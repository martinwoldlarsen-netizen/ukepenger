"use client";

import { useState } from "react";
import useSWR from "swr";
import { BarChart3, ExternalLink, Heart, Home, Mail, UserRound } from "lucide-react";
import { Badge, Card, CardHeader, ListSkeleton } from "@/components/ui";
import { adminFetch, friendlyError, swrDefaults } from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";

type Account = { email: string; created_at: string; last_sign_in_at: string | null; provider: string; type: "forelder" | "besteforelder" | "uten-familie" | "ubekreftet"; family: string | null };
type FamilyRow = { name: string; created_at: string; parents: number; children: number; grandparents: number; claims30: number; last_activity: string | null; active: boolean };
type Grandparent = { name: string; family: string; has_profile: boolean; last_seen_at: string | null; created_at: string };
type Stats = {
  totals: Record<
    | "families"
    | "activeFamilies7"
    | "parents"
    | "children"
    | "grandparents"
    | "grandparentProfiles"
    | "devices"
    | "accounts"
    | "newAccounts7"
    | "newAccounts30"
    | "logins1"
    | "logins7"
    | "grandparentVisits7"
    | "stuck",
    number
  >;
  perDay: { day: string; claims: number; gifts: number }[];
  accounts: Account[];
  families: FamilyRow[];
  grandparents: Grandparent[];
};

const TYPE_LABEL: Record<Account["type"], { text: string; tone: "success" | "primary" | "warning" | "neutral" }> = {
  forelder: { text: "Forelder", tone: "success" },
  besteforelder: { text: "Besteforelder", tone: "primary" },
  "uten-familie": { text: "Uten familie", tone: "warning" },
  ubekreftet: { text: "Ikke bekreftet e-post", tone: "warning" },
};

const ANALYTICS_URL = "https://vercel.com/martin-larsens-projects/ukepenger-app/analytics";

// Bare for eieren av tjenesten (app_owners). Tall og kontoer – ingen barnedata.
export default function OwnerPage() {
  const stats = useSWR("owner-stats", () => adminFetch<Stats>("/api/admin/owner"), { ...swrDefaults, refreshInterval: 60_000 });
  const [showAll, setShowAll] = useState(false);

  if (stats.error) {
    return (
      <Card>
        <p className="font-semibold">{friendlyError(stats.error, "Denne siden er bare for eieren av Ukepenger.")}</p>
      </Card>
    );
  }
  if (!stats.data) return <ListSkeleton rows={4} />;
  const { totals, perDay, accounts, families, grandparents } = stats.data;
  const stuck = accounts.filter((a) => a.type === "uten-familie" || a.type === "ubekreftet");
  const shown = showAll ? accounts : accounts.slice(0, 15);

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Familier" value={totals.families} sub={`${totals.activeFamilies7} aktive siste 7 dager`} />
        <Tile label="Innlogget i dag" value={totals.logins1} sub={`${totals.logins7} siste 7 dager`} />
        <Tile label="Nye kontoer, 7 dager" value={totals.newAccounts7} sub={`${totals.newAccounts30} siste 30 dager · ${totals.accounts} totalt`} />
        <Tile label="Besteforeldre innom" value={totals.grandparentVisits7} sub={`siste 7 dager · ${totals.grandparents} lenker, ${totals.grandparentProfiles} med profil`} />
        <Tile label="Foreldre" value={totals.parents} />
        <Tile label="Barn" value={totals.children} />
        <Tile label="iPader/enheter" value={totals.devices} />
        <Tile label="Står fast" value={totals.stuck} sub="konto uten familie" warn={totals.stuck > 0} />
      </div>

      <Card className="space-y-4">
        <CardHeader icon={<BarChart3 className="size-5" />} title="Krav og gaver per dag" description="Siste 14 dager, alle familier." />
        <DayBars data={perDay} />
      </Card>

      <Card className="space-y-3">
        <CardHeader
          icon={<ExternalLink className="size-5" />}
          title="Besøk på nettsiden"
          description="Anonym besøksstatistikk (sider, land, mobil/PC, hvor de kom fra) ligger i Vercel. Slå på «Web Analytics» der første gang."
        />
        <a href={ANALYTICS_URL} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-secondary font-bold hover:bg-accent">
          Åpne besøksstatistikk i Vercel <ExternalLink className="size-4" />
        </a>
      </Card>

      {stuck.length > 0 && (
        <Card className="space-y-3">
          <CardHeader
            icon={<Mail className="size-5" />}
            title="Står fast"
            description="Har laget konto, men er ikke med i en familie ennå (eller har ikke bekreftet e-posten). Kanskje de trenger hjelp?"
          />
          <ul className="space-y-2">
            {stuck.map((a) => (
              <li key={a.email} className="rounded-2xl border border-border px-4 py-3">
                <p className="break-all font-semibold">{a.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Laget {formatWhen(a.created_at)}</span>
                  <Badge tone="warning">{TYPE_LABEL[a.type].text}</Badge>
                  <a href={`mailto:${a.email}?subject=${encodeURIComponent("Ukepenger – trenger du hjelp?")}`} className="ml-auto font-semibold text-primary underline">
                    Send e-post
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-3">
        <CardHeader icon={<UserRound className="size-5" />} title="Kontoer" description="Sist innlogget først." />
        <ul className="space-y-2">
          {shown.map((a) => (
            <li key={a.email} className="rounded-2xl border border-border px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-semibold">{a.email}</p>
                <Badge tone={TYPE_LABEL[a.type].tone}>{TYPE_LABEL[a.type].text}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {a.family ? `${a.family} · ` : ""}
                {a.last_sign_in_at ? `Sist inne ${formatWhen(a.last_sign_in_at)}` : "Aldri logget inn"} · laget {formatWhen(a.created_at)}
                {a.provider !== "email" ? ` · ${a.provider === "google" ? "Google" : a.provider}` : ""}
              </p>
            </li>
          ))}
        </ul>
        {accounts.length > 15 && (
          <button type="button" onClick={() => setShowAll(!showAll)} className="w-full py-2 text-sm font-semibold text-primary underline">
            {showAll ? "Vis færre" : `Vis alle ${accounts.length}`}
          </button>
        )}
      </Card>

      <Card className="space-y-3">
        <CardHeader icon={<Home className="size-5" />} title="Familier" description="Sist aktiv først. Aktiv = krav eller innlogging siste 7 dager." />
        <ul className="space-y-2">
          {families.map((f, i) => (
            <li key={`${f.name}-${i}`} className="rounded-2xl border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-semibold">{f.name}</p>
                {f.active ? <Badge tone="success">Aktiv</Badge> : <Badge>Rolig</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {f.parents} voksne · {f.children} barn · {f.grandparents} besteforeldre · {f.claims30} krav siste 30 dager
                {f.last_activity ? ` · sist krav ${formatWhen(f.last_activity)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {grandparents.length > 0 && (
        <Card className="space-y-3">
          <CardHeader icon={<Heart className="size-5" />} title="Besteforeldre" description="Sist innom først." />
          <ul className="space-y-2">
            {grandparents.map((g, i) => (
              <li key={`${g.name}-${i}`} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {g.name} <span className="font-normal text-muted-foreground">· {g.family}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{g.last_seen_at ? `Sist innom ${formatWhen(g.last_seen_at)}` : "Har ikke åpnet lenken"}</p>
                </div>
                {g.has_profile && <Badge tone="primary">Har profil</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

function Tile({ label, value, sub, warn }: { label: string; value: number; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-3xl border bg-card p-4 shadow-sm ${warn ? "border-amber-300" : "border-border"}`}>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="font-num mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// Én serie (krav + gaver per dag). Hold over/trykk på en søyle for tallet.
function DayBars({ data }: { data: { day: string; claims: number; gifts: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = data.map((d) => d.claims + d.gifts);
  const max = Math.max(1, ...totals);
  const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("nb-NO", { weekday: "short", day: "numeric" });
  const shownIndex = active ?? data.length - 1;
  const shown = data[shownIndex];
  return (
    <div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-semibold text-foreground">{dayLabel(shown.day)}:</span> {shown.claims} krav{shown.gifts ? `, ${shown.gifts} gaver` : ""}
      </p>
      <div className="mt-3 flex h-32 items-end gap-[2px] border-b border-border" onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => {
          const total = totals[i];
          return (
            <button
              key={d.day}
              type="button"
              aria-label={`${dayLabel(d.day)}: ${d.claims} krav, ${d.gifts} gaver`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className="flex h-full flex-1 items-end"
            >
              <span
                className={`block w-full rounded-t-[4px] ${i === shownIndex ? "bg-primary" : "bg-primary/45"}`}
                style={{ height: total ? `${Math.max(4, (total / max) * 100)}%` : "2px" }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{dayLabel(data[0].day)}</span>
        <span>{dayLabel(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}
