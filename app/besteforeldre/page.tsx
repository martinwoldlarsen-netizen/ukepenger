"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { Check, Coins, Copy, Gift, Heart, Share, UserRound, X } from "lucide-react";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { getFigure } from "@/components/avatars/figures";
import { rememberPendingGuest } from "@/lib/after-auth";
import { OpenOutsideCard } from "@/components/OpenOutsideCard";
import { inAppBrowserName } from "@/lib/in-app-browser";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

type GuestWish = { id: string; title: string; emoji: string | null; price_ore: number | null; approved: boolean };
type GuestChild = { id: string; name: string; avatar_key: string | null; due_ore: number; saved_ore: number | null; wishes: GuestWish[] };
type Recipient = { id: string; name: string; phone: string };
type Overview = {
  guestId: string;
  guestName: string;
  familyName: string | null;
  linked: boolean;
  families: { guestId: string; familyName: string | null }[];
  recipients: Recipient[];
  children: GuestChild[];
};

const AMOUNTS = [50, 100, 200, 500];
const FAMILY_KEY = "uk_guest_family";
const WELCOME_KEY = "uk_guest_welcome_seen";

function readLocal(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // privat modus
  }
}

// Besteforeldre kan komme inn med lenke-cookien, en innlogget profil, eller begge.
async function guestHeaders(guestId?: string | null): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  if (guestId) headers["x-guest-id"] = guestId;
  return headers;
}

async function fetchOverview([, guestId]: [string, string | null]): Promise<Overview & { signedIn: boolean }> {
  const headers = await guestHeaders(guestId);
  const res = await fetch("/api/guest/overview", { credentials: "include", headers });
  const payload = (await res.json().catch(() => ({}))) as Overview & { error?: string };
  if (!res.ok) throw Object.assign(new Error(payload.error ?? "Feil"), { status: res.status, signedIn: Boolean(headers.Authorization) });
  return { ...payload, signedIn: Boolean(headers.Authorization) };
}

export default function GrandparentPage() {
  return (
    <Suspense>
      <GrandparentInner />
    </Suspense>
  );
}

function GrandparentInner() {
  const params = useSearchParams();
  const linkError = params.get("feil") === "lenke";
  const profileMade = params.get("profil") === "ok";
  const [familyPick, setFamilyPick] = useState<string | null>(() => readLocal(FAMILY_KEY));
  const { data, error, mutate } = useSWR(["guest-overview", familyPick] as [string, string | null], fetchOverview, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const [giftFor, setGiftFor] = useState<GuestChild | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [welcomeSeen, setWelcomeSeen] = useState(() => readLocal(WELCOME_KEY) === "1");

  const notConnected = (linkError && !data) || (error && (error as { status?: number }).status === 401);
  const signedInWithoutAccess = Boolean(error && (error as { signedIn?: boolean }).signedIn);

  const makeProfile = () => {
    writeLocal(WELCOME_KEY, "1");
    rememberPendingGuest();
    window.location.href = "/besteforeldre/bli-med";
  };
  const skipProfile = () => {
    writeLocal(WELCOME_KEY, "1");
    setWelcomeSeen(true);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Første gang med lenke: velg om du vil lage profil eller bare fortsette.
  if (data && !data.linked && !data.signedIn && !welcomeSeen) {
    return <WelcomeChoice name={data.guestName} familyName={data.familyName} onMakeProfile={makeProfile} onSkip={skipProfile} />;
  }

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
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{signedInWithoutAccess ? "Ingen familie ennå" : "Lenken virker ikke"}</h1>
          <p className="mt-2 text-muted-foreground">
            {signedInWithoutAccess
              ? "Profilen din er ikke koblet til en familie. Be foreldrene sende deg en besteforelder-lenke, og åpne den her."
              : "Be foreldrene sende deg en ny lenke fra Ukepenger."}
          </p>
          {signedInWithoutAccess ? (
            <button type="button" onClick={() => void signOut()} className="mt-6 min-h-14 w-full rounded-2xl bg-secondary font-bold">
              Logg ut
            </button>
          ) : (
            <Link href="/login" className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary font-bold">
              <UserRound className="size-5" /> Har du profil? Logg inn
            </Link>
          )}
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

          {profileMade && data.linked && (
            <p className="animate-pop mt-6 rounded-2xl bg-accent px-5 py-4 font-bold text-accent-foreground">
              Profilen din er klar ✓ Neste gang logger du bare inn på ukepenger.no.
            </p>
          )}

          {data.families.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Velg familie">
              {data.families.map((f) => (
                <button
                  key={f.guestId}
                  type="button"
                  aria-pressed={f.guestId === data.guestId}
                  onClick={() => {
                    writeLocal(FAMILY_KEY, f.guestId);
                    setFamilyPick(f.guestId);
                  }}
                  className={`min-h-12 rounded-full px-5 font-bold transition ${f.guestId === data.guestId ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                >
                  {f.familyName ?? "Familie"}
                </button>
              ))}
            </div>
          )}

          <StartHint linked={data.linked} signedIn={data.signedIn} onMakeProfile={makeProfile} />

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

          <div className="mt-10 border-t border-border pt-6 text-center text-base text-muted-foreground">
            {data.signedIn ? (
              <button type="button" onClick={() => void signOut()} className="underline">
                Logg ut
              </button>
            ) : !data.linked ? (
              <button type="button" onClick={makeProfile} className="font-semibold text-primary underline">
                Lag profil, så finner du alltid tilbake
              </button>
            ) : null}
          </div>
        </>
      )}

      {giftFor && (
        <GiftSheet
          child={giftFor}
          guestId={data?.guestId ?? null}
          recipients={data?.recipients ?? []}
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

function GiftSheet({
  child,
  guestId,
  recipients,
  onClose,
  onSent,
}: {
  child: GuestChild;
  guestId: string | null;
  recipients: Recipient[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [amount, setAmount] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const [wishId, setWishId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [recipientId, setRecipientId] = useState<string | null>(recipients.length === 1 ? recipients[0].id : null);
  const [step, setStep] = useState<"choose" | "vipps">("choose");
  const [inApp] = useState(() => inAppBrowserName());
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const typed = custom.trim() ? parseKrToOre(custom) : null;
  const amountOre = typeof typed === "number" ? typed : amount !== null && !custom.trim() ? amount * 100 : null;
  const recipient = recipients.find((r) => r.id === recipientId) ?? null;
  const useVipps = recipients.length > 0;

  const next = () => {
    if (typed === "invalid" || !amountOre) {
      setError("Velg et beløp.");
      return;
    }
    if (useVipps && !recipient) {
      setError("Velg hvem som skal få pengene.");
      return;
    }
    setError("");
    if (useVipps) setStep("vipps");
    else void send();
  };

  const copyNumber = async () => {
    if (!recipient) return;
    try {
      await navigator.clipboard.writeText(recipient.phone);
      setCopied(true);
    } catch {
      // Ikke støttet: nummeret står uansett stort på skjermen.
    }
  };

  // Vipps lar ikke andre apper fylle inn mottaker og beløp for vanlige
  // personer (lenker i QR-format avvises med «Vi kjenner ikke denne
  // QR-koden»). Vi kopierer nummeret og åpner Vipps; beløpet står stort her.
  const openVipps = async () => {
    await copyNumber();
    window.location.assign("vipps://");
  };

  const send = async () => {
    if (!amountOre) return;
    setSending(true);
    setError("");
    const headers = { "Content-Type": "application/json", ...(await guestHeaders(guestId)) };
    const res = await fetch("/api/guest/gift", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ childId: child.id, amountOre, wishId, message, recipientId: recipient?.id ?? null }),
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

        {step === "vipps" && recipient && amountOre ? (
          <>
            <h2 className="pr-14 text-3xl font-extrabold tracking-tight">Send med Vipps</h2>
            <div className="mt-5 rounded-[1.5rem] bg-[#ff5b24]/10 p-5 text-center">
              <p className="font-semibold text-muted-foreground">Send</p>
              <p className="font-num text-5xl font-extrabold">{formatKr(amountOre)}</p>
              <p className="mt-2 font-semibold text-muted-foreground">til {recipient.name}</p>
              <p className="font-num mt-1 text-3xl font-bold tracking-wider">
                {recipient.phone.replace(/(\d{3})(\d{2})(\d{3})/, "$1 $2 $3")}
              </p>
              <button type="button" onClick={() => void copyNumber()} className="mx-auto mt-3 flex min-h-12 items-center gap-2 rounded-full bg-card px-5 font-bold shadow-sm">
                {copied ? <Check className="size-5 text-primary" /> : <Copy className="size-5" />} {copied ? "Nummeret er kopiert" : "Kopier nummeret"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void openVipps()}
              className="mt-5 flex min-h-16 w-full items-center justify-center rounded-2xl bg-[#ff5b24] text-xl font-extrabold text-white shadow-lg transition active:scale-[0.98]"
            >
              Åpne Vipps
            </button>
            <ol className="mt-4 list-decimal space-y-1 pl-6 text-base text-muted-foreground">
              <li>
                Trykk <strong>Send</strong> i Vipps og lim inn nummeret (det er kopiert).
              </li>
              <li>
                Skriv <strong>{formatKr(amountOre)}</strong> og send.
              </li>
              <li>Kom tilbake hit og trykk knappen under.</li>
            </ol>
            {inApp && <p className="mt-2 text-sm text-muted-foreground">Åpnes ikke Vipps? Åpne siden i Safari/Chrome først (knappen øverst på siden).</p>}

            {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-800">{error}</p>}

            <button
              type="button"
              disabled={sending}
              onClick={() => void send()}
              className="mt-6 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              <Heart className="size-6" /> {sending ? "Sender …" : "Jeg har sendt pengene"}
            </button>
            <button type="button" onClick={() => setStep("choose")} className="mt-3 w-full py-2 text-base font-semibold text-muted-foreground underline">
              Tilbake
            </button>
          </>
        ) : (
          <>
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
                <p className="mt-5 font-bold">
                  Til et ønske? <span className="font-normal text-muted-foreground">(valgfritt)</span>
                </p>
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

            <p className="mt-5 font-bold">
              Hilsen <span className="font-normal text-muted-foreground">(valgfritt)</span>
            </p>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={60}
              placeholder="F.eks. Godt jobba! Klem fra mormor"
              className="mt-2 min-h-14 w-full rounded-2xl border border-border bg-card px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />

            {useVipps && (
              <>
                <p className="mt-5 font-bold">Hvem skal få pengene på Vipps?</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {recipients.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={recipientId === r.id}
                      onClick={() => setRecipientId(r.id)}
                      className={`min-h-16 rounded-2xl px-3 text-xl font-bold transition ${recipientId === r.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-800">{error}</p>}

            <button
              type="button"
              disabled={sending}
              onClick={next}
              className="mt-6 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              <Heart className="size-6" /> {useVipps ? "Videre til Vipps" : sending ? "Sender …" : "Send gaven"}
            </button>
            {!useVipps && (
              <p className="mt-3 text-center text-base text-muted-foreground">
                Send pengene til foreldrene (f.eks. Vipps). De legger gaven til når de har fått dem.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Første gang lenken åpnes: lag profil (finner tilbake på alle enheter) eller
// bare fortsett med lenken på denne telefonen.
function WelcomeChoice({
  name,
  familyName,
  onMakeProfile,
  onSkip,
}: {
  name: string;
  familyName: string | null;
  onMakeProfile: () => void;
  onSkip: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 text-lg">
      <div className="text-center text-7xl" aria-hidden="true">👋</div>
      <h1 className="mt-4 text-center text-4xl font-extrabold tracking-tight">Hei, {name}!</h1>
      <p className="mt-3 text-center text-xl text-muted-foreground">
        Du er invitert til {familyName ? <strong>{familyName}</strong> : "familien"} på Ukepenger. Her ser du hva barnebarna sparer til, og kan gi dem en gave.
      </p>

      <OpenOutsideCard
        guest
        className="mt-6"
        text="Åpne siden i nettleseren først – da kan du lage profil med Google og legge Ukepenger på hjemskjermen."
      />

      <button
        type="button"
        onClick={onMakeProfile}
        className="mt-8 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-extrabold text-primary-foreground shadow-lg transition active:scale-[0.98]"
      >
        <UserRound className="size-6" /> Lag profil
      </button>
      <p className="mt-2 text-center text-base text-muted-foreground">Da finner du alltid tilbake – også på ny telefon eller PC.</p>

      <button type="button" onClick={onSkip} className="mt-6 min-h-16 w-full rounded-2xl bg-secondary text-xl font-bold transition active:scale-[0.98]">
        Fortsett uten profil
      </button>
      <p className="mt-2 text-center text-base text-muted-foreground">Du kan lage profil senere, nederst på siden.</p>
    </main>
  );
}

// Tipset øverst. Uten profil er «Lag profil» det viktigste: da finner de
// tilbake overalt. Med profil: legg siden på hjemskjermen som en app.
// Inne i Messenger o.l. finnes ikke hjemskjerm, og innloggingen blir
// liggende i den appen – da forklarer vi det.
function StartHint({ linked, signedIn, onMakeProfile }: { linked: boolean; signedIn: boolean; onMakeProfile: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [inApp] = useState(() => inAppBrowserName());
  if (hidden) return null;

  const close = (
    <button type="button" onClick={() => setHidden(true)} aria-label="Skjul tips" className="flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-card">
      <X className="size-5" />
    </button>
  );

  // Inne i Messenger o.l.: først ut til den vanlige nettleseren.
  if (inApp) {
    return (
      <div className="mt-6">
        <OpenOutsideCard
          guest
          text={
            linked
              ? "Åpne siden i nettleseren og logg inn med profilen din – der kan du legge Ukepenger på hjemskjermen."
              : "Åpne siden i nettleseren, så kan du lage profil med Google og legge Ukepenger på hjemskjermen."
          }
        />
        {!linked && (
          <button type="button" onClick={onMakeProfile} className="mt-2 w-full py-2 text-base font-semibold text-primary underline">
            Eller lag profil her med e-post
          </button>
        )}
      </div>
    );
  }

  if (!linked) {
    return (
      <div className="mt-6 rounded-2xl bg-accent p-4 text-base text-accent-foreground">
        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 size-6 shrink-0" />
          <p className="flex-1">
            <strong>Lag en profil</strong>, så finner du alltid tilbake: gå til <strong>ukepenger.no</strong> og logg inn – også på ny telefon eller PC.
          </p>
          {close}
        </div>
        <button type="button" onClick={onMakeProfile} className="mt-3 min-h-14 w-full rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground shadow-sm active:scale-[0.98]">
          Lag profil
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-secondary p-4 text-base">
      <Share className="mt-0.5 size-6 shrink-0 text-primary" />
      <p className="flex-1">
        <strong>Tips:</strong> Trykk på <strong>Del</strong>-knappen og velg <strong>«Legg til på Hjem-skjerm»</strong>. Da ligger Ukepenger som en app på
        telefonen.{signedIn ? " Første gang du åpner den, logger du inn." : ""}
      </p>
      {close}
    </div>
  );
}
