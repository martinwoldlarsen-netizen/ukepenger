"use client";

import { useEffect, useState } from "react";
import { Check, Compass, Copy } from "lucide-react";
import { inAppBrowserName } from "@/lib/in-app-browser";
import { externalUrl, outsideLink, platform } from "@/lib/open-outside";

// Vises bare inne i Messenger, Facebook o.l.: knapper som åpner siden i
// Safari/Chrome (med besteforelder-tilgangen på lasset), og «Kopier lenken»
// som reserve hvis telefonen ikke lar knappen åpne nettleseren.
export function OpenOutsideCard({
  guest,
  profile,
  path,
  text,
  className = "",
}: {
  guest?: boolean;
  profile?: boolean;
  path?: string;
  text?: string;
  className?: string;
}) {
  const [inApp] = useState(() => inAppBrowserName());
  const [p] = useState(() => platform());
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Legg overleveringen i adresselinjen også, så «••• → Åpne i Safari» i
  // Messenger tar med tilgangen (ikke bare knappene her).
  useEffect(() => {
    if (!inApp || !guest) return;
    let alive = true;
    void outsideLink({ guest, profile, path }).then((url) => {
      if (alive && url.includes("/besteforeldre/koble?h=")) window.history.replaceState(window.history.state, "", url);
    });
    return () => {
      alive = false;
    };
  }, [inApp, guest, profile, path]);

  if (!inApp) return null;

  const open = async (target: "default" | "chrome") => {
    setBusy(true);
    const url = await outsideLink({ guest, profile, path });
    setBusy(false);
    window.location.assign(externalUrl(url, target));
  };

  const copy = async () => {
    const url = await outsideLink({ guest, profile, path });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Kopier lenken:", url);
    }
  };

  const main = p === "ios" ? "Åpne i Safari" : p === "android" ? "Åpne i nettleseren" : "Åpne i nettleseren";

  return (
    <div className={`rounded-2xl border-2 border-primary/30 bg-card p-4 text-base shadow-sm ${className}`}>
      <p className="font-semibold">
        Du er inne i <strong>{inApp}</strong>.{" "}
        {text ?? "Åpne siden i nettleseren din, så kan du logge inn med Google og legge Ukepenger på hjemskjermen."}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void open("default")}
        className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground shadow-sm active:scale-[0.98] disabled:opacity-60"
      >
        <Compass className="size-5" /> {busy ? "Åpner …" : main}
      </button>
      {p !== "other" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void open("chrome")}
          className="mt-2 min-h-12 w-full rounded-2xl bg-secondary font-bold active:scale-[0.98] disabled:opacity-60"
        >
          Åpne i Chrome
        </button>
      )}
      <button type="button" onClick={() => void copy()} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-muted-foreground">
        {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        {copied ? "Kopiert – lim inn i Safari eller Chrome" : "Kopier lenken"}
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        Virker ikke knappen? Trykk <strong>•••</strong> øverst til høyre og velg «Åpne i {p === "ios" ? "Safari" : "nettleser"}».
      </p>
    </div>
  );
}
