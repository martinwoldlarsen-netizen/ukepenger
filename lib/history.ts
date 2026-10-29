// Felles oppbygging av historikk (barnets egen og de voksnes), fra krav og
// utbetalinger. Brukes både på serveren (kiosk-API) og i nettleseren (admin).

import type { Lang } from "@/lib/i18n";

export type HistoryEvent = {
  id: string;
  kind: "earned" | "pending" | "rejected" | "payment" | "wish";
  childId: string;
  title: string;
  amountOre: number;
  savedOre: number;
  at: string;
  method?: string;
};

type ClaimLike = {
  id: string;
  child_id: string;
  task_id: string | null;
  status: string;
  amount_ore: number;
  saved_ore: number | null;
  note: string | null;
  created_at: string;
  decided_at: string | null;
  tasks: { title: string } | { title: string }[] | null;
};

type PaymentLike = { id: string; child_id: string; method: string; amount_ore: number; note: string | null; created_at: string };

export const METHOD_LABEL: Record<string, string> = { VIPPS: "Vipps", CASH: "Kontanter", BANK: "Bank", OTHER: "Annet", WISH: "Ønske" };

// Faste ord i historikken på barnets språk (barnesiden). Admin bruker norsk.
const WORDS: Record<Lang, { bonus: string; sale: string; task: string; wish: string; paid: string; allowance: string; methods: Record<string, string> }> = {
  nb: { bonus: "Bonus", sale: "Butikksalg", task: "Oppgave", wish: "Ønske", paid: "Utbetalt", allowance: "📅 Ukepenger", methods: METHOD_LABEL },
  en: { bonus: "Bonus", sale: "Shop sale", task: "Task", wish: "Wish", paid: "Paid out", allowance: "📅 Pocket money", methods: { VIPPS: "Vipps", CASH: "Cash", BANK: "Bank", OTHER: "Other", WISH: "Wish" } },
  uk: { bonus: "Бонус", sale: "Продаж", task: "Завдання", wish: "Бажання", paid: "Виплачено", allowance: "📅 Кишенькові", methods: { VIPPS: "Vipps", CASH: "Готівка", BANK: "Банк", OTHER: "Інше", WISH: "Бажання" } },
};

function claimTitle(c: ClaimLike, w: (typeof WORDS)[Lang]) {
  // Gaver («🎁 Gave fra …») og ukepenger («📅 Ukepenger») har allerede egen tekst.
  if (!c.task_id) {
    if (!c.note) return w.sale;
    if (c.note === "📅 Ukepenger") return w.allowance;
    return /^\p{Extended_Pictographic}/u.test(c.note) ? c.note : `${w.bonus}: ${c.note}`;
  }
  const t = Array.isArray(c.tasks) ? c.tasks[0] : c.tasks;
  return t?.title ?? w.task;
}

export function buildHistory(claims: ClaimLike[], payments: PaymentLike[], lang: Lang = "nb"): HistoryEvent[] {
  const w = WORDS[lang];
  const events: HistoryEvent[] = [];
  for (const c of claims) {
    const kind = c.status === "SENT" ? "pending" : c.status === "REJECTED" ? "rejected" : "earned";
    events.push({
      id: `c-${c.id}`,
      kind,
      childId: c.child_id,
      title: claimTitle(c, w),
      // Det barnet tjente før sparing ble trukket.
      amountOre: c.amount_ore + (c.saved_ore ?? 0),
      savedOre: c.saved_ore ?? 0,
      at: c.decided_at ?? c.created_at,
    });
  }
  for (const p of payments) {
    events.push({
      id: `p-${p.id}`,
      kind: p.method === "WISH" ? "wish" : "payment",
      childId: p.child_id,
      title: p.method === "WISH" ? `${w.wish}: ${p.note ?? ""}`.trim() : `${w.paid} (${w.methods[p.method] ?? p.method})${p.note ? ` · ${p.note}` : ""}`,
      amountOre: p.amount_ore,
      savedOre: 0,
      at: p.created_at,
      method: p.method,
    });
  }
  // Et krav som er delt i to ved ønskeutbetaling skal ikke se dobbelt ut;
  // utbetalingen vises som egen linje, kravene som "tjent".
  return events.sort((a, b) => (a.at < b.at ? 1 : -1));
}

export const HISTORY_CLAIM_SELECT = "id, child_id, task_id, status, amount_ore, saved_ore, note, created_at, decided_at, tasks(title)";
export const HISTORY_PAYMENT_SELECT = "id, child_id, method, amount_ore, note, created_at";
