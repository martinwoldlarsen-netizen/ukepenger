import { useId } from "react";
import { TASK_ART, taskArtKey } from "./task-art";
import { taskEmoji } from "@/lib/task-emoji";

// Bildet for en oppgave: egen illustrasjon når vi har en, ellers emoji i en
// hvit boks. Samme størrelse og form i begge tilfeller. Har forelderen valgt
// et bilde selv («icon»: navn på en illustrasjon eller en emoji), brukes det;
// ellers gjettes bildet ut fra navnet.
export function TaskIcon({ title, icon, size = 48, className, muted }: { title: string; icon?: string | null; size?: number; className?: string; muted?: boolean }) {
  const chosenArt = icon && TASK_ART[icon] ? icon : null;
  const chosenEmoji = icon && !chosenArt ? icon : null;
  const key = chosenEmoji ? null : (chosenArt ?? taskArtKey(title));
  const art = key ? TASK_ART[key] : null;
  // Egen id per bilde: like id-er på mange SVG-er på samme side gir feil og ekstra arbeid i Safari.
  const clipId = `uk-task-clip-${useId().replace(/:/g, "")}`;
  const radius = Math.round(size * 0.28);
  const style = { width: size, height: size, borderRadius: radius, flexShrink: 0, ...(muted ? { opacity: 0.4, filter: "grayscale(1)" } : {}) };
  if (art) {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} className={className} style={style} aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect width={120} height={120} rx={30} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width={120} height={120} fill={art.bg} />
          {art.art}
        </g>
      </svg>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ ...style, fontSize: size * 0.55, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgb(255 255 255 / 0.85)" }}
    >
      {chosenEmoji ?? taskEmoji(title)}
    </span>
  );
}
