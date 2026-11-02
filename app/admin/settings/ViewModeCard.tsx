"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { Card, CardHeader, cx, focusRing } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { type UiMode, friendlyError, useUiMode } from "@/lib/admin-data";
import { useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    title: "Visning",
    desc: "Hvor mye appen viser deg. Gjelder bare deg – den andre forelderen velger selv. Det du har stilt inn, gjelder uansett.",
    modes: {
      simple: ["Enkel", "Det viktigste: oppgaver med pris, barn, krav og penger."],
      normal: ["Vanlig", "Også bilder og kategorier, språk og ønsker per barn, og trofébeløp."],
      full: ["Alt", "Alle detaljer: lønn per barn, oversettelser, trofénivåer og navn."],
    },
    saved: (name: string) => `Visning: ${name}`,
    failed: "Klarte ikke å lagre.",
  },
  en: {
    title: "View",
    desc: "How much the app shows you. It only applies to you – the other parent chooses their own. What you've set up still applies.",
    modes: {
      simple: ["Simple", "The essentials: tasks with prices, children, requests and money."],
      normal: ["Standard", "Also pictures and categories, language and wishes per child, and trophy amounts."],
      full: ["Everything", "Every detail: pay per child, translations, trophy levels and names."],
    },
    saved: (name: string) => `View: ${name}`,
    failed: "Couldn't save.",
  },
  uk: {
    title: "Вигляд",
    desc: "Скільки показує застосунок. Стосується лише вас – інший із батьків обирає сам. Усе, що ви налаштували, діє в будь-якому разі.",
    modes: {
      simple: ["Простий", "Найважливіше: завдання з ціною, діти, запити й гроші."],
      normal: ["Звичайний", "Також зображення й категорії, мова та бажання для кожної дитини, суми за трофеї."],
      full: ["Усе", "Усі деталі: оплата для кожної дитини, переклади, рівні й назви трофеїв."],
    },
    saved: (name: string) => `Вигляд: ${name}`,
    failed: "Не вдалося зберегти.",
  },
};

const ORDER: UiMode[] = ["simple", "normal", "full"];

// Enkel, Vanlig eller Alt. Lagres på forelderens profil, så valget følger med
// på alle enheter.
export function ViewModeCard() {
  const t = useText(TEXT);
  const toast = useToast();
  const { mode, setMode, loaded } = useUiMode();

  const choose = async (next: UiMode) => {
    if (next === mode) return;
    try {
      await setMode(next);
      toast({ text: t.saved(t.modes[next][0]) });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.failed) });
    }
  };

  return (
    <Card>
      <CardHeader icon={<SlidersHorizontal className="size-5" />} title={t.title} description={t.desc} />
      <div className="mt-4 space-y-2" role="radiogroup" aria-label={t.title}>
        {ORDER.map((m) => {
          const selected = loaded && mode === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => void choose(m)}
              className={cx(
                "flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition",
                selected ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "border-border bg-card hover:bg-secondary",
                focusRing
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{t.modes[m][0]}</span>
                <span className="block text-sm text-muted-foreground">{t.modes[m][1]}</span>
              </span>
              <span className={cx("flex size-6 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {selected && <Check className="size-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
