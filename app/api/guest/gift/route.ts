import { NextResponse } from "next/server";
import { verifyGuestRequest } from "@/lib/guest-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

const MAX_GIFT_ORE = 500_000; // 5 000 kr
const MAX_GIFTS_PER_DAY = 10;

// En gave fra besteforeldre blir et krav som venter under Krav. Foreldrene
// godkjenner når pengene faktisk er mottatt (f.eks. på Vipps); da legges den
// til barnets «til gode» som vanlig.
export async function POST(request: Request) {
  const guest = await verifyGuestRequest(request);
  if (!guest) return NextResponse.json({ error: "Lenken er ikke aktiv." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { childId?: string; amountOre?: number; message?: string; wishId?: string };
  const amount = Number(body.amountOre);
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_GIFT_ORE) {
    return NextResponse.json({ error: "Velg et beløp mellom 1 og 5 000 kr." }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Serverfeil." }, { status: 500 });

  const childRes = await supabase.from("children").select("id, family_id, active").eq("id", body.childId ?? "").maybeSingle();
  if (childRes.error || !childRes.data || childRes.data.family_id !== guest.familyId || !childRes.data.active) {
    return NextResponse.json({ error: "Fant ikke barnet." }, { status: 404 });
  }

  let wishTitle: string | null = null;
  if (body.wishId) {
    const wishRes = await supabase.from("wishlist_items").select("title, child_id, family_id").eq("id", body.wishId).maybeSingle();
    if (wishRes.data && wishRes.data.family_id === guest.familyId && wishRes.data.child_id === body.childId) wishTitle = wishRes.data.title;
  }

  const prefix = `🎁 Gave fra ${guest.name}`;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await supabase
    .from("claims")
    .select("id", { count: "exact", head: true })
    .eq("family_id", guest.familyId)
    .is("task_id", null)
    .like("note", `${prefix}%`)
    .gte("created_at", since);
  if ((recent.count ?? 0) >= MAX_GIFTS_PER_DAY) {
    return NextResponse.json({ error: "Det er sendt mange gaver i dag. Prøv igjen i morgen." }, { status: 429 });
  }

  const message = (body.message ?? "").trim().replace(/\s+/g, " ");
  const note = `${prefix}${wishTitle ? ` til ${wishTitle}` : ""}${message ? `: ${message}` : ""}`.slice(0, 120);

  const insert = await supabase.from("claims").insert({
    family_id: guest.familyId,
    child_id: childRes.data.id,
    task_id: null,
    amount_ore: amount,
    status: "SENT",
    note,
  });
  if (insert.error) {
    console.error("[guest gift]", insert.error.message);
    return NextResponse.json({ error: "Klarte ikke å sende gaven." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
