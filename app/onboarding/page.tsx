"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_AVATAR_KEY } from "@/lib/avatars";
import { BASIC_TASKS } from "@/lib/task-packs";
import { QrImage } from "@/components/QrCode";
import { FigurePicker } from "@/components/avatars/FigurePicker";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { ensureFamilyForUser, getAdminSetupStatus, getCurrentSessionUser, type ApprovalMode } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { taskArtKey } from "@/components/task-art";
import { taskSuggestionTitle } from "@/lib/task-packs-i18n";
import { useLang, useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    prepareFailed: "Klarte ikke å gjøre klar familien. Last inn siden på nytt.",
    setupFailed: "Klarte ikke å hente oppsettet. Last inn siden på nytt.",
    notLoggedIn: "Ikke innlogget.",
    qrFailed: "Kunne ikke lage QR-lenke.",
    reload: "Noe gikk galt. Last inn siden på nytt.",
    saveFailed: "Noe gikk galt under lagringen. Prøv igjen.",
    loading: "Laster",
    step: (n: number) => `Steg ${n} av 5`,
    title: "Kom i gang",
    family: "Familie",
    familyName: "Familienavn (valgfritt)",
    familyPh: "For eksempel: Hansen",
    acceptA: "Jeg godtar ",
    terms: "brukervilkårene",
    acceptB: " og har lest ",
    privacy: "personvernerklæringen",
    acceptC: ".",
    next: "Neste",
    back: "Tilbake",
    addChildTitle: "Legg til barn",
    hasChildren: "Familien har allerede barn registrert. Du kan likevel legge til flere.",
    childName: "Barnets navn",
    addChild: "Legg til barn",
    figure: "Velg figur (barnet kan bytte selv senere)",
    remove: "Fjern",
    tasks: "Oppgaver",
    hasTasks: "Familien har allerede oppgaver. Du kan hoppe videre eller legge til flere.",
    selected: (n: number) => `Valgt: ${n} oppgaver.`,
    approvalTitle: "Godkjenning og sparing",
    require: "Krev godkjenning",
    requireText: "Barn sender krav, forelder godkjenner manuelt.",
    auto: "Auto-godkjenn",
    autoText: "Krav godkjennes automatisk.",
    savings: "Sparing",
    savingsText: "En del av alt barnet tjener settes av automatisk. Du kan endre dette senere under Innstillinger.",
    off: "Av",
    summary: (kids: number, tasks: number, approval: boolean, pct: number) =>
      `Oppsummering: ${kids} nye barn, ${tasks} nye oppgaver, ${approval ? "krever godkjenning" : "godkjennes automatisk"}, ${pct === 0 ? "ingen sparing" : `${pct} % sparing`}.`,
    saving: "Lagrer …",
    connect: "Koble til iPaden",
    saved: "Barn og oppgaver er lagret. Nå gjenstår bare enheten barna skal bruke.",
    connectText: "Barnesiden kjører på en delt iPad i kiosk-modus. Åpne QR-koden under på iPaden (eller skann den) for å koble nettbrettet til familien. Barnet velger sin egen profil hver gang – ingenting lagres permanent på enheten.",
    makingQr: "Lager QR-kode …",
    errorPrefix: "Feil:",
    scan: "Skann QR med iPad",
    qrValid: "Koden virker i 10 minutter og kan brukes én gang. Trykk «Ny QR-kode» hvis den har gått ut.",
    copied: "Kopiert",
    copyLink: "Kopier lenke",
    newQr: "Ny QR-kode",
    makeQr: "Lag QR-kode",
    moreDevices: "Du kan alltid koble til flere enheter under Mer → Enheter.",
    start: "Begynn å bruke appen",
  },
  en: {
    prepareFailed: "Couldn't get the family ready. Reload the page.",
    setupFailed: "Couldn't load the setup. Reload the page.",
    notLoggedIn: "Not logged in.",
    qrFailed: "Couldn't create a QR link.",
    reload: "Something went wrong. Reload the page.",
    saveFailed: "Something went wrong while saving. Please try again.",
    loading: "Loading",
    step: (n: number) => `Step ${n} of 5`,
    title: "Get started",
    family: "Family",
    familyName: "Family name (optional)",
    familyPh: "For example: Smith",
    acceptA: "I accept the ",
    terms: "terms of use",
    acceptB: " and have read the ",
    privacy: "privacy policy",
    acceptC: ".",
    next: "Next",
    back: "Back",
    addChildTitle: "Add children",
    hasChildren: "The family already has children registered. You can still add more.",
    childName: "Child's name",
    addChild: "Add child",
    figure: "Choose a character (your child can change it later)",
    remove: "Remove",
    tasks: "Tasks",
    hasTasks: "The family already has tasks. You can skip ahead or add more.",
    selected: (n: number) => `Selected: ${n} tasks.`,
    approvalTitle: "Approval and savings",
    require: "Require approval",
    requireText: "Children send requests, a parent approves them manually.",
    auto: "Auto-approve",
    autoText: "Requests are approved automatically.",
    savings: "Savings",
    savingsText: "A share of everything your child earns is set aside automatically. You can change this later in Settings.",
    off: "Off",
    summary: (kids: number, tasks: number, approval: boolean, pct: number) =>
      `Summary: ${kids} new children, ${tasks} new tasks, ${approval ? "approval required" : "approved automatically"}, ${pct === 0 ? "no savings" : `${pct} % savings`}.`,
    saving: "Saving …",
    connect: "Connect the iPad",
    saved: "Children and tasks are saved. All that's left is the device the kids will use.",
    connectText: "The children's page runs on a shared iPad in kiosk mode. Open the QR code below on the iPad (or scan it) to connect the tablet to your family. Your child picks their own profile every time – nothing is stored permanently on the device.",
    makingQr: "Creating QR code …",
    errorPrefix: "Error:",
    scan: "Scan the QR code with the iPad",
    qrValid: "The code works for 10 minutes and can be used once. Tap “New QR code” if it has expired.",
    copied: "Copied",
    copyLink: "Copy link",
    newQr: "New QR code",
    makeQr: "Create QR code",
    moreDevices: "You can always connect more devices under More → Devices.",
    start: "Start using the app",
  },
  uk: {
    prepareFailed: "Не вдалося підготувати родину. Перезавантажте сторінку.",
    setupFailed: "Не вдалося завантажити налаштування. Перезавантажте сторінку.",
    notLoggedIn: "Ви не ввійшли.",
    qrFailed: "Не вдалося створити QR-посилання.",
    reload: "Щось пішло не так. Перезавантажте сторінку.",
    saveFailed: "Під час збереження щось пішло не так. Спробуйте ще раз.",
    loading: "Завантаження",
    step: (n: number) => `Крок ${n} з 5`,
    title: "Початок",
    family: "Родина",
    familyName: "Назва родини (необов’язково)",
    familyPh: "Наприклад: Шевченки",
    acceptA: "Я приймаю ",
    terms: "умови користування",
    acceptB: " і ознайомлююся з ",
    privacy: "політикою конфіденційності",
    acceptC: ".",
    next: "Далі",
    back: "Назад",
    addChildTitle: "Додайте дітей",
    hasChildren: "У родині вже є діти. Ви можете додати ще.",
    childName: "Ім’я дитини",
    addChild: "Додати дитину",
    figure: "Оберіть персонажа (дитина зможе змінити його пізніше)",
    remove: "Прибрати",
    tasks: "Завдання",
    hasTasks: "У родині вже є завдання. Можна перейти далі або додати ще.",
    selected: (n: number) => `Вибрано завдань: ${n}.`,
    approvalTitle: "Схвалення й заощадження",
    require: "Вимагати схвалення",
    requireText: "Діти надсилають запити, батьки схвалюють їх вручну.",
    auto: "Автосхвалення",
    autoText: "Запити схвалюються автоматично.",
    savings: "Заощадження",
    savingsText: "Частина всього, що заробляє дитина, відкладається автоматично. Це можна змінити пізніше в налаштуваннях.",
    off: "Вимк.",
    summary: (kids: number, tasks: number, approval: boolean, pct: number) =>
      `Підсумок: нових дітей – ${kids}, нових завдань – ${tasks}, ${approval ? "потрібне схвалення" : "схвалюється автоматично"}, ${pct === 0 ? "без заощаджень" : `заощадження ${pct} %`}.`,
    saving: "Зберігаємо …",
    connect: "Підключіть iPad",
    saved: "Дітей і завдання збережено. Залишилося тільки підключити пристрій для дітей.",
    connectText: "Дитяча сторінка працює на спільному iPad у режимі кіоску. Відкрийте QR-код нижче на iPad (або відскануйте його), щоб підключити планшет до родини. Дитина щоразу сама обирає свій профіль – на пристрої нічого не зберігається назавжди.",
    makingQr: "Створюємо QR-код …",
    errorPrefix: "Помилка:",
    scan: "Відскануйте QR-код на iPad",
    qrValid: "Код діє 10 хвилин, і його можна використати один раз. Натисніть «Новий QR-код», якщо термін минув.",
    copied: "Скопійовано",
    copyLink: "Скопіювати посилання",
    newQr: "Новий QR-код",
    makeQr: "Створити QR-код",
    moreDevices: "Підключити інші пристрої можна будь-коли в розділі «Більше» → «Пристрої».",
    start: "Почати користуватися",
  },
};

type TaskTemplate = {
  key: string;
  title: string;
  emoji?: string;
  amountOre: number;
  enabled: boolean;
};

type ChildDraft = {
  name: string;
  avatarKey: string;
};

// Forslagene kommer fra oppgavepakkene. De vanligste er slått på fra start.
const ON_BY_DEFAULT = new Set(["Rydde rommet", "Ta oppvasken", "Ta ut søppel", "Dekke bordet"]);
const defaultTasks: TaskTemplate[] = BASIC_TASKS.map((t) => ({
  key: t.title,
  title: t.title,
  emoji: t.emoji,
  amountOre: t.kr * 100,
  enabled: ON_BY_DEFAULT.has(t.title),
}));

export default function OnboardingPage() {
  const router = useRouter();
  const t = useText(TEXT);
  const lang = useLang();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [childName, setChildName] = useState("");
  const [childAvatar, setChildAvatar] = useState(DEFAULT_AVATAR_KEY);
  const [childrenDrafts, setChildrenDrafts] = useState<ChildDraft[]>([]);

  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(defaultTasks);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("REQUIRE_APPROVAL");
  // Nye familier starter med 10 % sparing; kan endres her og under Innstillinger.
  const [savingsPercent, setSavingsPercent] = useState(10);

  const [hasChildrenAlready, setHasChildrenAlready] = useState(false);
  const [hasTasksAlready, setHasTasksAlready] = useState(false);
  const [saving, setSaving] = useState(false);

  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    const run = async () => {
      const session = await getCurrentSessionUser();
      if (!session.user) {
        router.replace("/login");
        return;
      }

      const ensured = await ensureFamilyForUser({ id: session.user.id, email: session.user.email });
      if (ensured.error) {
        console.error(ensured.error);
        setStatus(t.prepareFailed);
        setIsError(true);
        setLoading(false);
        return;
      }

      const setup = await getAdminSetupStatus();
      if (setup.error) {
        console.error(setup.error);
        setStatus(t.setupFailed);
        setIsError(true);
        setLoading(false);
        return;
      }

      if (!setup.needsOnboarding && setup.familyId) {
        router.replace("/admin/inbox");
        return;
      }

      setFamilyId(setup.familyId);
      setHasChildrenAlready(setup.hasChildren);
      setHasTasksAlready(setup.hasTasks);

      if (setup.familyId) {
        const familyRes = await supabase.from("families").select("name, approval_mode").eq("id", setup.familyId).maybeSingle();
        if (!familyRes.error && familyRes.data) {
          setFamilyName((familyRes.data.name as string | undefined) ?? "");
          setApprovalMode((familyRes.data.approval_mode as ApprovalMode | undefined) ?? "REQUIRE_APPROVAL");
        }
      }

      setLoading(false);
    };

    void run();
    // Teksten leses bare første gang siden åpnes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const selectedTaskCount = useMemo(() => taskTemplates.filter((task) => task.enabled).length, [taskTemplates]);

  const canContinueStep1 = acceptedTerms;
  const canContinueStep2 = hasChildrenAlready || childrenDrafts.length > 0;
  const canContinueStep3 = hasTasksAlready || selectedTaskCount > 0;

  const addChildDraft = () => {
    const trimmed = childName.trim();
    if (!trimmed) return;
    setChildrenDrafts((prev) => [...prev, { name: trimmed, avatarKey: childAvatar }]);
    setChildName("");
    setChildAvatar(DEFAULT_AVATAR_KEY);
  };

  const removeChildDraft = (index: number) => {
    setChildrenDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTask = (key: string) => {
    setTaskTemplates((prev) => prev.map((task) => (task.key === key ? { ...task, enabled: !task.enabled } : task)));
  };

  const updateTaskAmount = (key: string, amountNok: string) => {
    const parsed = Number(amountNok.replace(",", "."));
    const amountOre = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0;
    setTaskTemplates((prev) => prev.map((task) => (task.key === key ? { ...task, amountOre } : task)));
  };

  const openQr = async (regenerate: boolean) => {
    setQrBusy(true);
    setQrError("");
    setQrCopied(false);

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) {
      setQrBusy(false);
      setQrError(t.notLoggedIn);
      return;
    }

    const res = await fetch("/api/admin/devices/qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ regenerate }),
    });

    const payload = (await res.json().catch(() => ({}))) as { error?: string; claimUrl?: string };
    setQrBusy(false);

    if (!res.ok || payload.error || !payload.claimUrl) {
      setQrError(payload.error ?? t.qrFailed);
      return;
    }

    setClaimUrl(payload.claimUrl);
  };

  // Barn og oppgaver maa ligge i databasen foer QR-koden vises: forelderen skanner
  // den med en gang, og en iPad som lander paa /kids uten profiler er en blindvei.
  const persistSetup = async (): Promise<boolean> => {
    if (!familyId) {
      setStatus(t.reload);
      setIsError(true);
      return false;
    }

    setSaving(true);
    setStatus("");
    setIsError(false);

    if (familyName.trim()) {
      const familyUpdate = await supabase.from("families").update({ name: familyName.trim() }).eq("id", familyId);
      if (familyUpdate.error) {
        setSaving(false);
        console.error(familyUpdate.error.message);
        setStatus(t.saveFailed);
        setIsError(true);
        return false;
      }
    }

    if (!hasChildrenAlready && childrenDrafts.length > 0) {
      const childRows = childrenDrafts.map((child) => ({
        family_id: familyId,
        name: child.name,
        avatar_key: child.avatarKey,
        active: true,
      }));
      const childInsert = await supabase.from("children").insert(childRows);
      if (childInsert.error) {
        setSaving(false);
        console.error(childInsert.error.message);
        setStatus(t.saveFailed);
        setIsError(true);
        return false;
      }
    }

    if (!hasTasksAlready) {
      const taskRows = taskTemplates
        .filter((task) => task.enabled)
        .map((task) => ({
          family_id: familyId,
          title: taskSuggestionTitle(task.title, lang),
          amount_ore: task.amountOre,
          // På engelsk/ukrainsk kan ikke bildet gjettes ut fra navnet, så det lagres.
          icon: lang === "nb" ? null : (taskArtKey(task.title) ?? task.emoji ?? null),
          active: true,
        }));

      if (taskRows.length > 0) {
        const taskInsert = await supabase.from("tasks").insert(taskRows);
        if (taskInsert.error) {
          setSaving(false);
          console.error(taskInsert.error.message);
          setStatus(t.saveFailed);
        setIsError(true);
          return false;
        }
      }
    }

    const settingsUpdate = await supabase.from("families").update({ approval_mode: approvalMode, savings_percent: savingsPercent })
      .eq("id", familyId);
    if (settingsUpdate.error) {
      setSaving(false);
      console.error(settingsUpdate.error.message);
      setStatus(t.saveFailed);
        setIsError(true);
      return false;
    }

    // Gjoer et nytt kall til persistSetup til en no-op for barn/oppgaver, slik at
    // "Tilbake" fra barnemodus og "Neste" igjen ikke oppretter duplikater.
    if (childrenDrafts.length > 0) setHasChildrenAlready(true);
    setChildrenDrafts([]);
    setHasTasksAlready(true);

    setSaving(false);
    return true;
  };

  const goToBarnemodus = async () => {
    const saved = await persistSetup();
    if (!saved) return;

    setStep(5);
    if (!claimUrl && !qrBusy) {
      void openQr(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label={t.loading}>
        <span className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <LanguageSwitcher className="absolute right-3 top-3" />
      <section className="mx-auto max-w-3xl space-y-5">
        <header className="px-1 pt-2">
          <p className="text-sm font-semibold text-muted-foreground">{t.step(step)}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t.title}</h1>
          <div className="mt-4 grid grid-cols-5 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`h-2 rounded-full transition ${n <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </header>

        {step === 1 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">{t.family}</h2>
            <label className="mt-4 block space-y-1.5 text-sm">
              <span className="text-foreground/80">{t.familyName}</span>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder={t.familyPh}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5"
              />
            </label>
            <label className="mt-4 flex items-start gap-3 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>{t.acceptA}<a href="/vilkar" className="font-semibold underline underline-offset-4">{t.terms}</a>{t.acceptB}<a href="/personvern" className="font-semibold underline underline-offset-4">{t.privacy}</a>{t.acceptC}</span>
            </label>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">{t.addChildTitle}</h2>
            {hasChildrenAlready && (
              <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t.hasChildren}
              </p>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder={t.childName}
                className="rounded-xl border border-border bg-card px-3 py-2.5"
              />
              <button
                type="button"
                onClick={addChildDraft}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary/40"
              >
                {t.addChild}
              </button>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-foreground/85">{t.figure}</p>
              <FigurePicker value={childAvatar} onChange={setChildAvatar} lang={lang} />
            </div>

            <div className="mt-5 space-y-2">
              {childrenDrafts.map((child, index) => (
                <div key={`${child.name}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <KidAvatar avatarKey={child.avatarKey} size={32} />
                    <span>{child.name}</span>
                  </div>
                  <button type="button" onClick={() => removeChildDraft(index)} className="text-xs text-red-700 hover:text-red-800">
                    {t.remove}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                {t.back}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canContinueStep2}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">{t.tasks}</h2>
            {hasTasksAlready && (
              <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {t.hasTasks}
              </p>
            )}
            <div className="mt-4 space-y-3">
              {taskTemplates.map((task) => (
                <div key={task.key} className="grid items-center gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-[auto_1fr_120px]">
                  <input type="checkbox" checked={task.enabled} onChange={() => toggleTask(task.key)} className="h-4 w-4" />
                  <div className="text-sm">{taskSuggestionTitle(task.title, lang)}</div>
                  <input
                    type="text"
                    defaultValue={(task.amountOre / 100).toString()}
                    onChange={(e) => updateTaskAmount(task.key, e.target.value)}
                    className="rounded border border-border bg-card px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.selected(selectedTaskCount)}</p>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                {t.back}
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!canContinueStep3}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">{t.approvalTitle}</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
                <input
                  type="radio"
                  name="approvalMode"
                  checked={approvalMode === "REQUIRE_APPROVAL"}
                  onChange={() => setApprovalMode("REQUIRE_APPROVAL")}
                />
                <span>
                  {t.require}
                  <span className="block text-muted-foreground">{t.requireText}</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
                <input
                  type="radio"
                  name="approvalMode"
                  checked={approvalMode === "AUTO_APPROVE"}
                  onChange={() => setApprovalMode("AUTO_APPROVE")}
                />
                <span>
                  {t.auto}
                  <span className="block text-muted-foreground">{t.autoText}</span>
                </span>
              </label>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold">{t.savings}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.savingsText}
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[0, 5, 10, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    aria-pressed={savingsPercent === pct}
                    onClick={() => setSavingsPercent(pct)}
                    className={`font-num rounded-xl border py-2.5 text-sm font-bold transition ${
                      savingsPercent === pct
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {pct === 0 ? t.off : `${pct} %`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-secondary p-3 text-sm text-foreground/80">
              {t.summary(childrenDrafts.length, selectedTaskCount, approvalMode === "REQUIRE_APPROVAL", savingsPercent)}
            </div>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(3)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                {t.back}
              </button>
              <button
                type="button"
                onClick={() => void goToBarnemodus()}
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? t.saving : t.next}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">{t.connect}</h2>
            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {t.saved}
            </p>
            <p className="mt-3 text-sm text-foreground/80">
              {t.connectText}
            </p>

            <div className="mt-4">
              {qrBusy && <p className="text-sm text-muted-foreground">{t.makingQr}</p>}

              {qrError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{t.errorPrefix} {qrError}</p>
              )}

              {claimUrl && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="mb-1 text-sm font-semibold text-amber-800">{t.scan}</div>
                  <div className="mb-3 text-xs">{t.qrValid}</div>
                  <QrImage value={claimUrl} size={240} className="rounded-xl border border-amber-200 bg-white p-2" />
                  <div className="mt-3 break-all rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">{claimUrl}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(claimUrl);
                        setQrCopied(true);
                      }}
                      className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
                    >
                      {qrCopied ? t.copied : t.copyLink}
                    </button>
                    <button
                      type="button"
                      onClick={() => void openQr(true)}
                      disabled={qrBusy}
                      className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {t.newQr}
                    </button>
                  </div>
                </div>
              )}

              {!qrBusy && !claimUrl && (
                <button
                  type="button"
                  onClick={() => void openQr(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-secondary"
                >
                  {t.makeQr}
                </button>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {t.moreDevices}
            </p>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(4)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                {t.back}
              </button>
              <button
                type="button"
                onClick={() => router.replace("/admin/inbox")}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {t.start}
              </button>
            </div>
          </div>
        )}

        {status && (
          <p
            className={`rounded-xl border px-3 py-2 text-sm ${
              isError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {status}
          </p>
        )}
      </section>
    </main>
  );
}
