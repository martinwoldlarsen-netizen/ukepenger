// Ferdige oppgavepakker, så foreldre slipper å finne på alt selv.
// Brukes i onboarding og på Oppgaver-siden.

export type PackTask = { title: string; kr: number };
export type TaskPack = { key: string; title: string; emoji: string; tasks: PackTask[] };

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
];
