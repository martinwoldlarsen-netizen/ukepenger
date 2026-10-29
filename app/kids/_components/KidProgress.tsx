"use client";

import { TaskIcon } from "@/components/TaskIcon";
import { useEffect, useState } from "react";
import useSWR from "swr";
import type { Progress } from "@/lib/progress";
import { formatKr } from "@/lib/money";
import { taskEmoji } from "@/lib/task-emoji";
import { isBigLevel } from "@/lib/trophies";
import { celebrate } from "../_lib/celebrate";
import { readAloud } from "../_lib/read-aloud";
import { type Lang, localeOf } from "@/lib/i18n";
import { badgeText, kidText } from "../_lib/text";

export const kidProgressKey = (childId: string) => ["kid-progress", childId] as const;

// Månedsoppsummering, uke-streak og merker. Nye merker feires én gang
// (husket per barn på enheten).
export function KidProgress({ childId, lang = "nb" }: { childId: string; lang?: Lang }) {
  const t = kidText(lang);
  const kr = (ore: number) => formatKr(ore, lang);
  const { data } = useSWR(
    kidProgressKey(childId),
    async () => {
      const res = await fetch(`/api/kids/progress?childId=${encodeURIComponent(childId)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Feil");
      return (await res.json()) as Progress;
    },
    { revalidateOnFocus: true, shouldRetryOnError: false }
  );
  const [fresh, setFresh] = useState<{ emoji: string; title: string; label: string; bonusOre?: number } | null>(null);

  useEffect(() => {
    if (!data) return;
    const key = `uk_badges_${childId}`;
    const trophyKeys = (data.trophies ?? []).filter((t) => t.level > 0).map((t) => `t:${t.taskId}:${t.level}`);
    const earned = [...data.badges.filter((b) => b.earned).map((b) => b.key), ...trophyKeys];
    let seen: string[] | null = null;
    try {
      seen = JSON.parse(localStorage.getItem(key) ?? "null");
      localStorage.setItem(key, JSON.stringify(earned));
    } catch {
      return;
    }
    // Første gang på denne enheten: bare husk, ikke feir alt på en gang.
    if (!seen) return;
    const newTrophy = (data.trophies ?? []).find((t) => t.level > 0 && !seen?.includes(`t:${t.taskId}:${t.level}`));
    const newBadge = data.badges.find((b) => b.earned && !seen?.includes(b.key));
    const newOne = newTrophy
      ? { emoji: taskEmoji(newTrophy.title), title: t.trophyTitle(newTrophy.name, newTrophy.level), label: isBigLevel(newTrophy.level) ? t.bigTrophy : t.newLevel, bonusOre: newTrophy.levelBonusOre || undefined }
      : newBadge
        ? { emoji: newBadge.emoji, title: badgeText(t, newBadge)[0], label: t.newBadge, bonusOre: newBadge.bonusOre }
        : null;
    if (newOne) {
      const id = window.setTimeout(() => {
        setFresh(newOne);
        celebrate("big");
        readAloud(`${newOne.label} ${newOne.title}${newOne.bonusOre ? `. ${t.bonusSpoken(kr(newOne.bonusOre))}` : ""}`, lang);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [data, childId, t, lang]);

  if (!data) return null;
  const earned = data.badges.filter((b) => b.earned);
  const next = data.badges.filter((b) => !b.earned).sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));

  return (
    <section aria-labelledby="merker-title" className="space-y-4">
      {fresh && (
        <button
          type="button"
          onClick={() => setFresh(null)}
          className="animate-pop flex w-full items-center gap-4 rounded-[1.75rem] bg-accent p-5 text-left text-accent-foreground shadow-lg ring-2 ring-primary/30"
        >
          <span className="text-5xl" aria-hidden="true">{fresh.emoji}</span>
          <span>
            <span className="block text-sm font-bold opacity-80">{fresh.label}</span>
            <span className="block text-2xl font-extrabold leading-tight">{fresh.title}</span>
            {fresh.bonusOre ? <span className="block text-base font-bold">{t.bonus(kr(fresh.bonusOre))}</span> : null}
          </span>
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border">
          <p className="text-sm font-bold text-muted-foreground">{t.inMonth(lang === "nb" ? data.month.label : new Intl.DateTimeFormat(localeOf(lang), { month: "long" }).format(new Date(2026, data.month.index ?? 0, 15)))}</p>
          <p className="font-num mt-1 text-3xl font-bold">{kr(data.month.earnedOre)}</p>
          <p className="text-sm text-muted-foreground">
            {t.taskCount(data.month.tasks)}
            {data.month.topTask ? t.mostOften(data.month.topTask) : ""}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border">
          <p className="text-sm font-bold text-muted-foreground">{t.weeksInRow}</p>
          <p className="mt-1 text-3xl font-extrabold">
            <span aria-hidden="true">🔥</span> {data.streakWeeks}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.streakDoneThisWeek
              ? t.weekDone
              : data.streakWeeks > 0
                ? t.keepGoing
                : t.startStreak}
          </p>
        </div>
      </div>

      {(data.trophies?.length ?? 0) > 0 && (
        <div className="rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border sm:p-6">
          <h2 className="text-2xl font-extrabold tracking-tight">
            {t.trophyCase} <span aria-hidden="true">🏆</span>
          </h2>
          <p className="text-sm text-muted-foreground">{t.levelsIntro} {data.trophiesPay ? t.levelsPay : t.howHigh}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.trophies!.map((tr) => (
              <li key={tr.taskId} className={`flex items-center gap-3 rounded-2xl p-3 ${tr.level > 0 ? "bg-accent/60" : "bg-secondary"}`}>
                <span className="relative shrink-0">
                  <TaskIcon title={tr.title} icon={tr.icon} size={56} muted={tr.level === 0} />
                  {tr.level > 0 && (
                    <span className={`absolute -bottom-1.5 -right-1.5 flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-extrabold ${isBigLevel(tr.level) ? "bg-amber-400 text-amber-950" : "bg-primary text-primary-foreground"}`}>
                      {tr.level}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold leading-tight">{tr.name}</span>
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {tr.maxed ? t.topLevel(tr.count) : tr.level > 0 ? t.levelProgress(tr.level, tr.nextAt! - tr.count) : t.forLevel1(tr.nextAt! - tr.count)}
                  </span>
                  {!tr.maxed && (
                    <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-white">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${tr.progress}%` }} />
                    </span>
                  )}
                </span>
                {tr.nextBonusOre > 0 && (
                  <span className={`font-num shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${tr.nextIsBig ? "bg-amber-400 text-amber-950" : "bg-primary text-primary-foreground"}`}>
                    +{kr(tr.nextBonusOre)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border sm:p-6">
        <h2 id="merker-title" className="text-2xl font-extrabold tracking-tight">
          {t.myBadges} <span className="text-base font-bold text-muted-foreground">{earned.length}/{data.badges.length}</span>
        </h2>
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {[...earned, ...next].map((b) => (
            <li key={b.key} className={`flex flex-col items-center rounded-2xl p-3 text-center ${b.earned ? "bg-accent/70" : "bg-secondary"}`}>
              <span className={`text-4xl ${b.earned ? "" : "opacity-30 grayscale"}`} aria-hidden="true">
                {b.emoji}
              </span>
              <span className="mt-1 text-xs font-bold leading-tight">{badgeText(t, b)[b.earned ? 0 : 1]}</span>
              {b.bonusOre ? (
                <span className={`font-num mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${b.earned ? "bg-white/70" : "bg-primary text-primary-foreground"}`}>
                  {b.earned ? "✓ " : "+"}
                  {kr(b.bonusOre)}
                </span>
              ) : null}
              {!b.earned && (
                <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${b.progress ?? 0}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
