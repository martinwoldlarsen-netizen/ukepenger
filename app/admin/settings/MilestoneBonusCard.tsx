"use client";

import { useState } from "react";
import useSWR from "swr";
import { Medal } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, Switch } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { friendlyError, swrDefaults } from "@/lib/admin-data";
import { parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

const MILESTONES = [10, 50, 100] as const;
const SUGGESTED: Record<number, number> = { 10: 1000, 50: 5000, 100: 10000 };

type Bonuses = Record<string, number>;

// Bonus når barnet når 10, 50 og 100 godkjente oppgaver. Barnet ser bonusen
// på merket før det når den. Gis automatisk, én gang per milepæl.
export function MilestoneBonusCard({ familyId }: { familyId: string }) {
  const toast = useToast();
  const { data, mutate } = useSWR(
    ["milestone-bonus", familyId],
    async () => {
      const res = await supabase.from("families").select("milestone_bonus_ore").eq("id", familyId).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return (res.data?.milestone_bonus_ore ?? {}) as Bonuses;
    },
    swrDefaults
  );
  const [draft, setDraft] = useState<Record<number, string> | null>(null);
  const [saving, setSaving] = useState(false);

  if (!data) return null;
  const on = Object.values(data).some((v) => Number(v) > 0);
  const values = draft ?? Object.fromEntries(MILESTONES.map((m) => [m, data[m] ? String(data[m] / 100) : ""]));

  const store = async (next: Bonuses, text: string) => {
    setSaving(true);
    try {
      const res = await supabase.from("families").update({ milestone_bonus_ore: next }).eq("id", familyId);
      if (res.error) throw new Error(res.error.message);
      await mutate(next, { revalidate: false });
      setDraft(null);
      toast({ text });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre.") });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (next: boolean) =>
    void store(next ? Object.fromEntries(MILESTONES.map((m) => [String(m), SUGGESTED[m]])) : {}, next ? "Bonus for milepæler er på" : "Bonus for milepæler er av");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Bonuses = {};
    for (const m of MILESTONES) {
      const raw = (values[m] ?? "").trim();
      if (!raw) continue;
      const ore = parseKrToOre(raw);
      if (ore === null || ore === "invalid" || ore < 0 || ore > 100000) {
        toast({ kind: "error", text: "Skriv et beløp mellom 0 og 1000 kr." });
        return;
      }
      if (ore > 0) next[String(m)] = ore;
    }
    void store(next, "Lagret");
  };

  return (
    <Card>
      <CardHeader icon={<Medal className="size-5" />} title="Bonus for milepæler" description="Barnet får en bonus når det når 10, 50 og 100 oppgaver. Bonusen vises på merket, så barnet vet hva det jobber mot." />
      <div className="rounded-2xl bg-secondary px-4 py-3.5">
        <Switch checked={on} disabled={saving} onChange={toggle} label="Gi bonus for milepæler" description="Gis automatisk, én gang per barn og milepæl." />
      </div>
      {on && (
        <form onSubmit={save} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {MILESTONES.map((m) => (
              <Field key={m} label={`${m} oppgaver`}>
                <div className="relative">
                  <Input
                    value={values[m] ?? ""}
                    onChange={(e) => setDraft({ ...values, [m]: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                    className="pr-10"
                    aria-label={`Bonus for ${m} oppgaver i kroner`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                </div>
              </Field>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Barn som allerede har passert en milepæl, får bonusen fra neste milepæl.</p>
          {draft && (
            <Button type="submit" loading={saving}>
              Lagre beløp
            </Button>
          )}
        </form>
      )}
    </Card>
  );
}
