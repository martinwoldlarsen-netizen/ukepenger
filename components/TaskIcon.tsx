import { TASK_ART, taskArtKey } from "./task-art";
import { taskEmoji } from "@/lib/task-emoji";

// Bildet for en oppgave: egen illustrasjon når vi har en, ellers emoji i en
// hvit boks. Samme størrelse og form i begge tilfeller.
export function TaskIcon({ title, size = 48, className, muted }: { title: string; size?: number; className?: string; muted?: boolean }) {
  const key = taskArtKey(title);
  const art = key ? TASK_ART[key] : null;
  const radius = Math.round(size * 0.28);
  const style = { width: size, height: size, borderRadius: radius, flexShrink: 0, ...(muted ? { opacity: 0.4, filter: "grayscale(1)" } : {}) };
  if (art) {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} className={className} style={style} aria-hidden="true">
        <defs>
          <clipPath id="uk-task-clip">
            <rect width={120} height={120} rx={30} />
          </clipPath>
        </defs>
        <g clipPath="url(#uk-task-clip)">
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
      {taskEmoji(title)}
    </span>
  );
}
