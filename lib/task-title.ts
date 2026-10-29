import type { Lang } from "@/lib/i18n";
import { knownTaskTitle } from "@/lib/task-packs-i18n";

// Oversettelser forelderen har skrevet selv (tasks.title_i18n), f.eks. { en: "…", uk: "…" }.
export type TaskTitleI18n = Partial<Record<Lang, string>> | null;

// Navnet på oppgaven slik barnet skal se det: egen oversettelse fra forelderen,
// ellers et kjent forslag oversatt automatisk, ellers navnet som det er skrevet.
export function localTaskTitle(task: { title: string; title_i18n?: TaskTitleI18n | unknown }, lang: Lang): string {
  const own = task.title_i18n && typeof task.title_i18n === "object" ? (task.title_i18n as Record<string, unknown>)[lang] : null;
  if (typeof own === "string" && own.trim()) return own.trim();
  return knownTaskTitle(task.title, lang) ?? task.title;
}

type TaskJoin = { title: string; title_i18n?: unknown } | { title: string; title_i18n?: unknown }[] | null | undefined;

// Krav med oppgaven koblet på (claims … tasks(title, title_i18n)): bytt navnet
// til barnets språk, så historikk, merker og trofeer viser det samme som listen.
export function localizeClaimTasks<C extends { tasks?: TaskJoin }>(claims: C[], lang: Lang): C[] {
  if (lang === "nb" && !claims.some((c) => hasOwn(c.tasks))) return claims;
  return claims.map((c) => {
    if (!c.tasks) return c;
    const one = (t: { title: string; title_i18n?: unknown }) => ({ ...t, title: localTaskTitle(t, lang) });
    return { ...c, tasks: Array.isArray(c.tasks) ? c.tasks.map(one) : one(c.tasks) };
  });
}

function hasOwn(t: TaskJoin) {
  const list = Array.isArray(t) ? t : t ? [t] : [];
  return list.some((x) => x.title_i18n && typeof x.title_i18n === "object" && Object.keys(x.title_i18n).length > 0);
}
