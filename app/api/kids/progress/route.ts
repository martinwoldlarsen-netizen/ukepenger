import { NextResponse } from "next/server";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { computeProgress } from "@/lib/progress";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

export async function GET(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  const childId = new URL(request.url).searchParams.get("childId")?.trim() ?? "";
  const supabase = getServiceSupabaseClient();
  if (!supabase || !childId) return NextResponse.json({ error: "Mangler barn." }, { status: 400 });

  const childRes = await supabase.from("children").select("family_id").eq("id", childId).maybeSingle();
  if (!childRes.data || childRes.data.family_id !== auth.familyId) {
    return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  }

  const [claimsRes, wishesRes] = await Promise.all([
    supabase
      .from("claims")
      .select("task_id, status, amount_ore, saved_ore, created_at, decided_at, tasks(title)")
      .eq("child_id", childId)
      .in("status", ["APPROVED", "PAID"])
      .limit(5000),
    supabase.from("wishlist_items").select("id", { count: "exact", head: true }).eq("child_id", childId).eq("status", "PAID"),
  ]);
  if (claimsRes.error) return NextResponse.json({ error: "Klarte ikke å hente." }, { status: 400 });

  return NextResponse.json(computeProgress(claimsRes.data ?? [], wishesRes.count ?? 0));
}
