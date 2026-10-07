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

  await supabase.rpc("ensure_weekly_allowances", { p_family_id: guest.familyId });

  const familyIds = [...new Set(guest.all.map((g) => g.familyId))];
  const [familyRes, familiesRes, recipientsRes, childrenRes, claimsRes, wishesRes] = await Promise.all([
    supabase.from("families").select("name, show_savings_to_kids").eq("id", guest.familyId).maybeSingle(),
    supabase.from("families").select("id, name").in("id", familyIds),
    // Foreldre som har lagt inn Vipps-nummer for gaver.
    supabase
      .from("profiles")
      .select("user_id, display_name, vipps_phone")
      .eq("family_id", guest.familyId)
      .not("vipps_phone", "is", null)
      .order("created_at", { ascending: true }),
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
  if (familyRes.error || familiesRes.error || recipientsRes.error || childrenRes.error || claimsRes.error || wishesRes.error) {
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
    guestId: guest.guestId,
    guestName: guest.name,
    familyName: familyRes.data?.name ?? null,
    // Er lenken koblet til en konto? Ellers tilbyr siden å lage profil.
    linked: Boolean(guest.userId),
    families: guest.all.map((g) => ({
      guestId: g.guestId,
      familyName: familiesRes.data?.find((f) => f.id === g.familyId)?.name ?? null,
    })),
    recipients: (recipientsRes.data ?? []).map((p) => ({ id: p.user_id, name: p.display_name ?? "Forelder", phone: p.vipps_phone })),
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
