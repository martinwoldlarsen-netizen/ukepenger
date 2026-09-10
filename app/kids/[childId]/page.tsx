"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getAvatarByKey } from "@/lib/avatars";

type ChildRow = {
  id: string;
  name: string;
  avatar_key: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  amount_ore: number;
  active: boolean;
};

type WishlistItem = {
  id: string;
  title: string;
  target_ore: number;
  note: string | null;
};

const cardColors = [
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-lime-500",
  "from-orange-500 to-amber-500",
  "from-fuchsia-500 to-pink-500",
  "from-violet-500 to-indigo-500",
  "from-rose-500 to-red-500",
];

function formatKr(ore: number) {
  return `${(ore / 100).toFixed(2)} kr`;
}

export default function KidTaskPage() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;

  const [child, setChild] = useState<ChildRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [status, setStatus] = useState("Laster...");
  const [showLoginLink, setShowLoginLink] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [confirmations, setConfirmations] = useState<Record<string, number>>({});
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [pendingOre, setPendingOre] = useState(0);
  const [approvedOre, setApprovedOre] = useState(0);
  const [paidOre, setPaidOre] = useState(0);
  const [earnedOre, setEarnedOre] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const run = async () => {
      const [tasksRes, wishlistRes] = await Promise.all([
        fetch(`/api/kids/tasks?childId=${encodeURIComponent(childId)}`, {
          method: "GET",
          credentials: "include",
        }),
        fetch(`/api/kids/wishlist?childId=${encodeURIComponent(childId)}`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      const tasksPayload = (await tasksRes.json()) as {
        error?: string;
        child?: ChildRow;
        tasks?: TaskRow[];
        cooldowns?: Record<string, number>;
        pending_ore?: number;
        approved_ore?: number;
        paid_ore?: number;
        earned_ore?: number;
      };

      if (!tasksRes.ok || tasksPayload.error || !tasksPayload.child) {
        setStatus(tasksPayload.error ?? "Klarte ikke laste barn/oppgaver.");
        setShowLoginLink(true);
        return;
      }

      setChild(tasksPayload.child);
      setTasks(tasksPayload.tasks ?? []);
      setCooldowns(tasksPayload.cooldowns ?? {});
      setPendingOre(tasksPayload.pending_ore ?? 0);
      setApprovedOre(tasksPayload.approved_ore ?? 0);
      setPaidOre(tasksPayload.paid_ore ?? 0);
      setEarnedOre(tasksPayload.earned_ore ?? 0);

      const wishlistPayload = (await wishlistRes.json().catch(() => ({}))) as {
        error?: string;
        items?: WishlistItem[];
      };
      if (wishlistRes.ok && !wishlistPayload.error) {
        setWishlistItems(wishlistPayload.items ?? []);
      } else {
        setWishlistItems([]);
      }

      setShowLoginLink(false);
      setStatus("");
    };

    void run();
  }, [childId]);

  const visibleTasks = useMemo(() => tasks.filter((task) => task.active), [tasks]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNowTs(currentNow);
      setCooldowns((prev) => {
        const next: Record<string, number> = {};
        for (const [taskId, until] of Object.entries(prev)) {
          if (until > currentNow) next[taskId] = until;
        }
        return next;
      });
      setConfirmations((prev) => {
        const next: Record<string, number> = {};
        for (const [taskId, until] of Object.entries(prev)) {
          if (until > currentNow) next[taskId] = until;
        }
        return next;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const submitClaim = async (taskId: string) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) {
      setStatus("Feil: Fant ikke oppgaven.");
      return;
    }

    setStatus("");
    const currentTs = nowTs;
    setCooldowns((prev) => ({ ...prev, [taskId]: currentTs + 10_000 }));
    setPendingOre((prev) => prev + task.amount_ore);

    const res = await fetch("/api/kids/claim", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, taskId }),
    });

    const payload = (await res.json()) as { error?: string; ok?: boolean; status?: string };
    if (!res.ok || payload.error) {
      setPendingOre((prev) => prev - task.amount_ore);
      setStatus(`Feil: ${payload.error ?? "Kunne ikke sende krav."}`);
      return;
    }

    setConfirmations((prev) => ({ ...prev, [taskId]: nowTs + 2_500 }));
    if (payload.status === "APPROVED") {
      setPendingOre((prev) => Math.max(0, prev - task.amount_ore));
      setApprovedOre((prev) => prev + task.amount_ore);
      setEarnedOre((prev) => prev + task.amount_ore);
      setStatus("Sendt! Kravet ble auto-godkjent.");
      return;
    }
    setStatus("Sendt! Kravet ligger til godkjenning.");
  };

  const avatar = getAvatarByKey(child?.avatar_key);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-3xl">{avatar.emoji}</span>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{child ? child.name : "Barn"}</h1>
                <p className="text-sm text-slate-300">Velg en oppgave og trykk send.</p>
              </div>
            </div>
            <Link
              href="/kids"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Bytt profil
            </Link>
          </div>

          <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-4 text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Til gode</div>
            <div className="mt-1 text-4xl font-black text-emerald-200">{formatKr(approvedOre)}</div>
            <div className="mt-1 text-xs text-emerald-300/70">Godkjent, venter pa utbetaling</div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300/80">Venter</div>
              <div className="mt-1 text-lg font-black text-amber-200">{formatKr(pendingOre)}</div>
            </div>
            <div className="rounded-xl border border-sky-800/60 bg-sky-950/30 p-3 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/80">Utbetalt</div>
              <div className="mt-1 text-lg font-black text-sky-200">{formatKr(paidOre)}</div>
            </div>
          </div>

          <p className="mt-2 text-center text-xs text-slate-400">
            Tjent totalt: <span className="font-semibold text-slate-200">{formatKr(earnedOre)}</span>
          </p>

          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
            <h2 className="text-sm font-semibold text-slate-100">Onskeliste</h2>
            {wishlistItems.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Ingen onskeliste enda.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {wishlistItems.map((item) => {
                  const missingOre = Math.max(0, item.target_ore - approvedOre);
                  return (
                    <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                        <span className="text-xs text-slate-300">Maal: {formatKr(item.target_ore)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Mangler {formatKr(missingOre)}</p>
                      {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {status && (
          <p
            className={`mb-6 rounded-lg border px-3 py-2 text-sm ${
              status.startsWith("Feil:")
                ? "border-red-800 bg-red-950/40 text-red-200"
                : "border-emerald-800 bg-emerald-950/40 text-emerald-200"
            }`}
          >
            <span>{status}</span>
            {showLoginLink && (
              <Link href="/login" className="ml-2 inline-flex text-slate-100 underline underline-offset-4">
                Gaa til login
              </Link>
            )}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleTasks.map((task, index) => {
            const disabled = (cooldowns[task.id] ?? 0) > nowTs;
            const secondsLeft = disabled ? Math.ceil(((cooldowns[task.id] ?? 0) - nowTs) / 1000) : 0;
            const justSubmitted = (confirmations[task.id] ?? 0) > nowTs;
            const gradient = cardColors[index % cardColors.length];

            return (
              <button
                key={task.id}
                type="button"
                disabled={disabled}
                onClick={() => void submitClaim(task.id)}
                className={`relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br ${gradient} p-6 text-left text-slate-950 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-70 md:p-7`}
              >
                <div className="text-2xl font-black tracking-tight">{task.title}</div>
                <div className="mt-2 text-3xl font-black">{formatKr(task.amount_ore)}</div>
                <div className="mt-4 text-sm font-semibold text-slate-900/80">
                  {justSubmitted ? "Sendt!" : disabled ? `Vent ${secondsLeft}s` : "Trykk for aa sende krav"}
                </div>
                {disabled && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/50">
                    <div
                      className="h-full bg-slate-950 transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, (secondsLeft / 10) * 100))}%` }}
                    />
                  </div>
                )}
                {justSubmitted && <div className="pointer-events-none absolute right-3 top-3 text-xs font-black uppercase">OK</div>}
              </button>
            );
          })}
        </div>

        {visibleTasks.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Ingen synlige oppgaver for denne profilen.
          </div>
        )}
      </div>
    </main>
  );
}
