import { createHash } from "crypto";
import { NextResponse, after } from "next/server";
import { ownerFamilyIds } from "@/lib/owner-auth";
import { notifyParents } from "@/lib/push";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

export const runtime = "nodejs";

const TOPICS = ["sporsmal", "personvern", "feil", "annet"] as const;
const TOPIC_LABEL: Record<(typeof TOPICS)[number], string> = { sporsmal: "Spørsmål", personvern: "Personvern", feil: "Feil", annet: "Annet" };

// Kontaktskjemaet. Lagres i databasen, og eieren får varsel. Enkel beskyttelse
// mot spam: skjult felt («website») og maks 5 meldinger per avsender per time.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: string; email?: string; topic?: string; message?: string; website?: string };
  if (body.website) return NextResponse.json({ ok: true }); // robot

  const email = (body.email ?? "").trim().slice(0, 200);
  const message = (body.message ?? "").trim().slice(0, 3000);
  const name = (body.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80) || null;
  const topic = TOPICS.includes(body.topic as (typeof TOPICS)[number]) ? (body.topic as (typeof TOPICS)[number]) : "sporsmal";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Skriv en gyldig e-postadresse, så vi kan svare deg." }, { status: 400 });
  if (message.length < 2) return NextResponse.json({ error: "Skriv en melding." }, { status: 400 });

  const supabase = getServiceSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Serverfeil. Prøv igjen senere." }, { status: 500 });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "ukjent";
  const senderHash = createHash("sha256").update(`${ip}|${email.toLowerCase()}|${new Date().toISOString().slice(0, 10)}`).digest("base64url").slice(0, 32);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("sender_hash", senderHash).gte("created_at", since);
  if ((recent.count ?? 0) >= 5) return NextResponse.json({ error: "Du har sendt mange meldinger nå. Prøv igjen om en time." }, { status: 429 });

  const insert = await supabase.from("contact_messages").insert({ name, email, topic, message, sender_hash: senderHash });
  if (insert.error) {
    console.error("[contact]", insert.error.message);
    return NextResponse.json({ error: "Klarte ikke å sende. Prøv igjen." }, { status: 400 });
  }

  after(async () => {
    for (const familyId of await ownerFamilyIds(supabase)) {
      await notifyParents(supabase, familyId, {
        title: `Ny melding: ${TOPIC_LABEL[topic]} ✉️`,
        body: `${name ?? email}: ${message.slice(0, 80)}`,
        url: "/admin/eier",
        tag: "contact",
      });
    }
  });
  return NextResponse.json({ ok: true });
}
