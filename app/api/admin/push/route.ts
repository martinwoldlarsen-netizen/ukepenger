import { NextResponse } from "next/server";
import { verifyAdminApiRequest } from "@/lib/admin-api-auth";
import { getVapidKeys, notifyParents } from "@/lib/push";

export const runtime = "nodejs";

// Offentlig nøkkel som nettleseren trenger for å melde seg på.
export async function GET(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const keys = await getVapidKeys(auth.ctx.serviceClient);
  if (!keys) return NextResponse.json({ error: "Varsler er ikke tilgjengelig nå." }, { status: 500 });
  return NextResponse.json({ publicKey: keys.publicKey });
}

type Body = { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; test?: boolean };

// Slår på varsler for denne enheten (og sender et testvarsel).
export async function POST(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const { serviceClient, familyId, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as Body;
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth || !/^https:\/\//.test(sub.endpoint)) {
    return NextResponse.json({ error: "Nettleseren ga ikke et gyldig abonnement." }, { status: 400 });
  }
  const res = await serviceClient
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_id: userId, family_id: familyId }, { onConflict: "endpoint" });
  if (res.error) return NextResponse.json({ error: "Klarte ikke å slå på varsler." }, { status: 400 });
  if (body.test) await notifyParents(serviceClient, familyId, { title: "Varsler er på 🔔", body: "Du får beskjed når barna sender krav eller ønsker.", tag: "test" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminApiRequest(request);
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => ({}))) as Body;
  if (body.subscription?.endpoint) {
    await auth.ctx.serviceClient.from("push_subscriptions").delete().eq("endpoint", body.subscription.endpoint).eq("user_id", auth.ctx.userId);
  }
  return NextResponse.json({ ok: true });
}
