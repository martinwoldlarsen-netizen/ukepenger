"use client";

import { KidAvatar } from "@/components/avatars/KidAvatar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft, CalendarDays, Gift, Languages, ListChecks, Plus, Trash2, X } from "lucide-react";
import { LANGS, asLang } from "@/lib/i18n";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, ListSkeleton, Select, Switch, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { type AdminChild, adminFetch, friendlyError, swrDefaults, useAdminIdentity, useChildTaskSettings, useChildren, useTasks } from "@/lib/admin-data";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { type Lang } from "@/lib/i18n";
import { useLang, useText } from "@/lib/use-lang";

const WEEKDAY_NAMES: Record<Lang, string[]> = {
  nb: ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  uk: ["понеділок", "вівторок", "середа", "четвер", "п’ятниця", "субота", "неділя"],
};

const TEXT = {
  nb: {
    saveFailed: "Klarte ikke å lagre.", writeWish: "Skriv hva ønsket er.", priceAsNumber: "Skriv prisen som et tall, f.eks. 299.",
    added: (title: string) => `«${title}» er lagt til`, wishFailed: "Klarte ikke å lagre ønsket.",
    deleteTitle: (name: string) => `Slette ${name} for godt?`,
    deleteText: (name: string) => `All historikk, saldo, ønsker og trofeer for ${name} slettes og kan ikke hentes tilbake. Vil du bare skjule barnet, kan du gjøre det under Barn.`,
    deleteForGood: "Slett for godt", deleteFailed: "Klarte ikke å slette.", deleted: (name: string) => `${name} er slettet`,
    notFound: "Fant ikke barnet", backToChildren: "Tilbake til Barn", allChildren: "Alle barn",
    tasks: "Oppgaver og lønn", tasksDesc: (name: string) => `Velg hvilke oppgaver ${name} har, og hva ${name} får for dem. Tomt lønnsfelt = vanlig pris.`, pay: "Lønn", standard: (kr: string) => `Vanlig: ${kr}`, ownPay: "egen lønn", priceSaved: (task: string, kr: string) => `${task}: ${kr}`, invalidPrice: "Skriv lønnen som et tall.", noTasks: "Ingen aktive oppgaver. Lag oppgaver under Oppgaver.",
    shown: "vises", hidden: "skjult", wishes: "Ønsker", wishesDesc: (name: string) => `Det ${name} sparer til. Nye ønsker fra barnet godkjennes under Krav.`,
    noWishes: "Ingen ønsker ennå.", waitingInRequests: "Venter i Krav", newWish: "Nytt ønske", close: "Lukk", whatWish: "Hva ønsker barnet seg?",
    wishPlaceholder: "F.eks. ny sykkel", price: "Pris", note: "Notat (valgfritt)", notePlaceholder: "Farge, modell …", addWish: "Legg til ønske",
    deleteChild: (name: string) => `Slett ${name}`,
    language: "Språk", languageDesc: (name: string) => `Hvilket språk ${name} ser og hører på barnesiden. Kjente oppgaver oversettes av seg selv; egne oppgaver kan du oversette under Oppgaver.`,
    languageSaved: (name: string, lang: string) => `${name} ser nå barnesiden på ${lang}`, applyAll: "Bruk for alle barna", appliedAll: (lang: string) => `Alle barna ser nå barnesiden på ${lang}`,
    allowance: "Faste ukepenger", allowanceDesc: (name: string) => `Et fast beløp som legges til det ${name} har til gode, automatisk hver uke. Kommer i tillegg til oppgavene.`,
    allowanceSaved: (name: string, amount: string, day: string) => `${name} får ${amount} hver ${day}`, allowanceOff: "Faste ukepenger er slått av",
    amountRange: "Skriv et beløp mellom 0 og 1 000 kr.", perWeek: "Beløp per uke", day: "Dag", save: "Lagre",
    now: (amount: string, day: string) => `Nå: ${amount} hver ${day}.`, turnOff: "Slå av",
  },
  en: {
    saveFailed: "Couldn't save.", writeWish: "Write what the wish is.", priceAsNumber: "Write the price as a number, e.g. 299.",
    added: (title: string) => `“${title}” was added`, wishFailed: "Couldn't save the wish.",
    deleteTitle: (name: string) => `Delete ${name} for good?`,
    deleteText: (name: string) => `All history, balance, wishes and trophies for ${name} will be deleted and can't be recovered. If you only want to hide the child, you can do that under Children.`,
    deleteForGood: "Delete for good", deleteFailed: "Couldn't delete.", deleted: (name: string) => `${name} was deleted`,
    notFound: "Couldn't find the child", backToChildren: "Back to Children", allChildren: "All children",
    tasks: "Tasks and pay", tasksDesc: (name: string) => `Choose which tasks ${name} has, and what ${name} gets for them. Empty pay field = the usual price.`, pay: "Pay", standard: (kr: string) => `Usual: ${kr}`, ownPay: "own pay", priceSaved: (task: string, kr: string) => `${task}: ${kr}`, invalidPrice: "Enter the pay as a number.", noTasks: "No active tasks. Create tasks under Tasks.",
    shown: "shown", hidden: "hidden", wishes: "Wishes", wishesDesc: (name: string) => `What ${name} is saving for. New wishes from the child are approved under Requests.`,
    noWishes: "No wishes yet.", waitingInRequests: "Waiting in Requests", newWish: "New wish", close: "Close", whatWish: "What does the child wish for?",
    wishPlaceholder: "E.g. a new bike", price: "Price", note: "Note (optional)", notePlaceholder: "Colour, model …", addWish: "Add wish",
    deleteChild: (name: string) => `Delete ${name}`,
    language: "Language", languageDesc: (name: string) => `Which language ${name} sees and hears on the children's page. Known tasks are translated automatically; you can translate your own tasks under Tasks.`,
    languageSaved: (name: string, lang: string) => `${name} now sees the children's page in ${lang}`, applyAll: "Use for all the children", appliedAll: (lang: string) => `All the children now see the children's page in ${lang}`,
    allowance: "Weekly pocket money", allowanceDesc: (name: string) => `A fixed amount added to what ${name} is owed, automatically every week. Comes on top of the tasks.`,
    allowanceSaved: (name: string, amount: string, day: string) => `${name} gets ${amount} every ${day}`, allowanceOff: "Weekly pocket money is turned off",
    amountRange: "Write an amount between 0 and 1,000 kr.", perWeek: "Amount per week", day: "Day", save: "Save",
    now: (amount: string, day: string) => `Now: ${amount} every ${day}.`, turnOff: "Turn off",
  },
  uk: {
    saveFailed: "Не вдалося зберегти.", writeWish: "Напишіть, що це за бажання.", priceAsNumber: "Напишіть ціну числом, наприклад 299.",
    added: (title: string) => `«${title}» додано`, wishFailed: "Не вдалося зберегти бажання.",
    deleteTitle: (name: string) => `Видалити ${name} назавжди?`,
    deleteText: (name: string) => `Уся історія, баланс, бажання й трофеї (${name}) буде видалено без можливості відновлення. Якщо потрібно лише сховати дитину, це можна зробити в розділі «Діти».`,
    deleteForGood: "Видалити назавжди", deleteFailed: "Не вдалося видалити.", deleted: (name: string) => `${name}: видалено`,
    notFound: "Дитину не знайдено", backToChildren: "Назад до розділу «Діти»", allChildren: "Усі діти",
    tasks: "Завдання й оплата", tasksDesc: (name: string) => `Оберіть, які завдання має ${name} і скільки за них отримує. Порожнє поле оплати = звичайна ціна.`, pay: "Оплата", standard: (kr: string) => `Звичайна: ${kr}`, ownPay: "своя оплата", priceSaved: (task: string, kr: string) => `${task}: ${kr}`, invalidPrice: "Введіть оплату числом.", noTasks: "Немає активних завдань. Створіть їх у розділі «Завдання».",
    shown: "показано", hidden: "приховано", wishes: "Бажання", wishesDesc: (name: string) => `На що збирає ${name}. Нові бажання від дитини схвалюються в розділі «Запити».`,
    noWishes: "Бажань ще немає.", waitingInRequests: "Очікує в «Запитах»", newWish: "Нове бажання", close: "Закрити", whatWish: "Чого бажає дитина?",
    wishPlaceholder: "Напр. новий велосипед", price: "Ціна", note: "Примітка (необов’язково)", notePlaceholder: "Колір, модель …", addWish: "Додати бажання",
    deleteChild: (name: string) => `Видалити: ${name}`,
    language: "Мова", languageDesc: (name: string) => `Якою мовою ${name} бачить і чує сторінку для дітей. Відомі завдання перекладаються автоматично; власні можна перекласти в розділі «Завдання».`,
    languageSaved: (name: string, lang: string) => `${name} тепер бачить сторінку мовою: ${lang}`, applyAll: "Застосувати для всіх дітей", appliedAll: (lang: string) => `Усі діти тепер бачать сторінку мовою: ${lang}`,
    allowance: "Щотижневі кишенькові", allowanceDesc: (name: string) => `Фіксована сума, яка щотижня автоматично додається до того, що належить: ${name}. Нараховується додатково до завдань.`,
    allowanceSaved: (name: string, amount: string, day: string) => `${name} отримує ${amount} щотижня (${day})`, allowanceOff: "Щотижневі кишенькові вимкнено",
    amountRange: "Вкажіть суму від 0 до 1 000 kr.", perWeek: "Сума на тиждень", day: "День", save: "Зберегти",
    now: (amount: string, day: string) => `Зараз: ${amount} щотижня (${day}).`, turnOff: "Вимкнути",
  },
};

type WishlistItem = {
  id: string;
  title: string;
  target_ore: number | null;
  suggested_ore: number | null;
  status: "PROPOSED" | "ACTIVE";
  created_by: "PARENT" | "CHILD";
  note: string | null;
  created_at: string;
};

// Ny komponent per barn (key), så skjemaer og valg fra forrige barn ikke blir med.
export default function AdminChildDetailPage() {
  const params = useParams<{ id: string }>();
  return <ChildDetail key={params.id} childId={params.id} />;
}

function ChildDetail({ childId }: { childId: string }) {
  const t = useText(TEXT);
  const lang = useLang();
  const kr = (ore: number) => formatKr(ore, lang);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const { familyId } = useAdminIdentity();
  const children = useChildren(familyId);
  const tasks = useTasks(familyId);

  const settings = useChildTaskSettings(familyId);

  const wishlist = useSWR(
    familyId ? ["wishlist", childId] : null,
    async () => (await adminFetch<{ items?: WishlistItem[] }>(`/api/admin/wishlist/list?childId=${encodeURIComponent(childId)}`)).items ?? [],
    swrDefaults
  );

  const [formOpen, setFormOpen] = useState(false);
  const [wishTitle, setWishTitle] = useState("");
  const [wishPrice, setWishPrice] = useState("");
  const [wishNote, setWishNote] = useState("");
  const [saving, setSaving] = useState(false);

  const child = children.data?.find((c) => c.id === childId);
  const activeTasks = (tasks.data ?? []).filter((t) => t.active);
  const settingFor = (taskId: string) => settings.data?.find((x) => x.child_id === childId && x.task_id === taskId);
  const isEnabled = (taskId: string) => settingFor(taskId)?.enabled !== false;
  const ownPay = (taskId: string) => settingFor(taskId)?.amount_ore ?? null;

  // Lagrer på/av og egen lønn for denne oppgaven (én rad per barn og oppgave).
  const saveSetting = async (taskId: string, patch: { enabled?: boolean; amount_ore?: number | null }) => {
    const row = { child_id: childId, task_id: taskId, enabled: isEnabled(taskId), amount_ore: ownPay(taskId), ...patch };
    const merge = (current?: typeof settings.data) => [...(current ?? []).filter((x) => !(x.child_id === childId && x.task_id === taskId)), row];
    try {
      await settings.mutate(
        async (current) => {
          const res = await supabase.from("child_task_settings").upsert(row);
          if (res.error) throw new Error(res.error.message);
          return merge(current);
        },
        { optimisticData: merge, rollbackOnError: true, revalidate: false }
      );
      return true;
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.saveFailed) });
      return false;
    }
  };
  const toggleTask = (taskId: string) => saveSetting(taskId, { enabled: !isEnabled(taskId) });
  const savePay = async (task: { id: string; title: string; amount_ore: number }, value: string) => {
    const ore = value.trim() ? parseKrToOre(value) : null;
    if (ore === "invalid") return toast({ kind: "error", text: t.invalidPrice });
    // Samme som vanlig pris = ingen egen lønn.
    const next = ore === null || ore === task.amount_ore ? null : ore;
    if (next === ownPay(task.id)) return;
    if (await saveSetting(task.id, { amount_ore: next })) toast({ text: t.priceSaved(task.title, kr(next ?? task.amount_ore)) });
  };

  const createWish = async () => {
    if (saving) return;
    const targetOre = parseKrToOre(wishPrice);
    if (!wishTitle.trim()) {
      toast({ kind: "error", text: t.writeWish });
      return;
    }
    if (typeof targetOre !== "number" || targetOre <= 0) {
      toast({ kind: "error", text: t.priceAsNumber });
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/api/admin/wishlist/create", {
        method: "POST",
        body: JSON.stringify({ childId, title: wishTitle.trim(), targetOre, note: wishNote.trim() || undefined }),
      });
      toast({ text: t.added(wishTitle.trim()) });
      setWishTitle("");
      setWishPrice("");
      setWishNote("");
      setFormOpen(false);
      await wishlist.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.wishFailed) });
    } finally {
      setSaving(false);
    }
  };

  // Sletter barnet og alt som hører til (krav, utbetalinger, ønsker, trofeer).
  const deleteChild = async () => {
    if (!child) return;
    const ok = await confirm({
      title: t.deleteTitle(child.name),
      text: t.deleteText(child.name),
      confirmLabel: t.deleteForGood,
      danger: true,
    });
    if (!ok) return;
    const res = await supabase.from("children").delete().eq("id", child.id);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, t.deleteFailed) });
      return;
    }
    await children.mutate();
    toast({ text: t.deleted(child.name) });
    router.push("/admin/children");
  };

  if (!familyId || (children.isLoading && !children.data)) return <ListSkeleton rows={3} />;

  if (!child) {
    return (
      <EmptyState emoji="🔍" title={t.notFound}>
        <Link href="/admin/children" className="mt-2 inline-flex font-semibold text-primary underline underline-offset-4">
          {t.backToChildren}
        </Link>
      </EmptyState>
    );
  }

  return (
    <section className="space-y-5">
      <Link href="/admin/children" className={cx("-mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground", focusRing)}>
        <ArrowLeft className="size-4" /> {t.allChildren}
      </Link>

      <div className="flex items-center gap-4 rounded-3xl p-5" style={{ background: child.color.bg, color: child.color.ink }}>
        <KidAvatar avatarKey={child.avatar_key} size={64} />
        <p className="text-3xl font-extrabold tracking-tight">{child.name}</p>
      </div>

      <AllowanceCard child={child} familyId={familyId} onSaved={() => void children.mutate()} />

      <LanguageCard child={child} familyId={familyId} onSaved={() => void children.mutate()} />

      <Card className="space-y-4">
        <CardHeader icon={<ListChecks className="size-5" />} title={t.tasks} description={t.tasksDesc(child.name)} />
        {tasks.isLoading && !tasks.data ? (
          <ListSkeleton rows={2} />
        ) : activeTasks.length === 0 ? (
          <p className="rounded-2xl bg-secondary px-4 py-3 text-muted-foreground">{t.noTasks}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {activeTasks.map((task) => (
              <li key={task.id} className="space-y-2 px-4 py-3">
                <Switch
                  checked={isEnabled(task.id)}
                  onChange={() => void toggleTask(task.id)}
                  label={task.title}
                  description={`${kr(ownPay(task.id) ?? task.amount_ore)}${ownPay(task.id) !== null ? ` (${t.ownPay})` : ""} · ${isEnabled(task.id) ? t.shown : t.hidden}`}
                />
                {isEnabled(task.id) && (
                  <PayInput
                    key={`${task.id}-${ownPay(task.id) ?? ""}`}
                    label={`${t.pay}: ${task.title}`}
                    initial={ownPay(task.id)}
                    placeholder={t.standard(kr(task.amount_ore))}
                    onCommit={(v) => void savePay(task, v)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <CardHeader
          icon={<Gift className="size-5" />}
          title={t.wishes}
          description={t.wishesDesc(child.name)}
        />

        {wishlist.isLoading && !wishlist.data ? (
          <ListSkeleton rows={2} />
        ) : (wishlist.data ?? []).length === 0 ? (
          <p className="rounded-2xl bg-secondary px-4 py-3 text-muted-foreground">{t.noWishes}</p>
        ) : (
          <ul className="space-y-2">
            {(wishlist.data ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.title}</p>
                  {item.note && <p className="truncate text-sm text-muted-foreground">{item.note}</p>}
                </div>
                {item.status === "PROPOSED" ? (
                  <Badge tone="warning">{t.waitingInRequests}</Badge>
                ) : (
                  <span className="font-num font-bold">{item.target_ore !== null ? kr(item.target_ore) : ""}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {formOpen ? (
          <form
            className="animate-pop space-y-4 rounded-2xl bg-secondary/60 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createWish();
            }}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold">{t.newWish}</p>
              <button type="button" aria-label={t.close} onClick={() => setFormOpen(false)} className={cx("flex size-10 items-center justify-center rounded-full hover:bg-secondary", focusRing)}>
                <X className="size-5" />
              </button>
            </div>
            <Field label={t.whatWish}>
              <Input value={wishTitle} onChange={(e) => setWishTitle(e.target.value)} placeholder={t.wishPlaceholder} autoFocus maxLength={80} />
            </Field>
            <Field label={t.price}>
              <span className="relative block">
                <Input value={wishPrice} onChange={(e) => setWishPrice(e.target.value)} placeholder="299" inputMode="decimal" className="pr-12" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
              </span>
            </Field>
            <Field label={t.note}>
              <Input value={wishNote} onChange={(e) => setWishNote(e.target.value)} placeholder={t.notePlaceholder} />
            </Field>
            <Button type="submit" block loading={saving} disabled={!wishTitle.trim() || !wishPrice.trim()}>
              {t.addWish}
            </Button>
          </form>
        ) : (
          <Button variant="secondary" block icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
            {t.addWish}
          </Button>
        )}
      </Card>
      <Button variant="dangerSoft" block size="lg" icon={<Trash2 className="size-4" />} onClick={() => void deleteChild()}>
        {t.deleteChild(child.name)}
      </Button>
    </section>
  );
}

// Språk på barnesiden for dette barnet: tekst, opplesning og forslag i
// Ønskebutikken. «Bruk for alle barna» setter samme språk på hele familien.
function LanguageCard({ child, familyId, onSaved }: { child: AdminChild; familyId: string; onSaved: () => void }) {
  const t = useText(TEXT);
  const toast = useToast();
  const [lang, setLang] = useState(asLang(child.language));
  const [saving, setSaving] = useState(false);
  const label = (code: string) => LANGS.find((l) => l.code === code)?.label ?? code;
  const applyAll = async () => {
    setSaving(true);
    const res = await supabase.from("children").update({ language: lang }).eq("family_id", familyId);
    setSaving(false);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, t.saveFailed) });
      return;
    }
    toast({ text: t.appliedAll(label(lang)) });
    onSaved();
  };
  const save = async (next: string) => {
    const previous = lang;
    setLang(asLang(next));
    setSaving(true);
    const res = await supabase.from("children").update({ language: next }).eq("id", child.id);
    setSaving(false);
    if (res.error) {
      setLang(previous);
      toast({ kind: "error", text: friendlyError(res.error.message, t.saveFailed) });
      return;
    }
    toast({ text: t.languageSaved(child.name, label(next)) });
    onSaved();
  };
  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<Languages className="size-5" />}
        title={t.language}
        description={t.languageDesc(child.name)}
      />
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.language}>
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={lang === l.code}
            disabled={saving}
            onClick={() => lang !== l.code && void save(l.code)}
            className={cx(
              "flex min-h-14 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-sm font-semibold transition",
              focusRing,
              lang === l.code ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary" : "border-border bg-card hover:bg-secondary"
            )}
          >
            <span className="text-xl" aria-hidden="true">{l.flag}</span>
            {l.label}
          </button>
        ))}
      </div>
      <Button variant="secondary" size="sm" disabled={saving} onClick={() => void applyAll()}>
        {t.applyAll}
      </Button>
    </Card>
  );
}

// Faste ukepenger: et fast beløp som legges til automatisk én gang i uka.
function AllowanceCard({ child, familyId, onSaved }: { child: AdminChild; familyId: string; onSaved: () => void }) {
  const t = useText(TEXT);
  const lang = useLang();
  const WEEKDAYS = WEEKDAY_NAMES[lang];
  const toast = useToast();
  const current = child.weekly_allowance_ore ?? 0;
  const [amount, setAmount] = useState(current ? String(current / 100) : "");
  const [weekday, setWeekday] = useState(child.allowance_weekday ?? 6);
  const [saving, setSaving] = useState(false);

  const save = async (nextOre: number) => {
    setSaving(true);
    const patch: Record<string, unknown> = { weekly_allowance_ore: nextOre, allowance_weekday: weekday };
    // Slått på på nytt: start fra nå, ikke betal for ukene det var av.
    if (current === 0 || nextOre === 0) patch.allowance_paid_through = null;
    const res = await supabase.from("children").update(patch).eq("id", child.id);
    if (!res.error && nextOre > 0) await supabase.rpc("ensure_weekly_allowances", { p_family_id: familyId });
    setSaving(false);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, t.saveFailed) });
      return;
    }
    toast({ text: nextOre > 0 ? t.allowanceSaved(child.name, formatKr(nextOre, lang), WEEKDAYS[weekday - 1]) : t.allowanceOff });
    onSaved();
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<CalendarDays className="size-5" />}
        title={t.allowance}
        description={t.allowanceDesc(child.name)}
      />
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const ore = parseKrToOre(amount);
          if (ore === "invalid" || (typeof ore === "number" && ore > 100000)) {
            toast({ kind: "error", text: t.amountRange });
            return;
          }
          void save(ore ?? 0);
        }}
      >
        <Field label={t.perWeek}>
          <span className="relative block">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" className="pr-12" />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
          </span>
        </Field>
        <Field label={t.day}>
          <Select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i + 1}>
                {d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" size="lg" loading={saving}>
          {t.save}
        </Button>
      </form>
      {current > 0 && (
        <p className="text-sm text-muted-foreground">
          {t.now(formatKr(current, lang), WEEKDAYS[(child.allowance_weekday ?? 6) - 1])}{" "}
          <button type="button" className="font-semibold text-red-700 underline-offset-4 hover:underline" onClick={() => void save(0)}>
            {t.turnOff}
          </button>
        </p>
      )}
    </Card>
  );
}

// Lønnsfelt som lagrer når feltet forlates (eller Enter). Tomt = vanlig pris.
function PayInput({ label, initial, placeholder, onCommit }: { label: string; initial: number | null; placeholder: string; onCommit: (value: string) => void }) {
  const [value, setValue] = useState(initial === null ? "" : String(initial / 100).replace(".", ","));
  return (
    <span className="relative block max-w-56">
      <Input
        aria-label={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onCommit(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        inputMode="decimal"
        placeholder={placeholder}
        className="min-h-10 pr-10 text-sm"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
    </span>
  );
}
