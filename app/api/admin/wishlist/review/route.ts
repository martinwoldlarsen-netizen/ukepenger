import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/admin-api-auth";

const RPC_ERRORS: Record<string, { message: string; status: number }> = {
  INVALID_PRICE: { message: "Sett en pris større enn 0 kr.", status: 400 },
  WISH_NOT_FOUND: { message: "Fant ikke ønsket.", status: 404 },
  WISH_ALREADY_HANDLED: { message: "Ønsket er allerede behandlet.", status: 409 },
  BALANCE_CHANGED: { message: "Saldoen endret seg underveis. Prøv igjen.", status: 409 },
};

// Forelderen behandler et ønske fra Krav-lista:
//   approve - setter pris; utbetales med en gang hvis barnet har nok til gode,
//             ellers blir det et sparemål
//   payout  - et sparemål barnet nå har spart nok til, utbetales til lagret pris
//   decline - avslås
// Selve pengeflyten skjer atomisk i databasefunksjonen approve_wish.
export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId, userId } = auth.ctx;

  let body: { id?: unknown; action?: unknown; targetOre?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const action = body.action;
  if (!id || (action !== "approve" && action !== "payout" && action !== "decline")) {
    return NextResponse.json({ error: "Mangler id eller gyldig handling." }, { status: 400 });
  }

  const itemRes = await serviceClient
    .from("wishlist_items")
    .select("id, family_id, status, target_ore")
    .eq("id", id)
    .maybeSingle();
  if (itemRes.error || !itemRes.data) {
    return NextResponse.json({ error: itemRes.error?.message ?? "Fant ikke ønsket." }, { status: 404 });
  }
  if (itemRes.data.family_id !== familyId) {
    return NextResponse.json({ error: "Ønsket tilhører ikke din familie." }, { status: 403 });
  }

  if (action === "decline") {
    const res = await serviceClient
      .from("wishlist_items")
      .update({ status: "DECLINED", active: false })
      .eq("id", id)
      .in("status", ["PROPOSED", "ACTIVE"])
      .select("id");
    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 400 });
    }
    if ((res.data ?? []).length === 0) {
      return NextResponse.json({ error: RPC_ERRORS.WISH_ALREADY_HANDLED.message }, { status: 409 });
    }
    return NextResponse.json({ ok: true, result: "DECLINED" });
  }

  const targetOre = action === "payout" ? Number(itemRes.data.target_ore) : Number(body.targetOre);
  if (!Number.isInteger(targetOre) || targetOre <= 0) {
    return NextResponse.json({ error: RPC_ERRORS.INVALID_PRICE.message }, { status: 400 });
  }

  const rpc = await serviceClient.rpc("approve_wish", {
    p_wish_id: id,
    p_family_id: familyId,
    p_target_ore: targetOre,
    p_user_id: userId,
  });

  if (rpc.error) {
    const known = Object.entries(RPC_ERRORS).find(([code]) => rpc.error?.message.includes(code));
    if (known) {
      return NextResponse.json({ error: known[1].message }, { status: known[1].status });
    }
    return NextResponse.json({ error: rpc.error.message }, { status: 400 });
  }

  // "PAID" = utbetalt som ønske, "SAVING" = for lite til gode, ble sparemål.
  return NextResponse.json({ ok: true, result: rpc.data as "PAID" | "SAVING" });
}
