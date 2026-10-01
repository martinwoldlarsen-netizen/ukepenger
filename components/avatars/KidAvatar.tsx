import { getFigure } from "./figures";
import { getAvatarByKey } from "@/lib/avatars";

// Viser barnets figur. Nye figurer tegnes som SVG; barn som fortsatt har en
// av de gamle emoji-figurene får den vist i en sirkel, til de velger ny.
export function KidAvatar({
  avatarKey,
  size = 48,
  className,
  title,
}: {
  avatarKey?: string | null;
  size?: number;
  className?: string;
  title?: string;
}) {
  const figure = getFigure(avatarKey);
  if (figure) {
    return (
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className={className}
        role="img"
        aria-label={title ?? figure.label}
        style={{ flexShrink: 0, borderRadius: "9999px" }}
      >
        <circle cx={60} cy={60} r={60} fill={figure.bg} />
        {figure.art}
      </svg>
    );
  }
  const legacy = getAvatarByKey(avatarKey);
  return (
    <span
      role="img"
      aria-label={title ?? legacy.label}
      className={className}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        flexShrink: 0,
        borderRadius: "9999px",
        background: "rgb(255 255 255 / 0.85)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {legacy.emoji}
    </span>
  );
}
