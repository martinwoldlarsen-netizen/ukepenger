// Kategorier og forslag i Ønskebutikken, så barnet kan finne ønsket sitt ved
// å trykke i stedet for å skrive. Prisene er omtrentlige forslag; barnet kan
// endre eller hoppe over prisen, og en voksen bestemmer endelig pris.

export type WishSuggestion = { title: string; kr: number | null; emoji: string };
export type WishCategory = { key: string; title: string; emoji: string; bg: string; items: WishSuggestion[] };

export const WISH_CATEGORIES: WishCategory[] = [
  {
    key: "bygg",
    title: "Byggesett",
    emoji: "🧱",
    bg: "oklch(0.92 0.07 25)",
    items: [
      { title: "Lite LEGO-sett", kr: 150, emoji: "🧱" },
      { title: "Stort LEGO-sett", kr: 600, emoji: "🏰" },
      { title: "Magnetbyggesett", kr: 300, emoji: "🧲" },
    ],
  },
  {
    key: "spill",
    title: "Spill og apper",
    emoji: "🎮",
    bg: "oklch(0.9 0.06 260)",
    items: [
      { title: "Hus i Toca Boca", kr: 49, emoji: "🏠" },
      { title: "Robux / V-Bucks", kr: 100, emoji: "💎" },
      { title: "Nytt spill", kr: 400, emoji: "🎮" },
      { title: "Brettspill", kr: 300, emoji: "🎲" },
    ],
  },
  {
    key: "leker",
    title: "Leker",
    emoji: "🧸",
    bg: "oklch(0.92 0.06 340)",
    items: [
      { title: "Kosedyr", kr: 200, emoji: "🧸" },
      { title: "Slime-sett", kr: 150, emoji: "🫧" },
      { title: "Dukke eller figur", kr: 250, emoji: "🪆" },
      { title: "Fjernstyrt bil", kr: 400, emoji: "🏎️" },
    ],
  },
  {
    key: "samle",
    title: "Samlekort",
    emoji: "🃏",
    bg: "oklch(0.93 0.09 95)",
    items: [
      { title: "Pakke samlekort", kr: 60, emoji: "🃏" },
      { title: "Samleperm", kr: 150, emoji: "📒" },
    ],
  },
  {
    key: "hobby",
    title: "Tegning og hobby",
    emoji: "🎨",
    bg: "oklch(0.92 0.07 150)",
    items: [
      { title: "Tusjer og tegnesaker", kr: 150, emoji: "🖍️" },
      { title: "Perler", kr: 120, emoji: "📿" },
      { title: "Hobbysett", kr: 250, emoji: "✂️" },
    ],
  },
  {
    key: "boker",
    title: "Bøker",
    emoji: "📚",
    bg: "oklch(0.91 0.05 60)",
    items: [
      { title: "Bok", kr: 150, emoji: "📖" },
      { title: "Tegneserie", kr: 100, emoji: "📚" },
    ],
  },
  {
    key: "sport",
    title: "Sport og ute",
    emoji: "⚽",
    bg: "oklch(0.92 0.06 200)",
    items: [
      { title: "Ball", kr: 200, emoji: "⚽" },
      { title: "Hoppetau", kr: 80, emoji: "🪢" },
      { title: "Sparkesykkel-ting", kr: 300, emoji: "🛴" },
    ],
  },
  {
    key: "pynt",
    title: "Klær og pynt",
    emoji: "👕",
    bg: "oklch(0.91 0.06 300)",
    items: [
      { title: "Smykke", kr: 100, emoji: "💍" },
      { title: "Caps", kr: 200, emoji: "🧢" },
      { title: "Hårpynt", kr: 60, emoji: "🎀" },
    ],
  },
  {
    key: "godt",
    title: "Godteri",
    emoji: "🍬",
    bg: "oklch(0.92 0.07 10)",
    items: [
      { title: "Godteri", kr: 30, emoji: "🍬" },
      { title: "Is", kr: 25, emoji: "🍦" },
      { title: "Brus", kr: 25, emoji: "🥤" },
    ],
  },
  {
    key: "opplevelse",
    title: "Opplevelser",
    emoji: "🎟️",
    bg: "oklch(0.93 0.08 80)",
    items: [
      { title: "Kinotur", kr: 120, emoji: "🍿" },
      { title: "Badeland", kr: 250, emoji: "🏊" },
      { title: "Trampolinepark", kr: 200, emoji: "🤸" },
    ],
  },
];

export const PRICE_CHIPS = [25, 50, 100, 200, 500, 1000];

export const DEFAULT_WISH_EMOJI = "🎁";
