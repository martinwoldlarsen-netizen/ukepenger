"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Gift, PartyPopper, Send, Sparkles } from "lucide-react";
import { getAvatarByKey } from "@/lib/avatars";
import { formatKr, parseKrToOre } from "@/lib/money";
import { kidColor } from "../_lib/palette";

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
  target_ore: number | null;
  suggested_ore: number | null;
  status: "PROPOSED" | "ACTIVE" | "PAID";
  created_by: "PARENT" | "CHILD";
  note: string | null;
};

type Notice = { kind: "ok" | "error"; text: string } | null;

const MAX_WISH_LENGTH = 80;

export default function KidTaskPage() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;

  const [child, setChild] = useState<ChildRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [confirmations, setConfirmations] = useState<Record<string, number>>({});
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [pendingOre, setPendingOre] = useState(0);
  const [approvedOre, setApprovedOre] = useState(0);
  const [paidOre, setPaidOre] = useState(0);
  const [earnedOre, setEarnedOre] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const [wishTitle, setWishTitle] = useState("");
  const [wishPrice, setWishPrice] = useState("");
  const [wishSending, setWishSending] = useState(false);
  const [wishNotice, setWishNotice] = useState<Notice>(null);

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

      const tasksPayload = (await tasksRes.json().catch(() => ({}))) as {
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
        setLoadError(tasksPayload.error ?? "Klarte ikke laste oppgavene.");
        setLoading(false);
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
      setWishlistItems(wishlistRes.ok && !wishlistPayload.error ? (wishlistPayload.items ?? []) : []);
      setLoading(false);
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
      setNotice({ kind: "error", text: "Fant ikke oppgaven." });
      return;
    }

    setNotice(null);
    const currentTs = nowTs;
    setCooldowns((prev) => ({ ...prev, [taskId]: currentTs + 10_000 }));
    setPendingOre((prev) => prev + task.amount_ore);

    const res = await fetch("/api/kids/claim", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, taskId }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; status?: string };
    if (!res.ok || payload.error) {
      setPendingOre((prev) => prev - task.amount_ore);
      setNotice({ kind: "error", text: payload.error ?? "Kunne ikke sende. Prøv igjen." });
      return;
    }

    setConfirmations((prev) => ({ ...prev, [taskId]: nowTs + 2_500 }));
    if (payload.status === "APPROVED") {
      setPendingOre((prev) => Math.max(0, prev - task.amount_ore));
      setApprovedOre((prev) => prev + task.amount_ore);
      setEarnedOre((prev) => prev + task.amount_ore);
      setNotice({ kind: "ok", text: `Bra jobba! ${formatKr(task.amount_ore)} er lagt til.` });
      return;
    }
    setNotice({ kind: "ok", text: "Bra jobba! En voksen må godkjenne før pengene kommer." });
  };

  const submitWish = async (event: React.FormEvent) => {
    event.preventDefault();
    setWishNotice(null);

    const title = wishTitle.trim();
    if (!title) {
      setWishNotice({ kind: "error", text: "Skriv hva du ønsker deg." });
      return;
    }
    const suggestedOre = parseKrToOre(wishPrice);
    if (suggestedOre === "invalid") {
      setWishNotice({ kind: "error", text: "Skriv prisen som et tall, f.eks. 49." });
      return;
    }

    setWishSending(true);
    const res = await fetch("/api/kids/wishlist", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, title, suggestedOre }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string; item?: WishlistItem };
    setWishSending(false);

    if (!res.ok || payload.error || !payload.item) {
      setWishNotice({ kind: "error", text: payload.error ?? "Kunne ikke sende ønsket. Prøv igjen." });
      return;
    }

    setWishlistItems((prev) => [payload.item as WishlistItem, ...prev]);
    setWishTitle("");
    setWishPrice("");
    setWishNotice({ kind: "ok", text: "Sendt! En voksen ser på ønsket ditt." });
  };

  const avatar = getAvatarByKey(child?.avatar_key);

  if (loadError) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12">
        <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
          <p className="text-lg font-bold">Oi, noe gikk galt</p>
          <p className="mt-1 text-muted-foreground">{loadError}</p>
          <Link href="/kids" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary">
            <ArrowLeft className="size-4" /> Tilbake til profiler
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-card text-4xl shadow-sm ring-1 ring-border">
            {avatar.emoji}
          </span>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Hei,</p>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{child ? `${child.name}!` : "…"}</h1>
          </div>
        </div>
        <Link
          href="/kids"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:bg-secondary"
        >
          <ArrowLeft className="size-4" /> Bytt profil
        </Link>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Saldo */}
          <section className="rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-lg sm:p-7" aria-label="Pengene dine">
            <p className="text-sm font-semibold opacity-80">Til gode</p>
            <p className="font-num mt-1 text-5xl font-bold tracking-tight sm:text-6xl">
              {loading ? "…" : formatKr(approvedOre)}
            </p>
            <p className="mt-1 text-sm opacity-75">Godkjent, og venter på å bli utbetalt</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary-foreground/12 px-4 py-3">
                <p className="text-xs font-semibold opacity-75">Venter på godkjenning</p>
                <p className="font-num mt-0.5 text-xl font-bold">{formatKr(pendingOre)}</p>
              </div>
              <div className="rounded-2xl bg-primary-foreground/12 px-4 py-3">
                <p className="text-xs font-semibold opacity-75">Utbetalt</p>
                <p className="font-num mt-0.5 text-xl font-bold">{formatKr(paidOre)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm opacity-75">
              Tjent totalt: <span className="font-num font-bold opacity-100">{formatKr(earnedOre)}</span>
            </p>
          </section>

          {notice && (
            <p
              role="status"
              className={`animate-pop rounded-2xl px-5 py-4 text-base font-semibold ${
                notice.kind === "error" ? "bg-red-50 text-red-800 ring-1 ring-red-200" : "bg-accent text-accent-foreground"
              }`}
            >
              {notice.text}
            </p>
          )}

          {/* Oppgaver */}
          <section aria-labelledby="oppgaver-title">
            <h2 id="oppgaver-title" className="text-2xl font-extrabold tracking-tight">
              Oppgaver
            </h2>
            <p className="text-muted-foreground">Trykk når du er ferdig.</p>

            {loading ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-[1.75rem] bg-secondary" />
                ))}
              </div>
            ) : visibleTasks.length === 0 ? (
              <div className="mt-4 rounded-[1.75rem] border border-border bg-card p-8 text-center text-muted-foreground">
                Ingen oppgaver akkurat nå. Spør en voksen!
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visibleTasks.map((task, index) => {
                  const disabled = (cooldowns[task.id] ?? 0) > nowTs;
                  const secondsLeft = disabled ? Math.ceil(((cooldowns[task.id] ?? 0) - nowTs) / 1000) : 0;
                  const justSubmitted = (confirmations[task.id] ?? 0) > nowTs;
                  const color = kidColor(index);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => void submitClaim(task.id)}
                      className="flex min-h-32 flex-col justify-between rounded-[1.75rem] p-5 sm:min-h-40 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      style={{ background: color.bg, color: color.ink }}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-2xl font-extrabold leading-tight tracking-tight">{task.title}</span>
                        <span className="font-num shrink-0 rounded-full bg-white/80 px-3 py-1 text-base font-bold">
                          +{formatKr(task.amount_ore)}
                        </span>
                      </span>

                      {justSubmitted ? (
                        <span className="animate-pop mt-4 inline-flex items-center gap-2 self-start rounded-full bg-white/85 px-4 py-2 text-sm font-bold">
                          <PartyPopper className="size-4" /> Sendt!
                        </span>
                      ) : disabled ? (
                        <span className="mt-4 block">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                            <Clock className="size-4" /> Vent {secondsLeft} s
                          </span>
                          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/60">
                            <span
                              className="block h-full rounded-full transition-all"
                              style={{
                                width: `${Math.max(0, Math.min(100, (secondsLeft / 10) * 100))}%`,
                                background: color.ink,
                              }}
                            />
                          </span>
                        </span>
                      ) : (
                        <span className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-white/85 px-4 py-2 text-sm font-bold">
                          <Check className="size-4" strokeWidth={3} /> Jeg har gjort det!
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Ønsker */}
        <aside className="h-fit rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="onsker-title">
          <h2 id="onsker-title" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <Gift className="size-6 text-primary" /> Ønskene mine
          </h2>

          <form onSubmit={(e) => void submitWish(e)} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-bold">Jeg ønsker meg …</span>
              <input
                value={wishTitle}
                onChange={(e) => setWishTitle(e.target.value)}
                maxLength={MAX_WISH_LENGTH}
                placeholder="f.eks. hus i Toca Boca"
                className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-lg outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Hva tror du det koster?</span>{" "}
              <span className="text-sm text-muted-foreground">(kan stå tomt)</span>
              <span className="mt-1.5 flex items-center rounded-2xl border border-border bg-background pr-4 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <input
                  value={wishPrice}
                  onChange={(e) => setWishPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="49"
                  className="font-num w-full rounded-2xl bg-transparent px-4 py-3.5 text-lg outline-none placeholder:text-muted-foreground/70"
                />
                <span className="font-bold text-muted-foreground">kr</span>
              </span>
            </label>
            <button
              type="submit"
              disabled={wishSending || !wishTitle.trim()}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Send className="size-4" /> {wishSending ? "Sender…" : "Send ønske"}
            </button>
            <p className="text-xs text-muted-foreground">Sier en voksen ja, betaler du med pengene du har til gode.</p>
            {wishNotice && (
              <p
                role="status"
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  wishNotice.kind === "error" ? "bg-red-50 text-red-800" : "bg-secondary text-primary"
                }`}
              >
                {wishNotice.text}
              </p>
            )}
          </form>

          <div className="mt-6 space-y-3">
            {wishlistItems.length === 0 && !loading && (
              <p className="rounded-2xl bg-secondary px-4 py-5 text-center text-muted-foreground">
                Ingen ønsker ennå. Skriv inn noe du drømmer om!
              </p>
            )}
            {wishlistItems.map((item) => (
              <WishCard key={item.id} item={item} balanceOre={approvedOre} />
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

function WishCard({ item, balanceOre }: { item: WishlistItem; balanceOre: number }) {
  if (item.status === "PAID") {
    return (
      <div className="rounded-2xl bg-accent/60 p-4">
        <p className="flex items-center gap-2 font-bold">
          <PartyPopper className="size-5" /> {item.title}
        </p>
        <p className="mt-0.5 text-sm text-accent-foreground">
          Oppfylt{item.target_ore !== null ? ` for ${formatKr(item.target_ore)}` : ""}!
        </p>
      </div>
    );
  }

  if (item.status === "PROPOSED") {
    return (
      <div className="rounded-2xl border border-dashed border-border p-4">
        <p className="font-bold">{item.title}</p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" /> Venter på en voksen
          {item.suggested_ore ? ` · du tror ${formatKr(item.suggested_ore)}` : ""}
        </p>
      </div>
    );
  }

  // Sparemål: godkjent pris, men ikke nok til gode ennå (eller akkurat nok nå).
  const target = item.target_ore ?? 0;
  const progress = target > 0 ? Math.min(100, Math.round((balanceOre / target) * 100)) : 0;
  const missing = Math.max(0, target - balanceOre);

  return (
    <div className="rounded-2xl bg-secondary p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold">{item.title}</p>
        <span className="font-num shrink-0 text-sm font-bold">{formatKr(target)}</span>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-card"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Spart til ${item.title}`}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">
        {missing === 0 ? (
          <span className="inline-flex items-center gap-1.5 text-primary">
            <Sparkles className="size-4" /> Du har spart nok! Nå kan en voksen kjøpe det.
          </span>
        ) : (
          `${formatKr(missing)} igjen`
        )}
      </p>
    </div>
  );
}
