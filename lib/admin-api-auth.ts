import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type AdminProfile = {
  family_id: string;
  role: string;
};

export type AdminApiContext = {
  serviceClient: SupabaseClient;
  familyId: string;
  userId: string;
};

// Samme sjekk som de eksisterende admin/wishlist-rutene gjør inline:
// gyldig bearer-token -> profil -> ADMIN i en familie.
export async function verifyAdminApiRequest(
  request: Request
): Promise<{ ok: true; ctx: AdminApiContext } | { ok: false; response: NextResponse }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, response: NextResponse.json({ error: "Supabase env mangler." }, { status: 500 }) };
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "Mangler auth-token." }, { status: 401 }) };
  }

  const serviceClient = getServiceSupabaseClient();
  if (!serviceClient) {
    return { ok: false, response: NextResponse.json({ error: "Server mangler service role key." }, { status: 500 }) };
  }

  const authUserRes = await createClient(url, anonKey).auth.getUser(token);
  if (authUserRes.error || !authUserRes.data.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: authUserRes.error?.message ?? "Ugyldig innlogging." }, { status: 401 }),
    };
  }

  const profileRes = await serviceClient
    .from("profiles")
    .select("family_id, role")
    .eq("user_id", authUserRes.data.user.id)
    .maybeSingle();
  if (profileRes.error || !profileRes.data) {
    return {
      ok: false,
      response: NextResponse.json({ error: profileRes.error?.message ?? "Fant ikke admin-profil." }, { status: 403 }),
    };
  }

  const profile = profileRes.data as AdminProfile;
  if (!profile.family_id || profile.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Ingen admin-tilgang." }, { status: 403 }) };
  }

  return { ok: true, ctx: { serviceClient, familyId: profile.family_id, userId: authUserRes.data.user.id } };
}
