import { NextResponse } from "next/server";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type ChildRow = {
  id: string;
  family_id: string;
  active: boolean;
};

const MAX_TITLE_LENGTH = 80;
const MAX_SUGGESTED_ORE = 1_000_000; // 10 000 kr
// En delt iPad i barnehender: hindre at én profil fyller lista med forslag.
const MAX_OPEN_PROPOSALS_PER_CHILD = 10;
const PAID_VISIBLE_DAYS = 30;

async function loadChildForKiosk(childId: string, familyId: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Server mangler service role key." }, { status: 500 }) };
  }

  const childRes = await supabase.from("children").select("id, family_id, active").eq("id", childId).maybeSingle();
  if (childRes.error || !childRes.data) {
    return { error: NextResponse.json({ error: childRes.error?.message ?? "Barn ikke funnet." }, { status: 404 }) };
  }

  const child = childRes.data as ChildRow;
  if (child.family_id !== familyId) {
    return { error: NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 }) };
  }

  return { supabase, child };
}

export async function GET(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }

  const childId = new URL(request.url).searchParams.get("childId")?.trim() ?? "";
  if (!childId) {
    return NextResponse.json({ error: "Mangler childId." }, { status: 400 });
  }

  const loaded = await loadChildForKiosk(childId, auth.familyId);
  if ("error" in loaded) return loaded.error;

  const itemsRes = await loaded.supabase
    .from("wishlist_items")
    .select("id, title, emoji, target_ore, suggested_ore, status, created_by, note, created_at, paid_at, purchase_requested_at")
    .eq("family_id", auth.familyId)
    .eq("child_id", childId)
    .eq("active", true)
    .in("status", ["PROPOSED", "ACTIVE", "PAID"])
    .order("created_at", { ascending: false });

  if (itemsRes.error) {
    return NextResponse.json({ error: itemsRes.error.message }, { status: 400 });
  }

  // Oppfylte ønsker vises en stund, så barnet ser at det faktisk ble noe av.
  const showPaidSince = Date.now() - PAID_VISIBLE_DAYS * 24 * 60 * 60 * 1000;
  const items = (itemsRes.data ?? []).filter(
    (item) => item.status !== "PAID" || (item.paid_at && new Date(item.paid_at).getTime() >= showPaidSince)
  );

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }

  let body: { childId?: unknown; title?: unknown; suggestedOre?: unknown; emoji?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const childId = typeof body.childId === "string" ? body.childId.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim().replace(/\s+/g, " ") : "";
  if (!childId) {
    return NextResponse.json({ error: "Mangler childId." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Skriv hva du ønsker deg." }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `Ønsket kan være maks ${MAX_TITLE_LENGTH} tegn.` }, { status: 400 });
  }

  // Emoji fra katalogen i Ønskebutikken (valgfri, kort).
  const emoji = typeof body.emoji === "string" && body.emoji.trim() && body.emoji.length <= 16 ? body.emoji.trim() : null;

  let suggestedOre: number | null = null;
  if (body.suggestedOre !== undefined && body.suggestedOre !== null) {
    const value = Number(body.suggestedOre);
    if (!Number.isInteger(value) || value < 0 || value > MAX_SUGGESTED_ORE) {
      return NextResponse.json({ error: "Prisen ser ikke riktig ut." }, { status: 400 });
    }
    suggestedOre = value;
  }

  const loaded = await loadChildForKiosk(childId, auth.familyId);
  if ("error" in loaded) return loaded.error;
  if (!loaded.child.active) {
    return NextResponse.json({ error: "Barnet er inaktivt." }, { status: 400 });
  }

  const openRes = await loaded.supabase
    .from("wishlist_items")
    .select("id", { head: true, count: "exact" })
    .eq("child_id", childId)
    .eq("status", "PROPOSED")
    .eq("active", true);
  if (openRes.error) {
    return NextResponse.json({ error: openRes.error.message }, { status: 400 });
  }
  if ((openRes.count ?? 0) >= MAX_OPEN_PROPOSALS_PER_CHILD) {
    return NextResponse.json(
      { error: "Du har mange ønsker som venter. Vent til en voksen har sett på dem." },
      { status: 429 }
    );
  }

  const insertRes = await loaded.supabase
    .from("wishlist_items")
    .insert({
      family_id: auth.familyId,
      child_id: childId,
      title,
      target_ore: null,
      suggested_ore: suggestedOre,
      emoji,
      status: "PROPOSED",
      created_by: "CHILD",
      active: true,
    })
    .select("id, title, emoji, target_ore, suggested_ore, status, created_by, note, created_at, paid_at, purchase_requested_at")
    .single();

  if (insertRes.error || !insertRes.data) {
    return NextResponse.json({ error: insertRes.error?.message ?? "Kunne ikke lagre ønsket." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, item: insertRes.data });
}
