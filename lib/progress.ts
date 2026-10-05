// Merker, uke-streak og månedsoppsummering for barnet. Alt regnes ut fra
// krav og ønsker, så ingenting lagres og ingenting kan «mistes».
// Bevisst uten tap, tilfeldighet og sammenligning med søsken.

export type Badge = { key: string; emoji: string; title: string; hint: string; earned: boolean; progress?: number };
export type Progress = {
  badges: Badge[];
  streakWeeks: number;
  streakDoneThisWeek: boolean;
  month: { label: string; earnedOre: number; tasks: number; topTask: string | null };
};

type ClaimLike = { task_id: string | null; status: string; amount_ore: number; saved_ore: number | null; created_at: string; decided_at: string | null; tasks?: { title: string } | { title: string }[] | null };

const MONTHS = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

// Mandag i uka (lokal tid) som nøkkel.
function weekKey(d: Date) {
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return monday.toISOString().slice(0, 10);
}

function titleOf(c: ClaimLike) {
  const t = Array.isArray(c.tasks) ? c.tasks[0] : c.tasks;
  return t?.title ?? null;
}

export function computeProgress(claims: ClaimLike[], wishesBought: number, now = new Date()): Progress {
  const done = claims.filter((c) => c.status === "APPROVED" || c.status === "PAID");
  const taskDone = done.filter((c) => c.task_id);
  const earned = done.reduce((s, c) => s + c.amount_ore + (c.saved_ore ?? 0), 0);
  const saved = done.reduce((s, c) => s + (c.saved_ore ?? 0), 0);
  const nTasks = taskDone.length;

  const perTask: Record<string, number> = {};
  for (const c of taskDone) {
    const t = titleOf(c);
    if (t) perTask[t] = (perTask[t] ?? 0) + 1;
  }
  const [bestTask, bestCount] = Object.entries(perTask).sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

  // Uker på rad med minst én godkjent oppgave. Denne uka teller med hvis den
  // er gjort, men bryter ikke streaken hvis den ikke er gjort ennå.
  const weeks = new Set(taskDone.map((c) => weekKey(new Date(c.decided_at ?? c.created_at))));
  const thisWeek = weekKey(now);
  const doneThisWeek = weeks.has(thisWeek);
  let streak = 0;
  const cursor = new Date(now);
  if (!doneThisWeek) cursor.setDate(cursor.getDate() - 7);
  while (weeks.has(weekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  const pct = (have: number, need: number) => Math.min(100, Math.round((have / need) * 100));
  const badge = (key: string, emoji: string, title: string, hint: string, have: number, need: number): Badge => ({
    key,
    emoji,
    title,
    hint,
    earned: have >= need,
    progress: pct(have, need),
  });

  const badges: Badge[] = [
    badge("first", "🌟", "Første oppgave", "Gjør din første oppgave", nTasks, 1),
    badge("ten", "💪", "10 oppgaver", "Gjør 10 oppgaver", nTasks, 10),
    badge("fifty", "🏅", "50 oppgaver", "Gjør 50 oppgaver", nTasks, 50),
    badge("hundred", "🏆", "100 oppgaver", "Gjør 100 oppgaver", nTasks, 100),
    badge("kr100", "💰", "Tjent 100 kr", "Tjen 100 kr", earned, 10_000),
    badge("kr500", "💎", "Tjent 500 kr", "Tjen 500 kr", earned, 50_000),
    badge("kr1000", "👑", "Tjent 1000 kr", "Tjen 1000 kr", earned, 100_000),
    badge("saver", "🐷", "Sparegris", "Spar 100 kr i sparegrisen", saved, 10_000),
    badge("wish", "🎁", "Ønske oppfylt", "Kjøp ditt første ønske", wishesBought, 1),
    badge("streak4", "🔥", "4 uker på rad", "Gjør oppgaver 4 uker på rad", streak, 4),
    bestTask
      ? badge("expert", "🎓", `Ekspert: ${bestTask}`, `Gjør samme oppgave 10 ganger`, bestCount, 10)
      : badge("expert", "🎓", "Ekspert", "Gjør samme oppgave 10 ganger", 0, 10),
  ];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const inMonth = done.filter((c) => new Date(c.decided_at ?? c.created_at) >= monthStart);
  const monthPer: Record<string, number> = {};
  for (const c of inMonth) {
    const t = c.task_id ? titleOf(c) : null;
    if (t) monthPer[t] = (monthPer[t] ?? 0) + 1;
  }
  const monthTop = Object.entries(monthPer).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    badges,
    streakWeeks: streak,
    streakDoneThisWeek: doneThisWeek,
    month: {
      label: MONTHS[now.getMonth()],
      earnedOre: inMonth.reduce((s, c) => s + c.amount_ore + (c.saved_ore ?? 0), 0),
      tasks: inMonth.filter((c) => c.task_id).length,
      topTask: monthTop,
    },
  };
}
