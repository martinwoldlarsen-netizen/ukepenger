import { NextResponse } from "next/server";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";
import { HISTORY_CLAIM_SELECT, HISTORY_PAYMENT_SELECT, buildHistory } from "@/lib/history";

// Barnets egen historikk: hva det har gjort, tjent og fått utbetalt.
export async function GET(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }
  const childId = new URL(request.url).searchParams.get("childId")?.trim() ?? "";
  if (!childId) return NextResponse.json({ error: "Mangler childId." }, { status: 400 });

  const supabase = getServiceSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });

  const childRes = await supabase.from("children").select("family_id").eq("id", childId).maybeSingle();
  if (childRes.error || !childRes.data || childRes.data.family_id !== auth.familyId) {
    return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  }

  const [claimsRes, paymentsRes] = await Promise.all([
    supabase.from("claims").select(HISTORY_CLAIM_SELECT).eq("child_id", childId).order("created_at", { ascending: false }).limit(40),
    supabase.from("payments").select(HISTORY_PAYMENT_SELECT).eq("child_id", childId).order("created_at", { ascending: false }).limit(20),
  ]);
  if (claimsRes.error || paymentsRes.error) {
    return NextResponse.json({ error: "Klarte ikke å hente historikken." }, { status: 400 });
  }

  const events = buildHistory(claimsRes.data ?? [], paymentsRes.data ?? []).slice(0, 40);
  return NextResponse.json({ events });
}
