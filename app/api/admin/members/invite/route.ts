import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type AdminProfile = {
  family_id: string;
  role: string;
};

type InviteRow = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
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

function getSiteUrl() {
  return process.env.SITE_URL?.trim() || "https://www.ukepenger.no";
}

function createInviteToken(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendInviteEmail(email: string, inviteLink: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Mangler RESEND_API_KEY.");
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Ukepenger <no-reply@ukepenger.no>";
  const payload = {
    from,
    to: [email],
    subject: "Invitasjon til Ukepenger",
    text: `Du har blitt invitert til Ukepenger.\n\nAksepter invitasjonen her: ${inviteLink}`,
    html: `<p>Du har blitt invitert til Ukepenger.</p><p><a href="${inviteLink}">Aksepter invitasjonen</a></p>`,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`E-post feilet (${res.status}): ${errText || "Ukjent feil"}`);
  }
}

async function requireAdmin(request: Request) {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return { error: NextResponse.json({ error: "Supabase env mangler." }, { status: 500 }) };
  }

  const token = parseAuthToken(request);
  if (!token) {
    return { error: NextResponse.json({ error: "Mangler auth-token." }, { status: 401 }) };
  }

  const authClient = createClient(url, anonKey);
  const serviceClient = getServiceSupabaseClient();
  if (!serviceClient) {
    return { error: NextResponse.json({ error: "Server mangler service role key." }, { status: 500 }) };
  }

  const authUserRes = await authClient.auth.getUser(token);
  if (authUserRes.error || !authUserRes.data.user) {
    return {
      error: NextResponse.json({ error: authUserRes.error?.message ?? "Ugyldig innlogging." }, { status: 401 }),
    };
  }

  const profileRes = await serviceClient
    .from("profiles")
    .select("family_id, role")
    .eq("user_id", authUserRes.data.user.id)
    .maybeSingle();

  if (profileRes.error || !profileRes.data) {
    return {
      error: NextResponse.json({ error: profileRes.error?.message ?? "Fant ikke admin-profil." }, { status: 403 }),
    };
  }

  const profile = profileRes.data as AdminProfile;
  if (!profile.family_id || profile.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Ingen admin-tilgang." }, { status: 403 }) };
  }

  return { serviceClient, userId: authUserRes.data.user.id, familyId: profile.family_id, error: null };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const [membersRes, invitesRes] = await Promise.all([
    auth.serviceClient
      .from("profiles")
      .select("user_id, family_id, role, created_at")
      .eq("family_id", auth.familyId)
      .order("created_at", { ascending: true }),
    auth.serviceClient
      .from("family_invites")
      .select("id, email, token, expires_at, accepted_at, revoked_at, created_at")
      .eq("family_id", auth.familyId)
      .order("created_at", { ascending: false }),
  ]);

  if (membersRes.error || invitesRes.error) {
    return NextResponse.json(
      { error: membersRes.error?.message ?? invitesRes.error?.message ?? "Kunne ikke hente medlemmer/invitasjoner." },
      { status: 400 }
    );
  }

  // E-post ligger i auth-tabellen, ikke i profiles.
  const members = await Promise.all(
    (membersRes.data ?? []).map(async (m) => {
      const userRes = await auth.serviceClient.auth.admin.getUserById(m.user_id as string);
      return { user_id: m.user_id, role: m.role, created_at: m.created_at, email: userRes.data.user?.email ?? null, isMe: m.user_id === auth.userId };
    })
  );
  const siteUrl = getSiteUrl();

  return NextResponse.json({
    ok: true,
    siteUrl,
    members,
    invites: ((invitesRes.data ?? []) as InviteRow[])
      .filter((i) => !i.accepted_at && !i.revoked_at)
      .map(({ token, ...rest }) => ({ ...rest, link: `${siteUrl}/invite/${token}` })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  let body: { email?: string } = {};
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Skriv en gyldig e-postadresse." }, { status: 400 });
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const inviteUpsert = await auth.serviceClient
    .from("family_invites")
    .upsert(
      {
        family_id: auth.familyId,
        email,
        invited_by: auth.userId,
        token,
        expires_at: expiresAt,
        accepted_at: null,
        revoked_at: null,
      },
      { onConflict: "family_id,email" }
    )
    .select("token")
    .single();

  if (inviteUpsert.error || !inviteUpsert.data) {
    console.error("[invite]", inviteUpsert.error?.message);
    return NextResponse.json({ error: "Klarte ikke å lage invitasjonen." }, { status: 400 });
  }

  const inviteToken = inviteUpsert.data.token as string;
  const inviteLink = `${getSiteUrl()}/invite/${inviteToken}`;

  // E-post er en bonus: lenken returneres uansett, så den kan deles på SMS
  // eller Messenger hvis e-posttjenesten ikke er satt opp.
  let emailed = false;
  try {
    await sendInviteEmail(email, inviteLink);
    emailed = true;
  } catch (error) {
    console.error("[invite] e-post ble ikke sendt:", error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ ok: true, inviteLink, emailed });
}

// Trekk tilbake en invitasjon som ikke er brukt.
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Mangler invitasjon." }, { status: 400 });
  }

  const res = await auth.serviceClient
    .from("family_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("family_id", auth.familyId)
    .is("accepted_at", null);

  if (res.error) {
    return NextResponse.json({ error: "Klarte ikke å trekke tilbake invitasjonen." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
