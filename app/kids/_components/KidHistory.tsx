"use client";

import { useState } from "react";
import useSWR from "swr";
import { History } from "lucide-react";
import type { HistoryEvent } from "@/lib/history";
import { formatWhen } from "@/lib/dates";
import { formatKr } from "@/lib/money";
import type { Lang } from "@/lib/i18n";
import { kidText } from "../_lib/text";

const STYLE: Record<HistoryEvent["kind"], { emoji: string; tone: string }> = {
  earned: { emoji: "✅", tone: "text-primary" },
  pending: { emoji: "⏳", tone: "text-muted-foreground" },
  rejected: { emoji: "↩️", tone: "text-muted-foreground line-through" },
  payment: { emoji: "💸", tone: "text-foreground" },
  wish: { emoji: "🎁", tone: "text-foreground" },
};

export const kidHistoryKey = (childId: string) => ["kid-history", childId] as const;

// Barnets egen historikk: hva det har gjort, tjent og fått.
export function KidHistory({ childId, lang = "nb" }: { childId: string; lang?: Lang }) {
  const t = kidText(lang);
  const [showAll, setShowAll] = useState(false);
  const { data } = useSWR(
    kidHistoryKey(childId),
    async () => {
      const res = await fetch(`/api/kids/history?childId=${encodeURIComponent(childId)}`, { credentials: "include" });
      const payload = (await res.json().catch(() => ({}))) as { events?: HistoryEvent[]; error?: string };
      if (!res.ok || payload.error) throw new Error(payload.error ?? "Feil");
      return payload.events ?? [];
    },
    { revalidateOnFocus: true, shouldRetryOnError: false }
  );

  if (!data || data.length === 0) return null;
  const list = showAll ? data : data.slice(0, 6);

  return (
    <section aria-labelledby="historikk-title" className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 id="historikk-title" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
        <History className="size-6 text-primary" /> {t.history}
      </h2>
      <ul className="mt-4 divide-y divide-border">
        {list.map((e) => {
          const s = STYLE[e.kind];
          const negative = e.kind === "payment" || e.kind === "wish";
          return (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-xl" aria-hidden="true">
                {s.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{e.title}</p>
                <p className="text-sm text-muted-foreground">
                  {t.historyKind[e.kind]} · {formatWhen(e.at, undefined, lang)}
                  {e.savedOre > 0 && ` · ${t.inPiggy(formatKr(e.savedOre, lang))}`}
                </p>
              </div>
              <span className={`font-num shrink-0 font-bold ${s.tone}`}>
                {negative ? "" : "+"}
                {formatKr(e.amountOre, lang)}
              </span>
            </li>
          );
        })}
      </ul>
      {data.length > 6 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 min-h-11 font-semibold text-primary">
          {showAll ? t.showLess : t.showAll(data.length)}
        </button>
      )}
    </section>
  );
}
