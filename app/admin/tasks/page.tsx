"use client";

import { TaskIcon } from "@/components/TaskIcon";
import { useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Field, Input, ListSkeleton, Select, Switch, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { type AdminTask, friendlyError, useAdminIdentity, useTasks } from "@/lib/admin-data";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { OTHER_CATEGORY, TASK_PACKS, categoryOf, type PackTask } from "@/lib/task-packs";

type Category = { key: string; title: string; emoji: string; tasks: PackTask[] };
const CATEGORIES: Category[] = [...TASK_PACKS, { ...OTHER_CATEGORY, tasks: [] }];

// Oppgaver gruppert i kategorier. Kategorier familien bruker vises; resten kan
// hentes frem under «Flere kategorier». Hver kategori har egne oppgaver,
// forslag å legge til, og en + for egne oppgaver.
export default function AdminTasksPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const tasks = useTasks(familyId);

  const [open, setOpen] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  // Ny egen oppgave (i kategorien som er åpen)
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");

  // Endre oppgave
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const list = tasks.data ?? [];
  const existingTitles = new Set(list.map((t) => t.title.toLowerCase()));
  const byCategory: Record<string, AdminTask[]> = {};
  for (const t of list) (byCategory[categoryOf(t)] ??= []).push(t);
  for (const k of Object.keys(byCategory)) byCategory[k].sort((a, b) => Number(b.active) - Number(a.active) || a.title.localeCompare(b.title, "nb"));

  const used = CATEGORIES.filter((c) => (byCategory[c.key]?.length ?? 0) > 0);
  const unused = CATEGORIES.filter((c) => !byCategory[c.key]?.length && c.key !== OTHER_CATEGORY.key);

  const insert = async (rows: Array<{ title: string; amount_ore: number; category: string }>, text: string) => {
    if (!familyId) return false;
    const res = await supabase.from("tasks").insert(rows.map((r) => ({ ...r, family_id: familyId, active: true })));
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å legge til.") });
      return false;
    }
    toast({ text });
    await tasks.mutate();
    return true;
  };

  const addSuggestion = async (cat: Category, t: PackTask) => {
    setBusy(t.title);
    await insert([{ title: t.title, amount_ore: t.kr * 100, category: cat.key }], `«${t.title}» er lagt til`);
    setBusy(null);
  };

  const addAll = async (cat: Category, missing: PackTask[]) => {
    setBusy(`all-${cat.key}`);
    await insert(missing.map((t) => ({ title: t.title, amount_ore: t.kr * 100, category: cat.key })), `${cat.emoji} ${missing.length} oppgaver lagt til`);
    setBusy(null);
  };

  const addOwn = async (cat: Category) => {
    const amountOre = parseKrToOre(newAmount);
    if (!newTitle.trim()) return toast({ kind: "error", text: "Skriv hva oppgaven er." });
    if (amountOre === null || amountOre === "invalid") return toast({ kind: "error", text: "Skriv beløpet som et tall, f.eks. 25." });
    setBusy(`own-${cat.key}`);
    const ok = await insert([{ title: newTitle.trim(), amount_ore: amountOre, category: cat.key }], `«${newTitle.trim()}» er lagt til`);
    setBusy(null);
    if (ok) {
      setAdding(null);
      setNewTitle("");
      setNewAmount("");
    }
  };

  const startEdit = (task: AdminTask) => {
    setEditing(task.id);
    setEditTitle(task.title);
    setEditAmount(String(task.amount_ore / 100).replace(".", ","));
    setEditCategory(categoryOf(task));
  };

  const saveEdit = async (task: AdminTask) => {
    const amountOre = parseKrToOre(editAmount);
    if (!editTitle.trim()) return toast({ kind: "error", text: "Skriv hva oppgaven er." });
    if (amountOre === null || amountOre === "invalid") return toast({ kind: "error", text: "Skriv beløpet som et tall, f.eks. 25." });
    setBusy(`edit-${task.id}`);
    const patch = { title: editTitle.trim(), amount_ore: amountOre, category: editCategory };
    const res = await supabase.from("tasks").update(patch).eq("id", task.id);
    setBusy(null);
    if (res.error) return toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å lagre.") });
    await tasks.mutate((current) => (current ?? []).map((t) => (t.id === task.id ? { ...t, ...patch } : t)), { revalidate: false });
    setEditing(null);
    if (editCategory !== categoryOf(task)) setOpen(editCategory);
    toast({ text: `Lagret: ${patch.title} · ${formatKr(amountOre)}` });
  };

  // «Slett» arkiverer: barnas historikk og penger for oppgaven blir stående.
  const deleteTask = async (task: AdminTask) => {
    const ok = await confirm({
      title: `Slette «${task.title}»?`,
      text: "Oppgaven forsvinner for barna. Det barna allerede har tjent på den, blir stående.",
      confirmLabel: "Slett",
      danger: true,
    });
    if (!ok) return;
    const res = await supabase.from("tasks").update({ active: false, archived_at: new Date().toISOString() }).eq("id", task.id);
    if (res.error) return toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å slette.") });
    setEditing(null);
    await tasks.mutate((current) => (current ?? []).filter((t) => t.id !== task.id), { revalidate: false });
    toast({ text: `«${task.title}» er slettet` });
  };

  const toggleActive = async (task: AdminTask) => {
    if (toggling[task.id]) return;
    setToggling((p) => ({ ...p, [task.id]: true }));
    try {
      await tasks.mutate(
        async (current) => {
          const res = await supabase.from("tasks").update({ active: !task.active }).eq("id", task.id);
          if (res.error) throw new Error(res.error.message);
          return (current ?? []).map((t) => (t.id === task.id ? { ...t, active: !task.active } : t));
        },
        { optimisticData: (current) => (current ?? []).map((t) => (t.id === task.id ? { ...t, active: !task.active } : t)), rollbackOnError: true, revalidate: false }
      );
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre.") });
    } finally {
      setToggling((p) => {
        const n = { ...p };
        delete n[task.id];
        return n;
      });
    }
  };

  if (!familyId || (tasks.isLoading && !tasks.data)) return <ListSkeleton rows={4} />;

  const renderCategory = (cat: Category) => {
    const mine = byCategory[cat.key] ?? [];
    const missing = cat.tasks.filter((t) => !existingTitles.has(t.title.toLowerCase()));
    const isOpen = open === cat.key;
    const hidden = mine.filter((t) => !t.active).length;
    return (
      <div key={cat.key} className={cx("rounded-3xl border bg-card shadow-sm transition", isOpen ? "border-primary/40" : "border-border")}>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => {
            setOpen(isOpen ? null : cat.key);
            setAdding(null);
            setEditing(null);
          }}
          className={cx("flex min-h-16 w-full items-center gap-3 rounded-3xl p-4 text-left", focusRing)}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl" aria-hidden="true">
            {cat.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold">{cat.title}</span>
            <span className="block text-sm text-muted-foreground">
              {mine.length ? `${mine.length} ${mine.length === 1 ? "oppgave" : "oppgaver"}${hidden ? ` · ${hidden} skjult` : ""}` : `${cat.tasks.length} forslag`}
            </span>
          </span>
          <ChevronDown className={cx("size-5 shrink-0 text-muted-foreground transition", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="animate-pop space-y-4 px-4 pb-4">
            {mine.length > 0 && (
              <ul className="space-y-2">
                {mine.map((task) =>
                  editing === task.id ? (
                    <li key={task.id} className="rounded-2xl bg-secondary/70 p-4">
                      <form
                        className="space-y-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void saveEdit(task);
                        }}
                      >
                        <Field label="Hva skal gjøres?">
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={60} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Beløp">
                            <span className="relative block">
                              <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} inputMode="decimal" className="pr-10" autoFocus />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                            </span>
                          </Field>
                          <Field label="Kategori">
                            <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                              {CATEGORIES.map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.emoji} {c.title}
                                </option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                        <p className="text-xs text-muted-foreground">Krav som allerede er sendt, beholder den gamle prisen.</p>
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1" onClick={() => setEditing(null)}>
                            Avbryt
                          </Button>
                          <Button type="submit" className="flex-1" loading={busy === `edit-${task.id}`}>
                            Lagre
                          </Button>
                        </div>
                        <Button variant="dangerSoft" block icon={<Trash2 className="size-4" />} onClick={() => void deleteTask(task)}>
                          Slett oppgave
                        </Button>
                      </form>
                    </li>
                  ) : (
                    <li key={task.id} className={cx("flex items-center gap-3 rounded-2xl border border-border px-3 py-2.5", !task.active && "bg-secondary/50")}>
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        aria-label={`Endre ${task.title}`}
                        className={cx("flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl text-left", focusRing, !task.active && "opacity-60")}
                      >
                        <TaskIcon title={task.title} size={44} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{task.title}</span>
                          <span className="font-num block text-sm text-muted-foreground">{formatKr(task.amount_ore)}</span>
                        </span>
                        <Pencil className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                      <span className="shrink-0">
                        <Switch checked={task.active} disabled={toggling[task.id]} onChange={() => void toggleActive(task)} label="" />
                        <span className="sr-only">{task.active ? "Synlig for barna" : "Skjult for barna"}</span>
                      </span>
                    </li>
                  )
                )}
              </ul>
            )}

            {adding === cat.key ? (
              <form
                className="animate-pop space-y-3 rounded-2xl bg-secondary/70 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addOwn(cat);
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    Egen oppgave i {cat.emoji} {cat.title}
                  </p>
                  <button type="button" aria-label="Lukk" onClick={() => setAdding(null)} className="flex size-11 items-center justify-center rounded-full hover:bg-white/70">
                    <X className="size-5" />
                  </button>
                </div>
                <Field label="Hva skal gjøres?">
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="F.eks. Rydde garasjen" autoFocus maxLength={60} />
                </Field>
                <Field label="Hvor mye får barnet?">
                  <span className="relative block">
                    <Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="25" inputMode="decimal" className="pr-10" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                  </span>
                </Field>
                <Button type="submit" block loading={busy === `own-${cat.key}`} disabled={!newTitle.trim() || !newAmount.trim()}>
                  Legg til
                </Button>
              </form>
            ) : (
              <Button
                variant="secondary"
                block
                icon={<Plus className="size-4" />}
                onClick={() => {
                  setAdding(cat.key);
                  setEditing(null);
                  setNewTitle("");
                  setNewAmount("");
                }}
              >
                Egen oppgave
              </Button>
            )}

            {cat.tasks.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/85">Forslag</p>
                <ul className="divide-y divide-border rounded-2xl bg-secondary/60">
                  {cat.tasks.map((t) => {
                    const added = existingTitles.has(t.title.toLowerCase());
                    return (
                      <li key={t.title} className="flex items-center gap-3 px-4 py-2">
                        <TaskIcon title={t.title} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{t.title}</span>
                          <span className="font-num block text-sm text-muted-foreground">{t.kr} kr</span>
                        </span>
                        {added ? (
                          <span className="flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-primary">
                            <Check className="size-4" /> Lagt til
                          </span>
                        ) : (
                          <Button size="sm" variant="secondary" className="min-h-11" icon={<Plus className="size-4" />} loading={busy === t.title} disabled={Boolean(busy)} onClick={() => void addSuggestion(cat, t)}>
                            Legg til
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {missing.length > 1 && (
                  <Button className="mt-2" block icon={<Plus className="size-4" />} loading={busy === `all-${cat.key}`} disabled={Boolean(busy)} onClick={() => void addAll(cat, missing)}>
                    {missing.length === cat.tasks.length ? "Legg til alle" : `Legg til de ${missing.length} andre`}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <p className="text-muted-foreground">Trykk på en kategori for å se, endre eller legge til oppgaver.</p>

      {used.length === 0 ? (
        <p className="rounded-3xl bg-secondary px-5 py-4">Ingen oppgaver ennå. Åpne en kategori under og legg til forslag, eller lag dine egne.</p>
      ) : (
        <div className="space-y-3">{used.map(renderCategory)}</div>
      )}

      {unused.length > 0 && (
        <div className="space-y-3">
          {used.length > 0 && !showMore ? (
            <Button variant="secondary" block icon={<Plus className="size-4" />} onClick={() => setShowMore(true)}>
              Flere kategorier ({unused.length})
            </Button>
          ) : (
            <>
              <h2 className="pt-2 text-lg font-bold tracking-tight">Flere kategorier</h2>
              {unused.map(renderCategory)}
            </>
          )}
        </div>
      )}
    </section>
  );
}
