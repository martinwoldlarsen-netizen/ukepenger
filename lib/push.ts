import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

// Varsler til foreldre. VAPID-nøklene lages av serveren første gang og lagres
// i app_secrets (bare service role), så ingen trenger å sette dem opp for hånd.

type Keys = { publicKey: string; privateKey: string };
let cached: Keys | null = null;

export async function getVapidKeys(supabase: SupabaseClient): Promise<Keys | null> {
  if (cached) return cached;
  const read = async () => {
    const res = await supabase.from("app_secrets").select("value").eq("key", "vapid").maybeSingle();
    return res.data ? (JSON.parse(res.data.value as string) as Keys) : null;
  };
  let keys = await read();
  if (!keys) {
    const fresh = webpush.generateVAPIDKeys();
    // Hvis to forespørsler lager nøkler samtidig, vinner den første.
    await supabase.from("app_secrets").upsert({ key: "vapid", value: JSON.stringify(fresh) }, { onConflict: "key", ignoreDuplicates: true });
    keys = await read();
  }
  cached = keys;
  return keys;
}

export type PushMessage = { title: string; body: string; url?: string; tag?: string };

// Sender til alle foreldre i familien som har slått på varsler. Feiler aldri
// utad: et varsel som ikke kommer frem skal ikke stoppe barnet.
export async function notifyParents(supabase: SupabaseClient, familyId: string, message: PushMessage) {
  try {
    const keys = await getVapidKeys(supabase);
    if (!keys) return;
    const subs = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("family_id", familyId);
    if (subs.error || !subs.data?.length) return;
    const payload = JSON.stringify({ url: "/admin/inbox", ...message });
    await Promise.all(
      subs.data.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
            vapidDetails: { subject: "mailto:hei@ukepenger.no", publicKey: keys.publicKey, privateKey: keys.privateKey },
            TTL: 60 * 60 * 24,
            urgency: "normal",
          });
        } catch (error) {
          const code = (error as { statusCode?: number }).statusCode;
          // Avmeldt eller utløpt: rydd bort.
          if (code === 404 || code === 410) await supabase.from("push_subscriptions").delete().eq("id", s.id);
          else console.error("[push]", code, (error as Error).message);
        }
      })
    );
  } catch (error) {
    console.error("[push]", (error as Error).message);
  }
}
