"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronDown, Trophy } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, ListSkeleton, Switch, cx, focusRing } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { friendlyError, swrDefaults, useAdminIdentity, useTasks } from "@/lib/admin-data";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { taskEmoji } from "@/lib/task-emoji";
import { DEFAULT_TROPHY_SETTINGS, TOTAL_MILESTONES, TROPHY_LEVELS, type TrophySettings } from "@/lib/trophies";

import { useLang, useText } from "@/lib/use-lang";

const kr = (ore?: number) => (ore ? String(ore / 100).replace(".", ",") : "");

const TEXT = {
  nb: {
    saveFailed: "Klarte ikke å lagre.", nowPay: "Trofeer gir nå penger", noLongerPay: "Trofeer gir ikke lenger penger", range: "Beløpene må være mellom 0 og 1000 kr.", saved: "Lagret",
    title: "Trofeer", desc: "Hver oppgave har nivåer. Barnet får et trofé når det har gjort oppgaven 5, 10, 20, 35, 50 … ganger, og trofeene står alltid i trofeskapet.",
    pay: "Trofeer gir penger", payDesc: "Pengene går automatisk til det barnet har til gode.",
    now: (level: string, big: string, totals: string) => <>Nå: <strong className="text-foreground">{level}</strong> per nivå og <strong className="text-foreground">{big}</strong> hvert 5. nivå, pluss bonus ved {totals} oppgaver til sammen. Nivåer barna allerede har passert, gir ikke penger i ettertid.</>,
    always: "Barna får trofeer uansett. Slå på for at trofeene også gir penger.", settings: "Innstillinger", settingsDesc: "Beløp, navn på trofeer og hvilke oppgaver som gir penger",
    perLevel: "Bonus per nivå", normal: "Vanlig nivå", every5: "Hvert 5. nivå", levelsAfter: (list: string) => `Nivåene kommer etter ${list} … ganger.`,
    total: "Oppgaver til sammen", tasksN: (n: number) => `${n} oppgaver`, emptyNoBonus: "La feltet stå tomt for ingen bonus.", perTask: "Trofé per oppgave",
    perTaskDesc: "Gir penger når barnet når et nytt nivå", namePlaceholder: (word: string) => `Navn på trofeet, f.eks. Super-${word}`, nameFor: (title: string) => `Navn på trofeet for ${title}`,
    undo: "Angre", save: "Lagre",
  },
  en: {
    saveFailed: "Couldn't save.", nowPay: "Trophies now give money", noLongerPay: "Trophies no longer give money", range: "The amounts must be between 0 and 1,000 kr.", saved: "Saved",
    title: "Trophies", desc: "Every task has levels. The child gets a trophy after doing the task 5, 10, 20, 35, 50 … times, and the trophies always stay in the trophy case.",
    pay: "Trophies give money", payDesc: "The money goes automatically to what the child is owed.",
    now: (level: string, big: string, totals: string) => <>Now: <strong className="text-foreground">{level}</strong> per level and <strong className="text-foreground">{big}</strong> every 5th level, plus a bonus at {totals} tasks in total. Levels the children have already passed don&rsquo;t give money afterwards.</>,
    always: "The children get trophies anyway. Turn this on for the trophies to give money too.", settings: "Settings", settingsDesc: "Amounts, trophy names and which tasks give money",
    perLevel: "Bonus per level", normal: "Normal level", every5: "Every 5th level", levelsAfter: (list: string) => `The levels come after ${list} … times.`,
    total: "Tasks in total", tasksN: (n: number) => `${n} tasks`, emptyNoBonus: "Leave the field empty for no bonus.", perTask: "Trophy per task",
    perTaskDesc: "Gives money when the child reaches a new level", namePlaceholder: (word: string) => `Trophy name, e.g. Super ${word}`, nameFor: (title: string) => `Trophy name for ${title}`,
    undo: "Undo", save: "Save",
  },
  uk: {
    saveFailed: "Не вдалося зберегти.", nowPay: "Трофеї тепер дають гроші", noLongerPay: "Трофеї більше не дають гроші", range: "Суми мають бути від 0 до 1000 kr.", saved: "Збережено",
    title: "Трофеї", desc: "Кожне завдання має рівні. Дитина отримує трофей, коли виконає завдання 5, 10, 20, 35, 50 … разів, і трофеї завжди лишаються в шафі з трофеями.",
    pay: "Трофеї дають гроші", payDesc: "Гроші автоматично додаються до того, що належить дитині.",
    now: (level: string, big: string, totals: string) => <>Зараз: <strong className="text-foreground">{level}</strong> за рівень і <strong className="text-foreground">{big}</strong> за кожен 5-й рівень, плюс бонус за {totals} завдань разом. Рівні, які діти вже пройшли, не оплачуються заднім числом.</>,
    always: "Діти отримують трофеї в будь-якому разі. Увімкніть, щоб трофеї ще й давали гроші.", settings: "Налаштування", settingsDesc: "Суми, назви трофеїв і завдання, що дають гроші",
    perLevel: "Бонус за рівень", normal: "Звичайний рівень", every5: "Кожен 5-й рівень", levelsAfter: (list: string) => `Рівні настають після ${list} … разів.`,
    total: "Завдань разом", tasksN: (n: number) => `${n} завдань`, emptyNoBonus: "Залиште поле порожнім, якщо без бонусу.", perTask: "Трофей за завдання",
    perTaskDesc: "Дає гроші, коли дитина досягає нового рівня", namePlaceholder: (word: string) => `Назва трофея, напр. Супер-${word}`, nameFor: (title: string) => `Назва трофея для ${title}`,
    undo: "Скасувати", save: "Зберегти",
  },
};

// Trofeer: automatisk som standard. Foreldre slår det på, og kan åpne
// «Innstillinger» for å endre beløp, navn og hvilke oppgaver som gir penger.
export default function AdminTrophiesPage() {
  const t = useText(TEXT);
  const lang = useLang();
  const toast = useToast();
  const { familyId } = useAdminIdentity();
  const tasks = useTasks(familyId);
  const settings = useSWR(
    familyId ? ["trophy-settings", familyId] : null,
    async () => {
      const res = await supabase.from("families").select("trophy_settings").eq("id", familyId as string).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return (res.data?.trophy_settings ?? {}) as TrophySettings;
    },
    swrDefaults
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TrophySettings | null>(null);
  const [saving, setSaving] = useState(false);

  if (!familyId || !settings.data) return <ListSkeleton rows={3} />;
  const s = settings.data;
  const d: TrophySettings = draft ?? { ...DEFAULT_TROPHY_SETTINGS, ...s, totals: { ...DEFAULT_TROPHY_SETTINGS.totals, ...(s.totals ?? {}) } };
  const taskList = (tasks.data ?? []).filter((x) => x.active);

  const store = async (next: TrophySettings, text: string) => {
    setSaving(true);
    try {
      const res = await supabase.from("families").update({ trophy_settings: next }).eq("id", familyId);
      if (res.error) throw new Error(res.error.message);
      await settings.mutate(next, { revalidate: false });
      setDraft(null);
      toast({ text });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.saveFailed) });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (on: boolean) =>
    void store(
      on ? { ...DEFAULT_TROPHY_SETTINGS, ...s, totals: s.totals && Object.keys(s.totals).length ? s.totals : DEFAULT_TROPHY_SETTINGS.totals, enabled: true } : { ...s, enabled: false },
      on ? t.nowPay : t.noLongerPay
    );

  const setKr = (field: "level_ore" | "big_ore", value: string) => {
    const ore = parseKrToOre(value);
    setDraft({ ...d, [field]: typeof ore === "number" ? ore : 0 });
  };
  const setTotal = (n: number, value: string) => {
    const ore = parseKrToOre(value);
    setDraft({ ...d, totals: { ...(d.totals ?? {}), [String(n)]: typeof ore === "number" ? ore : 0 } });
  };
  const setTaskOn = (id: string, on: boolean) => {
    const off = new Set(d.task_off ?? []);
    if (on) off.delete(id);
    else off.add(id);
    setDraft({ ...d, task_off: [...off] });
  };
  const setName = (id: string, name: string) => setDraft({ ...d, names: { ...(d.names ?? {}), [id]: name.slice(0, 30) } });

  const save = () => {
    const tooBig = [d.level_ore ?? 0, d.big_ore ?? 0, ...Object.values(d.totals ?? {})].some((v) => v < 0 || v > 100000);
    if (tooBig) {
      toast({ kind: "error", text: t.range });
      return;
    }
    void store({ ...d, enabled: s.enabled }, t.saved);
  };

  return (
    <section className="space-y-5">
      <Card>
        <CardHeader
          icon={<Trophy className="size-5" />}
          title={t.title}
          description={t.desc}
        />
        <div className="rounded-2xl bg-secondary px-4 py-3.5">
          <Switch
            checked={Boolean(s.enabled)}
            disabled={saving}
            onChange={toggle}
            label={t.pay}
            description={t.payDesc}
          />
        </div>
        {s.enabled ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t.now(formatKr(s.level_ore ?? 0, lang), formatKr(s.big_ore ?? 0, lang), TOTAL_MILESTONES.filter((n) => (s.totals?.[String(n)] ?? 0) > 0).join(", "))}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{t.always}</p>
        )}
      </Card>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={cx("flex w-full items-center justify-between gap-3 rounded-3xl p-5 text-left", focusRing)}>
          <span>
            <span className="block text-lg font-bold">{t.settings}</span>
            <span className="block text-sm text-muted-foreground">{t.settingsDesc}</span>
          </span>
          <ChevronDown className={cx("size-5 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
        </button>
        {open && (
          <div className="animate-pop space-y-6 px-5 pb-5">
            <div>
              <h3 className="mb-2 font-bold">{t.perLevel}</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.normal}>
                  <KrInput value={kr(d.level_ore)} onChange={(v) => setKr("level_ore", v)} />
                </Field>
                <Field label={t.every5}>
                  <KrInput value={kr(d.big_ore)} onChange={(v) => setKr("big_ore", v)} />
                </Field>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.levelsAfter(TROPHY_LEVELS.slice(0, 8).join(", "))}</p>
            </div>

            <div>
              <h3 className="mb-2 font-bold">{t.total}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TOTAL_MILESTONES.map((n) => (
                  <Field key={n} label={t.tasksN(n)}>
                    <KrInput value={kr(d.totals?.[String(n)])} onChange={(v) => setTotal(n, v)} />
                  </Field>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.emptyNoBonus}</p>
            </div>

            <div>
              <h3 className="mb-2 font-bold">{t.perTask}</h3>
              <ul className="divide-y divide-border rounded-2xl bg-secondary/60">
                {taskList.map((x) => (
                  <li key={x.id} className="space-y-2 px-4 py-3">
                    <Switch
                      checked={!(d.task_off ?? []).includes(x.id)}
                      onChange={(on) => setTaskOn(x.id, on)}
                      label={`${taskEmoji(x.title)} ${x.title}`}
                      description={t.perTaskDesc}
                    />
                    <Input value={d.names?.[x.id] ?? ""} onChange={(e) => setName(x.id, e.target.value)} placeholder={t.namePlaceholder(x.title.split(" ").pop()?.toLowerCase() ?? "")} aria-label={t.nameFor(x.title)} />
                  </li>
                ))}
              </ul>
            </div>

            {draft && (
              <div className="sticky bottom-24 flex gap-2 md:bottom-4">
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => setDraft(null)}>
                  {t.undo}
                </Button>
                <Button size="lg" className="flex-1" loading={saving} onClick={save}>
                  {t.save}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function KrInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <span className="relative block">
      <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" placeholder="0" className="pr-10" />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
    </span>
  );
}
