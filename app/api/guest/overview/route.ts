import { NextResponse } from "next/server";
import { verifyGuestRequest } from "@/lib/guest-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

// Det besteforeldre ser: barnebarna, hvor mye de har til gode (og spart, hvis
// barna selv ser det), og ønskene deres. Ingen oppgaver, krav eller historikk.
export async function GET(request: Request) {
  const guest = await verifyGuestRequest(request);
  if (!guest) return NextResponse.json({ error: "Lenken er ikke aktiv." }, { status: 401 });
  const supabase = getServiceSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Serverfeil." }, { status: 500 });

  const [familyRes, childrenRes, claimsRes, wishesRes] = await Promise.all([
    supabase.from("families").select("name, show_savings_to_kids").eq("id", guest.familyId).maybeSingle(),
    supabase.from("children").select("id, name, avatar_key").eq("family_id", guest.familyId).eq("active", true).order("name"),
    supabase.from("claims").select("child_id, status, amount_ore, saved_ore").eq("family_id", guest.familyId).in("status", ["APPROVED", "PAID"]),
    supabase
      .from("wishlist_items")
      .select("id, child_id, title, emoji, target_ore, suggested_ore, status")
      .eq("family_id", guest.familyId)
      .eq("active", true)
      .in("status", ["PROPOSED", "ACTIVE"])
      .order("created_at", { ascending: false }),
  ]);
  if (familyRes.error || childrenRes.error || claimsRes.error || wishesRes.error) {
    return NextResponse.json({ error: "Klarte ikke å hente." }, { status: 400 });
  }

  const showSavings = familyRes.data?.show_savings_to_kids ?? true;
  const totals: Record<string, { due: number; saved: number }> = {};
  for (const c of claimsRes.data ?? []) {
    const t = (totals[c.child_id] ??= { due: 0, saved: 0 });
    if (c.status === "APPROVED") t.due += c.amount_ore;
    t.saved += c.saved_ore ?? 0;
  }

  return NextResponse.json({
    guestName: guest.name,
    familyName: familyRes.data?.name ?? null,
    children: (childrenRes.data ?? []).map((child) => ({
      ...child,
      due_ore: totals[child.id]?.due ?? 0,
      saved_ore: showSavings ? (totals[child.id]?.saved ?? 0) : null,
      wishes: (wishesRes.data ?? [])
        .filter((w) => w.child_id === child.id)
        .map((w) => ({ id: w.id, title: w.title, emoji: w.emoji, price_ore: w.target_ore ?? w.suggested_ore ?? null, approved: w.status === "ACTIVE" })),
    })),
  });
}
