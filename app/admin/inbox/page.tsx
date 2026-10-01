"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type ClaimRow = {
  id: string;
  created_at: string;
  amount_ore: number;
  child_id: string;
  task_id: string | null;
  children: { name: string }[] | null;
  tasks: { title: string }[] | null;
};

// Onsker barna har skrevet inn selv. Ligger i Krav-lista sammen med
// oppgavekravene: godkjent -> utbetalt som onske (eller sparemal hvis barnet
// ikke har nok til gode enna).
type PendingWish = {
  id: string;
  child_id: string;
  title: string;
  status: "PROPOSED" | "ACTIVE";
  target_ore: number | null;
  suggested_ore: number | null;
  balance_ore: number;
  created_at: string;
};

type ChildRow = {
  id: string;
  name: string;
};

type TaskRow = {
  id: string;
  title: string;
};

function formatKr(ore: number) {
  return `${(ore / 100).toFixed(2)} kr`;
}

export default function AdminInboxPage() {
  const [items, setItems] = useState<ClaimRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [childMap, setChildMap] = useState<Record<string, string>>({});
  const [taskMap, setTaskMap] = useState<Record<string, string>>({});
  const [pendingWishes, setPendingWishes] = useState<PendingWish[]>([]);
  const [wishPrices, setWishPrices] = useState<Record<string, string>>({});
  const [wishBusyId, setWishBusyId] = useState<string | null>(null);

  // Feiler stille: krav-lista skal fortsatt vise oppgavekrav selv om
  // onske-sporringen ikke gar.
  const loadPendingWishes = useCallback(async () => {
    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) return;
    const res = await fetch("/api/admin/wishlist/pending", { headers: { Authorization: `Bearer ${accessToken}` } });
    const payload = (await res.json().catch(() => ({}))) as { items?: PendingWish[] };
    if (!res.ok) return;
    const wishes = payload.items ?? [];
    setPendingWishes(wishes);
    // Forhandsutfyll med barnets eget prisforslag, sa holder det ofte a
    // trykke Godkjenn.
    setWishPrices((prev) => {
      const next = { ...prev };
      for (const wish of wishes) {
        if (wish.status === "PROPOSED" && next[wish.id] === undefined) {
          next[wish.id] = wish.suggested_ore ? String(wish.suggested_ore / 100) : "";
        }
      }
      return next;
    });
  }, []);

  const reviewWish = async (wish: PendingWish, action: "approve" | "payout" | "decline") => {
    setStatus("");
    let targetOre: number | undefined;
    if (action === "approve") {
      const kr = Number((wishPrices[wish.id] ?? "").replace(",", "."));
      targetOre = Number.isFinite(kr) ? Math.round(kr * 100) : 0;
      if (!targetOre || targetOre <= 0) {
        setStatus(`Feil: Sett en pris pa "${wish.title}" for du godkjenner.`);
        return;
      }
    }

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) {
      setStatus("Feil: Mangler innloggingstoken. Logg inn pa nytt.");
      return;
    }

    setWishBusyId(wish.id);
    const res = await fetch("/api/admin/wishlist/review", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ id: wish.id, action, targetOre }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string; result?: string };
    setWishBusyId(null);

    if (!res.ok || payload.error) {
      setStatus(`Feil: ${payload.error ?? "Kunne ikke behandle onsket."}`);
      return;
    }

    const childName = childMap[wish.child_id] ?? "Barnet";
    if (payload.result === "PAID") {
      setStatus(`Utbetalt som onske: ${wish.title}. Trukket fra ${childName} sin saldo.`);
    } else if (payload.result === "SAVING") {
      setStatus(`${wish.title} er godkjent som sparemal - ${childName} har ikke nok til gode enna.`);
    } else {
      setStatus(`Onsket "${wish.title}" er avvist.`);
    }
    await loadPendingWishes();
  };

  const wishPriceOre = (wish: PendingWish) => {
    if (wish.status === "ACTIVE") return wish.target_ore ?? 0;
    const kr = Number((wishPrices[wish.id] ?? "").replace(",", "."));
    return Number.isFinite(kr) ? Math.round(kr * 100) : 0;
  };

  const load = useCallback(async (nextFamilyId?: string) => {
    const family = nextFamilyId ?? familyId;
    if (!family) return;

    const [claimsRes, childrenRes, tasksRes] = await Promise.all([
      supabase
        .from("claims")
        .select("id, created_at, amount_ore, child_id, task_id, children(name), tasks(title)")
        .eq("family_id", family)
        .eq("status", "SENT")
        .order("created_at", { ascending: false }),
      supabase
        .from("children")
        .select("id, name")
        .eq("family_id", family)
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase
        .from("tasks")
        .select("id, title")
        .eq("family_id", family)
        .eq("active", true)
        .order("title", { ascending: true }),
    ]);

    if (claimsRes.error || childrenRes.error || tasksRes.error) {
      setStatus(`Feil: ${claimsRes.error?.message ?? childrenRes.error?.message ?? tasksRes.error?.message}`);
      return;
    }

    const nextChildMap: Record<string, string> = {};
    for (const child of (childrenRes.data ?? []) as ChildRow[]) nextChildMap[child.id] = child.name;
    setChildMap(nextChildMap);

    const nextTaskMap: Record<string, string> = {};
    for (const task of (tasksRes.data ?? []) as TaskRow[]) nextTaskMap[task.id] = task.title;
    setTaskMap(nextTaskMap);

    setItems((claimsRes.data ?? []) as ClaimRow[]);
  }, [familyId]);

  useEffect(() => {
    const run = async () => {
      const ctx = await getCurrentAdminContext();
      if (!ctx.user || !ctx.familyId) {
        setLoading(false);
        setStatus("Logg inn for a se krav.");
        return;
      }
      setFamilyId(ctx.familyId);
      setUserId(ctx.user.id);
      await Promise.all([load(ctx.familyId), loadPendingWishes()]);
      setLoading(false);
    };

    void run();
  }, [load, loadPendingWishes]);

  const decide = async (claimId: string, statusValue: "APPROVED" | "REJECTED") => {
    if (!userId) return;
    setStatus("");
    const res = await supabase
      .from("claims")
      .update({
        status: statusValue,
        decided_at: new Date().toISOString(),
        decided_by: userId,
      })
      .eq("id", claimId);

    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }

    setStatus(statusValue === "APPROVED" ? "Krav godkjent." : "Krav avvist.");
    await load();
  };

  const getChildName = (item: ClaimRow) => childMap[item.child_id] ?? item.children?.[0]?.name ?? "Ukjent barn";
  const getTaskTitle = (item: ClaimRow) => {
    if (!item.task_id) return "Butikksalg";
    return taskMap[item.task_id] ?? item.tasks?.[0]?.title ?? "Ukjent oppgave";
  };

  if (loading) return <div className="text-slate-300">Laster...</div>;
  const isError = status.startsWith("Feil:");

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Ventende krav</h2>
        <Link
          href="/admin/payments"
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Ga til utbetalinger
        </Link>
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

      <div className="md:hidden space-y-3">
        {items.length === 0 && pendingWishes.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-700">Ingen krav til godkjenning.</p>
        )}
        {pendingWishes.map((wish) => {
          const price = wishPriceOre(wish);
          const enough = price > 0 && wish.balance_ore >= price;
          return (
            <div key={wish.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-slate-900">
              <span className="inline-flex rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                {wish.status === "ACTIVE" ? "Onske - spart nok" : "Onske"}
              </span>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="font-semibold">Barn:</span> {childMap[wish.child_id] ?? "Ukjent barn"}</p>
                <p><span className="font-semibold">Onsker seg:</span> {wish.title}</p>
                <p><span className="font-semibold">Til gode:</span> {formatKr(wish.balance_ore)}</p>
              </div>
              {wish.status === "PROPOSED" ? (
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <span className="font-semibold">Pris (kr)</span>
                  <input
                    value={wishPrices[wish.id] ?? ""}
                    onChange={(e) => setWishPrices((prev) => ({ ...prev, [wish.id]: e.target.value }))}
                    inputMode="decimal"
                    placeholder="49"
                    className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                </label>
              ) : (
                <p className="mt-2 text-sm"><span className="font-semibold">Pris:</span> {formatKr(price)}</p>
              )}
              <p className="mt-2 text-xs text-slate-600">
                {price <= 0
                  ? "Sett en pris for a godkjenne."
                  : enough
                    ? "Utbetales med en gang og trekkes fra saldoen."
                    : "For lite til gode - blir et sparemal til det er nok."}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={wishBusyId === wish.id}
                  onClick={() => void reviewWish(wish, wish.status === "ACTIVE" ? "payout" : "approve")}
                  className="w-full rounded-lg bg-slate-900 px-3 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                >
                  {wish.status === "ACTIVE" ? "Utbetal onske" : "Godkjenn"}
                </button>
                <button
                  type="button"
                  disabled={wishBusyId === wish.id}
                  onClick={() => void reviewWish(wish, "decline")}
                  className="w-full rounded-lg bg-red-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  Avvis
                </button>
              </div>
            </div>
          );
        })}
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900">
            <div className="space-y-1 text-sm">
              <p><span className="font-semibold">Barn:</span> {getChildName(item)}</p>
              <p><span className="font-semibold">Oppgave:</span> {getTaskTitle(item)}</p>
              <p><span className="font-semibold">Belop:</span> {formatKr(item.amount_ore)}</p>
              <p><span className="font-semibold">Tid:</span> {new Date(item.created_at).toLocaleString("nb-NO")}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => void decide(item.id, "APPROVED")}
                className="w-full rounded-lg bg-slate-900 px-3 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Godkjenn
              </button>
              <button
                type="button"
                onClick={() => void decide(item.id, "REJECTED")}
                className="w-full rounded-lg bg-red-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Avvis
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/70 text-slate-300">
              <tr>
                <th className="px-4 py-3">Barn</th>
                <th className="px-4 py-3">Oppgave / onske</th>
                <th className="px-4 py-3">Belop</th>
                <th className="px-4 py-3">Tid</th>
                <th className="px-4 py-3">Handling</th>
              </tr>
            </thead>
            <tbody>
              {pendingWishes.map((wish) => {
                const price = wishPriceOre(wish);
                const enough = price > 0 && wish.balance_ore >= price;
                return (
                  <tr key={wish.id} className="border-t border-slate-800 bg-amber-950/20 text-slate-100">
                    <td className="px-4 py-3">{childMap[wish.child_id] ?? "Ukjent barn"}</td>
                    <td className="px-4 py-3">
                      <span className="mr-2 rounded-full bg-amber-900/60 px-2 py-0.5 text-xs font-semibold text-amber-200">
                        {wish.status === "ACTIVE" ? "Onske - spart nok" : "Onske"}
                      </span>
                      {wish.title}
                      <div className="mt-1 text-xs text-slate-400">
                        Til gode {formatKr(wish.balance_ore)}
                        {price > 0 && (enough ? " - utbetales med en gang" : " - blir sparemal")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {wish.status === "PROPOSED" ? (
                        <input
                          value={wishPrices[wish.id] ?? ""}
                          onChange={(e) => setWishPrices((prev) => ({ ...prev, [wish.id]: e.target.value }))}
                          inputMode="decimal"
                          placeholder="kr"
                          aria-label={`Pris for ${wish.title}`}
                          className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
                        />
                      ) : (
                        formatKr(price)
                      )}
                    </td>
                    <td className="px-4 py-3">{new Date(wish.created_at).toLocaleString("nb-NO")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={wishBusyId === wish.id}
                          onClick={() => void reviewWish(wish, wish.status === "ACTIVE" ? "payout" : "approve")}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white disabled:opacity-50"
                        >
                          {wish.status === "ACTIVE" ? "Utbetal" : "Godkjenn"}
                        </button>
                        <button
                          type="button"
                          disabled={wishBusyId === wish.id}
                          onClick={() => void reviewWish(wish, "decline")}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-red-500 disabled:opacity-50"
                        >
                          Avvis
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-800 text-slate-100">
                  <td className="px-4 py-3">{getChildName(item)}</td>
                  <td className="px-4 py-3">{getTaskTitle(item)}</td>
                  <td className="px-4 py-3">{formatKr(item.amount_ore)}</td>
                  <td className="px-4 py-3">{new Date(item.created_at).toLocaleString("nb-NO")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void decide(item.id, "APPROVED")}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white"
                      >
                        Godkjenn
                      </button>
                      <button
                        type="button"
                        onClick={() => void decide(item.id, "REJECTED")}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-red-500"
                      >
                        Avvis
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && pendingWishes.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                    Ingen krav til godkjenning.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
