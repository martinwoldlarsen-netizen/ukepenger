import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import type { KioskAuthContext } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

// Tilgang til ett barn på barnesiden (bare server):
// - egen enhet ser bare sitt barn (devices.child_id)
// - felles enheter ser ikke barn med shared_visible = false
// - barn med kode (pin_hash) krever en kort, signert billett i headeren
//   «x-kid-pin», som barnesiden får fra /api/kids/pin etter riktig kode.
//   Billetten er bundet til barnet og enheten, og holdes bare i nettleserens
//   økt (sessionStorage) – ingen cookie per barn.

export const PIN_HEADER = "x-kid-pin";
const TICKET_MS = 2 * 60 * 60 * 1000;
export const PIN_MAX_FAILS = 5;
export const PIN_LOCK_MS = 5 * 60 * 1000;

export const isValidPin = (pin: unknown): pin is string => typeof pin === "string" && /^\d{4}$/.test(pin);

export function hashPin(pin: string) {
  const salt = randomBytes(16);
  return `s1$${salt.toString("base64url")}$${scryptSync(pin, salt, 32).toString("base64url")}`;
}

export function checkPin(pin: string, stored: string) {
  const [v, salt, hash] = stored.split("$");
  if (v !== "s1" || !salt || !hash) return false;
  const a = scryptSync(pin, Buffer.from(salt, "base64url"), 32);
  const b = Buffer.from(hash, "base64url");
  return a.length === b.length && timingSafeEqual(a, b);
}

function ticketKey() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return secret ? createHmac("sha256", secret).update("uk-kid-pin-v1").digest() : null;
}

// Endres koden, slutter gamle billetter å virke (tag fra hashen).
const pinTag = (pinHash: string) => createHmac("sha256", "uk-pin-tag").update(pinHash).digest("base64url").slice(0, 12);

export function makePinTicket(childId: string, deviceId: string, pinHash: string): string | null {
  const key = ticketKey();
  if (!key) return null;
  const body = Buffer.from(JSON.stringify({ c: childId, d: deviceId, t: pinTag(pinHash), e: Date.now() + TICKET_MS })).toString("base64url");
  return `${body}.${createHmac("sha256", key).update(body).digest("base64url")}`;
}

export function pinTicketOk(ticket: string | null, childId: string, deviceId: string, pinHash: string) {
  const key = ticketKey();
  if (!key || !ticket) return false;
  const [body, sig] = ticket.split(".");
  if (!body || !sig) return false;
  const want = createHmac("sha256", key).update(body).digest();
  const got = Buffer.from(sig, "base64url");
  if (want.length !== got.length || !timingSafeEqual(want, got)) return false;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { c: string; d: string; t: string; e: number };
    return data.c === childId && data.d === deviceId && data.t === pinTag(pinHash) && data.e > Date.now();
  } catch {
    return false;
  }
}

type ChildAccessRow = { id: string; family_id: string; active: boolean; shared_visible: boolean | null; pin_hash: string | null };

// Kan enheten se barnet (familie, egen enhet, felles-synlighet)? Uten kodesjekk.
export function deviceMaySee(auth: KioskAuthContext, child: Pick<ChildAccessRow, "id" | "family_id" | "shared_visible">) {
  if (child.family_id !== auth.familyId) return false;
  if (auth.childId) return auth.childId === child.id;
  return child.shared_visible !== false;
}

// Felles sjekk i hvert kiosk-API som gjelder ett barn. Gir et svar å sende
// tilbake når tilgang nektes, ellers null. «pin: true» betyr at barnesiden skal
// be om koden.
export async function kidAccessDenied(request: Request, auth: KioskAuthContext, childId: string): Promise<NextResponse | null> {
  const supabase = getServiceSupabaseClient();
  if (!supabase || !childId) return NextResponse.json({ error: "Mangler barn." }, { status: 400 });
  const res = await supabase.from("children").select("id, family_id, active, shared_visible, pin_hash").eq("id", childId).maybeSingle();
  const child = res.data as ChildAccessRow | null;
  if (res.error || !child || !deviceMaySee(auth, child)) return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  if (child.pin_hash && !pinTicketOk(request.headers.get(PIN_HEADER), child.id, auth.deviceId, child.pin_hash)) {
    return NextResponse.json({ error: "Koden mangler.", pin: true }, { status: 401 });
  }
  return null;
}
