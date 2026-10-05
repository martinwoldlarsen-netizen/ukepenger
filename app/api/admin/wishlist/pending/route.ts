import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/admin-api-auth";

type WishRow = {
  id: string;
  child_id: string;
  title: string;
  status: "PROPOSED" | "ACTIVE";
  target_ore: number | null;
  suggested_ore: number | null;
  emoji: string | null;
  purchase_requested_at: string | null;
  created_at: string;
};

// Ønsker som trenger en voksen, til Krav-lista:
//   - nye forslag fra barna (PROPOSED)
//   - sparemål barnet nå har spart nok til (ACTIVE og til gode >= pris)
export async function GET(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId } = auth.ctx;

  const [wishRes, claimsRes] = await Promise.all([
    serviceClient
      .from("wishlist_items")
      .select("id, child_id, title, emoji, status, target_ore, suggested_ore, purchase_requested_at, created_at")
      .eq("family_id", familyId)
      .eq("active", true)
      .in("status", ["PROPOSED", "ACTIVE"])
      .order("created_at", { ascending: true }),
    serviceClient.from("claims").select("child_id, amount_ore").eq("family_id", familyId).eq("status", "APPROVED"),
  ]);

  if (wishRes.error || claimsRes.error) {
    return NextResponse.json({ error: wishRes.error?.message ?? claimsRes.error?.message }, { status: 400 });
  }

  const balanceByChild: Record<string, number> = {};
  for (const claim of (claimsRes.data ?? []) as { child_id: string; amount_ore: number }[]) {
    balanceByChild[claim.child_id] = (balanceByChild[claim.child_id] ?? 0) + claim.amount_ore;
  }

  const items = ((wishRes.data ?? []) as WishRow[])
    .map((wish) => ({ ...wish, balance_ore: balanceByChild[wish.child_id] ?? 0 }))
    .filter((wish) => wish.status === "PROPOSED" || (wish.target_ore !== null && wish.balance_ore >= wish.target_ore))
    // Ønsker barnet har trykket «Kjøp» på kommer først.
    .sort((a, b) => Number(Boolean(b.purchase_requested_at)) - Number(Boolean(a.purchase_requested_at)));

  return NextResponse.json({ items });
}
