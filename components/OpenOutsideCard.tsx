"use client";

import { useEffect, useState } from "react";
import { Check, Compass, Copy } from "lucide-react";
import { inAppBrowserName } from "@/lib/in-app-browser";
import { externalUrl, outsideLink, platform } from "@/lib/open-outside";
import { useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    copyPrompt: "Kopier lenken:",
    safari: "Åpne i Safari",
    browser: "Åpne i nettleseren",
    youAreIn: "Du er inne i",
    defaultText: "Åpne siden i nettleseren din, så kan du logge inn med Google og legge Ukepenger på hjemskjermen.",
    opening: "Åpner …",
    chrome: "Åpne i Chrome",
    copied: "Kopiert – lim inn i Safari eller Chrome",
    copy: "Kopier lenken",
    notWorking: "Virker ikke knappen? Trykk",
    choose: (b: string) => `øverst til høyre og velg «Åpne i ${b}».`,
    browserWord: "nettleser",
  },
  en: {
    copyPrompt: "Copy the link:",
    safari: "Open in Safari",
    browser: "Open in your browser",
    youAreIn: "You are inside",
    defaultText: "Open the page in your browser so you can sign in with Google and add Ukepenger to your home screen.",
    opening: "Opening …",
    chrome: "Open in Chrome",
    copied: "Copied – paste it into Safari or Chrome",
    copy: "Copy the link",
    notWorking: "Button not working? Tap",
    choose: (b: string) => `in the top right and choose “Open in ${b}”.`,
    browserWord: "browser",
  },
  uk: {
    copyPrompt: "Скопіюйте посилання:",
    safari: "Відкрити в Safari",
    browser: "Відкрити в браузері",
    youAreIn: "Ви зараз у",
    defaultText: "Відкрийте сторінку у своєму браузері, щоб увійти через Google і додати Ukepenger на головний екран.",
    opening: "Відкриваємо …",
    chrome: "Відкрити в Chrome",
    copied: "Скопійовано – вставте в Safari або Chrome",
    copy: "Скопіювати посилання",
    notWorking: "Кнопка не працює? Натисніть",
    choose: (b: string) => `угорі праворуч і виберіть «Відкрити в ${b}».`,
    browserWord: "браузері",
  },
};

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
  const t = useText(TEXT);
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
      window.prompt(t.copyPrompt, url);
    }
  };

  const main = p === "ios" ? t.safari : t.browser;

  return (
    <div className={`rounded-2xl border-2 border-primary/30 bg-card p-4 text-base shadow-sm ${className}`}>
      <p className="font-semibold">
        {t.youAreIn} <strong>{inApp}</strong>.{" "}
        {text ?? t.defaultText}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void open("default")}
        className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground shadow-sm active:scale-[0.98] disabled:opacity-60"
      >
        <Compass className="size-5" /> {busy ? t.opening : main}
      </button>
      {p !== "other" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void open("chrome")}
          className="mt-2 min-h-12 w-full rounded-2xl bg-secondary font-bold active:scale-[0.98] disabled:opacity-60"
        >
          {t.chrome}
        </button>
      )}
      <button type="button" onClick={() => void copy()} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-muted-foreground">
        {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        {copied ? t.copied : t.copy}
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.notWorking} <strong>•••</strong> {t.choose(p === "ios" ? "Safari" : t.browserWord)}
      </p>
    </div>
  );
}
