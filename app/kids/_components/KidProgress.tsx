"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { Progress } from "@/lib/progress";
import { formatKr } from "@/lib/money";
import { celebrate } from "../_lib/celebrate";
import { readAloud } from "../_lib/read-aloud";

export const kidProgressKey = (childId: string) => ["kid-progress", childId] as const;

// Månedsoppsummering, uke-streak og merker. Nye merker feires én gang
// (husket per barn på enheten).
export function KidProgress({ childId }: { childId: string }) {
  const { data } = useSWR(
    kidProgressKey(childId),
    async () => {
      const res = await fetch(`/api/kids/progress?childId=${encodeURIComponent(childId)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Feil");
      return (await res.json()) as Progress;
    },
    { revalidateOnFocus: true, shouldRetryOnError: false }
  );
  const [fresh, setFresh] = useState<Progress["badges"][number] | null>(null);

  useEffect(() => {
    if (!data) return;
    const key = `uk_badges_${childId}`;
    const earned = data.badges.filter((b) => b.earned).map((b) => b.key);
    let seen: string[] | null = null;
    try {
      seen = JSON.parse(localStorage.getItem(key) ?? "null");
      localStorage.setItem(key, JSON.stringify(earned));
    } catch {
      return;
    }
    // Første gang på denne enheten: bare husk, ikke feir alt på en gang.
    if (!seen) return;
    const newOne = data.badges.find((b) => b.earned && !seen?.includes(b.key));
    if (newOne) {
      const id = window.setTimeout(() => {
        setFresh(newOne);
        celebrate("big");
        readAloud(`Nytt merke! ${newOne.title}`);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [data, childId]);

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
            <span className="block text-sm font-bold opacity-80">Nytt merke!</span>
            <span className="block text-2xl font-extrabold leading-tight">{fresh.title}</span>
          </span>
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border">
          <p className="text-sm font-bold text-muted-foreground">I {data.month.label}</p>
          <p className="font-num mt-1 text-3xl font-bold">{formatKr(data.month.earnedOre)}</p>
          <p className="text-sm text-muted-foreground">
            {data.month.tasks} {data.month.tasks === 1 ? "oppgave" : "oppgaver"}
            {data.month.topTask ? ` · mest: ${data.month.topTask}` : ""}
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border">
          <p className="text-sm font-bold text-muted-foreground">Uker på rad</p>
          <p className="mt-1 text-3xl font-extrabold">
            <span aria-hidden="true">🔥</span> {data.streakWeeks}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.streakDoneThisWeek
              ? "Denne uka er klar. Kjempebra!"
              : data.streakWeeks > 0
                ? "Gjør én oppgave denne uka for å fortsette!"
                : "Gjør én oppgave i uka for å starte."}
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-card p-5 shadow-sm ring-1 ring-border sm:p-6">
        <h2 id="merker-title" className="text-2xl font-extrabold tracking-tight">
          Merkene mine <span className="text-base font-bold text-muted-foreground">{earned.length}/{data.badges.length}</span>
        </h2>
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {[...earned, ...next].map((b) => (
            <li key={b.key} className={`flex flex-col items-center rounded-2xl p-3 text-center ${b.earned ? "bg-accent/70" : "bg-secondary"}`}>
              <span className={`text-4xl ${b.earned ? "" : "opacity-30 grayscale"}`} aria-hidden="true">
                {b.emoji}
              </span>
              <span className="mt-1 text-xs font-bold leading-tight">{b.earned ? b.title : b.hint}</span>
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
