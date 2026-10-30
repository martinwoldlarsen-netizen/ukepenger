import { NextResponse } from "next/server";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type ChildRow = {
  id: string;
  name: string;
  avatar_key: string | null;
  language?: string | null;
  color?: string | null;
};

export async function GET(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  // Barnets egen enhet: bare det barnet.
  let query = supabase.from("children").select("id, name, avatar_key, language").eq("family_id", auth.familyId).eq("active", true);
  if (auth.childId) query = query.eq("id", auth.childId);
  const childrenRes = await query.order("name", { ascending: true });

  if (childrenRes.error) {
    return NextResponse.json({ error: childrenRes.error.message }, { status: 400 });
  }

  const children = ((childrenRes.data ?? []) as ChildRow[]).map((child) => ({ ...child, color: null, personal: Boolean(auth.childId) }));
  return NextResponse.json({ children });
}
