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

const kr = (ore?: number) => (ore ? String(ore / 100).replace(".", ",") : "");

// Trofeer: automatisk som standard. Foreldre slår det på, og kan åpne
// «Innstillinger» for å endre beløp, navn og hvilke oppgaver som gir penger.
export default function AdminTrophiesPage() {
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
  const taskList = (tasks.data ?? []).filter((t) => t.active);

  const store = async (next: TrophySettings, text: string) => {
    setSaving(true);
    try {
      const res = await supabase.from("families").update({ trophy_settings: next }).eq("id", familyId);
      if (res.error) throw new Error(res.error.message);
      await settings.mutate(next, { revalidate: false });
      setDraft(null);
      toast({ text });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre.") });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (on: boolean) =>
    void store(
      on ? { ...DEFAULT_TROPHY_SETTINGS, ...s, totals: s.totals && Object.keys(s.totals).length ? s.totals : DEFAULT_TROPHY_SETTINGS.totals, enabled: true } : { ...s, enabled: false },
      on ? "Trofeer gir nå penger" : "Trofeer gir ikke lenger penger"
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
      toast({ kind: "error", text: "Beløpene må være mellom 0 og 1000 kr." });
      return;
    }
    void store({ ...d, enabled: s.enabled }, "Lagret");
  };

  return (
    <section className="space-y-5">
      <Card>
        <CardHeader
          icon={<Trophy className="size-5" />}
          title="Trofeer"
          description="Hver oppgave har nivåer. Barnet får et trofé når det har gjort oppgaven 5, 10, 20, 35, 50 … ganger, og trofeene står alltid i trofeskapet."
        />
        <div className="rounded-2xl bg-secondary px-4 py-3.5">
          <Switch
            checked={Boolean(s.enabled)}
            disabled={saving}
            onChange={toggle}
            label="Trofeer gir penger"
            description="Pengene går automatisk til det barnet har til gode."
          />
        </div>
        {s.enabled ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nå: <strong className="text-foreground">{formatKr(s.level_ore ?? 0)}</strong> per nivå og <strong className="text-foreground">{formatKr(s.big_ore ?? 0)}</strong> hvert 5. nivå, pluss bonus ved{" "}
            {TOTAL_MILESTONES.filter((n) => (s.totals?.[String(n)] ?? 0) > 0).join(", ")} oppgaver til sammen. Nivåer barna allerede har passert, gir ikke penger i ettertid.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Barna får trofeer uansett. Slå på for at trofeene også gir penger.</p>
        )}
      </Card>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={cx("flex w-full items-center justify-between gap-3 rounded-3xl p-5 text-left", focusRing)}>
          <span>
            <span className="block text-lg font-bold">Innstillinger</span>
            <span className="block text-sm text-muted-foreground">Beløp, navn på trofeer og hvilke oppgaver som gir penger</span>
          </span>
          <ChevronDown className={cx("size-5 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
        </button>
        {open && (
          <div className="animate-pop space-y-6 px-5 pb-5">
            <div>
              <h3 className="mb-2 font-bold">Bonus per nivå</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vanlig nivå">
                  <KrInput value={kr(d.level_ore)} onChange={(v) => setKr("level_ore", v)} />
                </Field>
                <Field label="Hvert 5. nivå">
                  <KrInput value={kr(d.big_ore)} onChange={(v) => setKr("big_ore", v)} />
                </Field>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Nivåene kommer etter {TROPHY_LEVELS.slice(0, 8).join(", ")} … ganger.</p>
            </div>

            <div>
              <h3 className="mb-2 font-bold">Oppgaver til sammen</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TOTAL_MILESTONES.map((n) => (
                  <Field key={n} label={`${n} oppgaver`}>
                    <KrInput value={kr(d.totals?.[String(n)])} onChange={(v) => setTotal(n, v)} />
                  </Field>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">La feltet stå tomt for ingen bonus.</p>
            </div>

            <div>
              <h3 className="mb-2 font-bold">Trofé per oppgave</h3>
              <ul className="divide-y divide-border rounded-2xl bg-secondary/60">
                {taskList.map((t) => (
                  <li key={t.id} className="space-y-2 px-4 py-3">
                    <Switch
                      checked={!(d.task_off ?? []).includes(t.id)}
                      onChange={(on) => setTaskOn(t.id, on)}
                      label={`${taskEmoji(t.title)} ${t.title}`}
                      description="Gir penger når barnet når et nytt nivå"
                    />
                    <Input value={d.names?.[t.id] ?? ""} onChange={(e) => setName(t.id, e.target.value)} placeholder={`Navn på trofeet, f.eks. Super-${t.title.split(" ").pop()?.toLowerCase()}`} aria-label={`Navn på trofeet for ${t.title}`} />
                  </li>
                ))}
              </ul>
            </div>

            {draft && (
              <div className="sticky bottom-24 flex gap-2 md:bottom-4">
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => setDraft(null)}>
                  Angre
                </Button>
                <Button size="lg" className="flex-1" loading={saving} onClick={save}>
                  Lagre
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
