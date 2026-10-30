"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronDown, Coins, RotateCcw, Trophy } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, ListSkeleton, Select, Switch, cx, focusRing } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { friendlyError, swrDefaults, useAdminIdentity, useTasks } from "@/lib/admin-data";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { taskEmoji } from "@/lib/task-emoji";
import { DEFAULT_TROPHY_SETTINGS, TOTAL_MILESTONES, bigEvery, payFrom, trophyLevels, type TrophySettings } from "@/lib/trophies";

import { useLang, useText } from "@/lib/use-lang";

const kr = (ore?: number) => (ore ? String(ore / 100).replace(".", ",") : "");
const MAX_LEVELS = 15;
const BIG_CHOICES = [0, 2, 3, 4, 5, 10];

const TEXT = {
  nb: {
    saveFailed: "Klarte ikke å lagre.", saved: "Lagret", range: "Beløpene må være mellom 0 og 1000 kr.",
    trophiesOn: "Trofeer er slått på", trophiesOff: "Trofeer er slått av", prizesOn: "Premiene er slått på", prizesOff: "Premiene er slått av",
    title: "Trofeer og premier", desc: "Barna får et trofé per oppgave når de har gjort den mange nok ganger. Trofeene kan aldri mistes.",
    showTrophies: "Trofeer", showTrophiesDesc: "Trofeskapet på barnesiden, med nivåer per oppgave.",
    prizes: "Premier (penger)", prizesDesc: "Penger som går automatisk til det barnet har til gode når et nivå eller en milepæl nås.",
    now: (o: { level: string; big: string; bigEvery: number; payFrom: number; totals: string; trophies: boolean }) => (
      <>
        Nå:{" "}
        {o.trophies && (
          <>
            <strong className="text-foreground">{o.level}</strong> per nivå{o.payFrom > 1 ? ` fra nivå ${o.payFrom}` : ""}
            {o.bigEvery > 0 && (
              <>
                {" "}og <strong className="text-foreground">{o.big}</strong> hvert {o.bigEvery}. nivå
              </>
            )}
            {o.totals ? ", pluss " : ". "}
          </>
        )}
        {o.totals ? `bonus ved ${o.totals} oppgaver til sammen. ` : ""}
        Nivåer barna allerede har passert, gir ikke penger i ettertid.
      </>
    ),
    prizesOffText: "Barna får trofeer og merker, men ingen penger for dem.",
    settings: "Nivåer og premier", settingsDesc: "Hvor mange ganger hvert nivå krever, beløp, og hvilke oppgaver som gir penger",
    levels: "Antall ganger per nivå", level: (n: number) => `Nivå ${n}`,
    levelsHint: "Hvert nivå må kreve flere ganger enn det forrige. Tomme felt på slutten blir borte.",
    levelsBad: "Nivåene må være hele tall, uten hull, og hvert nivå høyere enn det forrige.",
    prizePerLevel: "Premie per nivå", normal: "Vanlig nivå", big: "Stor premie", bigEvery: "Stor premie hvert", never: "Aldri", nth: (n: number) => `${n}. nivå`,
    payFrom: "Penger fra og med", fromLevel: (n: number) => `Nivå ${n}`, payFromHint: "Lavere nivåer gir trofé, men ikke penger.",
    total: "Bonus for oppgaver til sammen", tasksN: (n: number) => `${n} oppgaver`, emptyNoBonus: "La feltet stå tomt for ingen bonus.",
    perTask: "Trofé per oppgave", perTaskDesc: "Gir penger når barnet når et nytt nivå",
    namePlaceholder: (word: string) => `Navn på trofeet, f.eks. Super-${word}`, nameFor: (title: string) => `Navn på trofeet for ${title}`,
    reset: "Tilbake til standard", resetDone: "Standard er fylt inn. Trykk Lagre for å bruke den.",
    undo: "Angre", save: "Lagre",
  },
  en: {
    saveFailed: "Couldn't save.", saved: "Saved", range: "Amounts must be between 0 and 1000 kr.",
    trophiesOn: "Trophies are switched on", trophiesOff: "Trophies are switched off", prizesOn: "Prizes are switched on", prizesOff: "Prizes are switched off",
    title: "Trophies and prizes", desc: "Children get a trophy for each task once they have done it enough times. Trophies can never be lost.",
    showTrophies: "Trophies", showTrophiesDesc: "The trophy case on the children's page, with levels per task.",
    prizes: "Prizes (money)", prizesDesc: "Money that's added automatically to what the child is owed when a level or milestone is reached.",
    now: (o: { level: string; big: string; bigEvery: number; payFrom: number; totals: string; trophies: boolean }) => (
      <>
        Now:{" "}
        {o.trophies && (
          <>
            <strong className="text-foreground">{o.level}</strong> per level{o.payFrom > 1 ? ` from level ${o.payFrom}` : ""}
            {o.bigEvery > 0 && (
              <>
                {" "}and <strong className="text-foreground">{o.big}</strong> every {o.bigEvery === 1 ? "" : `${o.bigEvery}${o.bigEvery === 2 ? "nd" : o.bigEvery === 3 ? "rd" : "th"} `}level
              </>
            )}
            {o.totals ? ", plus " : ". "}
          </>
        )}
        {o.totals ? `a bonus at ${o.totals} tasks in total. ` : ""}
        Levels the children have already passed don&rsquo;t pay out afterwards.
      </>
    ),
    prizesOffText: "The children get trophies and badges, but no money for them.",
    settings: "Levels and prizes", settingsDesc: "How many times each level takes, amounts, and which tasks give money",
    levels: "Times per level", level: (n: number) => `Level ${n}`,
    levelsHint: "Each level must take more times than the one before. Empty fields at the end are removed.",
    levelsBad: "Levels must be whole numbers, with no gaps, each higher than the one before.",
    prizePerLevel: "Prize per level", normal: "Normal level", big: "Big prize", bigEvery: "Big prize every", never: "Never", nth: (n: number) => `${n}${n === 2 ? "nd" : n === 3 ? "rd" : "th"} level`,
    payFrom: "Money from", fromLevel: (n: number) => `Level ${n}`, payFromHint: "Lower levels give a trophy, but no money.",
    total: "Bonus for tasks in total", tasksN: (n: number) => `${n} tasks`, emptyNoBonus: "Leave the field empty for no bonus.",
    perTask: "Trophy per task", perTaskDesc: "Gives money when the child reaches a new level",
    namePlaceholder: (word: string) => `Trophy name, e.g. Super ${word}`, nameFor: (title: string) => `Trophy name for ${title}`,
    reset: "Back to default", resetDone: "The default has been filled in. Tap Save to use it.",
    undo: "Undo", save: "Save",
  },
  uk: {
    saveFailed: "Не вдалося зберегти.", saved: "Збережено", range: "Суми мають бути від 0 до 1000 kr.",
    trophiesOn: "Трофеї увімкнено", trophiesOff: "Трофеї вимкнено", prizesOn: "Призи увімкнено", prizesOff: "Призи вимкнено",
    title: "Трофеї та призи", desc: "Діти отримують трофей за кожне завдання, коли виконають його достатньо разів. Трофеї ніколи не зникають.",
    showTrophies: "Трофеї", showTrophiesDesc: "Шафа з трофеями на дитячій сторінці, з рівнями для кожного завдання.",
    prizes: "Призи (гроші)", prizesDesc: "Гроші, які автоматично додаються до того, що належить дитині, коли досягнуто рівня чи етапу.",
    now: (o: { level: string; big: string; bigEvery: number; payFrom: number; totals: string; trophies: boolean }) => (
      <>
        Зараз:{" "}
        {o.trophies && (
          <>
            <strong className="text-foreground">{o.level}</strong> за рівень{o.payFrom > 1 ? `, починаючи з рівня ${o.payFrom}` : ""}
            {o.bigEvery > 0 && (
              <>
                {" "}і <strong className="text-foreground">{o.big}</strong> за кожен {o.bigEvery}-й рівень
              </>
            )}
            {o.totals ? ", плюс " : ". "}
          </>
        )}
        {o.totals ? `бонус за ${o.totals} завдань разом. ` : ""}
        Рівні, які діти вже пройшли, не оплачуються заднім числом.
      </>
    ),
    prizesOffText: "Діти отримують трофеї та значки, але без грошей.",
    settings: "Рівні та призи", settingsDesc: "Скільки разів потрібно для кожного рівня, суми та завдання, що дають гроші",
    levels: "Кількість разів для рівня", level: (n: number) => `Рівень ${n}`,
    levelsHint: "Кожен рівень має вимагати більше разів, ніж попередній. Порожні поля в кінці буде прибрано.",
    levelsBad: "Рівні мають бути цілими числами, без пропусків, і кожен більший за попередній.",
    prizePerLevel: "Приз за рівень", normal: "Звичайний рівень", big: "Великий приз", bigEvery: "Великий приз кожен", never: "Ніколи", nth: (n: number) => `${n}-й рівень`,
    payFrom: "Гроші починаючи з", fromLevel: (n: number) => `Рівень ${n}`, payFromHint: "Нижчі рівні дають трофей, але без грошей.",
    total: "Бонус за завдання разом", tasksN: (n: number) => `${n} завдань`, emptyNoBonus: "Залиште поле порожнім, якщо без бонусу.",
    perTask: "Трофей за завдання", perTaskDesc: "Дає гроші, коли дитина досягає нового рівня",
    namePlaceholder: (word: string) => `Назва трофея, напр. Супер-${word}`, nameFor: (title: string) => `Назва трофея для ${title}`,
    reset: "Повернути стандартні", resetDone: "Стандартні значення заповнено. Натисніть «Зберегти», щоб застосувати.",
    undo: "Скасувати", save: "Зберегти",
  },
};

// Trofeer og premier har hver sin bryter. Under «Nivåer og premier» kan
// familien endre hvor mange ganger hvert nivå krever, beløpene, fra hvilket
// nivå det gis penger og hvor ofte en stor premie kommer. Standarden er
// DEFAULT_TROPHY_SETTINGS, og «Tilbake til standard» fyller den inn igjen.
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
  // Nivåfeltene redigeres som tekst, så et felt kan være tomt underveis.
  const [levelText, setLevelText] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  if (!familyId || !settings.data) return <ListSkeleton rows={3} />;
  const s = settings.data;
  const d: TrophySettings = draft ?? { ...DEFAULT_TROPHY_SETTINGS, ...s, totals: { ...DEFAULT_TROPHY_SETTINGS.totals, ...(s.totals ?? {}) } };
  const taskList = (tasks.data ?? []).filter((x) => x.active);
  const trophiesOn = !s.hidden;
  const levelInputs = levelText ?? Array.from({ length: MAX_LEVELS }, (_, i) => (trophyLevels(d)[i] ? String(trophyLevels(d)[i]) : ""));
  const filledLevels = levelInputs.filter((v) => v.trim()).length;
  const dirty = draft !== null || levelText !== null;

  const store = async (next: TrophySettings, text: string) => {
    setSaving(true);
    try {
      const res = await supabase.from("families").update({ trophy_settings: next }).eq("id", familyId);
      if (res.error) throw new Error(res.error.message);
      await settings.mutate(next, { revalidate: false });
      setDraft(null);
      setLevelText(null);
      toast({ text });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.saveFailed) });
    } finally {
      setSaving(false);
    }
  };

  // Bryterne lagrer med en gang. Premier på første gang: standardbeløpene fylles inn.
  const togglePrizes = (on: boolean) =>
    void store(
      on ? { ...DEFAULT_TROPHY_SETTINGS, ...s, totals: s.totals && Object.keys(s.totals).length ? s.totals : DEFAULT_TROPHY_SETTINGS.totals, enabled: true } : { ...s, enabled: false },
      on ? t.prizesOn : t.prizesOff
    );
  const toggleTrophies = (on: boolean) => void store({ ...s, hidden: !on }, on ? t.trophiesOn : t.trophiesOff);

  const edit = (patch: Partial<TrophySettings>) => setDraft({ ...d, ...patch });
  const setKr = (field: "level_ore" | "big_ore", value: string) => {
    const ore = parseKrToOre(value);
    edit({ [field]: typeof ore === "number" ? ore : 0 });
  };
  const setTotal = (n: number, value: string) => {
    const ore = parseKrToOre(value);
    edit({ totals: { ...(d.totals ?? {}), [String(n)]: typeof ore === "number" ? ore : 0 } });
  };
  const setTaskOn = (id: string, on: boolean) => {
    const off = new Set(d.task_off ?? []);
    if (on) off.delete(id);
    else off.add(id);
    edit({ task_off: [...off] });
  };
  const setName = (id: string, name: string) => edit({ names: { ...(d.names ?? {}), [id]: name.slice(0, 30) } });
  const setLevel = (i: number, value: string) => {
    const next = [...levelInputs];
    next[i] = value.replace(/\D/g, "").slice(0, 5);
    setLevelText(next);
  };

  // Standard for nivåer og beløp. Navn og hvilke oppgaver som gir penger beholdes.
  const reset = () => {
    setDraft({ ...d, ...DEFAULT_TROPHY_SETTINGS, totals: { ...DEFAULT_TROPHY_SETTINGS.totals } });
    setLevelText(null);
    toast({ text: t.resetDone });
  };

  const save = () => {
    const tooBig = [d.level_ore ?? 0, d.big_ore ?? 0, ...Object.values(d.totals ?? {})].some((v) => v < 0 || v > 100000);
    if (tooBig) return toast({ kind: "error", text: t.range });
    let levels = trophyLevels(d);
    if (levelText) {
      const trimmed = [...levelText];
      while (trimmed.length && !trimmed[trimmed.length - 1].trim()) trimmed.pop();
      const nums = trimmed.map((v) => Number(v));
      const ok = nums.length > 0 && nums.every((n, i) => Number.isInteger(n) && n > 0 && (i === 0 || n > nums[i - 1]));
      if (!ok) return toast({ kind: "error", text: t.levelsBad });
      levels = nums;
    }
    void store({ ...d, levels, pay_from: Math.min(payFrom(d), levels.length), enabled: s.enabled, hidden: s.hidden }, t.saved);
  };

  const totalsOn = TOTAL_MILESTONES.filter((n) => (s.totals?.[String(n)] ?? 0) > 0).join(", ");

  return (
    <section className="space-y-5">
      <Card>
        <CardHeader icon={<Trophy className="size-5" />} title={t.title} description={t.desc} />
        <div className="space-y-2">
          <div className="rounded-2xl bg-secondary px-4 py-3.5">
            <Switch checked={trophiesOn} disabled={saving} onChange={toggleTrophies} label={t.showTrophies} description={t.showTrophiesDesc} />
          </div>
          <div className="rounded-2xl bg-secondary px-4 py-3.5">
            <Switch checked={Boolean(s.enabled)} disabled={saving} onChange={togglePrizes} label={t.prizes} description={t.prizesDesc} />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {s.enabled
            ? t.now({ level: formatKr(s.level_ore ?? 0, lang), big: formatKr(s.big_ore ?? 0, lang), bigEvery: bigEvery(s), payFrom: payFrom(s), totals: totalsOn, trophies: trophiesOn })
            : t.prizesOffText}
        </p>
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
            {trophiesOn && (
              <div>
                <h3 className="mb-2 font-bold">{t.levels}</h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {levelInputs.map((v, i) => (
                    <Field key={i} label={t.level(i + 1)}>
                      <Input value={v} onChange={(e) => setLevel(i, e.target.value)} inputMode="numeric" placeholder="–" className="font-num text-center" />
                    </Field>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.levelsHint}</p>
              </div>
            )}

            {trophiesOn && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-bold">
                  <Coins className="size-4 text-primary" /> {t.prizePerLevel}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.normal}>
                    <KrInput value={kr(d.level_ore)} onChange={(v) => setKr("level_ore", v)} />
                  </Field>
                  <Field label={t.big}>
                    <KrInput value={kr(d.big_ore)} onChange={(v) => setKr("big_ore", v)} />
                  </Field>
                  <Field label={t.bigEvery}>
                    <Select value={String(bigEvery(d))} onChange={(e) => edit({ big_every: Number(e.target.value) })}>
                      {BIG_CHOICES.map((n) => (
                        <option key={n} value={n}>
                          {n === 0 ? t.never : t.nth(n)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={t.payFrom}>
                    <Select value={String(Math.min(payFrom(d), Math.max(filledLevels, 1)))} onChange={(e) => edit({ pay_from: Number(e.target.value) })}>
                      {Array.from({ length: Math.max(filledLevels, 1) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {t.fromLevel(n)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.payFromHint}</p>
              </div>
            )}

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

            {trophiesOn && (
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
            )}

            <Button variant="ghost" block icon={<RotateCcw className="size-4" />} onClick={reset}>
              {t.reset}
            </Button>

            {dirty && (
              <div className="sticky bottom-24 flex gap-2 md:bottom-4">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    setDraft(null);
                    setLevelText(null);
                  }}
                >
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
