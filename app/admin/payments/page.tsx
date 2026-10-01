"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Check, ChevronDown, Receipt, Trash2, Wallet } from "lucide-react";
import { Avatar, Button, Card, EmptyState, Input, ListSkeleton, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import {
  type AdminChild,
  adminFetch,
  childLookup,
  friendlyError,
  swrDefaults,
  taskTitleOf,
  useAdminIdentity,
  useChildren,
} from "@/lib/admin-data";
import { formatWhen } from "@/lib/dates";
import { formatKr } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

type ApprovedClaim = {
  id: string;
  child_id: string;
  task_id: string | null;
  amount_ore: number;
  created_at: string;
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
const METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Kontanter" },
  { value: "VIPPS", label: "Vipps" },
  { value: "BANK", label: "Bank" },
  { value: "OTHER", label: "Annet" },
];
const methodLabel: Record<string, string> = {
  VIPPS: "Vipps",
  CASH: "Kontanter",
  BANK: "Bank",
  OTHER: "Annet",
  // Satt av databasefunksjonen approve_wish når et ønske utbetales.
  WISH: "Ønske",
};

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? ([] as unknown)) as T;
}

async function loadPayments(familyId: string) {
  const approved = check(
    await supabase
      .from("claims")
      .select("id, child_id, task_id, amount_ore, created_at, tasks(title)")
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
        .select("payment_id, claims(id, amount_ore, task_id, tasks(title))")
        .in("payment_id", payments.map((p) => p.id))
    ) as Array<{ payment_id: string; claims: { id: string; amount_ore: number; task_id: string | null; tasks: ApprovedClaim["tasks"] } | Array<{ id: string; amount_ore: number; task_id: string | null; tasks: ApprovedClaim["tasks"] }> | null }>;
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
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const children = useChildren(familyId);
  const data = useSWR(familyId ? ["payments", familyId] : null, () => loadPayments(familyId as string), swrDefaults);
  const childOf = childLookup(children.data);

  const [pickedChildId, setPickedChildId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
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
  const selectedIds = childClaims.filter((c) => selected[c.id]).map((c) => c.id);
  const payIds = selectedIds.length > 0 ? selectedIds : childClaims.map((c) => c.id);
  const payTotal = childClaims.filter((c) => payIds.includes(c.id)).reduce((s, c) => s + c.amount_ore, 0);

  const loading = !familyId || (data.isLoading && !data.data) || (children.isLoading && !children.data);

  const pay = async () => {
    if (!child || payIds.length === 0 || submitting) return;
    const ok = await confirm({
      title: `Utbetale ${formatKr(payTotal)} til ${child.name}?`,
      text: `${payIds.length} ${payIds.length === 1 ? "oppgave" : "oppgaver"} · ${methodLabel[method]}`,
      confirmLabel: "Utbetal",
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      const payload = await adminFetch<{ amount_ore?: number }>("/api/payments/create", {
        method: "POST",
        body: JSON.stringify({ childId: child.id, claimIds: payIds, method, note: note.trim() || undefined }),
      });
      toast({ text: `${formatKr(payload.amount_ore ?? payTotal)} utbetalt til ${child.name}` });
      setSelected({});
      setNote("");
      setShowNote(false);
      await data.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å registrere utbetalingen.") });
    } finally {
      setSubmitting(false);
    }
  };

  const deletePayment = async (payment: Payment) => {
    const who = childOf(payment.child_id).name;
    const ok = await confirm({
      title: "Slette utbetalingen?",
      text:
        payment.method === "WISH"
          ? `${formatKr(payment.amount_ore)} går tilbake til ${who} sitt «til gode», og ønsket blir et sparemål igjen.`
          : `${formatKr(payment.amount_ore)} går tilbake til ${who} sitt «til gode».`,
      confirmLabel: "Slett",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminFetch("/api/payments/delete", { method: "POST", body: JSON.stringify({ paymentId: payment.id }) });
      toast({ text: "Utbetalingen er slettet" });
      await data.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å slette utbetalingen.") });
    }
  };

  if (loading) return <ListSkeleton rows={4} />;

  if (data.error && !data.data) {
    return (
      <EmptyState emoji="😕" title="Klarte ikke å hente utbetalinger">
        <Button variant="secondary" className="mt-3" onClick={() => void data.mutate()}>
          Prøv igjen
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
                setSelected({});
              }}
              className={cx(
                "flex min-w-40 shrink-0 items-center gap-3 rounded-3xl p-3.5 text-left ring-2 transition active:scale-[0.98]",
                focusRing,
                active ? "ring-primary" : "ring-transparent hover:ring-border"
              )}
              style={{ background: c.color.bg, color: c.color.ink }}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-white/80 text-2xl">{c.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate font-bold">{c.name}</span>
                <span className="font-num block text-sm font-bold">{formatKr(dueByChild[c.id] ?? 0)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {child && (
        <Card className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar emoji={child.emoji} color={child.color.bg} />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{child.name} har til gode</p>
              <p className="font-num text-3xl font-bold tracking-tight">{formatKr(dueByChild[child.id] ?? 0)}</p>
            </div>
          </div>

          {childClaims.length === 0 ? (
            <p className="rounded-2xl bg-secondary px-4 py-3 text-muted-foreground">Ingenting å utbetale akkurat nå.</p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/85">
                  {selectedIds.length > 0 ? `${selectedIds.length} valgt` : "Trykk for å velge enkeltoppgaver, eller utbetal alt"}
                </p>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {childClaims.map((claim) => {
                    const isOn = Boolean(selected[claim.id]);
                    return (
                      <li key={claim.id}>
                        <button
                          type="button"
                          aria-pressed={isOn}
                          onClick={() => setSelected((prev) => ({ ...prev, [claim.id]: !prev[claim.id] }))}
                          className={cx("flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition", focusRing, isOn ? "bg-primary/8" : "hover:bg-secondary/60")}
                        >
                          <span className={cx("flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition", isOn ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                            {isOn && <Check className="size-4" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{taskTitleOf(claim)}</span>
                            <span className="block text-sm text-muted-foreground">{formatWhen(claim.created_at)}</span>
                          </span>
                          <span className="font-num font-bold">{formatKr(claim.amount_ore)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/85">Betalt med</p>
                <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-secondary p-1.5">
                  {METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={method === m.value}
                      onClick={() => setMethod(m.value)}
                      className={cx("min-h-10 rounded-xl px-1 text-sm font-semibold transition", focusRing, method === m.value ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {showNote ? (
                  <Input className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notat, f.eks. «lagt på sparekonto»" autoFocus />
                ) : (
                  <button type="button" onClick={() => setShowNote(true)} className={cx("mt-2 min-h-10 rounded-xl px-1 text-sm font-semibold text-primary", focusRing)}>
                    + Legg til notat
                  </button>
                )}
              </div>

              <Button size="lg" block loading={submitting} onClick={() => void pay()} icon={<Wallet className="size-5" />}>
                {selectedIds.length > 0 ? `Utbetal valgte · ${formatKr(payTotal)}` : `Utbetal alt · ${formatKr(payTotal)}`}
              </Button>
            </>
          )}
        </Card>
      )}

      {activeChildren.length === 0 && (
        <EmptyState emoji="👶" title="Ingen barn ennå">
          Legg til barn under Barn.
        </EmptyState>
      )}

      {/* Historikk */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Receipt className="size-5 text-muted-foreground" /> Siste utbetalinger
        </h2>
        {payments.length === 0 ? (
          <EmptyState emoji="🧾" title="Ingen utbetalinger ennå" />
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => {
              const c = childOf(payment.child_id);
              return (
                <li key={payment.id}>
                  <details className="group rounded-3xl border border-border bg-card shadow-sm">
                    <summary className={cx("flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-3xl px-4 py-3", focusRing)}>
                      <Avatar emoji={c.emoji} color={c.color.bg} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {c.name}
                          {payment.method === "WISH" && payment.note ? ` · ${payment.note}` : ""}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {formatWhen(payment.created_at)} · {methodLabel[payment.method] ?? payment.method}
                        </span>
                      </span>
                      <span className="font-num font-bold text-primary">{formatKr(payment.amount_ore)}</span>
                      <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
                    </summary>
                    <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
                      {payment.claims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between text-sm">
                          <span>{claim.title}</span>
                          <span className="font-num font-semibold">{formatKr(claim.amount_ore)}</span>
                        </div>
                      ))}
                      {payment.note && payment.method !== "WISH" && <p className="text-sm text-muted-foreground">Notat: {payment.note}</p>}
                      <Button variant="dangerSoft" size="sm" className="mt-2" icon={<Trash2 className="size-4" />} onClick={() => void deletePayment(payment)}>
                        Slett utbetaling
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
