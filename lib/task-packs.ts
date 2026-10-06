// Ferdige oppgaver, så foreldre slipper å finne på alt selv.
// BASIC_TASKS brukes i onboarding (det enkle startsettet). TASK_PACKS er
// kategoriene på Oppgaver-siden der man kan hente flere.

export type PackTask = { title: string; kr: number };
export type TaskPack = { key: string; title: string; emoji: string; tasks: PackTask[] };

// Startsettet i onboarding. Holdes kort og uendret.
export const BASIC_TASKS: PackTask[] = [
  { title: "Rydde rommet", kr: 25 },
  { title: "Re opp sengen", kr: 5 },
  { title: "Henge opp klærne", kr: 10 },
  { title: "Støvsuge", kr: 30 },
  { title: "Ta oppvasken", kr: 20 },
  { title: "Dekke bordet", kr: 10 },
  { title: "Tømme oppvaskmaskinen", kr: 15 },
  { title: "Ta ut søppel", kr: 15 },
  { title: "Lufte hunden", kr: 25 },
  { title: "Mate dyrene", kr: 10 },
  { title: "Måke snø", kr: 40 },
  { title: "Rake løv", kr: 30 },
  { title: "Lekser uten mas", kr: 30 },
  { title: "Lese i 20 minutter", kr: 15 },
  { title: "Øve på instrument", kr: 20 },
  { title: "Pakke sekken selv", kr: 5 },
];

export const TASK_PACKS: TaskPack[] = [
  {
    key: "huset",
    title: "Huset",
    emoji: "🏠",
    tasks: [
      { title: "Rydde rommet", kr: 25 },
      { title: "Re opp sengen", kr: 5 },
      { title: "Støvsuge", kr: 30 },
      { title: "Tørke støv", kr: 15 },
      { title: "Vaske gulvet", kr: 30 },
      { title: "Vaske badet", kr: 40 },
      { title: "Rydde stua", kr: 15 },
      { title: "Vaske vinduer", kr: 40 },
      { title: "Vanne blomstene", kr: 5 },
    ],
  },
  {
    key: "kjokken",
    title: "Kjøkken og mat",
    emoji: "🍽️",
    tasks: [
      { title: "Ta oppvasken", kr: 20 },
      { title: "Dekke bordet", kr: 10 },
      { title: "Rydde av bordet", kr: 10 },
      { title: "Tømme oppvaskmaskinen", kr: 15 },
      { title: "Tørke av bordet", kr: 5 },
      { title: "Smøre matpakke", kr: 10 },
      { title: "Lage frokost", kr: 15 },
      { title: "Hjelpe til med middagen", kr: 20 },
      { title: "Lage middag selv", kr: 50 },
      { title: "Rydde kjøleskapet", kr: 25 },
    ],
  },
  {
    key: "avfall",
    title: "Søppel og panting",
    emoji: "♻️",
    tasks: [
      { title: "Ta ut søppel", kr: 15 },
      { title: "Sortere søppel", kr: 10 },
      { title: "Pante flasker", kr: 10 },
      { title: "Bære inn handleposene", kr: 5 },
    ],
  },
  {
    key: "klaer",
    title: "Klær og vask",
    emoji: "🧺",
    tasks: [
      { title: "Henge opp klærne", kr: 10 },
      { title: "Skittentøy i kurven", kr: 5 },
      { title: "Brette klær", kr: 15 },
      { title: "Henge opp klesvask", kr: 15 },
      { title: "Skifte på sengen", kr: 20 },
      { title: "Rydde i gangen og skoene", kr: 10 },
    ],
  },
  {
    key: "ute",
    title: "Ute og hage",
    emoji: "🌳",
    tasks: [
      { title: "Måke snø", kr: 40 },
      { title: "Rake løv", kr: 30 },
      { title: "Klippe plenen", kr: 50 },
      { title: "Luke i hagen", kr: 30 },
      { title: "Bære inn ved", kr: 20 },
      { title: "Vaske bilen", kr: 60 },
      { title: "Rydde boden", kr: 50 },
      { title: "Feie trappa", kr: 10 },
    ],
  },
  {
    key: "dyr",
    title: "Dyr",
    emoji: "🐾",
    tasks: [
      { title: "Lufte hunden", kr: 25 },
      { title: "Mate dyrene", kr: 10 },
      { title: "Gi dyrene vann", kr: 5 },
      { title: "Måke kattedoen", kr: 15 },
      { title: "Rengjøre buret", kr: 25 },
    ],
  },
  {
    key: "skole",
    title: "Skole og ansvar",
    emoji: "🎒",
    tasks: [
      { title: "Lekser uten mas", kr: 30 },
      { title: "Lese i 20 minutter", kr: 15 },
      { title: "Øve på instrument", kr: 20 },
      { title: "Pakke sekken selv", kr: 5 },
      { title: "Stå opp selv", kr: 5 },
      { title: "Legge seg uten mas", kr: 5 },
    ],
  },
  {
    key: "minste",
    title: "For de minste",
    emoji: "🧸",
    tasks: [
      { title: "Rydde lekene", kr: 5 },
      { title: "Kle på seg selv", kr: 5 },
      { title: "Pusse tennene selv", kr: 5 },
      { title: "Sortere sokker", kr: 5 },
      { title: "Hjelpe til med handleposene", kr: 5 },
    ],
  },
  {
    key: "snill",
    title: "Snill og hjelpsom",
    emoji: "💛",
    tasks: [
      { title: "Hjelpe et søsken med lekser", kr: 15 },
      { title: "Passe småsøsken", kr: 30 },
      { title: "Ringe besteforeldre", kr: 10 },
      { title: "Hjelpe en nabo", kr: 20 },
    ],
  },
];

// Oppgaver som ikke passer i noen kategori (f.eks. «Salg 10,-»).
export const OTHER_CATEGORY = { key: "andre", title: "Andre oppgaver", emoji: "📦" } as const;

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/søppel|soppel|søpla|søppla|pant|flaske|resirk|handlepose/i, "avfall"],
  [/hund|katt|dyr|mate |fisk|bur\b|hest|kanin/i, "dyr"],
  [/snø|sno|måke|make|løv|rake|plen|gress|hage|luke|ved\b|bil|bod|trapp|garasje/i, "ute"],
  [/oppvask|bord|mat|middag|frokost|lunsj|kjøkken|kjøleskap|bake|matpakk/i, "kjokken"],
  [/klær|klaer|klesvask|brette|skittentøy|seng(e|a)?tøy|skifte på|sko/i, "klaer"],
  [/lekse|les(e|ing)|skole|sekk|instrument|øve|piano|stå opp|legge seg/i, "skole"],
  [/leke|tenn|kle på|sokk/i, "minste"],
  [/søsken|passe|besteforeld|nabo|hjelpe/i, "snill"],
  [/rydd|støvsug|vask|støv|gulv|bad|vindu|blomst|seng/i, "huset"],
];

// Kategori for en oppgave: lagret verdi, ellers eksakt treff i biblioteket,
// ellers et gjett ut fra navnet.
export function categoryOf(task: { title: string; category?: string | null }): string {
  if (task.category) return task.category;
  const t = task.title.trim().toLowerCase();
  const exact = TASK_PACKS.find((p) => p.tasks.some((x) => x.title.toLowerCase() === t));
  if (exact) return exact.key;
  return CATEGORY_RULES.find(([re]) => re.test(task.title))?.[1] ?? OTHER_CATEGORY.key;
}
