"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { Coins, Gift, Heart, Share, X } from "lucide-react";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { getFigure } from "@/components/avatars/figures";
import { formatKr, parseKrToOre } from "@/lib/money";

type GuestWish = { id: string; title: string; emoji: string | null; price_ore: number | null; approved: boolean };
type GuestChild = { id: string; name: string; avatar_key: string | null; due_ore: number; saved_ore: number | null; wishes: GuestWish[] };
type Overview = { guestName: string; familyName: string | null; children: GuestChild[] };

const AMOUNTS = [50, 100, 200, 500];

async function fetchOverview(): Promise<Overview> {
  const res = await fetch("/api/guest/overview", { credentials: "include" });
  const payload = (await res.json().catch(() => ({}))) as Overview & { error?: string };
  if (!res.ok) throw Object.assign(new Error(payload.error ?? "Feil"), { status: res.status });
  return payload;
}

export default function GrandparentPage() {
  return (
    <Suspense>
      <GrandparentInner />
    </Suspense>
  );
}

function GrandparentInner() {
  const linkError = useSearchParams().get("feil") === "lenke";
  const { data, error, mutate } = useSWR("guest-overview", fetchOverview, { revalidateOnFocus: true, shouldRetryOnError: false });
  const [giftFor, setGiftFor] = useState<GuestChild | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const notConnected = linkError || (error && (error as { status?: number }).status === 401);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-8 text-lg sm:py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-lg font-bold tracking-[-0.06em]">ukepenger</span>
      </div>

      {notConnected ? (
        <div className="mt-10 rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
          <div className="text-6xl" aria-hidden="true">🔗</div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Lenken virker ikke</h1>
          <p className="mt-2 text-muted-foreground">Be foreldrene sende deg en ny lenke fra Ukepenger.</p>
        </div>
      ) : !data ? (
        <div className="mt-10 space-y-4" aria-label="Laster" role="status">
          <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-secondary" />
          <div className="h-56 animate-pulse rounded-[2rem] bg-secondary" />
        </div>
      ) : (
        <>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight">Hei, {data.guestName}! 👋</h1>
          <p className="mt-2 text-xl text-muted-foreground">Her ser du hva barnebarna sparer til, og kan gi dem en gave.</p>

          <AddToHomeHint />

          <div className="mt-8 space-y-6">
            {data.children.map((child) => {
              const bg = getFigure(child.avatar_key)?.bg ?? "var(--secondary)";
              return (
                <section key={child.id} className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                  <div className="flex items-center gap-4 p-5" style={{ background: bg }}>
                    <span className="rounded-full bg-white/70 p-1">
                      <KidAvatar avatarKey={child.avatar_key} size={72} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-3xl font-extrabold tracking-tight">{child.name}</h2>
                      <p className="font-semibold opacity-80">
                        Har <span className="font-num font-bold">{formatKr(child.due_ore)}</span>
                        {child.saved_ore ? (
                          <>
                            {" "}
                            · 🐷 <span className="font-num font-bold">{formatKr(child.saved_ore)}</span> spart
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 p-5">
                    {child.wishes.length === 0 ? (
                      <p className="text-muted-foreground">{child.name} har ingen ønsker akkurat nå.</p>
                    ) : (
                      <>
                        <p className="font-bold">{child.name} sparer til:</p>
                        {child.wishes.map((w) => {
                          const pct = w.price_ore ? Math.min(100, Math.round((child.due_ore / w.price_ore) * 100)) : null;
                          return (
                            <div key={w.id} className="rounded-2xl bg-secondary p-4">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl" aria-hidden="true">{w.emoji ?? "🎁"}</span>
                                <span className="min-w-0 flex-1 font-bold">{w.title}</span>
                                {w.price_ore !== null && (
                                  <span className="font-num shrink-0 font-bold">
                                    {w.approved ? "" : "ca. "}
                                    {formatKr(w.price_ore)}
                                  </span>
                                )}
                              </div>
                              {pct !== null && (
                                <>
                                  <div className="mt-3 h-4 overflow-hidden rounded-full bg-white">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pct, 3)}%` }} />
                                  </div>
                                  <p className="mt-1.5 text-base text-muted-foreground">
                                    {pct >= 100 ? "Har spart nok! 🎉" : `${pct} % – mangler ${formatKr((w.price_ore ?? 0) - child.due_ore)}`}
                                  </p>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {sentTo === child.id && (
                      <p className="animate-pop rounded-2xl bg-accent px-5 py-4 font-bold text-accent-foreground">
                        Takk! Gaven er sendt 💛 Foreldrene legger den til når de har fått pengene.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setGiftFor(child)}
                      className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
                    >
                      <Gift className="size-6" /> Gi {child.name} en gave
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {giftFor && (
        <GiftSheet
          child={giftFor}
          onClose={() => setGiftFor(null)}
          onSent={() => {
            setSentTo(giftFor.id);
            setGiftFor(null);
            void mutate();
          }}
        />
      )}
    </main>
  );
}

function GiftSheet({ child, onClose, onSent }: { child: GuestChild; onClose: () => void; onSent: () => void }) {
  const [amount, setAmount] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const [wishId, setWishId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const typed = custom.trim() ? parseKrToOre(custom) : null;
    const amountOre = typeof typed === "number" ? typed : amount !== null ? amount * 100 : null;
    if (typed === "invalid" || !amountOre) {
      setError("Velg et beløp.");
      return;
    }
    setSending(true);
    setError("");
    const res = await fetch("/api/guest/gift", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: child.id, amountOre, wishId, message }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (!res.ok) {
      setError(payload.error ?? "Det gikk ikke. Prøv igjen.");
      return;
    }
    onSent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Gave til ${child.name}`}
        className="animate-pop relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-card p-6 text-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Lukk" className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-xl border border-border hover:bg-secondary">
          <X className="size-6" />
        </button>
        <h2 className="pr-14 text-3xl font-extrabold tracking-tight">Gave til {child.name} 🎁</h2>

        <p className="mt-5 font-bold">Hvor mye?</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {AMOUNTS.map((kr) => (
            <button
              key={kr}
              type="button"
              aria-pressed={!custom && amount === kr}
              onClick={() => {
                setAmount(kr);
                setCustom("");
              }}
              className={`font-num min-h-16 rounded-2xl text-2xl font-bold transition ${!custom && amount === kr ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
            >
              {kr} kr
            </button>
          ))}
        </div>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          inputMode="decimal"
          placeholder="Annet beløp (kr)"
          className="mt-3 min-h-14 w-full rounded-2xl border border-border bg-card px-4 text-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />

        {child.wishes.length > 0 && (
          <>
            <p className="mt-5 font-bold">Til et ønske? <span className="font-normal text-muted-foreground">(valgfritt)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {child.wishes.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  aria-pressed={wishId === w.id}
                  onClick={() => setWishId(wishId === w.id ? null : w.id)}
                  className={`min-h-12 rounded-full px-4 font-semibold transition ${wishId === w.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                >
                  {w.emoji ?? "🎁"} {w.title}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="mt-5 font-bold">Hilsen <span className="font-normal text-muted-foreground">(valgfritt)</span></p>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={60}
          placeholder="F.eks. Godt jobba! Klem fra mormor"
          className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-card px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />

        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-800">{error}</p>}

        <button
          type="button"
          disabled={sending}
          onClick={() => void send()}
          className="mt-6 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
        >
          <Heart className="size-6" /> {sending ? "Sender…" : "Send gaven"}
        </button>
        <p className="mt-3 text-center text-base text-muted-foreground">
          Send pengene til foreldrene (f.eks. Vipps). De legger gaven til når de har fått dem.
        </p>
      </div>
    </div>
  );
}

// Kort forklaring på hvordan siden legges på hjemskjermen, så den åpnes som en
// app uten innlogging. Kan lukkes.
function AddToHomeHint() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-secondary p-4 text-base">
      <Share className="mt-0.5 size-6 shrink-0 text-primary" />
      <p className="flex-1">
        <strong>Tips:</strong> Trykk på <strong>Del</strong>-knappen og velg <strong>«Legg til på Hjem-skjerm»</strong>. Da ligger Ukepenger som en app på
        telefonen, og du slipper å logge inn.
      </p>
      <button type="button" onClick={() => setHidden(true)} aria-label="Skjul tips" className="flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-card">
        <X className="size-5" />
      </button>
    </div>
  );
}
