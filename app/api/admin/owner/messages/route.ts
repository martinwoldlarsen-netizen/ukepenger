import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/owner-auth";

export const runtime = "nodejs";

// Marker en kontaktmelding som ferdig (eller åpen igjen).
export async function PATCH(request: Request) {
  const owner = await requireOwner(request);
  if (!owner) return NextResponse.json({ error: "Ikke tilgang." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { id?: string; handled?: boolean };
  if (!body.id) return NextResponse.json({ error: "Mangler id." }, { status: 400 });
  const res = await owner.supabase
    .from("contact_messages")
    .update({ handled_at: body.handled === false ? null : new Date().toISOString() })
    .eq("id", body.id);
  if (res.error) return NextResponse.json({ error: "Klarte ikke å lagre." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
