import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type InviteRow = {
  id: string;
  family_id: string;
  email: string;
  accepted_at: string | null;
  expires_at: string;
  revoked_at: string | null;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

function parseAuthToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function POST(request: Request) {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase env mangler." }, { status: 500 });
  }

  const token = parseAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Mangler auth-token." }, { status: 401 });
  }

  let body: { token?: string } = {};
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const inviteToken = body.token?.trim();
  if (!inviteToken) {
    return NextResponse.json({ error: "Mangler token." }, { status: 400 });
  }

  const authClient = createClient(url, anonKey);
  const serviceClient = getServiceSupabaseClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  const authUserRes = await authClient.auth.getUser(token);
  if (authUserRes.error || !authUserRes.data.user) {
    return NextResponse.json({ error: authUserRes.error?.message ?? "Ugyldig innlogging." }, { status: 401 });
  }

  const user = authUserRes.data.user;
  if (!user.email) {
    return NextResponse.json({ error: "Bruker mangler e-post." }, { status: 400 });
  }

  const inviteRes = await serviceClient
    .from("family_invites")
    .select("id, family_id, email, accepted_at, expires_at, revoked_at")
    .eq("token", inviteToken)
    .maybeSingle();

  if (inviteRes.error) {
    return NextResponse.json({ error: inviteRes.error.message }, { status: 400 });
  }

  if (!inviteRes.data) {
    return NextResponse.json({ error: "Fant ikke invitasjonen." }, { status: 404 });
  }

  const invite = inviteRes.data as InviteRow;
  if (invite.revoked_at) {
    return NextResponse.json({ error: "Invitasjonen er trukket tilbake." }, { status: 400 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: "Invitasjonen er allerede akseptert." }, { status: 400 });
  }
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Invitasjonen er utløpt. Be om en ny lenke." }, { status: 400 });
  }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Invitasjonen ble sendt til en annen e-post enn den du er logget inn med." }, { status: 403 });
  }

  const profileRes = await serviceClient
    .from("profiles")
    .select("family_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 400 });
  }

  if (!profileRes.data) {
    const insertProfile = await serviceClient.from("profiles").insert({
      user_id: user.id,
      family_id: invite.family_id,
      role: "ADMIN",
    });

    if (insertProfile.error) {
      return NextResponse.json({ error: insertProfile.error.message }, { status: 400 });
    }
  } else if (!profileRes.data.family_id) {
    const updateProfile = await serviceClient
      .from("profiles")
      .update({ family_id: invite.family_id, role: "ADMIN" })
      .eq("user_id", user.id);
    if (updateProfile.error) {
      return NextResponse.json({ error: updateProfile.error.message }, { status: 400 });
    }
  } else if ((profileRes.data.family_id as string) !== invite.family_id) {
    // Brukeren kan ha fått en tom familie automatisk ved første innlogging.
    // Er den tom (ingen barn, ingen andre voksne), flytter vi brukeren over.
    const oldFamilyId = profileRes.data.family_id as string;
    const [childrenRes, membersRes] = await Promise.all([
      serviceClient.from("children").select("id", { count: "exact", head: true }).eq("family_id", oldFamilyId),
      serviceClient.from("profiles").select("user_id", { count: "exact", head: true }).eq("family_id", oldFamilyId),
    ]);
    const emptyFamily = (childrenRes.count ?? 0) === 0 && (membersRes.count ?? 0) <= 1;
    if (!emptyFamily) {
      return NextResponse.json(
        { error: "Du er allerede med i en annen familie med barn. Logg inn med en annen e-post for å bli med her." },
        { status: 409 }
      );
    }
    const moveRes = await serviceClient
      .from("profiles")
      .update({ family_id: invite.family_id, role: "ADMIN" })
      .eq("user_id", user.id);
    if (moveRes.error) {
      return NextResponse.json({ error: "Klarte ikke å bli med i familien." }, { status: 400 });
    }
  }

  const acceptRes = await serviceClient
    .from("family_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (acceptRes.error) {
    return NextResponse.json({ error: acceptRes.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
