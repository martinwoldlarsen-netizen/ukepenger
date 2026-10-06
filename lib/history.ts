// Felles oppbygging av historikk (barnets egen og de voksnes), fra krav og
// utbetalinger. Brukes både på serveren (kiosk-API) og i nettleseren (admin).

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

function claimTitle(c: ClaimLike) {
  // Gaver («🎁 Gave fra …») og ukepenger («📅 Ukepenger») har allerede egen tekst.
  if (!c.task_id) return c.note ? (/^\p{Extended_Pictographic}/u.test(c.note) ? c.note : `Bonus: ${c.note}`) : "Butikksalg";
  const t = Array.isArray(c.tasks) ? c.tasks[0] : c.tasks;
  return t?.title ?? "Oppgave";
}

export function buildHistory(claims: ClaimLike[], payments: PaymentLike[]): HistoryEvent[] {
  const events: HistoryEvent[] = [];
  for (const c of claims) {
    const kind = c.status === "SENT" ? "pending" : c.status === "REJECTED" ? "rejected" : "earned";
    events.push({
      id: `c-${c.id}`,
      kind,
      childId: c.child_id,
      title: claimTitle(c),
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
      title: p.method === "WISH" ? `Ønske: ${p.note ?? ""}`.trim() : `Utbetalt (${METHOD_LABEL[p.method] ?? p.method})${p.note ? ` · ${p.note}` : ""}`,
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
