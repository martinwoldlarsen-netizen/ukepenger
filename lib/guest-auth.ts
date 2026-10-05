import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

// Gjeste-tilgang for besteforeldre: cookien "uk_guest" inneholder
// "<gjeste-id>:<hemmelighet>". Databasen har bare hashen av hemmeligheten.
export const GUEST_COOKIE_NAME = "uk_guest";
export const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ca. 13 måneder

export function newGuestSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashGuestSecret(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest("base64url");
}

function sameHash(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function readCookie(request: Request) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === GUEST_COOKIE_NAME) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return null;
}

export type GuestContext = { guestId: string; familyId: string; name: string };

// Sjekker id + hemmelighet mot databasen. Brukes både av koble-lenken og av
// gjeste-API-ene.
export async function verifyGuestCredentials(guestId: string, secret: string): Promise<GuestContext | null> {
  if (!/^[0-9a-f-]{36}$/i.test(guestId) || !secret) return null;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return null;
  const res = await supabase
    .from("family_guests")
    .select("id, family_id, name, secret_hash, revoked_at, last_seen_at")
    .eq("id", guestId)
    .maybeSingle();
  const row = res.data;
  if (res.error || !row || row.revoked_at || !sameHash(row.secret_hash, hashGuestSecret(secret))) return null;

  // Oppdater "sist sett" høyst én gang i timen.
  if (!row.last_seen_at || Date.now() - new Date(row.last_seen_at).getTime() > 60 * 60 * 1000) {
    await supabase.from("family_guests").update({ last_seen_at: new Date().toISOString() }).eq("id", row.id);
  }
  return { guestId: row.id, familyId: row.family_id, name: row.name };
}

export async function verifyGuestRequest(request: Request) {
  const raw = readCookie(request);
  if (!raw) return null;
  const [guestId, secret] = raw.split(":");
  if (!guestId || !secret) return null;
  return verifyGuestCredentials(guestId, secret);
}
