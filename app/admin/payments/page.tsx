"use client";

import { KidAvatar } from "@/components/avatars/KidAvatar";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { ChevronDown, Receipt, Trash2, Wallet } from "lucide-react";
import { Avatar, Button, Card, EmptyState, Input, ListSkeleton, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import {
  type AdminChild,
  adminFetch,
  childLookup,
  friendlyError,
  swrDefaults,
  UserFacingError,
  taskTitleOf,
  useAdminIdentity,
  useChildren,
} from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { useLang, useText } from "@/lib/use-lang";

type ApprovedClaim = {
  id: string;
  child_id: string;
  task_id: string | null;
  amount_ore: number;
  created_at: string;
  note?: string | null;
  tasks: { title: string } | { title: string }[] | null;
};

type Payment = {
  id: string;
  child_id: string;
  method: string;
  amount_ore: number;
  created_at: string;
  note: string | null;
  claims: Array<{ id: string; title: string; amount_ore: number }>;
};

type PaymentMethod = "CASH" | "VIPPS" | "BANK" | "OTHER";
const METHODS: PaymentMethod[] = ["CASH", "VIPPS", "BANK", "OTHER"];

const TEXT = {
  nb: {
    // WISH settes av databasefunksjonen approve_wish når et ønske utbetales.
    methods: { VIPPS: "Vipps", CASH: "Kontanter", BANK: "Bank", OTHER: "Annet", WISH: "Ønske" } as Record<string, string>,
    amountAsNumber: "Skriv beløpet som et tall, f.eks. 34,50.",
    onlyOwed: (name: string, amount: string) => `${name} har bare ${amount} til gode.`,
    theChild: "Barnet",
    payTitle: (amount: string, name: string) => `Utbetale ${amount} til ${name}?`,
    payText: (method: string, rest: string) => `${method}. ${rest} blir igjen.`,
    payOut: "Utbetal",
    tooMuch: "Beløpet er større enn det barnet har til gode.",
    paidToast: (amount: string, name: string) => `${amount} utbetalt til ${name}`,
    payFailed: "Klarte ikke å registrere utbetalingen.",
    deleteTitle: "Slette utbetalingen?",
    deleteWishText: (amount: string, name: string) => `${amount} går tilbake til ${name} sitt «til gode», og ønsket blir et sparemål igjen.`,
    deleteText: (amount: string, name: string) => `${amount} går tilbake til ${name} sitt «til gode».`,
    delete: "Slett",
    deleted: "Utbetalingen er slettet",
    deleteFailed: "Klarte ikke å slette utbetalingen.",
    loadFailed: "Klarte ikke å hente utbetalinger",
    tryAgain: "Prøv igjen",
    owes: (name: string) => `${name} har til gode`,
    nothingToPay: "Ingenting å utbetale akkurat nå.",
    howMuch: "Hvor mye betaler du ut?",
    all: (amount: string) => `Alt · ${amount}`,
    leftInPot: (amount: string) => `${amount} blir igjen i potten.`,
    whatFor: "Hva gjelder det?",
    optional: "(valgfritt)",
    notePlaceholder: "F.eks. Lego-sett, eller ukepenger",
    paidWith: "Betalt med",
    payAmount: (amount: string) => `Utbetal ${amount}`,
    showSource: "Vis hva pengene kommer fra",
    noChildrenTitle: "Ingen barn ennå",
    noChildrenBody: "Legg til barn under Barn.",
    recent: "Siste utbetalinger",
    noPayments: "Ingen utbetalinger ennå",
    deletePayment: "Slett utbetaling",
  },
  en: {
    methods: { VIPPS: "Vipps", CASH: "Cash", BANK: "Bank", OTHER: "Other", WISH: "Wish" } as Record<string, string>,
    amountAsNumber: "Write the amount as a number, e.g. 34.50.",
    onlyOwed: (name: string, amount: string) => `${name} is only owed ${amount}.`,
    theChild: "The child",
    payTitle: (amount: string, name: string) => `Pay ${amount} to ${name}?`,
    payText: (method: string, rest: string) => `${method}. ${rest} will be left.`,
    payOut: "Pay out",
    tooMuch: "The amount is more than the child is owed.",
    paidToast: (amount: string, name: string) => `${amount} paid to ${name}`,
    payFailed: "Couldn't record the payout.",
    deleteTitle: "Delete the payout?",
    deleteWishText: (amount: string, name: string) => `${amount} goes back to what ${name} is owed, and the wish becomes a savings goal again.`,
    deleteText: (amount: string, name: string) => `${amount} goes back to what ${name} is owed.`,
    delete: "Delete",
    deleted: "The payout was deleted",
    deleteFailed: "Couldn't delete the payout.",
    loadFailed: "Couldn't load payouts",
    tryAgain: "Try again",
    owes: (name: string) => `${name} is owed`,
    nothingToPay: "Nothing to pay out right now.",
    howMuch: "How much are you paying out?",
    all: (amount: string) => `All · ${amount}`,
    leftInPot: (amount: string) => `${amount} will be left.`,
    whatFor: "What is it for?",
    optional: "(optional)",
    notePlaceholder: "E.g. LEGO set, or pocket money",
    paidWith: "Paid with",
    payAmount: (amount: string) => `Pay out ${amount}`,
    showSource: "Show where the money comes from",
    noChildrenTitle: "No children yet",
    noChildrenBody: "Add children under Children.",
    recent: "Recent payouts",
    noPayments: "No payouts yet",
    deletePayment: "Delete payout",
  },
  uk: {
    methods: { VIPPS: "Vipps", CASH: "Готівка", BANK: "Банк", OTHER: "Інше", WISH: "Бажання" } as Record<string, string>,
    amountAsNumber: "Напишіть суму числом, наприклад 34,50.",
    onlyOwed: (name: string, amount: string) => `${name}: належить лише ${amount}.`,
    theChild: "Дитина",
    payTitle: (amount: string, name: string) => `Виплатити ${amount} — ${name}?`,
    payText: (method: string, rest: string) => `${method}. Залишиться ${rest}.`,
    payOut: "Виплатити",
    tooMuch: "Сума більша, ніж належить дитині.",
    paidToast: (amount: string, name: string) => `${amount} виплачено — ${name}`,
    payFailed: "Не вдалося зареєструвати виплату.",
    deleteTitle: "Видалити виплату?",
    deleteWishText: (amount: string, name: string) => `${amount} повернеться до суми, що належить: ${name}, а бажання знову стане ціллю накопичення.`,
    deleteText: (amount: string, name: string) => `${amount} повернеться до суми, що належить: ${name}.`,
    delete: "Видалити",
    deleted: "Виплату видалено",
    deleteFailed: "Не вдалося видалити виплату.",
    loadFailed: "Не вдалося завантажити виплати",
    tryAgain: "Спробувати ще раз",
    owes: (name: string) => `${name}: належить`,
    nothingToPay: "Зараз нічого виплачувати.",
    howMuch: "Скільки ви виплачуєте?",
    all: (amount: string) => `Усе · ${amount}`,
    leftInPot: (amount: string) => `Залишиться ${amount}.`,
    whatFor: "За що це?",
    optional: "(необов’язково)",
    notePlaceholder: "Напр. набір LEGO або кишенькові",
    paidWith: "Спосіб оплати",
    payAmount: (amount: string) => `Виплатити ${amount}`,
    showSource: "Показати, звідки гроші",
    noChildrenTitle: "Ще немає дітей",
    noChildrenBody: "Додайте дітей у розділі «Діти».",
    recent: "Останні виплати",
    noPayments: "Ще немає виплат",
    deletePayment: "Видалити виплату",
  },
};

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? ([] as unknown)) as T;
}

async function loadPayments(familyId: string) {
  const approved = check(
    await supabase
      .from("claims")
      .select("id, child_id, task_id, amount_ore, created_at, note, tasks(title)")
      .eq("family_id", familyId)
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false })
  ) as ApprovedClaim[];

  // Krav som allerede er koblet til en utbetaling skal ikke kunne betales to ganger.
  let linked = new Set<string>();
  if (approved.length > 0) {
    const links = check(await supabase.from("payment_claims").select("claim_id").in("claim_id", approved.map((c) => c.id))) as Array<{ claim_id: string }>;
    linked = new Set(links.map((l) => l.claim_id));
  }

  const payments = check(
    await supabase
      .from("payments")
      .select("id, child_id, method, amount_ore, created_at, note")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(50)
  ) as Omit<Payment, "claims">[];

  const claimsByPayment: Record<string, Payment["claims"]> = {};
  if (payments.length > 0) {
    const rows = check(
      await supabase
        .from("payment_claims")
        .select("payment_id, claims(id, amount_ore, task_id, note, tasks(title))")
        .in("payment_id", payments.map((p) => p.id))
    ) as Array<{ payment_id: string; claims: { id: string; amount_ore: number; task_id: string | null; note?: string | null; tasks: ApprovedClaim["tasks"] } | Array<{ id: string; amount_ore: number; task_id: string | null; note?: string | null; tasks: ApprovedClaim["tasks"] }> | null }>;
    for (const row of rows) {
      const claim = Array.isArray(row.claims) ? row.claims[0] : row.claims;
      if (!claim) continue;
      (claimsByPayment[row.payment_id] ??= []).push({ id: claim.id, amount_ore: claim.amount_ore, title: taskTitleOf(claim) });
    }
  }

  return {
    approved: approved.filter((c) => !linked.has(c.id)),
    payments: payments.map((p) => ({ ...p, claims: claimsByPayment[p.id] ?? [] })),
  };
}

export default function AdminPaymentsPage() {
  const t = useText(TEXT);
  const lang = useLang();
  const kr = (ore: number) => formatKr(ore, lang);
  const when = (d: string) => formatWhen(d, undefined, lang);
  const methodLabel = t.methods;
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const children = useChildren(familyId);
  const data = useSWR(familyId ? ["payments", familyId] : null, () => loadPayments(familyId as string), swrDefaults);
  const childOf = childLookup(children.data);

  const [pickedChildId, setPickedChildId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeChildren = useMemo(() => (children.data ?? []).filter((c) => c.active), [children.data]);
  const approved = useMemo(() => data.data?.approved ?? [], [data.data]);
  const dueByChild = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of approved) map[c.child_id] = (map[c.child_id] ?? 0) + c.amount_ore;
    return map;
  }, [approved]);

  // Standard: første barn som har noe til gode.
  const childId = pickedChildId ?? activeChildren.find((c) => (dueByChild[c.id] ?? 0) > 0)?.id ?? activeChildren[0]?.id ?? null;
  const child: AdminChild | null = childId ? childOf(childId) : null;
  const childClaims = approved.filter((c) => c.child_id === childId);
  const balance = childId ? (dueByChild[childId] ?? 0) : 0;
  // Ett felt for beløp: tomt = alt. Alt fra potten, eldste krav først.
  const parsed = amount.trim() ? parseKrToOre(amount) : balance;
  const payOre = typeof parsed === "number" ? parsed : 0;
  const amountError =
    amount.trim() && typeof parsed !== "number" ? t.amountAsNumber : payOre > balance ? t.onlyOwed(child?.name ?? t.theChild, kr(balance)) : null;

  const loading = !familyId || (data.isLoading && !data.data) || (children.isLoading && !children.data);

  const pay = async () => {
    if (!child || payOre <= 0 || amountError || submitting) return;
    const ok = await confirm({
      title: t.payTitle(kr(payOre), child.name),
      text: t.payText(`${methodLabel[method]}${note.trim() ? ` · ${note.trim()}` : ""}`, kr(balance - payOre)),
      confirmLabel: t.payOut,
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      const res = await supabase.rpc("pay_out_amount", { p_child_id: child.id, p_amount_ore: payOre, p_method: method, p_note: note.trim() || null });
      if (res.error) {
        if (/NOT_ENOUGH|BALANCE_CHANGED/.test(res.error.message)) throw new UserFacingError(t.tooMuch);
        throw new Error(res.error.message);
      }
      toast({ text: t.paidToast(kr(payOre), child.name) });
      setAmount("");
      setNote("");
      await data.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.payFailed) });
    } finally {
      setSubmitting(false);
    }
  };

  const deletePayment = async (payment: Payment) => {
    const who = childOf(payment.child_id).name;
    const ok = await confirm({
      title: t.deleteTitle,
      text: payment.method === "WISH" ? t.deleteWishText(kr(payment.amount_ore), who) : t.deleteText(kr(payment.amount_ore), who),
      confirmLabel: t.delete,
      danger: true,
    });
    if (!ok) return;
    try {
      await adminFetch("/api/payments/delete", { method: "POST", body: JSON.stringify({ paymentId: payment.id }) });
      toast({ text: t.deleted });
      await data.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.deleteFailed) });
    }
  };

  if (loading) return <ListSkeleton rows={4} />;

  if (data.error && !data.data) {
    return (
      <EmptyState emoji="😕" title={t.loadFailed}>
        <Button variant="secondary" className="mt-3" onClick={() => void data.mutate()}>
          {t.tryAgain}
        </Button>
      </EmptyState>
    );
  }

  const payments = data.data?.payments ?? [];

  return (
    <section className="space-y-6">
      {/* Velg barn */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {activeChildren.map((c) => {
          const active = c.id === childId;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setPickedChildId(c.id);
                setAmount("");
              }}
              className={cx(
                "flex min-w-40 shrink-0 items-center gap-3 rounded-3xl p-3.5 text-left ring-2 transition active:scale-[0.98]",
                focusRing,
                active ? "ring-primary" : "ring-transparent hover:ring-border"
              )}
              style={{ background: c.color.bg, color: c.color.ink }}
            >
              <KidAvatar avatarKey={c.avatar_key} size={44} />
              <span className="min-w-0">
                <span className="block truncate font-bold">{c.name}</span>
                <span className="font-num block text-sm font-bold">{kr(dueByChild[c.id] ?? 0)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {child && (
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar avatarKey={child.avatar_key} />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{t.owes(child.name)}</p>
              <p className="font-num text-3xl font-bold tracking-tight">{kr(dueByChild[child.id] ?? 0)}</p>
            </div>
          </div>

          {childClaims.length === 0 ? (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-muted-foreground">{t.nothingToPay}</p>
          ) : (
            <>
              <div>
                <label htmlFor="pay-amount" className="mb-2 block text-sm font-semibold text-foreground/85">
                  {t.howMuch}
                </label>
                <span className="relative block">
                  <Input
                    id="pay-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder={(balance / 100).toFixed(2).replace(".", ",")}
                    className="font-num pr-12 text-lg"
                    aria-invalid={Boolean(amountError)}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount("")}
                    className={cx("min-h-10 rounded-full px-4 text-sm font-semibold transition", focusRing, !amount.trim() ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent")}
                  >
                    {t.all(kr(balance))}
                  </button>
                </div>
                {amountError ? (
                  <p className="mt-2 text-sm font-semibold text-red-700">{amountError}</p>
                ) : (
                  amount.trim() && <p className="mt-2 text-sm text-muted-foreground">{t.leftInPot(kr(balance - payOre))}</p>
                )}
              </div>

              <div>
                <label htmlFor="pay-note" className="mb-2 block text-sm font-semibold text-foreground/85">
                  {t.whatFor} <span className="font-normal text-muted-foreground">{t.optional}</span>
                </label>
                <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.notePlaceholder} maxLength={120} />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/85">{t.paidWith}</p>
                <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-secondary p-1.5">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={method === m}
                      onClick={() => setMethod(m)}
                      className={cx("min-h-10 rounded-xl px-1 text-sm font-semibold transition", focusRing, method === m ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                      {methodLabel[m]}
                    </button>
                  ))}
                </div>
              </div>

              <Button size="lg" block loading={submitting} disabled={payOre <= 0 || Boolean(amountError)} onClick={() => void pay()} icon={<Wallet className="size-5" />}>
                {t.payAmount(kr(payOre))}
              </Button>

              <details className="group">
                <summary className={cx("flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground", focusRing)}>
                  <ChevronDown className="size-4 transition group-open:rotate-180" /> {t.showSource}
                </summary>
                <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border text-sm">
                  {childClaims.map((claim) => (
                    <li key={claim.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{taskTitleOf(claim)}</span>
                        <span className="block text-muted-foreground">{when(claim.created_at)}</span>
                      </span>
                      <span className="font-num font-bold">{kr(claim.amount_ore)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </Card>
      )}

      {activeChildren.length === 0 && (
        <EmptyState emoji="👶" title={t.noChildrenTitle}>
          {t.noChildrenBody}
        </EmptyState>
      )}

      {/* Historikk */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Receipt className="size-5 text-muted-foreground" /> {t.recent}
        </h2>
        {payments.length === 0 ? (
          <EmptyState emoji="🧾" title={t.noPayments} />
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => {
              const c = childOf(payment.child_id);
              return (
                <li key={payment.id}>
                  <details className="group rounded-3xl border border-border bg-card shadow-sm">
                    <summary className={cx("flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-3xl px-4 py-3", focusRing)}>
                      <Avatar avatarKey={c.avatar_key} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {c.name}
                          {payment.note ? ` · ${payment.note}` : ""}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {when(payment.created_at)} · {methodLabel[payment.method] ?? payment.method}
                        </span>
                      </span>
                      <span className="font-num font-bold text-primary">{kr(payment.amount_ore)}</span>
                      <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
                    </summary>
                    <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
                      {payment.claims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between text-sm">
                          <span>{claim.title}</span>
                          <span className="font-num font-semibold">{kr(claim.amount_ore)}</span>
                        </div>
                      ))}
                      
                      <Button variant="dangerSoft" size="sm" className="mt-2" icon={<Trash2 className="size-4" />} onClick={() => void deletePayment(payment)}>
                        {t.deletePayment}
                      </Button>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
