"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type ChildRow = {
  id: string;
  name: string;
};

type TaskRow = {
  id: string;
  title: string;
};

type ApprovedClaimRow = {
  id: string;
  family_id: string;
  child_id: string;
  task_id: string;
  amount_ore: number;
  created_at: string;
  children: { name: string }[] | null;
  tasks: { title: string }[] | null;
};

type PaymentRow = {
  id: string;
  child_id: string;
  method: string;
  amount_ore: number;
  created_at: string;
  note: string | null;
};

type PaymentClaimRow = {
  payment_id: string;
  claim_id: string;
  claims: {
    id: string;
    amount_ore: number;
    task_id: string;
    created_at: string;
    tasks: { title: string }[] | null;
  }[] | null;
};

type PaymentHistory = {
  payment: PaymentRow;
  childName: string;
  claims: Array<{ id: string; title: string; amount_ore: number }>;
};

type PaymentMethod = "VIPPS" | "CASH" | "BANK" | "OTHER";
const methodLabelMap: Record<string, string> = {
  VIPPS: "Vipps",
  CASH: "Kontanter",
  BANK: "Bank",
  OTHER: "Annet",
  // Satt av databasefunksjonen approve_wish nar et onske utbetales.
  WISH: "Onske",
};

function formatKr(ore: number) {
  return `${(ore / 100).toFixed(2)} kr`;
}

export default function AdminPaymentsPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [claims, setClaims] = useState<ApprovedClaimRow[]>([]);
  const [selectedClaimIds, setSelectedClaimIds] = useState<Record<string, boolean>>({});
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskMap, setTaskMap] = useState<Record<string, string>>({});

  const load = useCallback(async (nextFamilyId?: string) => {
    const family = nextFamilyId ?? familyId;
    if (!family) return;

    const [childrenRes, tasksRes, approvedRes, paymentsRes] = await Promise.all([
      supabase.from("children").select("id, name").eq("family_id", family).eq("active", true).order("name", { ascending: true }),
      supabase.from("tasks").select("id, title").eq("family_id", family).eq("active", true).order("title", { ascending: true }),
      supabase
        .from("claims")
        .select("id, family_id, child_id, task_id, amount_ore, created_at, children(name), tasks(title)")
        .eq("family_id", family)
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, child_id, method, amount_ore, created_at, note")
        .eq("family_id", family)
        .order("created_at", { ascending: false }),
    ]);

    if (childrenRes.error || tasksRes.error || approvedRes.error || paymentsRes.error) {
      setStatus(
        `Feil: ${childrenRes.error?.message ?? tasksRes.error?.message ?? approvedRes.error?.message ?? paymentsRes.error?.message}`
      );
      return;
    }

    const childRows = (childrenRes.data ?? []) as ChildRow[];
    const taskRows = (tasksRes.data ?? []) as TaskRow[];
    const approvedClaims = (approvedRes.data ?? []) as ApprovedClaimRow[];
    const paymentRows = (paymentsRes.data ?? []) as PaymentRow[];

    setChildren(childRows);
    if (!selectedChildId && childRows.length > 0) setSelectedChildId(childRows[0].id);

    const nextTaskMap: Record<string, string> = {};
    for (const task of taskRows) nextTaskMap[task.id] = task.title;
    setTaskMap(nextTaskMap);

    const approvedIds = approvedClaims.map((claim) => claim.id);
    let linkedClaimIds = new Set<string>();

    if (approvedIds.length > 0) {
      const linksRes = await supabase.from("payment_claims").select("claim_id").in("claim_id", approvedIds);
      if (linksRes.error) {
        setStatus(`Feil: ${linksRes.error.message}`);
        return;
      }
      linkedClaimIds = new Set((linksRes.data ?? []).map((row) => row.claim_id as string));
    }

    setClaims(approvedClaims.filter((claim) => !linkedClaimIds.has(claim.id)));

    let historyClaimsMap: Record<string, Array<{ id: string; title: string; amount_ore: number }>> = {};

    if (paymentRows.length > 0) {
      const paymentIds = paymentRows.map((payment) => payment.id);
      const paymentClaimsRes = await supabase
        .from("payment_claims")
        .select("payment_id, claim_id, claims(id, amount_ore, task_id, created_at, tasks(title))")
        .in("payment_id", paymentIds);

      if (paymentClaimsRes.error) {
        setStatus(`Feil: ${paymentClaimsRes.error.message}`);
        return;
      }

      historyClaimsMap = {};
      for (const row of (paymentClaimsRes.data ?? []) as PaymentClaimRow[]) {
        const claim = row.claims?.[0];
        if (!claim) continue;
        if (!historyClaimsMap[row.payment_id]) historyClaimsMap[row.payment_id] = [];
        historyClaimsMap[row.payment_id].push({
          id: claim.id,
          amount_ore: claim.amount_ore,
          title: nextTaskMap[claim.task_id] ?? claim.tasks?.[0]?.title ?? claim.task_id,
        });
      }
    }

    const childNameMap: Record<string, string> = {};
    for (const child of childRows) childNameMap[child.id] = child.name;

    setPaymentHistory(
      paymentRows.map((payment) => ({
        payment,
        childName: childNameMap[payment.child_id] ?? payment.child_id,
        claims: historyClaimsMap[payment.id] ?? [],
      }))
    );
  }, [familyId, selectedChildId]);

  useEffect(() => {
    const run = async () => {
      const ctx = await getCurrentAdminContext();
      if (!ctx.familyId) {
        setStatus("Fant ikke familie.");
        setLoading(false);
        return;
      }

      setFamilyId(ctx.familyId);
      await load(ctx.familyId);
      setLoading(false);
    };

    void run();
  }, [load]);

  const visibleClaims = useMemo(
    () => claims.filter((claim) => !selectedChildId || claim.child_id === selectedChildId),
    [claims, selectedChildId]
  );

  const childMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const child of children) map[child.id] = child.name;
    return map;
  }, [children]);

  const selectedIds = useMemo(
    () => visibleClaims.filter((claim) => selectedClaimIds[claim.id]).map((claim) => claim.id),
    [visibleClaims, selectedClaimIds]
  );

  const selectedTotal = useMemo(
    () => visibleClaims.filter((claim) => selectedClaimIds[claim.id]).reduce((sum, claim) => sum + claim.amount_ore, 0),
    [visibleClaims, selectedClaimIds]
  );
  const allTotal = useMemo(
    () => visibleClaims.reduce((sum, claim) => sum + (claim.amount_ore ?? 0), 0),
    [visibleClaims]
  );
  const selectedChildName = useMemo(
    () => children.find((child) => child.id === selectedChildId)?.name ?? "valgt barn",
    [children, selectedChildId]
  );

  const toggleClaim = (claimId: string) => {
    setSelectedClaimIds((prev) => ({ ...prev, [claimId]: !prev[claimId] }));
  };

  const markPaid = async () => {
    if (!selectedChildId) {
      setStatus("Velg barn.");
      return;
    }
    if (!selectedIds.length) {
      setStatus("Velg minst ett krav.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;

    if (!accessToken) {
      setSubmitting(false);
      setStatus("Feil: Mangler innloggingstoken. Logg inn pa nytt.");
      return;
    }

    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        childId: selectedChildId,
        claimIds: selectedIds,
        method,
        note: note.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as { error?: string; paymentId?: string; amount_ore?: number };
    setSubmitting(false);

    if (!response.ok || payload.error) {
      setStatus(`Feil: ${payload.error ?? "Kunne ikke registrere utbetaling."}`);
      return;
    }

    setStatus(`Utbetaling registrert (${payload.paymentId}). Sum ${formatKr(payload.amount_ore ?? 0)}.`);
    setNote("");
    setSelectedClaimIds({});
    await load();
  };

  const payAllForSelectedChild = async () => {
    if (!selectedChildId) {
      setStatus("Velg barn.");
      return;
    }

    const claimIds = visibleClaims.map((claim) => claim.id);
    if (claimIds.length === 0) {
      setStatus("Ingen til gode å utbetale.");
      return;
    }
    if (!allTotal) {
      setStatus("Ingen til gode å utbetale.");
      return;
    }
    if (!window.confirm(`Er du sikker pa at du vil utbetale ${formatKr(allTotal)} til ${selectedChildName}?`)) {
      return;
    }

    setSubmitting(true);
    setStatus("");

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;

    if (!accessToken) {
      setSubmitting(false);
      setStatus("Feil: Mangler innloggingstoken. Logg inn pa nytt.");
      return;
    }

    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        childId: selectedChildId,
        claimIds,
        method,
        note: note.trim() || undefined,
      }),
    });

    const payload = (await response.json()) as { error?: string; paymentId?: string; amount_ore?: number };
    setSubmitting(false);

    if (!response.ok || payload.error) {
      setStatus(`Feil: ${payload.error ?? "Kunne ikke registrere utbetaling."}`);
      return;
    }

    const totalOre = payload.amount_ore ?? allTotal;
    setStatus(`Utbetalte alt til gode (${payload.paymentId}). Sum ${formatKr(totalOre)}.`);
    setNote("");
    setSelectedClaimIds({});
    await load();
  };

  const deletePayment = async (paymentId: string) => {
    const confirmed = window.confirm(
      "Er du sikker pa at du vil slette denne utbetalingen? Kravene blir satt tilbake til APPROVED."
    );
    if (!confirmed) return;

    setStatus("");

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;

    if (!accessToken) {
      setStatus("Feil: Mangler innloggingstoken. Logg inn pa nytt.");
      return;
    }

    const response = await fetch("/api/payments/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ paymentId }),
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string; revertedClaims?: number };

    if (!response.ok) {
      setStatus(`Feil (${response.status}): ${payload.error ?? "Ukjent feil"}`);
      return;
    }

    setStatus(`Utbetaling slettet. Revert: ${payload.revertedClaims ?? 0}`);
    await load();
  };

  if (loading) return <div className="text-slate-300">Laster...</div>;

  const isError = status.startsWith("Feil:");

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <h3 className="mb-3 text-base font-semibold tracking-tight">Marker krav som utbetalt</h3>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Barn</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
              value={selectedChildId}
              onChange={(e) => {
                setSelectedChildId(e.target.value);
                setSelectedClaimIds({});
              }}
            >
              <option value="">Velg barn</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Metode</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              <option value="CASH">Kontanter</option>
              <option value="VIPPS">Vipps</option>
              <option value="BANK">Bank</option>
              <option value="OTHER">Annet</option>
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Notat</span>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Valgfritt notat"
            />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/70 text-slate-300">
            <tr>
              <th className="px-4 py-3">Velg</th>
              <th className="px-4 py-3">Barn</th>
              <th className="px-4 py-3">Oppgave</th>
              <th className="px-4 py-3">Belop</th>
              <th className="px-4 py-3">Tid</th>
            </tr>
          </thead>
          <tbody>
            {visibleClaims.map((claim) => (
              <tr key={claim.id} className="border-t border-slate-800 text-slate-100">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedClaimIds[claim.id])}
                    onChange={() => toggleClaim(claim.id)}
                    className="h-4 w-4 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">{childMap[claim.child_id] ?? claim.children?.[0]?.name ?? claim.child_id}</td>
                <td className="px-4 py-3">{taskMap[claim.task_id] ?? claim.tasks?.[0]?.title ?? claim.task_id}</td>
                <td className="px-4 py-3">{formatKr(claim.amount_ore)}</td>
                <td className="px-4 py-3">{new Date(claim.created_at).toLocaleString("nb-NO")}</td>
              </tr>
            ))}
            {visibleClaims.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                  Ingen APPROVED krav klare for utbetaling.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
        <p className="text-sm text-slate-200">
          Valgt: {selectedIds.length} krav. Sum: <strong>{formatKr(selectedTotal)}</strong>
        </p>
        <button
          type="button"
          disabled={submitting || !selectedChildId || allTotal === 0}
          onClick={() => void payAllForSelectedChild()}
          className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {submitting ? "Lagrer..." : allTotal === 0 ? "Ingen til gode" : `Utbetal alt (${formatKr(allTotal)})`}
        </button>
        <button
          type="button"
          disabled={submitting || selectedIds.length === 0}
          onClick={() => void markPaid()}
          className="w-full rounded-lg border border-slate-500 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {submitting ? "Lagrer..." : "Marker utbetalt"}
        </button>
      </div>

      {status && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            isError
              ? "border-red-800 bg-red-950/40 text-red-200"
              : "border-emerald-800 bg-emerald-950/40 text-emerald-200"
          }`}
        >
          {status}
        </p>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">Kvitteringer</h3>
          <span className="text-xs uppercase tracking-wide text-slate-500">Historikk</span>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
            Ingen utbetalinger registrert enda.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="space-y-3">
                {paymentHistory.map((entry) => (
                  <article key={entry.payment.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{entry.childName}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(entry.payment.created_at).toLocaleString("nb-NO")} ·{" "}
                          {methodLabelMap[entry.payment.method as PaymentMethod] ?? entry.payment.method}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-300">{formatKr(entry.payment.amount_ore)}</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {entry.claims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                          <span>{claim.title}</span>
                          <span className="font-semibold">{formatKr(claim.amount_ore)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => void deletePayment(entry.payment.id)}
                        className="rounded-lg border border-red-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:border-red-700 hover:bg-red-950/40"
                      >
                        Slett
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="md:hidden space-y-3">
              {paymentHistory.map((entry) => (
                <article key={entry.payment.id} className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <div className="space-y-1 text-sm text-slate-200">
                    <p>
                      <span className="font-semibold text-slate-100">Barn:</span> {entry.childName || entry.payment.child_id}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-100">Sum:</span> {formatKr(entry.payment.amount_ore)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-100">Metode:</span>{" "}
                      {methodLabelMap[entry.payment.method as PaymentMethod] ?? entry.payment.method}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-100">Dato:</span> {new Date(entry.payment.created_at).toLocaleString()}
                    </p>
                    {entry.payment.note && (
                      <p>
                        <span className="font-semibold text-slate-100">Notat:</span> {entry.payment.note}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => void deletePayment(entry.payment.id)}
                      className="w-full rounded-lg border border-red-800 px-3 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-700 hover:bg-red-950/40"
                    >
                      Slett
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
