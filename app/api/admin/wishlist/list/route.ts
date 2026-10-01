import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type AdminProfile = {
  family_id: string;
  role: string;
};

type ChildRow = {
  id: string;
  family_id: string;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

function parseAuthToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function GET(request: Request) {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase env mangler." }, { status: 500 });
  }

  const token = parseAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Mangler auth-token." }, { status: 401 });
  }

  const authClient = createClient(url, anonKey);
  const serviceClient = getServiceSupabaseClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  const authUserRes = await authClient.auth.getUser(token);
  if (authUserRes.error || !authUserRes.data.user) {
    return NextResponse.json({ error: authUserRes.error?.message ?? "Ugyldig innlogging." }, { status: 401 });
  }

  const profileRes = await serviceClient
    .from("profiles")
    .select("family_id, role")
    .eq("user_id", authUserRes.data.user.id)
    .maybeSingle();

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: profileRes.error?.message ?? "Fant ikke admin-profil." }, { status: 403 });
  }

  const profile = profileRes.data as AdminProfile;
  if (!profile.family_id || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen admin-tilgang." }, { status: 403 });
  }

  const childId = new URL(request.url).searchParams.get("childId")?.trim() ?? "";
  if (!childId) {
    return NextResponse.json({ error: "Mangler childId." }, { status: 400 });
  }

  const childRes = await serviceClient.from("children").select("id, family_id").eq("id", childId).maybeSingle();
  if (childRes.error || !childRes.data) {
    return NextResponse.json({ error: childRes.error?.message ?? "Barn ikke funnet." }, { status: 404 });
  }

  const child = childRes.data as ChildRow;
  if (child.family_id !== profile.family_id) {
    return NextResponse.json({ error: "Barnet tilhorer ikke din familie." }, { status: 403 });
  }

  const itemsRes = await serviceClient
    .from("wishlist_items")
    .select("id, title, target_ore, suggested_ore, status, created_by, note, created_at")
    .eq("family_id", profile.family_id)
    .eq("child_id", childId)
    .eq("active", true)
    .in("status", ["PROPOSED", "ACTIVE"])
    .order("created_at", { ascending: false });

  if (itemsRes.error) {
    return NextResponse.json({ error: itemsRes.error.message }, { status: 400 });
  }

  return NextResponse.json({ items: itemsRes.data ?? [] });
}

