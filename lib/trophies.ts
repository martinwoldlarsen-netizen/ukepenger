// Trofeer: hver oppgave har nivåer (5, 10, 20 … ganger), og totalt antall
// oppgaver gir milepæler. Trofeene regnes ut fra kravene, så de kan aldri
// mistes. Penger gis av databasen (claims_trophies) når et nivå nås.
// Familien kan endre nivåene og premiene; standarden under er den samme som i
// databasen, og reglene her må holdes like dem i claims_trophies().

export const TROPHY_LEVELS = [5, 10, 20, 35, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
export const TOTAL_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

export type TrophySettings = {
  enabled?: boolean; // premier (penger) på
  hidden?: boolean; // trofeer per oppgave slått av
  levels?: number[]; // antall ganger for hvert nivå
  pay_from?: number; // første nivå som gir penger
  big_every?: number; // stor premie hvert N. nivå (0 = aldri)
  level_ore?: number;
  big_ore?: number;
  totals?: Record<string, number>;
  task_off?: string[];
  names?: Record<string, string>;
};

export const DEFAULT_TROPHY_SETTINGS: Required<Pick<TrophySettings, "level_ore" | "big_ore" | "totals" | "levels" | "pay_from" | "big_every">> = {
  levels: TROPHY_LEVELS,
  pay_from: 1,
  big_every: 5,
  level_ore: 500,
  big_ore: 5000,
  totals: { "10": 1000, "25": 2000, "50": 5000, "100": 10000, "250": 15000, "500": 20000, "1000": 20000 },
};

const int = (v: unknown, def: number, min: number, max: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 ? Math.min(Math.max(v, min), max) : def;

// Nivåene familien har valgt (stigende), ellers standard.
export function trophyLevels(s: TrophySettings): number[] {
  const list = Array.isArray(s.levels) ? s.levels.filter((n) => Number.isInteger(n) && n > 0 && n <= 99999) : [];
  return list.length ? list : TROPHY_LEVELS;
}
export const bigEvery = (s: TrophySettings) => int(s.big_every, 5, 0, 50);
export const payFrom = (s: TrophySettings) => int(s.pay_from, 1, 1, 50);

// Stor premie hvert N. nivå (standard hvert 5.).
export const isBigLevel = (level: number, s: TrophySettings = {}) => bigEvery(s) > 0 && level > 0 && level % bigEvery(s) === 0;

export function levelFor(count: number, levels: number[] = TROPHY_LEVELS) {
  // Som i databasen: et nivå nås når antallet treffer grensen.
  let level = 0;
  for (const need of levels) if (count >= need) level += 1;
  return level;
}

export type TaskTrophy = {
  taskId: string;
  title: string;
  icon?: string | null; // bildet forelderen har valgt for oppgaven
  name: string;
  count: number;
  level: number;
  maxed: boolean;
  nextAt: number | null;
  progress: number; // 0–100 mot neste nivå
  nextBonusOre: number; // 0 når trofeer ikke gir penger
  nextIsBig: boolean;
  levelIsBig: boolean; // nivået barnet har nå er et «stort» nivå
  levelBonusOre: number; // bonusen for nivået barnet nettopp nådde (til feiringen)
};

export function bonusForLevel(level: number, s: TrophySettings) {
  if (!s.enabled || s.hidden || level < payFrom(s)) return 0;
  return isBigLevel(level, s) ? (s.big_ore ?? 0) : (s.level_ore ?? 0);
}

export function taskTrophy(taskId: string, title: string, count: number, s: TrophySettings): TaskTrophy {
  const levels = trophyLevels(s);
  const level = levelFor(count, levels);
  const maxed = level >= levels.length;
  const prevAt = level === 0 ? 0 : levels[level - 1];
  const nextAt = maxed ? null : levels[level];
  const off = s.task_off?.includes(taskId);
  return {
    taskId,
    title,
    name: s.names?.[taskId]?.trim() || title,
    count,
    level,
    maxed,
    nextAt,
    progress: nextAt ? Math.min(100, Math.round(((count - prevAt) / (nextAt - prevAt)) * 100)) : 100,
    nextBonusOre: off || maxed ? 0 : bonusForLevel(level + 1, s),
    nextIsBig: !maxed && isBigLevel(level + 1, s),
    levelIsBig: isBigLevel(level, s),
    levelBonusOre: off || level === 0 ? 0 : bonusForLevel(level, s),
  };
}
