"use client";

import { useState } from "react";
import useSWR from "swr";
import { Avatar, EmptyState, ListSkeleton, cx, focusRing } from "@/components/ui";
import { childLookup, swrDefaults, useAdminIdentity, useChildren } from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";
import { HISTORY_CLAIM_SELECT, HISTORY_PAYMENT_SELECT, type HistoryEvent, buildHistory } from "@/lib/history";
import { formatKr } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

const LABEL: Record<HistoryEvent["kind"], { text: string; tone: string }> = {
  earned: { text: "Godkjent", tone: "text-primary" },
  pending: { text: "Venter", tone: "text-amber-700" },
  rejected: { text: "Avvist", tone: "text-muted-foreground line-through" },
  payment: { text: "Utbetalt", tone: "text-foreground" },
  wish: { text: "Ønske utbetalt", tone: "text-foreground" },
};

export default function AdminHistoryPage() {
  const { familyId } = useAdminIdentity();
  const children = useChildren(familyId);
  const childOf = childLookup(children.data);
  const [filter, setFilter] = useState<string | null>(null);

  const history = useSWR(
    familyId ? ["history", familyId] : null,
    async () => {
      const [claims, payments] = await Promise.all([
        supabase.from("claims").select(HISTORY_CLAIM_SELECT).eq("family_id", familyId as string).order("created_at", { ascending: false }).limit(150),
        supabase.from("payments").select(HISTORY_PAYMENT_SELECT).eq("family_id", familyId as string).order("created_at", { ascending: false }).limit(60),
      ]);
      if (claims.error || payments.error) throw new Error(claims.error?.message ?? payments.error?.message);
      return buildHistory(claims.data ?? [], payments.data ?? []);
    },
    swrDefaults
  );

  if (!history.data) return <ListSkeleton rows={5} />;

  const events = history.data.filter((e) => !filter || e.childId === filter);
  const kids = (children.data ?? []).filter((c) => c.active);

  return (
    <section className="space-y-5">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Velg barn">
        {[{ id: null as string | null, name: "Alle" }, ...kids].map((c) => (
          <button
            key={c.id ?? "alle"}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={cx(
              "min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition",
              focusRing,
              filter === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/80 hover:bg-accent"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState emoji="📖" title="Ingenting her ennå">
          Når barna gjør oppgaver og du betaler ut, dukker det opp her.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {events.map((e) => {
            const child = childOf(e.childId);
            const l = LABEL[e.kind];
            const out = e.kind === "payment" || e.kind === "wish";
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar avatarKey={child.avatar_key} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {child.name} · {l.text} · {formatWhen(e.at)}
                    {e.savedOre > 0 && ` · ${formatKr(e.savedOre)} spart`}
                  </p>
                </div>
                <span className={cx("font-num shrink-0 font-bold", l.tone)}>
                  {out ? "−" : "+"}
                  {formatKr(e.amountOre)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
