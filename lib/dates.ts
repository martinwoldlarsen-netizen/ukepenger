// Vennlige tidspunkter: "i dag 15:17", "i går 09:02", "man. 28. sep." og
// "28. sep. 2025" for tidligere år. Norsk er standard; barnesiden kan be om
// engelsk eller ukrainsk.
import { type Lang, localeOf } from "@/lib/i18n";

const WORDS: Record<Lang, { today: string; yesterday: string }> = {
  nb: { today: "i dag", yesterday: "i går" },
  en: { today: "today", yesterday: "yesterday" },
  uk: { today: "сьогодні", yesterday: "учора" },
};

const formats = new Map<Lang, { time: Intl.DateTimeFormat; dayMonth: Intl.DateTimeFormat; dayMonthYear: Intl.DateTimeFormat }>();
function fmt(lang: Lang) {
  let f = formats.get(lang);
  if (!f) {
    const loc = localeOf(lang);
    f = {
      time: new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit" }),
      dayMonth: new Intl.DateTimeFormat(loc, { weekday: "short", day: "numeric", month: "short" }),
      dayMonthYear: new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }),
    };
    formats.set(lang, f);
  }
  return f;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function formatWhen(value: string | Date | null | undefined, now: Date = new Date(), lang: Lang = "nb") {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const f = fmt(lang);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff === 0) return `${WORDS[lang].today} ${f.time.format(date)}`;
  if (dayDiff === 1) return `${WORDS[lang].yesterday} ${f.time.format(date)}`;
  if (date.getFullYear() === now.getFullYear()) return f.dayMonth.format(date);
  return f.dayMonthYear.format(date);
}
