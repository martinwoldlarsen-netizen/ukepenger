"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, ListSkeleton, Switch } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { type AdminTask, friendlyError, useAdminIdentity, useTasks } from "@/lib/admin-data";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { kidColor } from "@/app/kids/_lib/palette";

const SUGGESTIONS = [
  { title: "Rydde rommet", kr: 25 },
  { title: "Ta oppvasken", kr: 20 },
  { title: "Ta ut søppel", kr: 15 },
  { title: "Støvsuge", kr: 30 },
  { title: "Dekke bordet", kr: 10 },
];

export default function AdminTasksPage() {
  const toast = useToast();
  const { familyId } = useAdminIdentity();
  const tasks = useTasks(familyId);

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const list = [...(tasks.data ?? [])].sort((a, b) => Number(b.active) - Number(a.active));
  const existingTitles = new Set(list.map((t) => t.title.toLowerCase()));

  const createTask = async () => {
    if (!familyId || saving) return;
    const amountOre = parseKrToOre(amount);
    if (!title.trim()) {
      toast({ kind: "error", text: "Skriv hva oppgaven er." });
      return;
    }
    if (amountOre === null || amountOre === "invalid") {
      toast({ kind: "error", text: "Skriv beløpet som et tall, f.eks. 25." });
      return;
    }
    setSaving(true);
    const res = await supabase.from("tasks").insert({ family_id: familyId, title: title.trim(), amount_ore: amountOre, active: true });
    setSaving(false);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å lage oppgaven.") });
      return;
    }
    toast({ text: `«${title.trim()}» er lagt til` });
    setTitle("");
    setAmount("");
    setFormOpen(false);
    await tasks.mutate();
  };

  const toggleActive = async (task: AdminTask) => {
    if (toggling[task.id]) return;
    setToggling((prev) => ({ ...prev, [task.id]: true }));
    try {
      await tasks.mutate(
        async (current) => {
          const res = await supabase.from("tasks").update({ active: !task.active }).eq("id", task.id);
          if (res.error) throw new Error(res.error.message);
          return (current ?? []).map((t) => (t.id === task.id ? { ...t, active: !task.active } : t));
        },
        {
          optimisticData: (current) => (current ?? []).map((t) => (t.id === task.id ? { ...t, active: !task.active } : t)),
          rollbackOnError: true,
          revalidate: false,
        }
      );
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre.") });
    } finally {
      setToggling((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

  if (!familyId || (tasks.isLoading && !tasks.data)) return <ListSkeleton rows={4} />;

  return (
    <section className="space-y-5">
      {formOpen ? (
        <Card className="animate-pop space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Ny oppgave</h2>
            <button type="button" aria-label="Lukk" onClick={() => setFormOpen(false)} className="flex size-10 items-center justify-center rounded-full hover:bg-secondary">
              <X className="size-5" />
            </button>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createTask();
            }}
          >
            <Field label="Hva skal gjøres?">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Rydde rommet" autoFocus maxLength={60} />
            </Field>
            <Field label="Hvor mye får barnet?">
              <span className="relative block">
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25" inputMode="decimal" className="pr-12" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
              </span>
            </Field>
            {SUGGESTIONS.some((s) => !existingTitles.has(s.title.toLowerCase())) && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/85">Forslag</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.filter((s) => !existingTitles.has(s.title.toLowerCase())).map((s) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => {
                        setTitle(s.title);
                        setAmount(String(s.kr));
                      }}
                      className="min-h-10 rounded-full bg-secondary px-4 text-sm font-semibold transition hover:bg-accent"
                    >
                      {s.title} · {s.kr} kr
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button type="submit" block size="lg" loading={saving} disabled={!title.trim() || !amount.trim()}>
              Legg til oppgave
            </Button>
          </form>
        </Card>
      ) : (
        <Button size="lg" block icon={<Plus className="size-5" />} onClick={() => setFormOpen(true)}>
          Ny oppgave
        </Button>
      )}

      {list.length === 0 ? (
        <EmptyState emoji="🧹" title="Ingen oppgaver ennå">
          Lag den første, så kan barna begynne å tjene penger.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((task, index) => {
            const color = kidColor(index);
            return (
              <li
                key={task.id}
                className="flex flex-col justify-between gap-4 rounded-3xl p-5 shadow-sm ring-1 ring-black/5 transition"
                style={task.active ? { background: color.bg, color: color.ink } : undefined}
              >
                <div className={task.active ? "" : "opacity-60"}>
                  <p className="text-xl font-extrabold leading-tight tracking-tight">{task.title}</p>
                  <p className="font-num mt-1 text-lg font-bold">{formatKr(task.amount_ore)}</p>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3 text-foreground">
                  <Switch
                    checked={task.active}
                    disabled={toggling[task.id]}
                    onChange={() => void toggleActive(task)}
                    label={task.active ? "Synlig for barna" : "Skjult for barna"}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
