import { NextResponse } from "next/server";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { PIN_LOCK_MS, PIN_MAX_FAILS, checkPin, deviceMaySee, isValidPin, makePinTicket } from "@/lib/kid-access";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

// Barnet taster koden sin. Riktig kode gir en kort billett barnesiden sender
// med i headeren x-kid-pin. Etter for mange feil blir barnet sperret en stund.
export async function POST(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { childId?: unknown; pin?: unknown };
  const childId = typeof body.childId === "string" ? body.childId.trim() : "";
  if (!childId || !isValidPin(body.pin)) return NextResponse.json({ error: "Feil kode." }, { status: 400 });

  const supabase = getServiceSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });

  const res = await supabase
    .from("children")
    .select("id, family_id, active, shared_visible, pin_hash, pin_fails, pin_locked_until")
    .eq("id", childId)
    .maybeSingle();
  const child = res.data;
  if (res.error || !child || !child.active || !deviceMaySee(auth, child)) {
    return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  }
  if (!child.pin_hash) return NextResponse.json({ ticket: null });

  if (child.pin_locked_until && new Date(child.pin_locked_until).getTime() > Date.now()) {
    return NextResponse.json({ error: "For mange forsøk.", locked: true }, { status: 429 });
  }

  if (!checkPin(body.pin, child.pin_hash)) {
    const fails = (child.pin_fails ?? 0) + 1;
    const lock = fails >= PIN_MAX_FAILS;
    await supabase
      .from("children")
      .update({ pin_fails: lock ? 0 : fails, pin_locked_until: lock ? new Date(Date.now() + PIN_LOCK_MS).toISOString() : null })
      .eq("id", childId);
    return NextResponse.json({ error: lock ? "For mange forsøk." : "Feil kode.", locked: lock }, { status: lock ? 429 : 401 });
  }

  if (child.pin_fails || child.pin_locked_until) await supabase.from("children").update({ pin_fails: 0, pin_locked_until: null }).eq("id", childId);
  const ticket = makePinTicket(child.id, auth.deviceId, child.pin_hash);
  if (!ticket) return NextResponse.json({ error: "Serverfeil." }, { status: 500 });
  return NextResponse.json({ ticket });
}
