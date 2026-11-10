import { type Lang, localeOf } from "@/lib/i18n";

// Barnevennlig beløpsvisning: "25 kr" for hele kroner, "25,50 kr" ellers.
export function formatKr(ore: number, lang: Lang = "nb") {
  const kr = ore / 100;
  const hasOre = Math.round(ore) % 100 !== 0;
  return `${kr.toLocaleString(localeOf(lang), {
    minimumFractionDigits: hasOre ? 2 : 0,
    maximumFractionDigits: 2,
  })} kr`;
}

// Tolker "49", "49,50" og "49.50" fra et tekstfelt. Tomt felt gir null.
export function parseKrToOre(input: string): number | null | "invalid" {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return "invalid";
  return Math.round(value * 100);
}

// Delen av et krav som går til sparing: nærmeste hele krone, så barnet får
// hele kroner til gode. Samme regel som apply_claim_savings() i databasen.
export function savedPartOre(amountOre: number, percent: number) {
  if (!percent || percent <= 0) return 0;
  return Math.min(Math.round((amountOre * percent) / 100 / 100) * 100, amountOre);
}
