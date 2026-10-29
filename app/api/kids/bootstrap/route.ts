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

  const childrenRes = await supabase
    .from("children")
    .select("id, name, avatar_key, language")
    .eq("family_id", auth.familyId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (childrenRes.error) {
    return NextResponse.json({ error: childrenRes.error.message }, { status: 400 });
  }

  const children = ((childrenRes.data ?? []) as ChildRow[]).map((child) => ({ ...child, color: null }));
  return NextResponse.json({ children });
}
