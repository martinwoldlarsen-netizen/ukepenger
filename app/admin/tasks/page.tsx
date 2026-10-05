"use client";

import { useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, ListSkeleton, Switch, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { type AdminTask, friendlyError, useAdminIdentity, useTasks } from "@/lib/admin-data";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { kidColor } from "@/app/kids/_lib/palette";
import { TASK_PACKS, type TaskPack } from "@/lib/task-packs";

const SUGGESTIONS = TASK_PACKS.flatMap((p) => p.tasks).slice(0, 8);

export default function AdminTasksPage() {
  const toast = useToast();
  const confirm = useConfirm();
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

  const [addingPack, setAddingPack] = useState<string | null>(null);

  // Legger til oppgavene i pakken som familien ikke allerede har.
  const addPack = async (pack: TaskPack) => {
    if (!familyId || addingPack) return;
    const missing = pack.tasks.filter((t) => !existingTitles.has(t.title.toLowerCase()));
    if (missing.length === 0) return;
    setAddingPack(pack.key);
    const res = await supabase
      .from("tasks")
      .insert(missing.map((t) => ({ family_id: familyId, title: t.title, amount_ore: t.kr * 100, active: true })));
    setAddingPack(null);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å legge til pakken.") });
      return;
    }
    toast({ text: `${pack.emoji} ${missing.length} oppgaver lagt til` });
    await tasks.mutate();
  };

  // Endre oppgave: ett kort om gangen åpnes for redigering.
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = (task: AdminTask) => {
    setEditing(task.id);
    setEditTitle(task.title);
    setEditAmount(String(task.amount_ore / 100).replace(".", ","));
  };

  const saveEdit = async (task: AdminTask) => {
    const amountOre = parseKrToOre(editAmount);
    if (!editTitle.trim()) {
      toast({ kind: "error", text: "Skriv hva oppgaven er." });
      return;
    }
    if (amountOre === null || amountOre === "invalid") {
      toast({ kind: "error", text: "Skriv beløpet som et tall, f.eks. 25." });
      return;
    }
    setEditSaving(true);
    const patch = { title: editTitle.trim(), amount_ore: amountOre };
    const res = await supabase.from("tasks").update(patch).eq("id", task.id);
    setEditSaving(false);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å lagre.") });
      return;
    }
    await tasks.mutate((current) => (current ?? []).map((t) => (t.id === task.id ? { ...t, ...patch } : t)), { revalidate: false });
    setEditing(null);
    toast({ text: `Lagret: ${patch.title} · ${formatKr(amountOre)}` });
  };

  // «Slett» arkiverer: oppgaven forsvinner for alle, men barnas historikk og
  // penger for oppgaven blir stående (en ekte sletting ville fjernet dem).
  const deleteTask = async (task: AdminTask) => {
    const ok = await confirm({
      title: `Slette «${task.title}»?`,
      text: "Oppgaven forsvinner for barna. Det barna allerede har tjent på den, blir stående.",
      confirmLabel: "Slett",
      danger: true,
    });
    if (!ok) return;
    const res = await supabase.from("tasks").update({ active: false, archived_at: new Date().toISOString() }).eq("id", task.id);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å slette.") });
      return;
    }
    setEditing(null);
    await tasks.mutate((current) => (current ?? []).filter((t) => t.id !== task.id), { revalidate: false });
    toast({ text: `«${task.title}» er slettet` });
  };

  const [openPack, setOpenPack] = useState<string | null>(null);
  const [addingOne, setAddingOne] = useState<string | null>(null);

  const addOne = async (t: { title: string; kr: number }) => {
    if (!familyId || addingOne) return;
    setAddingOne(t.title);
    const res = await supabase.from("tasks").insert({ family_id: familyId, title: t.title, amount_ore: t.kr * 100, active: true });
    setAddingOne(null);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å legge til.") });
      return;
    }
    toast({ text: `«${t.title}» er lagt til` });
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
            if (editing === task.id) {
              return (
                <li key={task.id} className="animate-pop rounded-3xl bg-card p-5 shadow-sm ring-2 ring-primary/30 sm:col-span-2">
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveEdit(task);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold tracking-tight">Endre oppgave</h2>
                      <button type="button" aria-label="Lukk" onClick={() => setEditing(null)} className="flex size-11 items-center justify-center rounded-full hover:bg-secondary">
                        <X className="size-5" />
                      </button>
                    </div>
                    <Field label="Hva skal gjøres?">
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={60} />
                    </Field>
                    <Field label="Hvor mye får barnet?" hint="Krav som allerede er sendt, beholder den gamle prisen.">
                      <span className="relative block">
                        <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} inputMode="decimal" className="pr-12" autoFocus />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
                      </span>
                    </Field>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="dangerSoft" size="lg" icon={<Trash2 className="size-4" />} onClick={() => void deleteTask(task)}>
                        Slett oppgave
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="lg" className="flex-1 sm:flex-none" onClick={() => setEditing(null)}>
                          Avbryt
                        </Button>
                        <Button type="submit" size="lg" className="flex-1 sm:flex-none" loading={editSaving}>
                          Lagre
                        </Button>
                      </div>
                    </div>
                  </form>
                </li>
              );
            }
            return (
              <li
                key={task.id}
                className="flex flex-col justify-between gap-4 rounded-3xl p-5 shadow-sm ring-1 ring-black/5 transition"
                style={task.active ? { background: color.bg, color: color.ink } : undefined}
              >
                <button
                  type="button"
                  onClick={() => startEdit(task)}
                  aria-label={`Endre ${task.title}`}
                  className={cx("-m-2 flex items-start justify-between gap-3 rounded-2xl p-2 text-left transition active:scale-[0.99]", focusRing, task.active ? "" : "opacity-60")}
                >
                  <span>
                    <span className="block text-xl font-extrabold leading-tight tracking-tight">{task.title}</span>
                    <span className="font-num mt-1 block text-lg font-bold">{formatKr(task.amount_ore)}</span>
                  </span>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/70 text-foreground">
                    <Pencil className="size-4" />
                  </span>
                </button>
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
      <div>
        <h2 className="text-lg font-bold tracking-tight">Inspirasjon</h2>
        <p className="mb-3 text-sm text-muted-foreground">Trykk på en pakke for å velge oppgaver. Du kan endre pris etterpå.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {TASK_PACKS.map((pack) => {
            const missing = pack.tasks.filter((t) => !existingTitles.has(t.title.toLowerCase()));
            const open = openPack === pack.key;
            return (
              <div key={pack.key} className={cx("rounded-3xl border bg-card shadow-sm transition", open ? "border-primary/40 md:col-span-2" : "border-border")}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenPack(open ? null : pack.key)}
                  className={cx("flex w-full items-center gap-3 rounded-3xl p-4 text-left", focusRing)}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl" aria-hidden="true">
                    {pack.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold">{pack.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {pack.tasks.length} oppgaver{missing.length < pack.tasks.length ? ` · ${pack.tasks.length - missing.length} lagt til` : ""}
                    </span>
                  </span>
                  <ChevronDown className={cx("size-5 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="animate-pop space-y-2 px-4 pb-4">
                    <ul className="divide-y divide-border rounded-2xl bg-secondary/60">
                      {pack.tasks.map((t) => {
                        const added = existingTitles.has(t.title.toLowerCase());
                        return (
                          <li key={t.title} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold">{t.title}</span>
                              <span className="font-num block text-sm text-muted-foreground">{t.kr} kr</span>
                            </span>
                            {added ? (
                              <span className="flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-primary">
                                <Check className="size-4" /> Lagt til
                              </span>
                            ) : (
                              <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} loading={addingOne === t.title} disabled={Boolean(addingOne)} onClick={() => void addOne(t)} className="min-h-11">
                                Legg til
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {missing.length > 1 && (
                      <Button block size="lg" icon={<Plus className="size-5" />} loading={addingPack === pack.key} onClick={() => void addPack(pack)}>
                        {missing.length === pack.tasks.length ? "Legg til alle" : `Legg til de ${missing.length} andre`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
