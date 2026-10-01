import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

// Offentlig oppslag for invitasjonssiden: viser bare status, familienavn og en
// delvis skjult e-post, aldri noe annet om familien.
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  return `${name.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(6, name.length - 1)))}@${domain}`;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!/^[a-f0-9]{16,128}$/i.test(token)) {
    return NextResponse.json({ status: "not_found" });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  const inviteRes = await supabase
    .from("family_invites")
    .select("email, family_id, accepted_at, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteRes.error || !inviteRes.data) {
    return NextResponse.json({ status: "not_found" });
  }

  const invite = inviteRes.data;
  const familyRes = await supabase.from("families").select("name").eq("id", invite.family_id).maybeSingle();
  const status = invite.revoked_at
    ? "revoked"
    : invite.accepted_at
      ? "accepted"
      : new Date(invite.expires_at).getTime() <= Date.now()
        ? "expired"
        : "pending";

  return NextResponse.json({
    status,
    email: maskEmail(invite.email),
    familyName: familyRes.data?.name ?? null,
  });
}
