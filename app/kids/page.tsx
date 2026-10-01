"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Coins, ShoppingBag, X } from "lucide-react";
import { getAvatarByKey } from "@/lib/avatars";
import { kidColor } from "./_lib/palette";

type ChildRow = {
  id: string;
  name: string;
  avatar_key: string | null;
  color?: string | null;
};

const PRICE_OPTIONS = [
  { label: "5 kr", ore: 500 },
  { label: "10 kr", ore: 1000 },
  { label: "20 kr", ore: 2000 },
  { label: "30 kr", ore: 3000 },
  { label: "40 kr", ore: 4000 },
  { label: "50 kr", ore: 5000 },
];

type ButikkStep = "price" | "child";

export default function KidsPage() {
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [butikkOpen, setButikkOpen] = useState(false);
  const [butikkStep, setButikkStep] = useState<ButikkStep>("price");
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [butikkLoading, setButikkLoading] = useState(false);
  const [butikkStatus, setButikkStatus] = useState("");

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/kids/bootstrap", {
        method: "GET",
        credentials: "include",
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; children?: ChildRow[] };

      if (!res.ok || payload.error) {
        setError(payload.error ?? "Kiosk-session mangler eller er ugyldig.");
        setLoading(false);
        return;
      }

      setChildren(payload.children ?? []);
      setLoading(false);
    };

    void run();
  }, []);

  const openButikk = () => {
    setButikkOpen(true);
    setButikkStep("price");
    setSelectedPrice(null);
    setButikkStatus("");
  };

  const closeButikk = () => {
    if (butikkLoading) return;
    setButikkOpen(false);
  };

  const selectPrice = (ore: number) => {
    setSelectedPrice(ore);
    setButikkStep("child");
    setButikkStatus("");
  };

  const registerSale = async (childId: string) => {
    if (!selectedPrice) return;
    setButikkLoading(true);
    setButikkStatus("");

    const res = await fetch("/api/kids/butikk", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, amountOre: selectedPrice }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
    setButikkLoading(false);

    if (!res.ok || payload.error) {
      setButikkStatus(`Feil: ${payload.error ?? "Noe gikk galt."}`);
      return;
    }

    const child = children.find((c) => c.id === childId);
    const priceLabel = PRICE_OPTIONS.find((p) => p.ore === selectedPrice)?.label ?? "";
    setButikkStatus(`${priceLabel} lagt til ${child?.name ?? "barnet"}!`);

    setTimeout(() => {
      setButikkOpen(false);
      setButikkStatus("");
    }, 1500);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Coins className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-num text-[17px] font-bold tracking-[-0.06em]">ukepenger</span>
      </div>

      <h1 className="mt-10 text-4xl font-extrabold tracking-tight sm:text-5xl">Hvem er du?</h1>
      <p className="mt-2 text-lg text-muted-foreground">Trykk på deg selv for å se oppgavene dine.</p>

      {loading && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[1.75rem] bg-secondary" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
          <p className="text-lg font-bold">Denne enheten er ikke koblet til en familie</p>
          <p className="mt-1 text-muted-foreground">Be en voksen skanne QR-koden fra Enheter i admin.</p>
          <p className="mt-3 text-sm text-muted-foreground">({error})</p>
          <Link href="/kiosk" className="mt-4 inline-flex font-semibold text-primary underline underline-offset-4">
            Gå til kiosk
          </Link>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child, index) => {
            const avatar = getAvatarByKey(child.avatar_key);
            const color = kidColor(index);
            return (
              <Link
                key={child.id}
                href={`/kids/${child.id}`}
                className="animate-pop group flex min-h-44 flex-col justify-between rounded-[1.75rem] p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                style={{ background: color.bg, color: color.ink }}
              >
                <span className="flex size-20 items-center justify-center rounded-full bg-white/85 text-5xl shadow-sm">
                  {avatar.emoji}
                </span>
                <span className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-3xl font-extrabold tracking-tight">{child.name}</span>
                  <ChevronRight className="size-7 shrink-0 transition group-hover:translate-x-1" strokeWidth={2.5} />
                </span>
              </Link>
            );
          })}

          {children.length > 0 && (
            <button
              type="button"
              onClick={openButikk}
              className="group flex min-h-44 flex-col justify-between rounded-[1.75rem] border-2 border-dashed border-border bg-card/60 p-6 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-lg active:scale-[0.98]"
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-secondary text-primary">
                <ShoppingBag className="size-9" strokeWidth={2} />
              </span>
              <span className="mt-4">
                <span className="block text-3xl font-extrabold tracking-tight">Butikk</span>
                <span className="text-sm font-semibold text-muted-foreground">Registrer et salg</span>
              </span>
            </button>
          )}
        </div>
      )}

      {!loading && !error && children.length === 0 && (
        <div className="mt-8 rounded-[1.75rem] border border-border bg-card p-8 text-center text-muted-foreground">
          Ingen aktive barn ennå. En voksen kan legge til barn i admin.
        </div>
      )}

      {butikkOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={closeButikk}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="butikk-title"
            className="animate-pop w-full max-w-md rounded-[1.75rem] bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="butikk-title" className="text-2xl font-extrabold tracking-tight">
                  Butikk
                </h2>
                <p className="mt-0.5 text-muted-foreground">{butikkStep === "price" ? "Hvor mye solgte du for?" : "Hvem solgte?"}</p>
              </div>
              <button
                type="button"
                onClick={closeButikk}
                disabled={butikkLoading}
                aria-label="Lukk"
                className="flex size-11 items-center justify-center rounded-xl border border-border transition hover:bg-secondary disabled:opacity-40"
              >
                <X className="size-5" />
              </button>
            </div>

            {butikkStep === "price" && (
              <div className="grid grid-cols-3 gap-3">
                {PRICE_OPTIONS.map((option) => (
                  <button
                    key={option.ore}
                    type="button"
                    onClick={() => selectPrice(option.ore)}
                    className="font-num rounded-2xl bg-secondary py-5 text-xl font-bold transition hover:bg-accent active:scale-95"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {butikkStep === "child" && (
              <div className="max-h-80 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setButikkStep("price");
                    setButikkStatus("");
                  }}
                  className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> Endre beløp ({PRICE_OPTIONS.find((p) => p.ore === selectedPrice)?.label})
                </button>
                <div className="grid grid-cols-2 gap-3">
                  {children.map((child, index) => {
                    const avatar = getAvatarByKey(child.avatar_key);
                    const color = kidColor(index);
                    return (
                      <button
                        key={child.id}
                        type="button"
                        disabled={butikkLoading}
                        onClick={() => void registerSale(child.id)}
                        className="rounded-2xl p-4 text-left transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ background: color.bg, color: color.ink }}
                      >
                        <span className="text-3xl">{avatar.emoji}</span>
                        <span className="mt-1 block text-lg font-extrabold">{child.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {butikkStatus && (
              <p
                role="status"
                className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                  butikkStatus.startsWith("Feil:") ? "bg-red-50 text-red-800" : "bg-secondary text-primary"
                }`}
              >
                {butikkStatus}
              </p>
            )}

            {butikkLoading && <p className="mt-4 text-center text-sm text-muted-foreground">Registrerer…</p>}
          </div>
        </div>
      )}
    </main>
  );
}
