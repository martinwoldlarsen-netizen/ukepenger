"use client";

import type { Lang } from "@/lib/i18n";
import { FIGURES, type FigureGroup } from "./figures";
import { KidAvatar } from "./KidAvatar";

const GROUPS: Record<Lang, Array<{ group: FigureGroup; title: string }>> = {
  nb: [
    { group: "cute", title: "Søte" },
    { group: "cool", title: "Tøffe" },
  ],
  en: [
    { group: "cute", title: "Cute" },
    { group: "cool", title: "Cool" },
  ],
  uk: [
    { group: "cute", title: "Милі" },
    { group: "cool", title: "Круті" },
  ],
};

// Figurnavn på barnets språk (norsk navn er standard).
const NAMES: Record<"en" | "uk", Record<string, string>> = {
  en: {
    skyvalp: "Cloud pup", gnist: "Spark", kvakk: "Quack", pusi: "Kitty", bobble: "Bubble", fersken: "Peach", mochi: "Mochi", hubro: "Owl",
    baerbjorn: "Berry bear", spokis: "Ghosty", raptor: "Raptor", ninja: "Ninja", drage: "Dragon", robot: "Robot", hai: "Shark", ulv: "Wolf",
    astronaut: "Astronaut", ridder: "Knight", pirat: "Pirate", kulpanda: "Cool panda",
  },
  uk: {
    skyvalp: "Хмаринка", gnist: "Іскорка", kvakk: "Кря", pusi: "Киця", bobble: "Бульбашка", fersken: "Персик", mochi: "Моті", hubro: "Сова",
    baerbjorn: "Ягідний ведмідь", spokis: "Привидик", raptor: "Раптор", ninja: "Ніндзя", drage: "Дракон", robot: "Робот", hai: "Акула", ulv: "Вовк",
    astronaut: "Астронавт", ridder: "Лицар", pirat: "Пірат", kulpanda: "Крута панда",
  },
};

// Rutenett med alle figurene, delt i søte og tøffe. Brukes både av barna
// (store ruter) og av de voksne (mindre ruter).
export function FigurePicker({
  value,
  onChange,
  size = "md",
  disabled = false,
  lang = "nb",
}: {
  value?: string | null;
  onChange: (key: string) => void;
  size?: "md" | "lg";
  disabled?: boolean;
  lang?: Lang;
}) {
  const px = size === "lg" ? 76 : 52;
  return (
    <div className="space-y-4">
      {GROUPS[lang].map(({ group, title }) => (
        <div key={group}>
          <p className="mb-2 text-sm font-bold text-muted-foreground">{title}</p>
          <div
            role="radiogroup"
            aria-label={title}
            className={size === "lg" ? "grid grid-cols-3 gap-3 sm:grid-cols-5" : "grid grid-cols-5 gap-2"}
          >
            {FIGURES.filter((f) => f.group === group).map((figure) => {
              const selected = value === figure.key;
              return (
                <button
                  key={figure.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange(figure.key)}
                  className={`flex flex-col items-center gap-1 rounded-2xl p-1.5 transition active:scale-95 disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    selected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-secondary"
                  }`}
                >
                  <KidAvatar avatarKey={figure.key} size={px} />
                  <span className={`truncate font-semibold ${size === "lg" ? "text-sm" : "text-[11px]"}`}>{lang === "nb" ? figure.label : (NAMES[lang][figure.key] ?? figure.label)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
