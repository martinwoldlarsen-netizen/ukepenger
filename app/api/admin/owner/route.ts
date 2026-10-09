import { createClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

// Eier-oversikt: hvem som bruker tjenesten. Bare for kontoer i app_owners.
// ?check=1 svarer bare om du er eier (brukes for å vise menypunktet).
export async function GET(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = getServiceSupabaseClient();
  if (!token || !url || !anonKey || !supabase) return NextResponse.json({ error: "Ikke tilgang." }, { status: 403 });

  const userRes = await createClient(url, anonKey).auth.getUser(token);
  const me = userRes.data.user;
  if (!me) return NextResponse.json({ error: "Ikke tilgang." }, { status: 403 });
  const ownerRes = await supabase.from("app_owners").select("user_id").eq("user_id", me.id).maybeSingle();
  if (!ownerRes.data) return NextResponse.json({ error: "Ikke tilgang." }, { status: 403 });
  if (new URL(request.url).searchParams.get("check") === "1") return NextResponse.json({ owner: true });

  const now = Date.now();
  const since30 = new Date(now - 30 * DAY).toISOString();

  const users: User[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (res.error) return NextResponse.json({ error: "Klarte ikke å hente brukere." }, { status: 500 });
    users.push(...res.data.users);
    if (res.data.users.length < 1000) break;
  }

  const [profilesRes, familiesRes, childrenRes, guestsRes, devicesRes, claimsRes] = await Promise.all([
    supabase.from("profiles").select("user_id, family_id"),
    supabase.from("families").select("id, name, created_at"),
    supabase.from("children").select("family_id, active"),
    supabase.from("family_guests").select("id, family_id, name, user_id, created_at, last_seen_at, revoked_at"),
    supabase.from("devices").select("family_id, active, revoked_at"),
    supabase.from("claims").select("family_id, task_id, note, created_at").gte("created_at", since30),
  ]);
  if (profilesRes.error || familiesRes.error || childrenRes.error || guestsRes.error || devicesRes.error || claimsRes.error) {
    return NextResponse.json({ error: "Klarte ikke å hente tall." }, { status: 500 });
  }

  const profiles = profilesRes.data ?? [];
  const families = familiesRes.data ?? [];
  const guests = (guestsRes.data ?? []).filter((g) => !g.revoked_at);
  const claims = claimsRes.data ?? [];
  const familyName = new Map(families.map((f) => [f.id, f.name as string | null]));
  const familyOf = new Map(profiles.map((p) => [p.user_id, p.family_id as string]));
  const guestUsers = new Set(guests.filter((g) => g.user_id).map((g) => g.user_id as string));
  const within = (iso: string | null | undefined, days: number) => Boolean(iso && now - new Date(iso).getTime() < days * DAY);

  // Krav per dag siste 14 dager (oppgaver/ukepenger/bonus) og gaver.
  const perDay: { day: string; claims: number; gifts: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * DAY).toISOString().slice(0, 10);
    perDay.push({ day: d, claims: 0, gifts: 0 });
  }
  for (const c of claims) {
    const row = perDay.find((r) => r.day === c.created_at.slice(0, 10));
    if (!row) continue;
    if (!c.task_id && (c.note ?? "").startsWith("🎁")) row.gifts++;
    else row.claims++;
  }

  // Aktiv familie = krav siste 7 dager, eller en forelder logget inn siste 7 dager.
  const activeFamilies = new Set<string>();
  for (const c of claims) if (within(c.created_at, 7)) activeFamilies.add(c.family_id);
  for (const u of users) {
    const f = familyOf.get(u.id);
    if (f && within(u.last_sign_in_at, 7)) activeFamilies.add(f);
  }

  const lastClaim = new Map<string, string>();
  for (const c of claims) if (!lastClaim.has(c.family_id) || c.created_at > lastClaim.get(c.family_id)!) lastClaim.set(c.family_id, c.created_at);

  const accounts = users
    .map((u) => {
      const f = familyOf.get(u.id);
      const type = f ? "forelder" : guestUsers.has(u.id) ? "besteforelder" : !u.email_confirmed_at ? "ubekreftet" : "uten-familie";
      return {
        email: u.email ?? "(uten e-post)",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        provider: (u.app_metadata?.provider as string | undefined) ?? "email",
        type,
        family: f ? (familyName.get(f) ?? "Familie") : null,
      };
    })
    .sort((a, b) => (b.last_sign_in_at ?? b.created_at).localeCompare(a.last_sign_in_at ?? a.created_at));

  const familyRows = families
    .map((f) => ({
      name: f.name ?? "Familie",
      created_at: f.created_at,
      parents: profiles.filter((p) => p.family_id === f.id).length,
      children: (childrenRes.data ?? []).filter((c) => c.family_id === f.id && c.active).length,
      grandparents: guests.filter((g) => g.family_id === f.id).length,
      claims30: claims.filter((c) => c.family_id === f.id).length,
      last_activity: lastClaim.get(f.id) ?? null,
      active: activeFamilies.has(f.id),
    }))
    .sort((a, b) => (b.last_activity ?? b.created_at).localeCompare(a.last_activity ?? a.created_at));

  return NextResponse.json({
    totals: {
      families: families.length,
      activeFamilies7: activeFamilies.size,
      parents: profiles.length,
      children: (childrenRes.data ?? []).filter((c) => c.active).length,
      grandparents: guests.length,
      grandparentProfiles: guests.filter((g) => g.user_id).length,
      devices: (devicesRes.data ?? []).filter((d) => d.active && !d.revoked_at).length,
      accounts: users.length,
      newAccounts7: users.filter((u) => within(u.created_at, 7)).length,
      newAccounts30: users.filter((u) => within(u.created_at, 30)).length,
      logins1: users.filter((u) => within(u.last_sign_in_at, 1)).length,
      logins7: users.filter((u) => within(u.last_sign_in_at, 7)).length,
      grandparentVisits7: guests.filter((g) => within(g.last_seen_at, 7)).length,
      stuck: accounts.filter((a) => a.type === "uten-familie" || a.type === "ubekreftet").length,
    },
    perDay,
    accounts: accounts.slice(0, 100),
    families: familyRows,
    grandparents: guests
      .map((g) => ({ name: g.name, family: familyName.get(g.family_id) ?? "Familie", has_profile: Boolean(g.user_id), last_seen_at: g.last_seen_at, created_at: g.created_at }))
      .sort((a, b) => (b.last_seen_at ?? b.created_at).localeCompare(a.last_seen_at ?? a.created_at)),
  });
}
