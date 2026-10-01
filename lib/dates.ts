// Vennlige tidspunkter: "i dag 15:17", "i går 09:02", "man. 28. sep." og
// "28. sep. 2025" for tidligere år.
const time = new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", minute: "2-digit" });
const dayMonth = new Intl.DateTimeFormat("nb-NO", { weekday: "short", day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short", year: "numeric" });

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatWhen(value: string | Date | null | undefined, now: Date = new Date()) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff === 0) return `i dag ${time.format(date)}`;
  if (dayDiff === 1) return `i går ${time.format(date)}`;
  if (date.getFullYear() === now.getFullYear()) return dayMonth.format(date);
  return dayMonthYear.format(date);
}
