"use client";

import { TaskIcon } from "@/components/TaskIcon";
import { TaskIconPicker } from "@/components/TaskIconPicker";
import { useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Field, Input, ListSkeleton, Select, Switch, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { type AdminTask, friendlyError, useAdminIdentity, useChildTaskSettings, useChildren, useTasks } from "@/lib/admin-data";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { LANGS, type Lang, asLang } from "@/lib/i18n";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { OTHER_CATEGORY, TASK_PACKS, categoryOf, type PackTask } from "@/lib/task-packs";
import { categoryTitle, knownTaskTitle, taskSuggestionTitle } from "@/lib/task-packs-i18n";
import { taskArtKey } from "@/components/task-art";
import { useLang, useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    addFailed: "Klarte ikke å legge til.",
    added: (title: string) => `«${title}» er lagt til`,
    addedMany: (emoji: string, n: number) => `${emoji} ${n} oppgaver lagt til`,
    writeTask: "Skriv hva oppgaven er.",
    amountAsNumber: "Skriv beløpet som et tall, f.eks. 25.",
    saveFailed: "Klarte ikke å lagre.",
    saved: (title: string, amount: string) => `Lagret: ${title} · ${amount}`,
    deleteTitle: (title: string) => `Slette «${title}»?`,
    deleteText: "Oppgaven forsvinner for barna. Det barna allerede har tjent på den, blir stående.",
    delete: "Slett",
    deleteFailed: "Klarte ikke å slette.",
    deleted: (title: string) => `«${title}» er slettet`,
    count: (n: number, hidden: number) => `${n} ${n === 1 ? "oppgave" : "oppgaver"}${hidden ? ` · ${hidden} skjult` : ""}`,
    suggestionsCount: (n: number) => `${n} forslag`,
    whatToDo: "Hva skal gjøres?",
    amount: "Beløp",
    category: "Kategori",
    picture: "Bilde",
    nameInLangs: "Navnet på barnas språk",
    whoHas: "Hvem har oppgaven, og hva får de?", whoHasHint: "Slå av for barn som ikke skal ha den. Tomt lønnsfelt = prisen over.", payFor: (name: string) => `Lønn for ${name}`,
    nameInLangsHint: "Barnet ser oppgaven på sitt språk. Tomt felt: kjente oppgaver oversettes av seg selv, ellers vises navnet over.",
    oldPrice: "Krav som allerede er sendt, beholder den gamle prisen.",
    cancel: "Avbryt",
    save: "Lagre",
    deleteTask: "Slett oppgave",
    edit: (title: string) => `Endre ${title}`,
    visible: "Synlig for barna",
    hidden: "Skjult for barna",
    ownIn: (cat: string) => `Egen oppgave i ${cat}`,
    ownPlaceholder: "F.eks. Rydde garasjen",
    howMuch: "Hvor mye får barnet?",
    add: "Legg til",
    own: "Egen oppgave",
    suggestions: "Forslag",
    addedLabel: "Lagt til",
    addAll: "Legg til alle",
    addRest: (n: number) => `Legg til de ${n} andre`,
    intro: "Trykk på en kategori for å se, endre eller legge til oppgaver.",
    none: "Ingen oppgaver ennå. Åpne en kategori under og legg til forslag, eller lag dine egne.",
    moreCategories: "Flere kategorier",
  },
  en: {
    addFailed: "Couldn't add it.",
    added: (title: string) => `“${title}” was added`,
    addedMany: (emoji: string, n: number) => `${emoji} ${n} tasks added`,
    writeTask: "Write what the task is.",
    amountAsNumber: "Write the amount as a number, e.g. 25.",
    saveFailed: "Couldn't save.",
    saved: (title: string, amount: string) => `Saved: ${title} · ${amount}`,
    deleteTitle: (title: string) => `Delete “${title}”?`,
    deleteText: "The task disappears for the children. What they have already earned from it stays.",
    delete: "Delete",
    deleteFailed: "Couldn't delete it.",
    deleted: (title: string) => `“${title}” was deleted`,
    count: (n: number, hidden: number) => `${n} ${n === 1 ? "task" : "tasks"}${hidden ? ` · ${hidden} hidden` : ""}`,
    suggestionsCount: (n: number) => `${n} suggestions`,
    whatToDo: "What needs doing?",
    amount: "Amount",
    category: "Category",
    picture: "Picture",
    nameInLangs: "The name in the children's languages",
    whoHas: "Who has the task, and what do they get?", whoHasHint: "Switch off for children who shouldn't have it. Empty pay field = the price above.", payFor: (name: string) => `Pay for ${name}`,
    nameInLangsHint: "Each child sees the task in their own language. Empty field: known tasks are translated automatically, otherwise the name above is shown.",
    oldPrice: "Requests already sent keep the old price.",
    cancel: "Cancel",
    save: "Save",
    deleteTask: "Delete task",
    edit: (title: string) => `Edit ${title}`,
    visible: "Visible to the children",
    hidden: "Hidden from the children",
    ownIn: (cat: string) => `Your own task in ${cat}`,
    ownPlaceholder: "E.g. Tidy the garage",
    howMuch: "How much does the child get?",
    add: "Add",
    own: "Your own task",
    suggestions: "Suggestions",
    addedLabel: "Added",
    addAll: "Add all",
    addRest: (n: number) => `Add the other ${n}`,
    intro: "Tap a category to see, edit or add tasks.",
    none: "No tasks yet. Open a category below and add suggestions, or make your own.",
    moreCategories: "More categories",
  },
  uk: {
    addFailed: "Не вдалося додати.",
    added: (title: string) => `«${title}» додано`,
    addedMany: (emoji: string, n: number) => `${emoji} Додано завдань: ${n}`,
    writeTask: "Напишіть, що потрібно зробити.",
    amountAsNumber: "Напишіть суму числом, наприклад 25.",
    saveFailed: "Не вдалося зберегти.",
    saved: (title: string, amount: string) => `Збережено: ${title} · ${amount}`,
    deleteTitle: (title: string) => `Видалити «${title}»?`,
    deleteText: "Завдання зникне для дітей. Те, що вони вже заробили на ньому, залишиться.",
    delete: "Видалити",
    deleteFailed: "Не вдалося видалити.",
    deleted: (title: string) => `«${title}» видалено`,
    count: (n: number, hidden: number) => `Завдань: ${n}${hidden ? ` · приховано: ${hidden}` : ""}`,
    suggestionsCount: (n: number) => `Пропозицій: ${n}`,
    whatToDo: "Що потрібно зробити?",
    amount: "Сума",
    category: "Категорія",
    picture: "Зображення",
    nameInLangs: "Назва мовами дітей",
    whoHas: "Хто має завдання і скільки отримує?", whoHasHint: "Вимкніть для дітей, яким воно не потрібне. Порожнє поле оплати = ціна вище.", payFor: (name: string) => `Оплата: ${name}`,
    nameInLangsHint: "Дитина бачить завдання своєю мовою. Порожнє поле: відомі завдання перекладаються автоматично, інакше показується назва вище.",
    oldPrice: "Запити, які вже надіслано, зберігають стару ціну.",
    cancel: "Скасувати",
    save: "Зберегти",
    deleteTask: "Видалити завдання",
    edit: (title: string) => `Змінити ${title}`,
    visible: "Видно дітям",
    hidden: "Приховано від дітей",
    ownIn: (cat: string) => `Власне завдання: ${cat}`,
    ownPlaceholder: "Напр. Прибрати в гаражі",
    howMuch: "Скільки отримає дитина?",
    add: "Додати",
    own: "Власне завдання",
    suggestions: "Пропозиції",
    addedLabel: "Додано",
    addAll: "Додати всі",
    addRest: (n: number) => `Додати решту (${n})`,
    intro: "Натисніть на категорію, щоб переглянути, змінити або додати завдання.",
    none: "Завдань ще немає. Відкрийте категорію нижче й додайте пропозиції або створіть власні.",
    moreCategories: "Більше категорій",
  },
};

type Category = { key: string; title: string; emoji: string; tasks: PackTask[] };
const CATEGORIES: Category[] = [...TASK_PACKS, { ...OTHER_CATEGORY, tasks: [] }];

// Oppgaver gruppert i kategorier. Kategorier familien bruker vises; resten kan
// hentes frem under «Flere kategorier». Hver kategori har egne oppgaver,
// forslag å legge til, og en + for egne oppgaver.
export default function AdminTasksPage() {
  const t = useText(TEXT);
  const lang = useLang();
  // Forslag og kategorier på valgt språk. En oppgave fra forslagene får fast
  // bilde, så den kjennes igjen også når navnet ikke er norsk.
  const catTitle = (c: Category) => categoryTitle(c.key, c.title, lang);
  const sugTitle = (x: PackTask) => taskSuggestionTitle(x.title, lang);
  const sugIcon = (x: PackTask) => (lang === "nb" ? null : (taskArtKey(x.title) ?? x.emoji ?? null));
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const tasks = useTasks(familyId);
  // Barnas språk utenom ditt eget (navnet skrives på ditt språk). Snakker alle
  // samme språk, trengs ingen oversettelse.
  const kids = useChildren(familyId);
  const kidLangs = new Set<Lang>((kids.data ?? []).filter((c) => c.active).map((c) => asLang(c.language)));
  // Hvilke barn har oppgaven, og egen lønn per barn (vises når familien har flere barn).
  const activeKids = (kids.data ?? []).filter((c) => c.active);
  const childSettings = useChildTaskSettings(familyId);
  const settingOf = (childId: string, taskId: string) => childSettings.data?.find((x) => x.child_id === childId && x.task_id === taskId);
  const translateTo = LANGS.filter((l) => l.code !== lang && kidLangs.has(l.code));

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
  const [editIcon, setEditIcon] = useState<string | null>(null);
  const [editI18n, setEditI18n] = useState<Partial<Record<Lang, string>>>({});
  const [editKids, setEditKids] = useState<Record<string, { on: boolean; pay: string }>>({});

  const list = tasks.data ?? [];
  const existingTitles = new Set(list.map((t) => t.title.toLowerCase()));
  const byCategory: Record<string, AdminTask[]> = {};
  for (const t of list) (byCategory[categoryOf(t)] ??= []).push(t);
  for (const k of Object.keys(byCategory)) byCategory[k].sort((a, b) => Number(b.active) - Number(a.active) || a.title.localeCompare(b.title, "nb"));

  const used = CATEGORIES.filter((c) => (byCategory[c.key]?.length ?? 0) > 0);
  const unused = CATEGORIES.filter((c) => !byCategory[c.key]?.length && c.key !== OTHER_CATEGORY.key);

  const insert = async (rows: Array<{ title: string; amount_ore: number; category: string; icon?: string | null }>, text: string) => {
    if (!familyId) return false;
    const res = await supabase.from("tasks").insert(rows.map((r) => ({ ...r, family_id: familyId, active: true })));
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, t.addFailed) });
      return false;
    }
    toast({ text });
    await tasks.mutate();
    return true;
  };

  const addSuggestion = async (cat: Category, x: PackTask) => {
    setBusy(x.title);
    await insert([{ title: sugTitle(x), amount_ore: x.kr * 100, category: cat.key, icon: sugIcon(x) }], t.added(sugTitle(x)));
    setBusy(null);
  };

  const addAll = async (cat: Category, missing: PackTask[]) => {
    setBusy(`all-${cat.key}`);
    await insert(missing.map((x) => ({ title: sugTitle(x), amount_ore: x.kr * 100, category: cat.key, icon: sugIcon(x) })), t.addedMany(cat.emoji, missing.length));
    setBusy(null);
  };

  const addOwn = async (cat: Category) => {
    const amountOre = parseKrToOre(newAmount);
    if (!newTitle.trim()) return toast({ kind: "error", text: t.writeTask });
    if (amountOre === null || amountOre === "invalid") return toast({ kind: "error", text: t.amountAsNumber });
    setBusy(`own-${cat.key}`);
    const ok = await insert([{ title: newTitle.trim(), amount_ore: amountOre, category: cat.key }], t.added(newTitle.trim()));
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
    setEditIcon(task.icon ?? null);
    setEditI18n(task.title_i18n ?? {});
    setEditKids(
      Object.fromEntries(
        activeKids.map((c) => {
          const x = settingOf(c.id, task.id);
          return [c.id, { on: x?.enabled !== false, pay: x?.amount_ore != null ? String(x.amount_ore / 100).replace(".", ",") : "" }];
        })
      )
    );
  };

  const saveEdit = async (task: AdminTask) => {
    const amountOre = parseKrToOre(editAmount);
    if (!editTitle.trim()) return toast({ kind: "error", text: t.writeTask });
    if (amountOre === null || amountOre === "invalid") return toast({ kind: "error", text: t.amountAsNumber });
    setBusy(`edit-${task.id}`);
    // Bare utfylte oversettelser lagres; felt som er like navnet, trengs ikke.
    const i18n = Object.fromEntries(
      Object.entries(editI18n)
        .map(([k, v]) => [k, (v ?? "").trim()])
        .filter(([, v]) => v && v !== editTitle.trim())
    ) as Partial<Record<Lang, string>>;
    const patch = { title: editTitle.trim(), amount_ore: amountOre, category: editCategory, icon: editIcon, title_i18n: Object.keys(i18n).length ? i18n : null };
    // Barn: bare rader som er endret lagres. Lønn lik prisen over = ingen egen lønn.
    const kidRows: Array<{ child_id: string; task_id: string; enabled: boolean; amount_ore: number | null }> = [];
    for (const c of activeKids) {
      const e = editKids[c.id];
      if (!e) continue;
      const ore = e.pay.trim() ? parseKrToOre(e.pay) : null;
      if (ore === "invalid") {
        setBusy(null);
        return toast({ kind: "error", text: t.amountAsNumber });
      }
      const amount = ore === null || ore === amountOre ? null : ore;
      const old = settingOf(c.id, task.id);
      if ((old?.enabled !== false) !== e.on || (old?.amount_ore ?? null) !== amount) kidRows.push({ child_id: c.id, task_id: task.id, enabled: e.on, amount_ore: amount });
    }
    const res = await supabase.from("tasks").update(patch).eq("id", task.id);
    const kidRes = !res.error && kidRows.length ? await supabase.from("child_task_settings").upsert(kidRows) : null;
    setBusy(null);
    if (res.error || kidRes?.error) return toast({ kind: "error", text: friendlyError((res.error ?? kidRes?.error)!.message, t.saveFailed) });
    await tasks.mutate((current) => (current ?? []).map((x) => (x.id === task.id ? { ...x, ...patch } : x)), { revalidate: false });
    if (kidRows.length) await childSettings.mutate();
    setEditing(null);
    if (editCategory !== categoryOf(task)) setOpen(editCategory);
    toast({ text: t.saved(patch.title, formatKr(amountOre, lang)) });
  };

  // «Slett» arkiverer: barnas historikk og penger for oppgaven blir stående.
  const deleteTask = async (task: AdminTask) => {
    const ok = await confirm({
      title: t.deleteTitle(task.title),
      text: t.deleteText,
      confirmLabel: t.delete,
      danger: true,
    });
    if (!ok) return;
    const res = await supabase.from("tasks").update({ active: false, archived_at: new Date().toISOString() }).eq("id", task.id);
    if (res.error) return toast({ kind: "error", text: friendlyError(res.error.message, t.deleteFailed) });
    setEditing(null);
    await tasks.mutate((current) => (current ?? []).filter((x) => x.id !== task.id), { revalidate: false });
    toast({ text: t.deleted(task.title) });
  };

  const toggleActive = async (task: AdminTask) => {
    if (toggling[task.id]) return;
    setToggling((p) => ({ ...p, [task.id]: true }));
    try {
      await tasks.mutate(
        async (current) => {
          const res = await supabase.from("tasks").update({ active: !task.active }).eq("id", task.id);
          if (res.error) throw new Error(res.error.message);
          return (current ?? []).map((x) => (x.id === task.id ? { ...x, active: !task.active } : x));
        },
        { optimisticData: (current) => (current ?? []).map((x) => (x.id === task.id ? { ...x, active: !task.active } : x)), rollbackOnError: true, revalidate: false }
      );
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.saveFailed) });
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
    const isAdded = (x: PackTask) => existingTitles.has(x.title.toLowerCase()) || existingTitles.has(sugTitle(x).toLowerCase());
    const missing = cat.tasks.filter((x) => !isAdded(x));
    const isOpen = open === cat.key;
    const hidden = mine.filter((x) => !x.active).length;
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
            <span className="block text-lg font-bold">{catTitle(cat)}</span>
            <span className="block text-sm text-muted-foreground">
              {mine.length ? t.count(mine.length, hidden) : t.suggestionsCount(cat.tasks.length)}
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
                        <Field label={t.whatToDo}>
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={60} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label={t.amount}>
                            <span className="relative block">
                              <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} inputMode="decimal" className="pr-10" autoFocus />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                            </span>
                          </Field>
                          <Field label={t.category}>
                            <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                              {CATEGORIES.map((c) => (
                                <option key={c.key} value={c.key}>
                                  {c.emoji} {catTitle(c)}
                                </option>
                              ))}
                            </Select>
                          </Field>
                        </div>
                        <div>
                          <span className="mb-1.5 block text-sm font-semibold text-foreground/85">{t.picture}</span>
                          <TaskIconPicker title={editTitle || task.title} value={editIcon} onChange={setEditIcon} />
                        </div>
                        {activeKids.length > 1 && (
                          <div>
                            <span className="mb-1.5 block text-sm font-semibold text-foreground/85">{t.whoHas}</span>
                            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
                              {activeKids.map((c) => {
                                const e = editKids[c.id] ?? { on: true, pay: "" };
                                const set = (patch: Partial<typeof e>) => setEditKids((cur) => ({ ...cur, [c.id]: { ...e, ...patch } }));
                                return (
                                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                                    <KidAvatar avatarKey={c.avatar_key} size={32} />
                                    <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span>
                                    {e.on && (
                                      <span className="relative block w-24 shrink-0">
                                        <Input
                                          aria-label={t.payFor(c.name)}
                                          value={e.pay}
                                          onChange={(ev) => set({ pay: ev.target.value })}
                                          inputMode="decimal"
                                          placeholder={editAmount || "0"}
                                          className="min-h-10 pr-8 text-sm"
                                        />
                                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr</span>
                                      </span>
                                    )}
                                    <Switch checked={e.on} onChange={(on) => set({ on })} label={c.name} hideLabel />
                                  </li>
                                );
                              })}
                            </ul>
                            <p className="mt-1.5 text-xs text-muted-foreground">{t.whoHasHint}</p>
                          </div>
                        )}
                        {translateTo.length > 0 && (
                          <div>
                            <span className="mb-1.5 block text-sm font-semibold text-foreground/85">{t.nameInLangs}</span>
                            <div className="space-y-2">
                              {translateTo.map((l) => (
                                <label key={l.code} className="flex items-center gap-2">
                                  <span className="w-7 shrink-0 text-center text-xl" aria-hidden="true">
                                    {l.flag}
                                  </span>
                                  <Input
                                    aria-label={`${t.nameInLangs}: ${l.label}`}
                                    lang={l.code}
                                    value={editI18n[l.code] ?? ""}
                                    onChange={(e) => setEditI18n((cur) => ({ ...cur, [l.code]: e.target.value }))}
                                    placeholder={knownTaskTitle(editTitle, l.code) ?? editTitle}
                                    maxLength={60}
                                  />
                                </label>
                              ))}
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">{t.nameInLangsHint}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">{t.oldPrice}</p>
                        <div className="flex gap-2">
                          <Button variant="ghost" className="flex-1" onClick={() => setEditing(null)}>
                            {t.cancel}
                          </Button>
                          <Button type="submit" className="flex-1" loading={busy === `edit-${task.id}`}>
                            {t.save}
                          </Button>
                        </div>
                        <Button variant="dangerSoft" block icon={<Trash2 className="size-4" />} onClick={() => void deleteTask(task)}>
                          {t.deleteTask}
                        </Button>
                      </form>
                    </li>
                  ) : (
                    <li key={task.id} className={cx("flex items-center gap-3 rounded-2xl border border-border px-3 py-2.5", !task.active && "bg-secondary/50")}>
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        aria-label={t.edit(task.title)}
                        className={cx("flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl text-left", focusRing, !task.active && "opacity-60")}
                      >
                        <TaskIcon title={task.title} icon={task.icon} size={44} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{task.title}</span>
                          <span className="font-num block text-sm text-muted-foreground">{formatKr(task.amount_ore)}</span>
                        </span>
                        <Pencil className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                      <span className="shrink-0">
                        <Switch checked={task.active} disabled={toggling[task.id]} onChange={() => void toggleActive(task)} label="" />
                        <span className="sr-only">{task.active ? t.visible : t.hidden}</span>
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
                    {t.ownIn(`${cat.emoji} ${catTitle(cat)}`)}
                  </p>
                  <button type="button" aria-label="Lukk" onClick={() => setAdding(null)} className="flex size-11 items-center justify-center rounded-full hover:bg-white/70">
                    <X className="size-5" />
                  </button>
                </div>
                <Field label={t.whatToDo}>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t.ownPlaceholder} autoFocus maxLength={60} />
                </Field>
                <Field label={t.howMuch}>
                  <span className="relative block">
                    <Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="25" inputMode="decimal" className="pr-10" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                  </span>
                </Field>
                <Button type="submit" block loading={busy === `own-${cat.key}`} disabled={!newTitle.trim() || !newAmount.trim()}>
                  {t.add}
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
                {t.own}
              </Button>
            )}

            {cat.tasks.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/85">{t.suggestions}</p>
                <ul className="divide-y divide-border rounded-2xl bg-secondary/60">
                  {cat.tasks.map((x) => {
                    const added = isAdded(x);
                    return (
                      <li key={x.title} className="flex items-center gap-3 px-4 py-2">
                        <TaskIcon title={x.title} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{sugTitle(x)}</span>
                          <span className="font-num block text-sm text-muted-foreground">{formatKr(x.kr * 100, lang)}</span>
                        </span>
                        {added ? (
                          <span className="flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-primary">
                            <Check className="size-4" /> {t.addedLabel}
                          </span>
                        ) : (
                          <Button size="sm" variant="secondary" className="min-h-11" icon={<Plus className="size-4" />} loading={busy === x.title} disabled={Boolean(busy)} onClick={() => void addSuggestion(cat, x)}>
                            {t.add}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {missing.length > 1 && (
                  <Button className="mt-2" block icon={<Plus className="size-4" />} loading={busy === `all-${cat.key}`} disabled={Boolean(busy)} onClick={() => void addAll(cat, missing)}>
                    {missing.length === cat.tasks.length ? t.addAll : t.addRest(missing.length)}
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
      <p className="text-muted-foreground">{t.intro}</p>

      {used.length === 0 ? (
        <p className="rounded-3xl bg-secondary px-5 py-4">{t.none}</p>
      ) : (
        <div className="space-y-3">{used.map(renderCategory)}</div>
      )}

      {unused.length > 0 && (
        <div className="space-y-3">
          {used.length > 0 && !showMore ? (
            <Button variant="secondary" block icon={<Plus className="size-4" />} onClick={() => setShowMore(true)}>
              {t.moreCategories} ({unused.length})
            </Button>
          ) : (
            <>
              <h2 className="pt-2 text-lg font-bold tracking-tight">{t.moreCategories}</h2>
              {unused.map(renderCategory)}
            </>
          )}
        </div>
      )}
    </section>
  );
}
