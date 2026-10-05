import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/admin-api-auth";
import { hashGuestSecret, newGuestSecret } from "@/lib/guest-auth";

export const runtime = "nodejs";

// Foreldrene administrerer besteforeldre-lenker. Hemmeligheten vises bare én
// gang (når lenken lages); databasen har bare hashen.
export async function GET(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId } = auth.ctx;
  const res = await serviceClient
    .from("family_guests")
    .select("id, name, created_at, last_seen_at")
    .eq("family_id", familyId)
    .is("revoked_at", null)
    .order("created_at", { ascending: true });
  if (res.error) return NextResponse.json({ error: "Klarte ikke å hente." }, { status: 400 });
  return NextResponse.json({ guests: res.data ?? [] });
}

// Lager en ny gjest, eller en ny lenke til en eksisterende (den gamle slutter å virke).
export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as { name?: string; guestId?: string };

  const secret = newGuestSecret();
  let guestId = body.guestId ?? "";

  if (guestId) {
    const res = await serviceClient
      .from("family_guests")
      .update({ secret_hash: hashGuestSecret(secret) })
      .eq("id", guestId)
      .eq("family_id", familyId)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (res.error || !res.data) return NextResponse.json({ error: "Fant ikke personen." }, { status: 404 });
  } else {
    const name = (body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name) return NextResponse.json({ error: "Skriv et navn, f.eks. Mormor." }, { status: 400 });
    const res = await serviceClient
      .from("family_guests")
      .insert({ family_id: familyId, name, secret_hash: hashGuestSecret(secret), created_by: userId })
      .select("id")
      .single();
    if (res.error || !res.data) return NextResponse.json({ error: "Klarte ikke å lage lenken." }, { status: 400 });
    guestId = res.data.id;
  }

  const origin = new URL(request.url).origin;
  return NextResponse.json({ ok: true, link: `${origin}/besteforeldre/koble?id=${guestId}&s=${secret}` });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as { guestId?: string };
  const res = await serviceClient
    .from("family_guests")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", body.guestId ?? "")
    .eq("family_id", familyId);
  if (res.error) return NextResponse.json({ error: "Klarte ikke å stenge lenken." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
