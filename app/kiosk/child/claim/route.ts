import { NextResponse } from "next/server";
import { KIOSK_COOKIE_NAME, getKioskCookieValue } from "@/lib/device-session";
import { generateDeviceCode, generateDeviceSecret, hashToken } from "@/lib/device-session.node";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

export const runtime = "nodejs";

type ChildQrRow = {
  child_id: string;
  code: string;
  secret_hash: string;
  active: boolean;
  revoked_at: string | null;
};

type ChildRow = {
  id: string;
  family_id: string;
};

type DeviceRow = {
  id: string;
  family_id: string;
  device_secret: string | null;
  active: boolean;
  revoked_at: string | null;
};

function redirectKiosk(error: string) {
  return NextResponse.redirect(`https://www.ukepenger.no/kiosk?claim_error=${encodeURIComponent(error)}`, { status: 303 });
}

async function generateUniqueDeviceCode(supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>) {
  for (let i = 0; i < 10; i += 1) {
    const candidate = await generateDeviceCode(8);
    const existsRes = await supabase.from("devices").select("id").eq("device_code", candidate).maybeSingle();
    if (!existsRes.data) return candidate;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = (url.searchParams.get("code") ?? "").trim();
    const secret = (url.searchParams.get("secret") ?? "").trim();

    if (!code || !secret) {
      return redirectKiosk("missing_params");
    }

    const supabase = getServiceSupabaseClient();
    if (!supabase) {
      return redirectKiosk("server_error");
    }

    const secretHash = await hashToken(secret);
    const qrRes = await supabase
      .from("child_qr_codes")
      .select("child_id, code, secret_hash, active, revoked_at")
      .eq("code", code)
      .eq("secret_hash", secretHash)
      .eq("active", true)
      .is("revoked_at", null)
      .maybeSingle();

    if (qrRes.error || !qrRes.data) {
      return redirectKiosk("invalid_child_qr");
    }

    const qr = qrRes.data as ChildQrRow;
    const childRes = await supabase
      .from("children")
      .select("id, family_id")
      .eq("id", qr.child_id)
      .maybeSingle();

    if (childRes.error || !childRes.data) {
      return redirectKiosk("invalid_child_qr");
    }

    const child = childRes.data as ChildRow;
    const validatedSession = await verifyKioskRequest(request);

    let kioskValue: string | null = null;
    if (validatedSession && validatedSession.familyId === child.family_id) {
      const existingDeviceRes = await supabase
        .from("devices")
        .select("id, family_id, device_secret, active, revoked_at")
        .eq("id", validatedSession.deviceId)
        .maybeSingle();

      if (!existingDeviceRes.error && existingDeviceRes.data) {
        const existingDevice = existingDeviceRes.data as DeviceRow;
        const ds = existingDevice.device_secret;
        const validExisting =
          existingDevice.family_id === child.family_id &&
          existingDevice.active &&
          !existingDevice.revoked_at &&
          ds;

        if (ds && validExisting) {
          kioskValue = getKioskCookieValue(existingDevice.id, ds);
        }
      }
    }

    if (!kioskValue) {
      let deviceRes = await supabase
        .from("devices")
        .select("id, family_id, device_secret, active, revoked_at")
        .eq("family_id", child.family_id)
        .eq("active", true)
        .is("revoked_at", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (deviceRes.error) {
        return redirectKiosk("server_error");
      }

      if (!deviceRes.data) {
        const newCode = await generateUniqueDeviceCode(supabase);
        if (!newCode) {
          return redirectKiosk("server_error");
        }

        const newSecret = await generateDeviceSecret(48);
        const newTokenHash = await hashToken(newSecret);
        const now = new Date().toISOString();

        const insertRes = await supabase
          .from("devices")
          .insert({
            family_id: child.family_id,
            name: "Kiosk",
            device_code: newCode,
            device_secret: newSecret,
            token_hash: newTokenHash,
            active: true,
            revoked_at: null,
            updated_at: now,
          })
          .select("id, family_id, device_secret, active, revoked_at")
          .single();

        if (insertRes.error || !insertRes.data) {
          return redirectKiosk("server_error");
        }

        deviceRes = { ...deviceRes, data: insertRes.data, error: null };
      }

      const device = deviceRes.data as DeviceRow;
      if (!device.device_secret) {
        return redirectKiosk("invalid_device");
      }

      kioskValue = getKioskCookieValue(device.id, device.device_secret);
    }

    const response = NextResponse.redirect("https://www.ukepenger.no/kids", { status: 303 });
    response.cookies.set({
      name: KIOSK_COOKIE_NAME,
      value: kioskValue,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      domain: "ukepenger.no",
      maxAge: 31536000,
    });
    // Bevisst ingen per-barn-cookie: barnet velger profil paa nytt hver gang.
    // Rydder bort en eventuell gammel uk_kid fra enheter som fikk den tidligere.
    response.cookies.set({
      name: "uk_kid",
      value: "",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      domain: "ukepenger.no",
      maxAge: 0,
    });
    return response;
  } catch {
    return redirectKiosk("server_error");
  }
}
