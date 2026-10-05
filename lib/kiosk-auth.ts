import { timingSafeEqual } from "crypto";
import { getKioskSessionFromRequest } from "@/lib/device-session";
import { hashToken } from "@/lib/device-session.node";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type DeviceAuthRow = {
  id: string;
  family_id: string;
  token_hash: string | null;
  device_secret: string | null;
  active: boolean;
  revoked_at: string | null;
};

export type KioskAuthContext = {
  deviceId: string;
  familyId: string;
};

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// Barneenheten har en httpOnly-cookie med enhets-id og en tilfeldig hemmelighet.
// Nye enheter (engangs-QR) har bare hashen lagret (token_hash). Eldre enheter
// som ble koblet til før dette, har hemmeligheten i device_secret og virker fortsatt.
export async function verifyKioskRequest(request: Request): Promise<KioskAuthContext | null> {
  const session = getKioskSessionFromRequest(request);
  if (!session) return null;

  const supabase = getServiceSupabaseClient();
  if (!supabase) return null;

  const deviceRes = await supabase
    .from("devices")
    .select("id, family_id, token_hash, device_secret, active, revoked_at")
    .eq("id", session.deviceId)
    .maybeSingle();

  if (deviceRes.error || !deviceRes.data) return null;

  const device = deviceRes.data as DeviceAuthRow;
  if (!device.active || device.revoked_at) return null;

  const ok = device.device_secret
    ? safeEqual(device.device_secret, session.deviceSecret)
    : Boolean(device.token_hash) && safeEqual(device.token_hash as string, await hashToken(session.deviceSecret));
  if (!ok) return null;

  return {
    deviceId: device.id,
    familyId: device.family_id,
  };
}
