import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type PaymentRow = {
  id: string;
  family_id: string;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey };
}

function parseAuthToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function POST(request: Request) {
  const { url, anonKey, serviceKey } = getSupabaseEnv();
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Supabase env mangler." }, { status: 500 });
  }

  const token = parseAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "Mangler auth-token." }, { status: 401 });
  }

  const authClient = createClient(url, anonKey);
  const serviceClient = createClient(url, serviceKey);

  const authUserRes = await authClient.auth.getUser(token);
  if (authUserRes.error || !authUserRes.data.user) {
    return NextResponse.json({ error: authUserRes.error?.message ?? "Ugyldig innlogging." }, { status: 401 });
  }
  const user = authUserRes.data.user;

  const profileRes = await serviceClient
    .from("profiles")
    .select("family_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: profileRes.error?.message ?? "Fant ikke admin-profil." }, { status: 403 });
  }

  const adminFamilyId = profileRes.data.family_id as string;

  let body: { paymentId?: string } = {};
  try {
    body = (await request.json()) as { paymentId?: string };
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }
  const paymentId = body.paymentId?.trim();

  if (!paymentId) {
    return NextResponse.json({ error: "Mangler paymentId." }, { status: 400 });
  }

  const paymentRes = await serviceClient
    .from("payments")
    .select("id, family_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentRes.error) {
    return NextResponse.json({ error: paymentRes.error.message }, { status: 400 });
  }

  if (!paymentRes.data) {
    return NextResponse.json({ error: "Fant ikke utbetaling." }, { status: 404 });
  }

  const payment = paymentRes.data as PaymentRow;
  if (payment.family_id !== adminFamilyId) {
    return NextResponse.json({ error: "Ingen tilgang til utbetalingen." }, { status: 403 });
  }

  const claimsRes = await serviceClient
    .from("payment_claims")
    .select("claim_id")
    .eq("payment_id", paymentId);

  if (claimsRes.error) {
    return NextResponse.json({ error: claimsRes.error.message }, { status: 400 });
  }

  const claimIds = Array.from(
    new Set((claimsRes.data ?? []).map((row) => row.claim_id as string).filter(Boolean))
  );

  // Kravene går tilbake til "til gode" (APPROVED), slik at pengene ikke blir
  // borte når en utbetaling slettes. Sparing er allerede trukket på disse
  // kravene (savings_applied), så triggeren trekker ikke en gang til.
  if (claimIds.length > 0) {
    const revertRes = await serviceClient
      .from("claims")
      .update({ status: "APPROVED", paid_at: null })
      .in("id", claimIds)
      .eq("status", "PAID");

    if (revertRes.error) {
      return NextResponse.json({ error: revertRes.error.message }, { status: 400 });
    }
  }

  // Var dette et ønske som ble betalt ut, blir ønsket et sparemål igjen.
  const wishRes = await serviceClient
    .from("wishlist_items")
    .update({ status: "ACTIVE", paid_at: null, purchase_requested_at: null })
    .eq("payment_id", paymentId)
    .eq("status", "PAID");

  if (wishRes.error) {
    return NextResponse.json({ error: wishRes.error.message }, { status: 400 });
  }

  const deleteLinksRes = await serviceClient
    .from("payment_claims")
    .delete()
    .eq("payment_id", paymentId)
    .select("claim_id");

  if (deleteLinksRes.error) {
    return NextResponse.json({ error: deleteLinksRes.error.message }, { status: 400 });
  }

  const deletePaymentsRes = await serviceClient
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .select("id");

  if (deletePaymentsRes.error) {
    return NextResponse.json({ error: deletePaymentsRes.error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    revertedClaims: claimIds.length,
    deletedLinks: (deleteLinksRes.data ?? []).length,
    deletedPayments: (deletePaymentsRes.data ?? []).length,
  });
}
