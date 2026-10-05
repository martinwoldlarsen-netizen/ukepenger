// Trofeer: hver oppgave har nivåer (5, 10, 20 … ganger), og totalt antall
// oppgaver gir milepæler. Trofeene regnes ut fra kravene, så de kan aldri
// mistes. Penger gis av databasen (claims_trophies) når et nivå nås.
// Samme nivåliste som trophy_level_for() i databasen.

export const TROPHY_LEVELS = [5, 10, 20, 35, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
export const TOTAL_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

export type TrophySettings = {
  enabled?: boolean;
  level_ore?: number;
  big_ore?: number;
  totals?: Record<string, number>;
  task_off?: string[];
  names?: Record<string, string>;
};

export const DEFAULT_TROPHY_SETTINGS: Required<Pick<TrophySettings, "level_ore" | "big_ore" | "totals">> = {
  level_ore: 500,
  big_ore: 5000,
  totals: { "10": 1000, "25": 2000, "50": 5000, "100": 10000, "250": 15000, "500": 20000, "1000": 20000 },
};

// Store bonuser hvert 5. nivå.
export const isBigLevel = (level: number) => level % 5 === 0;

export function levelFor(count: number) {
  let level = 0;
  for (const need of TROPHY_LEVELS) if (count >= need) level += 1;
  return level;
}

export type TaskTrophy = {
  taskId: string;
  title: string;
  name: string;
  count: number;
  level: number;
  maxed: boolean;
  nextAt: number | null;
  progress: number; // 0–100 mot neste nivå
  nextBonusOre: number; // 0 når trofeer ikke gir penger
  nextIsBig: boolean;
  levelBonusOre: number; // bonusen for nivået barnet nettopp nådde (til feiringen)
};

export function bonusForLevel(level: number, s: TrophySettings) {
  if (!s.enabled) return 0;
  return isBigLevel(level) ? (s.big_ore ?? 0) : (s.level_ore ?? 0);
}

export function taskTrophy(taskId: string, title: string, count: number, s: TrophySettings): TaskTrophy {
  const level = levelFor(count);
  const maxed = level >= TROPHY_LEVELS.length;
  const prevAt = level === 0 ? 0 : TROPHY_LEVELS[level - 1];
  const nextAt = maxed ? null : TROPHY_LEVELS[level];
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
    nextIsBig: !maxed && isBigLevel(level + 1),
    levelBonusOre: off || level === 0 ? 0 : bonusForLevel(level, s),
  };
}
