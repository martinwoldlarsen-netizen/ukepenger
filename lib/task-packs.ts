// Ferdige oppgavepakker, så foreldre slipper å finne på alt selv.
// Brukes i onboarding og på Oppgaver-siden.

export type PackTask = { title: string; kr: number };
// extra: bare som inspirasjon på Oppgaver-siden, ikke i onboarding (holder den kort).
export type TaskPack = { key: string; title: string; emoji: string; tasks: PackTask[]; extra?: boolean };

export const TASK_PACKS: TaskPack[] = [
  {
    key: "hjemme",
    title: "Hjemme",
    emoji: "🏠",
    tasks: [
      { title: "Rydde rommet", kr: 25 },
      { title: "Re opp sengen", kr: 5 },
      { title: "Henge opp klærne", kr: 10 },
      { title: "Støvsuge", kr: 30 },
    ],
  },
  {
    key: "kjokken",
    title: "Kjøkken",
    emoji: "🍽️",
    tasks: [
      { title: "Ta oppvasken", kr: 20 },
      { title: "Dekke bordet", kr: 10 },
      { title: "Tømme oppvaskmaskinen", kr: 15 },
      { title: "Ta ut søppel", kr: 15 },
    ],
  },
  {
    key: "ute",
    title: "Ute og dyr",
    emoji: "🐾",
    tasks: [
      { title: "Lufte hunden", kr: 25 },
      { title: "Mate dyrene", kr: 10 },
      { title: "Måke snø", kr: 40 },
      { title: "Rake løv", kr: 30 },
    ],
  },
  {
    key: "ansvar",
    title: "Skole og ansvar",
    emoji: "🎒",
    tasks: [
      { title: "Lekser uten mas", kr: 30 },
      { title: "Lese i 20 minutter", kr: 15 },
      { title: "Øve på instrument", kr: 20 },
      { title: "Pakke sekken selv", kr: 5 },
    ],
  },
  {
    key: "minste",
    title: "For de minste",
    emoji: "🧸",
    extra: true,
    tasks: [
      { title: "Rydde lekene", kr: 5 },
      { title: "Skittentøy i kurven", kr: 5 },
      { title: "Vanne blomstene", kr: 5 },
      { title: "Sortere sokker", kr: 5 },
      { title: "Hjelpe til med handleposene", kr: 5 },
      { title: "Kle på seg selv", kr: 5 },
    ],
  },
  {
    key: "klesvask",
    title: "Vask og klær",
    emoji: "🧺",
    extra: true,
    tasks: [
      { title: "Brette klær", kr: 15 },
      { title: "Henge opp klesvask", kr: 15 },
      { title: "Tørke støv", kr: 15 },
      { title: "Vaske badet", kr: 40 },
      { title: "Skifte på sengen", kr: 20 },
      { title: "Vaske gulvet", kr: 30 },
    ],
  },
  {
    key: "kokk",
    title: "Lille kokk",
    emoji: "👩‍🍳",
    extra: true,
    tasks: [
      { title: "Lage frokost", kr: 15 },
      { title: "Smøre matpakke", kr: 10 },
      { title: "Hjelpe til med middagen", kr: 20 },
      { title: "Lage middag selv", kr: 50 },
      { title: "Tørke av bordet", kr: 5 },
      { title: "Rydde kjøleskapet", kr: 25 },
    ],
  },
  {
    key: "store",
    title: "Store jobber",
    emoji: "💪",
    extra: true,
    tasks: [
      { title: "Vaske bilen", kr: 60 },
      { title: "Klippe plenen", kr: 50 },
      { title: "Rydde boden", kr: 50 },
      { title: "Vaske vinduer", kr: 40 },
      { title: "Bære inn ved", kr: 20 },
      { title: "Luke i hagen", kr: 30 },
    ],
  },
  {
    key: "snill",
    title: "Snill og hjelpsom",
    emoji: "💛",
    extra: true,
    tasks: [
      { title: "Hjelpe et søsken med lekser", kr: 15 },
      { title: "Passe småsøsken", kr: 30 },
      { title: "Ringe besteforeldre", kr: 10 },
      { title: "Hjelpe en nabo", kr: 20 },
    ],
  },
];
