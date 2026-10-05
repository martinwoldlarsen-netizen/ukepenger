import { NextResponse } from "next/server";
import { KIOSK_COOKIE_NAME, getKioskCookieValue } from "@/lib/device-session";
import { generateDeviceCode, generateDeviceSecret, hashToken } from "@/lib/device-session.node";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

export const runtime = "nodejs";

// Gjetter et forståelig navn på enheten, så foreldre kjenner den igjen under Enheter.
function deviceName(ua: string) {
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))) return "iPad";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android-telefon" : "Android-nettbrett";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "PC";
  return "Barneenhet";
}

// Engangs-QR: tokenet virker i 10 minutter og bare én gang. Hver enhet får sin
// egen tilfeldige hemmelighet i en httpOnly-cookie; databasen har bare hashen.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = (reason: string) => NextResponse.redirect(`${url.origin}/kiosk?claim_error=${reason}`, { status: 303 });
  try {
    const token = (url.searchParams.get("pair") ?? "").trim();
    // Gamle QR-koder (code + secret) kunne brukes om igjen og er slått av.
    if (!token) return fail(url.searchParams.get("code") ? "old_qr" : "missing_params");

    const supabase = getServiceSupabaseClient();
    if (!supabase) return fail("server_error");

    const now = new Date().toISOString();
    // Atomisk: bare én forespørsel kan bruke tokenet.
    const pairRes = await supabase
      .from("device_pairings")
      .update({ used_at: now })
      .eq("token_hash", await hashToken(token))
      .is("used_at", null)
      .gt("expires_at", now)
      .select("id, family_id")
      .maybeSingle();
    if (pairRes.error || !pairRes.data) return fail("expired_qr");

    const secret = await generateDeviceSecret(48);
    const deviceRes = await supabase
      .from("devices")
      .insert({
        family_id: pairRes.data.family_id,
        name: deviceName(request.headers.get("user-agent") ?? ""),
        token_hash: await hashToken(secret),
        device_code: await generateDeviceCode(10),
        device_secret: null,
        active: true,
        revoked_at: null,
        updated_at: now,
      })
      .select("id")
      .single();
    if (deviceRes.error || !deviceRes.data) return fail("server_error");
    await supabase.from("device_pairings").update({ device_id: deviceRes.data.id }).eq("id", pairRes.data.id);

    const response = NextResponse.redirect(`${url.origin}/kids`, { status: 303 });
    response.cookies.set({
      name: KIOSK_COOKIE_NAME,
      value: getKioskCookieValue(deviceRes.data.id, secret),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 31536000,
    });
    return response;
  } catch {
    return fail("server_error");
  }
}
