import { NextResponse, after } from "next/server";
import { formatKr } from "@/lib/money";
import { notifyParents } from "@/lib/push";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

// Barnet trykker «Kjøp» i Ønskebutikken. Det betaler ikke ut noe selv: det
// markerer ønsket som «vil kjøpe nå», og en voksen fullfører under Krav
// (approve_wish), siden tingen må kjøpes i virkeligheten.
export async function POST(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { childId?: string; wishId?: string };
  const childId = body.childId?.trim() ?? "";
  const wishId = body.wishId?.trim() ?? "";
  if (!childId || !wishId) {
    return NextResponse.json({ error: "Mangler ønske." }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  const wishRes = await supabase
    .from("wishlist_items")
    .select("id, family_id, child_id, status, active, target_ore, purchase_requested_at, title, children(name)")
    .eq("id", wishId)
    .maybeSingle();
  const wish = wishRes.data;
  if (wishRes.error || !wish || wish.family_id !== auth.familyId || wish.child_id !== childId || !wish.active) {
    return NextResponse.json({ error: "Fant ikke ønsket." }, { status: 404 });
  }
  if (wish.status !== "ACTIVE" || !wish.target_ore) {
    return NextResponse.json({ error: "En voksen må se på ønsket først." }, { status: 400 });
  }
  if (wish.purchase_requested_at) {
    return NextResponse.json({ ok: true, alreadyRequested: true });
  }

  const balanceRes = await supabase.from("claims").select("amount_ore").eq("child_id", childId).eq("family_id", auth.familyId).eq("status", "APPROVED");
  if (balanceRes.error) {
    return NextResponse.json({ error: "Klarte ikke å sjekke pengene dine." }, { status: 400 });
  }
  const balance = (balanceRes.data ?? []).reduce((sum, c) => sum + (c.amount_ore as number), 0);
  if (balance < wish.target_ore) {
    return NextResponse.json({ error: "Du har ikke spart nok ennå." }, { status: 400 });
  }

  const update = await supabase
    .from("wishlist_items")
    .update({ purchase_requested_at: new Date().toISOString() })
    .eq("id", wishId)
    .eq("status", "ACTIVE")
    .is("purchase_requested_at", null);
  if (update.error) {
    return NextResponse.json({ error: "Klarte ikke å sende kjøpet." }, { status: 400 });
  }

  const kid = Array.isArray(wish.children) ? wish.children[0] : wish.children;
  after(() =>
    notifyParents(supabase, auth.familyId, {
      title: `${(kid as { name?: string } | null)?.name ?? "Barnet"} vil kjøpe noe 🛍️`,
      body: `${wish.title} · ${formatKr(wish.target_ore as number)}. Trykk for å se.`,
      tag: "wishes",
    })
  );

  return NextResponse.json({ ok: true });
}
