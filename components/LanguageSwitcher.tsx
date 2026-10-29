"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { LANGS } from "@/lib/i18n";
import { setLang, useLang } from "@/lib/use-lang";
import { cx, focusRing } from "@/components/ui";

// Språkknapp for de voksne (flagg). Gjelder forsiden, innlogging og
// foreldredelen. Barnas språk velges per barn i foreldredelen.
export function LanguageSwitcher({ className, align = "right", full = false }: { className?: string; align?: "left" | "right"; full?: boolean }) {
  const lang = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Språk / Language / Мова: ${current.label}`}
        className={cx(
          "inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition hover:bg-black/5",
          full && "w-full justify-between border border-border bg-card px-3 py-2",
          focusRing
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none" aria-hidden="true">
            {current.flag}
          </span>
          {full && current.label}
        </span>
        <ChevronDown className={cx("size-4 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Språk"
          className={cx("z-50 mt-1 min-w-44 rounded-2xl border border-border bg-card p-1", full ? "w-full" : cx("absolute shadow-xl", align === "right" ? "right-0" : "left-0"))}
        >
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                  // Sider som lages på serveren (f.eks. personvern) hentes på nytt.
                  router.refresh();
                }}
                className={cx("flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left font-semibold hover:bg-secondary", focusRing)}
              >
                <span className="text-lg" aria-hidden="true">
                  {l.flag}
                </span>
                <span className="flex-1">{l.label}</span>
                {l.code === lang && <Check className="size-4 text-primary" strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
