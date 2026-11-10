import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/admin-api-auth";
import { hashPin, isValidPin } from "@/lib/kid-access";

// Forelderen setter eller fjerner barnets kode. Koden hashes her på serveren.
export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId } = auth.ctx;

  const body = (await request.json().catch(() => ({}))) as { childId?: unknown; pin?: unknown };
  const childId = typeof body.childId === "string" ? body.childId.trim() : "";
  const remove = body.pin === null;
  if (!childId || (!remove && !isValidPin(body.pin))) {
    return NextResponse.json({ error: "Koden må være fire tall." }, { status: 400 });
  }

  const res = await serviceClient
    .from("children")
    .update({ pin_hash: remove ? null : hashPin(body.pin as string), pin_fails: 0, pin_locked_until: null })
    .eq("id", childId)
    .eq("family_id", familyId)
    .select("id")
    .maybeSingle();
  if (res.error || !res.data) return NextResponse.json({ error: "Fant ikke barnet." }, { status: 404 });
  return NextResponse.json({ ok: true, hasPin: !remove });
}
