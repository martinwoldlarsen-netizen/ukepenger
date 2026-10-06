// Ferdige oppgaver, så foreldre slipper å finne på alt selv.
// BASIC_TASKS brukes i onboarding (det enkle startsettet). TASK_PACKS er
// kategoriene på Oppgaver-siden der man kan hente flere.

export type PackTask = { title: string; kr: number; emoji?: string };
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
      { title: "Rydde rommet", kr: 25, emoji: "🧸" },
      { title: "Re opp sengen", kr: 5, emoji: "🛏️" },
      { title: "Støvsuge", kr: 30, emoji: "🧹" },
      { title: "Støvsuge stua", kr: 20, emoji: "🛋️" },
      { title: "Tørke støv", kr: 15, emoji: "🪶" },
      { title: "Vaske gulvet", kr: 30, emoji: "🪣" },
      { title: "Rydde stua", kr: 15, emoji: "📺" },
      { title: "Vaske vinduer", kr: 40, emoji: "🪟" },
      { title: "Vanne blomstene", kr: 5, emoji: "🪴" },
      { title: "Rydde gangen", kr: 10, emoji: "🚪" },
      { title: "Lufte rommet", kr: 5, emoji: "🌬️" },
      { title: "Rydde skrivebordet", kr: 10, emoji: "🖥️" },
      { title: "Bytte lyspære", kr: 10, emoji: "💡" },
      { title: "Rydde bokhylla", kr: 10, emoji: "📚" },
      { title: "Vaske speil", kr: 10, emoji: "🪞" },
      { title: "Rydde i skapet", kr: 15, emoji: "🗄️" },
    ],
  },
  {
    key: "bad",
    title: "Badet",
    emoji: "🛁",
    tasks: [
      { title: "Rydde badet", kr: 15, emoji: "🧴" },
      { title: "Vaske badet", kr: 40, emoji: "🛁" },
      { title: "Vaske vasken", kr: 10, emoji: "🚰" },
      { title: "Vaske do", kr: 20, emoji: "🚽" },
      { title: "Henge opp håndklær", kr: 5, emoji: "🪝" },
      { title: "Tørke av dusjveggen", kr: 10, emoji: "🚿" },
      { title: "Fylle på dopapir", kr: 5, emoji: "🧻" },
    ],
  },
  {
    key: "kjokken",
    title: "Kjøkken og mat",
    emoji: "🍽️",
    tasks: [
      { title: "Ta oppvasken", kr: 20, emoji: "🧽" },
      { title: "Dekke bordet", kr: 10, emoji: "🍴" },
      { title: "Rydde av bordet", kr: 10, emoji: "🍽️" },
      { title: "Rydde bordet", kr: 10, emoji: "🪑" },
      { title: "Tømme oppvaskmaskinen", kr: 15, emoji: "🫧" },
      { title: "Fylle oppvaskmaskinen", kr: 10, emoji: "🥣" },
      { title: "Tørke av bordet", kr: 5, emoji: "🧼" },
      { title: "Tørke av benken", kr: 5, emoji: "✨" },
      { title: "Smøre matpakke", kr: 10, emoji: "🥪" },
      { title: "Lage frokost", kr: 15, emoji: "🥞" },
      { title: "Hjelpe til med middagen", kr: 20, emoji: "🍲" },
      { title: "Lage middag selv", kr: 50, emoji: "👩‍🍳" },
      { title: "Bake", kr: 20, emoji: "🧁" },
      { title: "Skrelle poteter", kr: 10, emoji: "🥔" },
      { title: "Kutte grønnsaker", kr: 10, emoji: "🥕" },
      { title: "Rydde kjøleskapet", kr: 25, emoji: "🧊" },
      { title: "Lage salat", kr: 10, emoji: "🥗" },
      { title: "Tømme brødsmuler", kr: 5, emoji: "🍞" },
      { title: "Sette bort maten", kr: 5, emoji: "🥫" },
      { title: "Tørke oppvask", kr: 10, emoji: "🍵" },
    ],
  },
  {
    key: "avfall",
    title: "Søppel og panting",
    emoji: "♻️",
    tasks: [
      { title: "Ta ut søppel", kr: 15, emoji: "🗑️" },
      { title: "Sortere søppel", kr: 10, emoji: "♻️" },
      { title: "Pante flasker", kr: 10, emoji: "🥤" },
      { title: "Bære inn handleposene", kr: 5, emoji: "🛍️" },
      { title: "Ta ut papir", kr: 10, emoji: "📰" },
      { title: "Ta ut plast", kr: 10, emoji: "🧃" },
      { title: "Ta ut glass og metall", kr: 10, emoji: "🫙" },
      { title: "Skylle melkekartonger", kr: 5, emoji: "🥛" },
      { title: "Trille søppeldunken ut", kr: 10, emoji: "🛢️" },
    ],
  },
  {
    key: "klaer",
    title: "Klær og vask",
    emoji: "🧺",
    tasks: [
      { title: "Henge opp klærne", kr: 10, emoji: "👕" },
      { title: "Skittentøy i kurven", kr: 5, emoji: "🧺" },
      { title: "Brette klær", kr: 15, emoji: "👚" },
      { title: "Henge opp klesvask", kr: 15, emoji: "🧷" },
      { title: "Skifte på sengen", kr: 20, emoji: "🛌" },
      { title: "Rydde i gangen og skoene", kr: 10, emoji: "👟" },
      { title: "Rydde klesskapet", kr: 15, emoji: "👗" },
      { title: "Sette på vaskemaskinen", kr: 10, emoji: "🌀" },
      { title: "Sortere klesvask", kr: 10, emoji: "🩲" },
      { title: "Pusse sko", kr: 15, emoji: "🥾" },
      { title: "Legge bort rene klær", kr: 10, emoji: "🧥" },
    ],
  },
  {
    key: "ute",
    title: "Ute og hage",
    emoji: "🌳",
    tasks: [
      { title: "Måke snø", kr: 40, emoji: "☃️" },
      { title: "Rake løv", kr: 30, emoji: "🍂" },
      { title: "Klippe plenen", kr: 50, emoji: "🌱" },
      { title: "Luke i hagen", kr: 30, emoji: "🌿" },
      { title: "Bære inn ved", kr: 20, emoji: "🪵" },
      { title: "Vaske bilen", kr: 60, emoji: "🚗" },
      { title: "Rydde boden", kr: 50, emoji: "🧰" },
      { title: "Feie trappa", kr: 10, emoji: "🪜" },
      { title: "Vanne hagen", kr: 10, emoji: "💦" },
      { title: "Plukke bær", kr: 20, emoji: "🫐" },
      { title: "Plante blomster", kr: 20, emoji: "🌷" },
      { title: "Rydde lekeplassen i hagen", kr: 15, emoji: "🛝" },
      { title: "Strø med sand", kr: 10, emoji: "🧂" },
      { title: "Vaske sykkelen", kr: 20, emoji: "🚲" },
      { title: "Hente posten", kr: 5, emoji: "📬" },
    ],
  },
  {
    key: "dyr",
    title: "Dyr",
    emoji: "🐾",
    tasks: [
      { title: "Lufte hunden", kr: 25, emoji: "🐕" },
      { title: "Mate dyrene", kr: 10, emoji: "🦴" },
      { title: "Gi dyrene vann", kr: 5, emoji: "💧" },
      { title: "Måke kattedoen", kr: 15, emoji: "🐈" },
      { title: "Rengjøre buret", kr: 25, emoji: "🐹" },
      { title: "Mate fiskene", kr: 5, emoji: "🐠" },
      { title: "Børste hunden", kr: 15, emoji: "🪮" },
      { title: "Leke med katten", kr: 5, emoji: "🧶" },
      { title: "Plukke hundebæsj i hagen", kr: 15, emoji: "💩" },
      { title: "Mate fuglene", kr: 5, emoji: "🐦" },
    ],
  },
  {
    key: "skole",
    title: "Skole og ansvar",
    emoji: "🎒",
    tasks: [
      { title: "Lekser uten mas", kr: 30, emoji: "📝" },
      { title: "Lese i 20 minutter", kr: 15, emoji: "📖" },
      { title: "Øve på instrument", kr: 20, emoji: "🎵" },
      { title: "Pakke sekken selv", kr: 5, emoji: "🎒" },
      { title: "Stå opp selv", kr: 5, emoji: "⏰" },
      { title: "Legge seg uten mas", kr: 5, emoji: "🌙" },
      { title: "Pakke treningsbagen", kr: 5, emoji: "⚽" },
      { title: "Øve på gangetabellen", kr: 10, emoji: "✖️" },
      { title: "Skrive dagbok", kr: 5, emoji: "📔" },
      { title: "Skjermfri ettermiddag", kr: 20, emoji: "📵" },
      { title: "Lage ukeplan", kr: 10, emoji: "🗓️" },
    ],
  },
  {
    key: "minste",
    title: "For de minste",
    emoji: "🧸",
    tasks: [
      { title: "Rydde lekene", kr: 5, emoji: "🪀" },
      { title: "Rydde legoen", kr: 5, emoji: "🧱" },
      { title: "Kle på seg selv", kr: 5, emoji: "🧦" },
      { title: "Pusse tennene selv", kr: 5, emoji: "🪥" },
      { title: "Sortere sokker", kr: 5, emoji: "🧤" },
      { title: "Hjelpe til med handleposene", kr: 5, emoji: "🥖" },
      { title: "Rydde tegnesakene", kr: 5, emoji: "🖍️" },
      { title: "Legge bamser på plass", kr: 5, emoji: "🐻" },
      { title: "Henge opp jakka", kr: 5, emoji: "🧣" },
      { title: "Sette skoene på plass", kr: 5, emoji: "👞" },
      { title: "Vaske hendene før mat", kr: 5, emoji: "🙌" },
    ],
  },
  {
    key: "snill",
    title: "Snill og hjelpsom",
    emoji: "💛",
    tasks: [
      { title: "Hjelpe et søsken med lekser", kr: 15, emoji: "🧑‍🏫" },
      { title: "Passe småsøsken", kr: 30, emoji: "👶" },
      { title: "Ringe besteforeldre", kr: 10, emoji: "☎️" },
      { title: "Hjelpe en nabo", kr: 20, emoji: "🏘️" },
      { title: "Lese for småsøsken", kr: 10, emoji: "📘" },
      { title: "Lage en tegning til noen", kr: 5, emoji: "🎨" },
      { title: "Hjelpe til uten å bli spurt", kr: 15, emoji: "🌟" },
      { title: "Være med på handletur", kr: 10, emoji: "🛒" },
    ],
  },
];

// Oppgaver som ikke passer i noen kategori (f.eks. «Salg 10,-»).
export const OTHER_CATEGORY = { key: "andre", title: "Andre oppgaver", emoji: "📦" } as const;

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/søppel|soppel|søpla|søppla|pant|flaske|resirk|handlepose/i, "avfall"],
  [/hund|katt|dyr|mate |fisk|bur\b|hest|kanin/i, "dyr"],
  [/\bbad(et)?\b|dusj|\bdo\b|toalett|håndkl|dopapir|vasken\b/i, "bad"],
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

// Fast bilde for oppgaver fra biblioteket (slås opp på navn).
export const LIBRARY_EMOJI: Record<string, string> = Object.fromEntries(
  TASK_PACKS.flatMap((p) => p.tasks.filter((t) => t.emoji).map((t) => [t.title.toLowerCase(), t.emoji as string]))
);
