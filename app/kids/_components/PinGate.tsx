"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Delete } from "lucide-react";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { asLang } from "@/lib/i18n";
import { type ChildRow, KIDS_BOOTSTRAP_KEY, fetchKidsBootstrap, getPinTicket, setPinTicket } from "../_lib/kid-data";
import { kidText } from "../_lib/text";

// Sperre foran barnets sider når barnet har kode: ingenting av barnets data
// vises før koden er riktig. Koden sjekkes på serveren (/api/kids/pin), som
// gir en billett resten av barnesidens kall sender med.
export function PinGate({ childId, children }: { childId: string; children: React.ReactNode }) {
  const boot = useSWR<ChildRow[], Error>(KIDS_BOOTSTRAP_KEY, fetchKidsBootstrap, { revalidateOnFocus: false, shouldRetryOnError: false });
  const [open, setOpen] = useState(() => Boolean(getPinTicket(childId)));
  const child = boot.data?.find((c) => c.id === childId);

  if (open || boot.error) return <>{children}</>;
  if (!boot.data) return <main className="min-h-screen" aria-busy="true" />;
  // Ukjent barn (f.eks. skjult her) eller uten kode: siden viser selv riktig melding.
  if (!child?.has_pin) return <>{children}</>;
  return <PinPad child={child} onOpen={() => setOpen(true)} />;
}

function PinPad({ child, onOpen }: { child: ChildRow; onOpen: () => void }) {
  const lang = asLang(child.language);
  const t = kidText(lang);
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const press = async (d: string) => {
    if (busy || digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError("");
    if (next.length < 4) return;
    setBusy(true);
    const res = await fetch("/api/kids/pin", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: child.id, pin: next }),
    }).catch(() => null);
    const payload = res ? ((await res.json().catch(() => ({}))) as { ticket?: string | null; locked?: boolean }) : {};
    setBusy(false);
    if (res?.ok) {
      setPinTicket(child.id, payload.ticket ?? null);
      onOpen();
      return;
    }
    setDigits("");
    setError(payload.locked ? t.pinLocked : t.pinWrong);
  };

  return (
    <main lang={lang} className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-5 py-10 text-center">
      <span className="rounded-full bg-white/70 p-1 shadow-sm">
        <KidAvatar avatarKey={child.avatar_key} size={96} />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{t.pinTitle(child.name)}</h1>
      <div className={`mt-6 flex gap-3 ${error ? "animate-pop" : ""}`} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-5 rounded-full border-2 border-primary transition ${i < digits.length ? "bg-primary" : "bg-transparent"}`} />
        ))}
      </div>
      <p role="status" className="mt-3 min-h-6 text-base font-semibold text-red-700">
        {error}
      </p>
      <div className="mt-2 grid w-full grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PadKey key={d} label={t.pinDigit(Number(d))} onClick={() => void press(d)} disabled={busy}>
            {d}
          </PadKey>
        ))}
        <span />
        <PadKey label={t.pinDigit(0)} onClick={() => void press("0")} disabled={busy}>
          0
        </PadKey>
        <PadKey label={t.pinDelete} onClick={() => setDigits((v) => v.slice(0, -1))} disabled={busy || digits.length === 0}>
          <Delete className="size-7" />
        </PadKey>
      </div>
      {!child.personal && (
        <Link href="/kids" className="mt-8 font-semibold text-muted-foreground underline underline-offset-4">
          {t.pinNotMe}
        </Link>
      )}
    </main>
  );
}

function PadKey({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="font-num flex aspect-square max-h-24 items-center justify-center rounded-3xl bg-card text-3xl font-bold shadow-sm ring-1 ring-border transition active:scale-95 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
