"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { KidHistory, kidHistoryKey } from "../_components/KidHistory";
import { ArrowLeft, ArrowRight, Check, Clock, PartyPopper, Pencil, X } from "lucide-react";
import { FigurePicker } from "@/components/avatars/FigurePicker";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { getFigure } from "@/components/avatars/figures";
import { formatKr } from "@/lib/money";
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
  emoji?: string | null;
  status: "PROPOSED" | "ACTIVE" | "PAID";
  created_by: "PARENT" | "CHILD";
  note: string | null;
};

type Notice = { kind: "ok" | "error"; text: string } | null;


type TasksPayload = {
  error?: string;
  child?: ChildRow;
  tasks?: TaskRow[];
  cooldowns?: Record<string, number>;
  pending_ore?: number;
  approved_ore?: number;
  paid_ore?: number;
  earned_ore?: number;
  saved_ore?: number | null;
  savings_percent?: number;
};

// Litt moro: nivå etter hvor mye barnet har tjent totalt.
const LEVELS = [
  { fromOre: 0, title: "Nybegynner", emoji: "🌱" },
  { fromOre: 5_000, title: "Hjelper", emoji: "⭐" },
  { fromOre: 20_000, title: "Superhjelper", emoji: "🚀" },
  { fromOre: 50_000, title: "Mester", emoji: "🏆" },
  { fromOre: 100_000, title: "Legende", emoji: "👑" },
];

function levelFor(earnedOre: number) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (earnedOre >= LEVELS[i].fromOre) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const progress = next ? Math.round(((earnedOre - current.fromOre) / (next.fromOre - current.fromOre)) * 100) : 100;
  return { ...current, nextOre: next ? next.fromOre : null, progress };
}

type KidPageData = { tasks: TasksPayload; wishlist: WishlistItem[] | null };

async function fetchKidPage(childId: string): Promise<KidPageData> {
  const [tasksRes, wishlistRes] = await Promise.all([
    fetch(`/api/kids/tasks?childId=${encodeURIComponent(childId)}`, { credentials: "include" }),
    fetch(`/api/kids/wishlist?childId=${encodeURIComponent(childId)}`, { credentials: "include" }),
  ]);
  const tasks = (await tasksRes.json().catch(() => ({}))) as TasksPayload;
  if (!tasksRes.ok || tasks.error || !tasks.child) throw new Error(tasks.error ?? "Klarte ikke laste oppgavene.");
  const wishlist = (await wishlistRes.json().catch(() => ({}))) as { error?: string; items?: WishlistItem[] };
  return { tasks, wishlist: wishlistRes.ok && !wishlist.error ? (wishlist.items ?? []) : null };
}

export default function KidTaskPage() {
  const params = useParams<{ childId: string }>();
  const childId = params.childId;

  const [child, setChild] = useState<ChildRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  // Pause etter et trykk: tidspunkt den slutter og hvor lang den er (for
  // CSS-animasjonen). Fjernes med en timeout i stedet for en timer som tegner
  // hele siden på nytt hvert halve sekund.
  const [cooldowns, setCooldowns] = useState<Record<string, { until: number; duration: number }>>({});
  // Kort bekreftelse inne i oppgavekortet barnet nettopp trykket på.
  const [cardMessages, setCardMessages] = useState<Record<string, Notice>>({});
  const timers = useRef<number[]>([]);
  const [pendingOre, setPendingOre] = useState(0);
  const [approvedOre, setApprovedOre] = useState(0);
  const [paidOre, setPaidOre] = useState(0);
  const [earnedOre, setEarnedOre] = useState(0);
  // null = sparegrisen er skjult for barnet (eller sparing er av).
  const [savedOre, setSavedOre] = useState<number | null>(null);
  const [savingsPercent, setSavingsPercent] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const { mutate: mutateGlobal } = useSWRConfig();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);


  // Enten et kjent sluttidspunkt (fra serveren) eller en varighet fra nå.
  const startCooldown = useCallback((taskId: string, end: { until: number } | { ms: number }) => {
    const until = "until" in end ? end.until : Date.now() + end.ms;
    const duration = Math.max(0, until - Date.now());
    if (duration <= 0) return;
    setCooldowns((prev) => ({ ...prev, [taskId]: { until, duration } }));
    timers.current.push(
      window.setTimeout(() => {
        setCooldowns((prev) => {
          if (prev[taskId]?.until !== until) return prev;
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }, duration)
    );
  }, []);

  const showCardMessage = useCallback((taskId: string, message: Notice) => {
    setCardMessages((prev) => ({ ...prev, [taskId]: message }));
    timers.current.push(
      window.setTimeout(() => {
        setCardMessages((prev) => {
          if (prev[taskId] !== message) return prev;
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }, 3_000)
    );
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  // Henter oppgaver, saldo og ønsker ved start og når siden får fokus igjen
  // (SWR), så saldoen er oppdatert etter at en voksen har godkjent.
  const applyData = useCallback(
    (data: KidPageData) => {
      const p = data.tasks;
      setLoadError("");
      setChild(p.child ?? null);
      setTasks(p.tasks ?? []);
      for (const [taskId, until] of Object.entries(p.cooldowns ?? {})) startCooldown(taskId, { until });
      setPendingOre(p.pending_ore ?? 0);
      setApprovedOre(p.approved_ore ?? 0);
      setPaidOre(p.paid_ore ?? 0);
      setEarnedOre(p.earned_ore ?? 0);
      setSavedOre(p.saved_ore ?? null);
      setSavingsPercent(p.savings_percent ?? 0);
      // Feiler bare ønskelisten, beholder vi den vi har.
      if (data.wishlist) setWishlistItems(data.wishlist);
      setLoading(false);
    },
    [startCooldown]
  );

  useSWR(["kid-page", childId], () => fetchKidPage(childId), {
    revalidateOnFocus: true,
    dedupingInterval: 2_000,
    shouldRetryOnError: false,
    onSuccess: applyData,
    onError: (error: Error) => {
      // En bakgrunnsoppdatering som feiler skal ikke ta bort siden.
      if (!child) setLoadError(error.message || "Klarte ikke laste oppgavene.");
      setLoading(false);
    },
  });

  const visibleTasks = useMemo(() => tasks.filter((task) => task.active), [tasks]);

  const submitClaim = async (taskId: string) => {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) {
      setNotice({ kind: "error", text: "Fant ikke oppgaven." });
      return;
    }

    setNotice(null);
    startCooldown(taskId, { ms: 10_000 });
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
      setCooldowns((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      showCardMessage(taskId, { kind: "error", text: payload.error ?? "Det gikk ikke. Prøv igjen!" });
      return;
    }

    void mutateGlobal(kidHistoryKey(childId));
    if (payload.status === "APPROVED") {
      // Samme regel som databasen: sparedelen rundes ned og trekkes fra beløpet.
      const savedPart = Math.floor((task.amount_ore * savingsPercent) / 100);
      setPendingOre((prev) => Math.max(0, prev - task.amount_ore));
      setApprovedOre((prev) => prev + task.amount_ore - savedPart);
      setSavedOre((prev) => (prev === null ? null : prev + savedPart));
      setEarnedOre((prev) => prev + task.amount_ore);
      showCardMessage(taskId, { kind: "ok", text: `Bra jobba! +${formatKr(task.amount_ore)}` });
      return;
    }
    showCardMessage(taskId, { kind: "ok", text: "Bra jobba! En voksen sjekker snart." });
  };

  // Ønsket barnet er nærmest å ha råd til, vist på gave-knappen.
  const openWishes = wishlistItems.filter((w) => w.status !== "PAID");
  const openWishCount = openWishes.length;
  const nextWish =
    openWishes
      .map((w) => ({ title: w.title, emoji: w.emoji ?? "🎁", price: w.target_ore ?? w.suggested_ore ?? null }))
      .filter((w) => w.price !== null && w.price > 0)
      .sort((a, b) => approvedOre / (b.price as number) - approvedOre / (a.price as number))[0] ?? null;

  const profileBg = getFigure(child?.avatar_key)?.bg ?? "var(--secondary)";
  const level = levelFor(earnedOre);

  const chooseFigure = async (avatarKey: string) => {
    if (!child || avatarSaving) return;
    const previous = child.avatar_key;
    setAvatarSaving(true);
    setChild({ ...child, avatar_key: avatarKey });
    const res = await fetch("/api/kids/avatar", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, avatarKey }),
    });
    setAvatarSaving(false);
    if (!res.ok) {
      setChild((current) => (current ? { ...current, avatar_key: previous } : current));
      setNotice({ kind: "error", text: "Klarte ikke å bytte figur. Prøv igjen." });
      return;
    }
    setPickerOpen(false);
  };

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
      <div className="flex justify-end">
        <Link
          href="/kids"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:bg-secondary"
        >
          <ArrowLeft className="size-4" /> Bytt profil
        </Link>
      </div>

      {/* Profil: figuren barnet har valgt, navn og nivå */}
      <header
        className="mt-4 flex items-center gap-4 rounded-[2rem] p-5 shadow-sm ring-1 ring-black/5 sm:gap-6 sm:p-6"
        style={{ background: profileBg }}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Bytt figur"
          className="group relative shrink-0 rounded-full bg-white/70 p-1.5 shadow-sm transition hover:-rotate-3 hover:scale-105 active:scale-95"
        >
          <KidAvatar avatarKey={child?.avatar_key} size={96} />
          <span className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow ring-4 ring-white/70">
            <Pencil className="size-4" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold opacity-70">Hei,</p>
          <h1 className="truncate text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{child ? `${child.name}!` : "…"}</h1>
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-sm font-bold">
            <span aria-hidden="true">{level.emoji}</span> {level.title}
          </p>
          {level.nextOre !== null && (
            <div className="mt-2 max-w-56">
              <div className="h-2 overflow-hidden rounded-full bg-white/60">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${level.progress}%` }} />
              </div>
              <p className="mt-1 text-xs font-semibold opacity-70">{formatKr(level.nextOre - earnedOre)} til neste nivå</p>
            </div>
          )}
        </div>
      </header>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center" onClick={() => setPickerOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="figur-title"
            className="animate-pop max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-card p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="figur-title" className="text-2xl font-extrabold tracking-tight">
                Velg figuren din
              </h2>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                aria-label="Lukk"
                className="flex size-11 items-center justify-center rounded-xl border border-border transition hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>
            <FigurePicker size="lg" value={child?.avatar_key} disabled={avatarSaving} onChange={(key) => void chooseFigure(key)} />
          </div>
        </div>
      )}

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

          {savedOre !== null && (savedOre > 0 || savingsPercent > 0) && (
            <section
              className="flex items-center gap-4 rounded-[1.75rem] bg-accent p-5 text-accent-foreground shadow-sm ring-1 ring-black/5"
              aria-label="Sparegrisen din"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/80 text-3xl" aria-hidden="true">
                🐷
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold opacity-80">Sparegrisen din</p>
                <p className="font-num text-3xl font-bold tracking-tight">{loading ? "…" : formatKr(savedOre)}</p>
                {savingsPercent > 0 && (
                  <p className="text-sm opacity-80">{savingsPercent} % av alt du tjener blir spart her.</p>
                )}
              </div>
            </section>
          )}

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

          {/* Snarvei til Ønskebutikken på mobil; på store skjermer ligger den i sidekolonnen. */}
          <Link
            href={`/kids/${childId}/onsker`}
            className="flex items-center gap-4 rounded-[1.75rem] bg-accent p-4 text-accent-foreground shadow-sm ring-1 ring-black/5 transition active:scale-[0.98] lg:hidden"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-4xl" aria-hidden="true">
              🎁
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-extrabold leading-tight">Ønskebutikken</span>
              <span className="block truncate text-sm font-semibold opacity-80">
                {nextWish && nextWish.price !== null
                  ? `${nextWish.title}: ${Math.min(100, Math.round((approvedOre / nextWish.price) * 100))} %`
                  : "Finn noe du ønsker deg"}
              </span>
            </span>
            <ArrowRight className="size-6 shrink-0" />
          </Link>

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
                  const cooldown = cooldowns[task.id];
                  const message = cardMessages[task.id];
                  const color = kidColor(index);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={Boolean(cooldown)}
                      onClick={() => void submitClaim(task.id)}
                      className="flex min-h-32 flex-col justify-between rounded-[1.75rem] p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:hover:translate-y-0 sm:min-h-40"
                      style={{ background: color.bg, color: color.ink }}
                    >
                      <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                        <span className="min-w-0 flex-1 text-2xl font-extrabold leading-tight tracking-tight [overflow-wrap:anywhere]">{task.title}</span>
                        <span className="font-num shrink-0 rounded-full bg-white/80 px-3 py-1 text-base font-bold">
                          +{formatKr(task.amount_ore)}
                        </span>
                      </span>

                      {message ? (
                        <span
                          role="status"
                          className={`animate-pop mt-4 inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold ${
                            message.kind === "error" ? "bg-red-50 text-red-800" : "bg-white/90"
                          }`}
                        >
                          {message.kind === "ok" && <PartyPopper className="size-4" />} {message.text}
                        </span>
                      ) : cooldown ? (
                        <span className="mt-4 block">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                            <Clock className="size-4" /> Vent litt …
                          </span>
                          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/60">
                            <span
                              key={cooldown.until}
                              className="cooldown-bar block h-full rounded-full"
                              style={{ animationDuration: `${cooldown.duration}ms`, background: color.ink }}
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

          <KidHistory childId={childId} />
        </div>

        {/* Ønskebutikken */}
        <aside className="hidden h-fit space-y-3 lg:block">
          <Link
            href={`/kids/${childId}/onsker`}
            className="group relative block overflow-hidden rounded-[2rem] bg-accent p-6 text-accent-foreground shadow-lg ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]"
          >
            <span className="absolute -right-4 -top-4 text-[7rem] leading-none opacity-90 transition group-hover:rotate-6 group-hover:scale-110" aria-hidden="true">
              🎁
            </span>
            <span className="relative block max-w-[65%]">
              <span className="block text-3xl font-extrabold leading-tight tracking-tight">Ønskebutikken</span>
              <span className="mt-1 block font-semibold opacity-80">Kjøp det du ønsker deg med pengene dine</span>
            </span>
            {nextWish && nextWish.price !== null && (
              <span className="relative mt-5 block rounded-2xl bg-white/70 p-3">
                <span className="flex items-center justify-between gap-2 text-sm font-bold">
                  <span className="truncate">
                    {nextWish.emoji} {nextWish.title}
                  </span>
                  <span className="font-num shrink-0">{Math.min(100, Math.round((approvedOre / nextWish.price) * 100))} %</span>
                </span>
                <span className="mt-2 block h-3 overflow-hidden rounded-full bg-white">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.round((approvedOre / nextWish.price) * 100))}%` }}
                  />
                </span>
              </span>
            )}
            <span className="relative mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-primary px-5 font-extrabold text-primary-foreground shadow-sm">
              Gå til butikken <ArrowRight className="size-5" />
            </span>
          </Link>
          {openWishCount > 0 && (
            <p className="px-2 text-center text-sm font-semibold text-muted-foreground">
              Du har {openWishCount} {openWishCount === 1 ? "ønske" : "ønsker"} i butikken
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
