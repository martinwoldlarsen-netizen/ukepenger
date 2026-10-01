// Barnevennlig beløpsvisning: "25 kr" for hele kroner, "25,50 kr" ellers.
export function formatKr(ore: number) {
  const kr = ore / 100;
  const hasOre = Math.round(ore) % 100 !== 0;
  return `${kr.toLocaleString("nb-NO", {
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
