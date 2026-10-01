"use client";

import { FIGURES, type FigureGroup } from "./figures";
import { KidAvatar } from "./KidAvatar";

const GROUPS: Array<{ group: FigureGroup; title: string }> = [
  { group: "cute", title: "Søte" },
  { group: "cool", title: "Tøffe" },
];

// Rutenett med alle figurene, delt i søte og tøffe. Brukes både av barna
// (store ruter) og av de voksne (mindre ruter).
export function FigurePicker({
  value,
  onChange,
  size = "md",
  disabled = false,
}: {
  value?: string | null;
  onChange: (key: string) => void;
  size?: "md" | "lg";
  disabled?: boolean;
}) {
  const px = size === "lg" ? 76 : 52;
  return (
    <div className="space-y-4">
      {GROUPS.map(({ group, title }) => (
        <div key={group}>
          <p className="mb-2 text-sm font-bold text-muted-foreground">{title}</p>
          <div
            role="radiogroup"
            aria-label={`${title} figurer`}
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
                  <span className={`truncate font-semibold ${size === "lg" ? "text-sm" : "text-[11px]"}`}>{figure.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
