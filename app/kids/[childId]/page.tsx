"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { ArrowLeft, Check, Clock, Gift, PartyPopper, Pencil, Send, Sparkles, X } from "lucide-react";
import { FigurePicker } from "@/components/avatars/FigurePicker";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { getFigure } from "@/components/avatars/figures";
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

  const [pickerOpen, setPickerOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [wishTitle, setWishTitle] = useState("");
  const [wishPrice, setWishPrice] = useState("");
  const [wishSending, setWishSending] = useState(false);
  const [wishNotice, setWishNotice] = useState<Notice>(null);

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
