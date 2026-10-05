"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowLeft, Check, ChevronLeft, Clock, PartyPopper, Pencil, Plus, ShoppingCart, X } from "lucide-react";
import { formatKr, parseKrToOre } from "@/lib/money";
import { DEFAULT_WISH_EMOJI, PRICE_CHIPS, WISH_CATEGORIES, type WishCategory } from "@/lib/wish-catalog";
import { kidColor } from "../../_lib/palette";
import { taskEmoji } from "@/lib/task-emoji";
import { celebrate } from "../../_lib/celebrate";

type Wish = {
  id: string;
  title: string;
  emoji: string | null;
  target_ore: number | null;
  suggested_ore: number | null;
  status: "PROPOSED" | "ACTIVE" | "PAID";
  created_by: "PARENT" | "CHILD";
  paid_at: string | null;
  purchase_requested_at: string | null;
};

type Task = { id: string; title: string; amount_ore: number; active: boolean };

type ShopData = {
  name: string;
  balanceOre: number;
  savingsPercent: number;
  tasks: Task[];
  wishes: Wish[];
};

async function fetchShop(childId: string): Promise<ShopData> {
  const [tasksRes, wishRes] = await Promise.all([
    fetch(`/api/kids/tasks?childId=${encodeURIComponent(childId)}`, { credentials: "include" }),
    fetch(`/api/kids/wishlist?childId=${encodeURIComponent(childId)}`, { credentials: "include" }),
  ]);
  const t = (await tasksRes.json().catch(() => ({}))) as {
    error?: string;
    child?: { name: string };
    tasks?: Task[];
    approved_ore?: number;
    savings_percent?: number;
  };
  if (!tasksRes.ok || t.error || !t.child) throw new Error(t.error ?? "Klarte ikke å laste.");
  const w = (await wishRes.json().catch(() => ({}))) as { items?: Wish[] };
  return {
    name: t.child.name,
    balanceOre: t.approved_ore ?? 0,
    savingsPercent: t.savings_percent ?? 0,
    tasks: (t.tasks ?? []).filter((task) => task.active && task.amount_ore > 0),
    wishes: wishRes.ok ? (w.items ?? []) : [],
  };
}

const priceOf = (w: Wish) => w.target_ore ?? w.suggested_ore ?? null;

// Teller opp fra 0 til målet, så det føles som en "lasteskjerm".
function useCountUp(target: number, durationMs = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

function ProgressBar({ pct, color, tall = false }: { pct: number; color: string; tall?: boolean }) {
  // Starter på 0 og glir opp når kortet vises.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(pct), 60);
    return () => window.clearTimeout(id);
  }, [pct]);
  return (
    <div className={`${tall ? "h-5" : "h-3"} overflow-hidden rounded-full bg-white/70 ring-1 ring-black/5`}>
      <div
        className="h-full rounded-full transition-[width] duration-[1100ms] ease-out"
        style={{ width: `${Math.max(shown > 0 ? 4 : 0, shown)}%`, background: color }}
      />
    </div>
  );
}

export default function WishShopPage() {
  const { childId } = useParams<{ childId: string }>();
  const shop = useSWR(["kid-shop", childId], () => fetchShop(childId), { revalidateOnFocus: true, shouldRetryOnError: false });

  const [addOpen, setAddOpen] = useState(false);
  const [openWishId, setOpenWishId] = useState<string | null>(null);

  const data = shop.data;
  const open = data?.wishes.filter((w) => w.status !== "PAID") ?? [];
  const bought = data?.wishes.filter((w) => w.status === "PAID") ?? [];
  const openWish = data?.wishes.find((w) => w.id === openWishId) ?? null;

  if (shop.error && !data) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12 text-center">
        <p className="text-lg font-bold">Oi, noe gikk galt</p>
        <Link href={`/kids/${childId}`} className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary">
          <ArrowLeft className="size-4" /> Tilbake
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/kids/${childId}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-semibold transition hover:bg-secondary"
        >
          <ArrowLeft className="size-4" /> Tilbake
        </Link>
        <span className="font-num rounded-full bg-primary px-4 py-2 text-base font-bold text-primary-foreground shadow-sm">
          {data ? `Du har ${formatKr(data.balanceOre)}` : "…"}
        </span>
      </div>

      <header className="mt-5">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span aria-hidden="true">🎁</span> Ønskebutikken
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">Spar opp pengene dine og kjøp det du ønsker deg.</p>
      </header>

      {!data ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-[1.75rem] bg-secondary" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {open.map((wish, index) => {
              const price = priceOf(wish);
              const pct = price ? Math.min(100, Math.round((data.balanceOre / price) * 100)) : 0;
              const color = kidColor(index);
              const enough = price !== null && data.balanceOre >= price;
              return (
                <button
                  key={wish.id}
                  type="button"
                  onClick={() => setOpenWishId(wish.id)}
                  className="animate-pop flex min-h-56 flex-col rounded-[1.75rem] p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] sm:p-5"
                  style={{ background: color.bg, color: color.ink }}
                >
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-white/80 text-4xl shadow-sm sm:size-20 sm:text-5xl" aria-hidden="true">
                    {wish.emoji ?? DEFAULT_WISH_EMOJI}
                  </span>
                  <span className="mt-3 line-clamp-2 text-lg font-extrabold leading-tight tracking-tight sm:text-xl">{wish.title}</span>
                  <span className="mt-auto pt-3">
                    {price !== null ? (
                      <>
                        <ProgressBar pct={pct} color={color.ink} />
                        <span className="mt-1.5 flex items-center justify-between text-sm font-bold">
                          <span>{enough && wish.status === "ACTIVE" ? "Klar! 🎉" : `${pct} %`}</span>
                          <span className="font-num">{wish.status === "PROPOSED" ? "ca. " : ""}{formatKr(price)}</span>
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
                        <Clock className="size-3.5" /> En voksen setter pris
                      </span>
                    )}
                    {wish.purchase_requested_at && enough && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold">
                        <ShoppingCart className="size-3.5" /> Kjøpt – venter på en voksen
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-border bg-card/70 p-5 text-center transition hover:-translate-y-1 hover:border-primary/40 hover:bg-card active:scale-[0.98]"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Plus className="size-8" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-extrabold">Nytt ønske</span>
            </button>
          </div>

          {open.length === 0 && (
            <p className="mt-4 text-center text-muted-foreground">Du har ingen ønsker ennå. Trykk «Nytt ønske» for å finne noe!</p>
          )}

          {bought.length > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-extrabold tracking-tight">Kjøpt 🎉</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {bought.map((w) => (
                  <li key={w.id} className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 font-semibold shadow-sm ring-1 ring-border">
                    <span aria-hidden="true">{w.emoji ?? DEFAULT_WISH_EMOJI}</span> {w.title}
                    <Check className="size-4 text-primary" strokeWidth={3} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {addOpen && data && (
        <AddWishSheet
          childId={childId}
          onClose={() => setAddOpen(false)}
          onAdded={async () => {
            setAddOpen(false);
            await shop.mutate();
          }}
        />
      )}

      {openWish && data && (
        <WishDetailSheet
          wish={openWish}
          data={data}
          childId={childId}
          onClose={() => setOpenWishId(null)}
          onBought={() => void shop.mutate()}
        />
      )}
    </main>
  );
}

/* ---------- Detaljer + kjøp ---------- */

function WishDetailSheet({
  wish,
  data,
  childId,
  onClose,
  onBought,
}: {
  wish: Wish;
  data: ShopData;
  childId: string;
  onClose: () => void;
  onBought: () => void;
}) {
  const price = priceOf(wish);
  const pct = price ? Math.min(100, Math.round((data.balanceOre / price) * 100)) : 0;
  const shownPct = useCountUp(pct);
  const missing = price ? Math.max(0, price - data.balanceOre) : 0;
  const enough = price !== null && missing === 0;
  const [buying, setBuying] = useState(false);
  // Et gammelt kjøp teller bare hvis barnet fortsatt har nok (pengene kan ha
  // blitt brukt på noe annet i mellomtiden).
  const [bought, setBought] = useState(Boolean(wish.purchase_requested_at) && enough);
  const [error, setError] = useState("");

  // Hvor mange ganger må barnet gjøre hver oppgave for å nå målet? Regnet med
  // det barnet faktisk får etter sparing.
  const plan = useMemo(() => {
    if (!missing) return [];
    return data.tasks
      .map((t) => {
        const net = t.amount_ore - Math.floor((t.amount_ore * data.savingsPercent) / 100);
        return { title: t.title, emoji: taskEmoji(t.title), times: net > 0 ? Math.ceil(missing / net) : Infinity };
      })
      .filter((p) => Number.isFinite(p.times))
      .sort((a, b) => a.times - b.times)
      .slice(0, 4);
  }, [data.tasks, data.savingsPercent, missing]);

  const buy = async () => {
    setBuying(true);
    setError("");
    const res = await fetch("/api/kids/wishlist/buy", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, wishId: wish.id }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setBuying(false);
    if (!res.ok) {
      setError(payload.error ?? "Det gikk ikke. Prøv igjen!");
      return;
    }
    setBought(true);
    celebrate("big");
    onBought();
  };

  return (
    <Sheet onClose={onClose} label={wish.title}>
      <div className="text-center">
        <div className={`mx-auto flex size-28 items-center justify-center rounded-[2rem] bg-secondary text-7xl ${bought ? "animate-bounce" : ""}`} aria-hidden="true">
          {wish.emoji ?? DEFAULT_WISH_EMOJI}
        </div>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight">{wish.title}</h2>
      </div>

      {price === null ? (
        <p className="mt-5 rounded-2xl bg-secondary px-5 py-4 text-center font-semibold">
          En voksen ser på ønsket ditt og finner ut hva det koster. ⏳
        </p>
      ) : (
        <div className="mt-6 rounded-[1.75rem] bg-secondary p-5">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <span className="font-num text-5xl font-bold tracking-tight">{shownPct}%</span>
            <span className="text-sm font-semibold text-muted-foreground sm:text-right">
              <span className="font-num block text-lg font-bold text-foreground">
                {formatKr(Math.min(data.balanceOre, price))} / {formatKr(price)}
              </span>
              {wish.status === "PROPOSED" && "omtrentlig pris"}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar pct={pct} color="var(--primary)" tall />
          </div>
          <p className="mt-3 text-center text-lg font-bold">{enough ? "Du har spart nok! 🎉" : `Du mangler ${formatKr(missing)}`}</p>
        </div>
      )}

      {plan.length > 0 && (
        <div className="mt-5">
          <p className="font-bold">Så mye må du gjøre:</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {plan.map((p, i) => (
              <li key={p.title} className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold" style={{ background: kidColor(i).bg, color: kidColor(i).ink }}>
                <span className="text-2xl" aria-hidden="true">{p.emoji}</span>
                <span className="font-num text-2xl font-bold">{p.times}×</span>
                <span className="min-w-0 flex-1 leading-tight">{p.title}</span>
              </li>
            ))}
          </ul>
          {plan.length > 1 && <p className="mt-2 text-sm text-muted-foreground">Eller en blanding – alt teller!</p>}
        </div>
      )}

      <div className="mt-6">
        {bought ? (
          <p className="animate-pop flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-center text-lg font-bold text-accent-foreground">
            <PartyPopper className="size-5" /> Kjøpt! En voksen får beskjed.
          </p>
        ) : wish.status === "ACTIVE" && enough ? (
          <button
            type="button"
            disabled={buying}
            onClick={() => void buy()}
            className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
          >
            <ShoppingCart className="size-6" /> {buying ? "Kjøper…" : `Kjøp for ${formatKr(price ?? 0)}`}
          </button>
        ) : wish.status === "PROPOSED" ? (
          <p className="text-center text-sm text-muted-foreground">Når en voksen har sagt ja, kan du kjøpe det her.</p>
        ) : null}
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-center font-semibold text-red-800">{error}</p>}
      </div>
    </Sheet>
  );
}

/* ---------- Legg til ønske ---------- */

function AddWishSheet({ childId, onClose, onAdded }: { childId: string; onClose: () => void; onAdded: () => void }) {
  const [category, setCategory] = useState<WishCategory | null>(null);
  const [draft, setDraft] = useState<{ title: string; emoji: string; kr: number | null } | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!draft?.title.trim()) return;
    const typed = customPrice.trim() ? parseKrToOre(customPrice) : null;
    if (typed === "invalid") {
      setError("Skriv prisen som et tall, f.eks. 49.");
      return;
    }
    const suggestedOre = typeof typed === "number" ? typed : draft.kr !== null ? draft.kr * 100 : null;
    setSending(true);
    setError("");
    const res = await fetch("/api/kids/wishlist", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, title: draft.title.trim(), suggestedOre, emoji: draft.emoji }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (!res.ok) {
      setError(payload.error ?? "Det gikk ikke. Prøv igjen!");
      return;
    }
    onAdded();
  };

  const back = () => {
    if (draft) setDraft(null);
    else setCategory(null);
  };

  return (
    <Sheet onClose={onClose} label="Nytt ønske">
      <div className="flex items-center gap-2">
        {(category || draft) && (
          <button type="button" onClick={back} aria-label="Tilbake" className="flex size-11 items-center justify-center rounded-xl border border-border hover:bg-secondary">
            <ChevronLeft className="size-5" />
          </button>
        )}
        <h2 className="text-2xl font-extrabold tracking-tight">
          {draft ? "Ser dette riktig ut?" : category ? `${category.emoji} ${category.title}` : "Hva ønsker du deg?"}
        </h2>
      </div>

      {!category && !draft && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {WISH_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c)}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-[1.5rem] p-3 text-center font-extrabold shadow-sm ring-1 ring-black/5 transition active:scale-95"
              style={{ background: c.bg }}
            >
              <span className="text-4xl" aria-hidden="true">{c.emoji}</span>
              {c.title}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDraft({ title: "", emoji: DEFAULT_WISH_EMOJI, kr: null })}
            className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-[1.5rem] border-2 border-dashed border-border p-3 text-center font-extrabold transition active:scale-95"
          >
            <Pencil className="size-8 text-primary" /> Skriv selv
          </button>
        </div>
      )}

      {category && !draft && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {category.items.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setDraft({ title: item.title, emoji: item.emoji, kr: item.kr })}
              className="flex items-center gap-4 rounded-[1.5rem] p-4 text-left shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
              style={{ background: category.bg }}
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-3xl" aria-hidden="true">{item.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold leading-tight">{item.title}</span>
                {item.kr !== null && <span className="font-num text-sm font-bold opacity-75">ca. {item.kr} kr</span>}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDraft({ title: "", emoji: category.emoji, kr: null })}
            className="flex items-center gap-4 rounded-[1.5rem] border-2 border-dashed border-border p-4 text-left font-extrabold active:scale-[0.98]"
          >
            <Pencil className="size-6 text-primary" /> Noe annet …
          </button>
        </div>
      )}

      {draft && (
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-4 rounded-[1.5rem] bg-secondary p-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl" aria-hidden="true">{draft.emoji}</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Hva heter det?"
              maxLength={80}
              autoFocus={!draft.title}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-border bg-card px-4 text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <p className="font-bold">Hva tror du det koster? <span className="font-normal text-muted-foreground">(kan hoppes over)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[null, ...PRICE_CHIPS].map((kr) => {
                const selected = !customPrice && draft.kr === kr;
                return (
                  <button
                    key={kr ?? "vet-ikke"}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setCustomPrice("");
                      setDraft({ ...draft, kr });
                    }}
                    className={`font-num min-h-11 rounded-full px-4 text-sm font-bold transition ${selected ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                  >
                    {kr === null ? "Vet ikke" : `${kr} kr`}
                  </button>
                );
              })}
            </div>
            <input
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              inputMode="decimal"
              placeholder="Annen pris (kr)"
              className="mt-3 min-h-12 w-full rounded-xl border border-border bg-card px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-800">{error}</p>}

          <button
            type="button"
            disabled={sending || !draft.title.trim()}
            onClick={() => void send()}
            className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {sending ? "Legger til…" : "Legg i ønskelisten 🎁"}
          </button>
          <p className="text-center text-sm text-muted-foreground">En voksen ser på ønsket og bestemmer prisen.</p>
        </div>
      )}
    </Sheet>
  );
}

function Sheet({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="animate-pop relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-card p-5 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Lukk" className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary">
          <X className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
