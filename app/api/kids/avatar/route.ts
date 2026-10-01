import { NextResponse } from "next/server";
import { FIGURES } from "@/components/avatars/figures";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

const VALID_KEYS = new Set(FIGURES.map((f) => f.key));

// Barnet velger figur selv fra kiosken. Bare figurene i listen er lov, og bare
// for barn i samme familie som kiosken.
export async function POST(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { childId?: string; avatarKey?: string };
  const childId = body.childId?.trim() ?? "";
  const avatarKey = body.avatarKey?.trim() ?? "";
  if (!childId || !VALID_KEYS.has(avatarKey)) {
    return NextResponse.json({ error: "Ugyldig figur." }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  const childRes = await supabase.from("children").select("id, family_id, active").eq("id", childId).maybeSingle();
  if (childRes.error || !childRes.data) {
    return NextResponse.json({ error: "Barn ikke funnet." }, { status: 404 });
  }
  if (childRes.data.family_id !== auth.familyId || !childRes.data.active) {
    return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  }

  const update = await supabase.from("children").update({ avatar_key: avatarKey }).eq("id", childId).eq("family_id", auth.familyId);
  if (update.error) {
    return NextResponse.json({ error: "Klarte ikke å lagre figuren." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, avatarKey });
}
