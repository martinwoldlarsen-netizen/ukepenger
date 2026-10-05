import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { generateDeviceSecret, hashToken } from "@/lib/device-session.node";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

const PAIRING_MINUTES = 10;
import { ensureFamilyForUser } from "@/lib/ensure-family";

export const runtime = "nodejs";

type AuthContext = {
  supabase: SupabaseClient;
  userId: string;
};


async function getAuthContextForToken(token: string): Promise<AuthContext | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const userRes = await supabase.auth.getUser(token);
  if (userRes.error || !userRes.data.user) return null;

  return { supabase, userId: userRes.data.user.id };
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!bearerToken) {
    return NextResponse.json({ error: "Mangler auth token." }, { status: 401 });
  }

  const authContext = await getAuthContextForToken(bearerToken);
  if (!authContext) {
    return NextResponse.json({ error: "Ugyldig innlogging." }, { status: 401 });
  }

  let familyId: string;
  try {
    familyId = await ensureFamilyForUser(authContext.supabase, authContext.userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunne ikke klargjore familie.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Engangs-QR: nytt tilfeldig token hver gang, gyldig i 10 minutter og bare
  // én gang. Tidligere ubrukte koder for familien slutter å virke.
  const service = getServiceSupabaseClient();
  if (!service) return NextResponse.json({ error: "Serverfeil." }, { status: 500 });
  await service.from("device_pairings").delete().eq("family_id", familyId).is("used_at", null);

  const token = await generateDeviceSecret(32);
  const expiresAt = new Date(Date.now() + PAIRING_MINUTES * 60_000).toISOString();
  const insertRes = await service.from("device_pairings").insert({
    family_id: familyId,
    token_hash: await hashToken(token),
    expires_at: expiresAt,
    created_by: authContext.userId,
  });
  if (insertRes.error) return NextResponse.json({ error: "Klarte ikke å lage QR-kode." }, { status: 400 });

  const origin = new URL(request.url).origin;
  return NextResponse.json({ ok: true, claimUrl: `${origin}/kiosk/claim?pair=${encodeURIComponent(token)}`, expiresAt });
}
