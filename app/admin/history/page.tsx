"use client";

import { useState } from "react";
import useSWR from "swr";
import { Download } from "lucide-react";
import { Avatar, Button, EmptyState, ListSkeleton, cx, focusRing } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { childLookup, friendlyError, swrDefaults, useAdminIdentity, useChildren } from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";
import { HISTORY_CLAIM_SELECT, HISTORY_PAYMENT_SELECT, type HistoryEvent, buildHistory } from "@/lib/history";
import { formatKr } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

import { localeOf } from "@/lib/i18n";
import { useLang, useText } from "@/lib/use-lang";

const TONE: Record<HistoryEvent["kind"], string> = {
  earned: "text-primary",
  pending: "text-amber-700",
  rejected: "text-muted-foreground line-through",
  payment: "text-foreground",
  wish: "text-foreground",
};

const TEXT = {
  nb: {
    kind: { earned: "Godkjent", pending: "Venter", rejected: "Avvist", payment: "Utbetalt", wish: "Ønske utbetalt" } as Record<HistoryEvent["kind"], string>,
    columns: ["Dato", "Barn", "Hva", "Status", "Beløp (kr)", "Til sparing (kr)"], downloaded: (n: number) => `Lastet ned ${n} rader`, downloadFailed: "Klarte ikke å laste ned.",
    download: "Last ned all historikk (Excel/CSV)", pickChild: "Velg barn", all: "Alle", emptyTitle: "Ingenting her ennå", emptyBody: "Når barna gjør oppgaver og du betaler ut, dukker det opp her.",
    saved: (amount: string) => `${amount} spart`, file: "ukepenger-historikk",
  },
  en: {
    kind: { earned: "Approved", pending: "Waiting", rejected: "Declined", payment: "Paid out", wish: "Wish paid out" } as Record<HistoryEvent["kind"], string>,
    columns: ["Date", "Child", "What", "Status", "Amount (kr)", "To savings (kr)"], downloaded: (n: number) => `Downloaded ${n} rows`, downloadFailed: "Couldn't download.",
    download: "Download all history (Excel/CSV)", pickChild: "Choose child", all: "All", emptyTitle: "Nothing here yet", emptyBody: "When the children do tasks and you pay out, it shows up here.",
    saved: (amount: string) => `${amount} saved`, file: "ukepenger-history",
  },
  uk: {
    kind: { earned: "Схвалено", pending: "Очікує", rejected: "Відхилено", payment: "Виплачено", wish: "Бажання виплачено" } as Record<HistoryEvent["kind"], string>,
    columns: ["Дата", "Дитина", "Що", "Статус", "Сума (kr)", "У заощадження (kr)"], downloaded: (n: number) => `Завантажено рядків: ${n}`, downloadFailed: "Не вдалося завантажити.",
    download: "Завантажити всю історію (Excel/CSV)", pickChild: "Оберіть дитину", all: "Усі", emptyTitle: "Тут поки нічого немає", emptyBody: "Коли діти виконуватимуть завдання, а ви — виплачувати, усе з’явиться тут.",
    saved: (amount: string) => `відкладено ${amount}`, file: "ukepenger-istoriia",
  },
};

export default function AdminHistoryPage() {
  const t = useText(TEXT);
  const lang = useLang();
  const { familyId } = useAdminIdentity();
  const children = useChildren(familyId);
  const childOf = childLookup(children.data);
  const [filter, setFilter] = useState<string | null>(null);
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  // Hele historikken som CSV (semikolon + BOM, så Excel/Numbers på norsk åpner den riktig).
  const exportCsv = async () => {
    if (!familyId) return;
    setExporting(true);
    try {
      const [claims, payments] = await Promise.all([
        supabase.from("claims").select(HISTORY_CLAIM_SELECT).eq("family_id", familyId).order("created_at", { ascending: false }).limit(20000),
        supabase.from("payments").select(HISTORY_PAYMENT_SELECT).eq("family_id", familyId).order("created_at", { ascending: false }).limit(20000),
      ]);
      if (claims.error || payments.error) throw new Error(claims.error?.message ?? payments.error?.message);
      const all = buildHistory(claims.data ?? [], payments.data ?? [], lang);
      const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const kr = (ore: number) => (ore / 100).toFixed(2).replace(".", ",");
      const rows = [
        t.columns.map(cell).join(";"),
        ...all.map((e) =>
          [new Date(e.at).toLocaleString(localeOf(lang)), childOf(e.childId).name, e.title, t.kind[e.kind], kr(e.amountOre), kr(e.savedOre)].map(cell).join(";")
        ),
      ];
      const blob = new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${t.file}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ text: t.downloaded(all.length) });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.downloadFailed) });
    } finally {
      setExporting(false);
    }
  };

  const history = useSWR(
    familyId ? ["history", familyId, lang] : null,
    async () => {
      const [claims, payments] = await Promise.all([
        supabase.from("claims").select(HISTORY_CLAIM_SELECT).eq("family_id", familyId as string).order("created_at", { ascending: false }).limit(150),
        supabase.from("payments").select(HISTORY_PAYMENT_SELECT).eq("family_id", familyId as string).order("created_at", { ascending: false }).limit(60),
      ]);
      if (claims.error || payments.error) throw new Error(claims.error?.message ?? payments.error?.message);
      return buildHistory(claims.data ?? [], payments.data ?? [], lang);
    },
    swrDefaults
  );

  if (!history.data) return <ListSkeleton rows={5} />;

  const events = history.data.filter((e) => !filter || e.childId === filter);
  const kids = (children.data ?? []).filter((c) => c.active);

  return (
    <section className="space-y-5">
      <Button variant="secondary" block icon={<Download className="size-4" />} loading={exporting} onClick={() => void exportCsv()}>
        {t.download}
      </Button>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label={t.pickChild}>
        {[{ id: null as string | null, name: t.all }, ...kids].map((c) => (
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
        <EmptyState emoji="📖" title={t.emptyTitle}>
          {t.emptyBody}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {events.map((e) => {
            const child = childOf(e.childId);
            const tone = TONE[e.kind];
            const out = e.kind === "payment" || e.kind === "wish";
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar avatarKey={child.avatar_key} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {child.name} · {t.kind[e.kind]} · {formatWhen(e.at, undefined, lang)}
                    {e.savedOre > 0 && ` · ${t.saved(formatKr(e.savedOre, lang))}`}
                  </p>
                </div>
                <span className={cx("font-num shrink-0 font-bold", tone)}>
                  {out ? "−" : "+"}
                  {formatKr(e.amountOre, lang)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
