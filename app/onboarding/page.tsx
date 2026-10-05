"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_AVATAR_KEY } from "@/lib/avatars";
import { TASK_PACKS } from "@/lib/task-packs";
import { QrImage } from "@/components/QrCode";
import { FigurePicker } from "@/components/avatars/FigurePicker";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { ensureFamilyForUser, getAdminSetupStatus, getCurrentSessionUser, type ApprovalMode } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type TaskTemplate = {
  key: string;
  title: string;
  amountOre: number;
  enabled: boolean;
};

type ChildDraft = {
  name: string;
  avatarKey: string;
};

// Forslagene kommer fra oppgavepakkene. De vanligste er slått på fra start.
const ON_BY_DEFAULT = new Set(["Rydde rommet", "Ta oppvasken", "Ta ut søppel", "Dekke bordet"]);
const defaultTasks: TaskTemplate[] = TASK_PACKS.filter((pack) => !pack.extra).flatMap((pack) =>
  pack.tasks.map((t) => ({ key: `${pack.key}-${t.title}`, title: t.title, amountOre: t.kr * 100, enabled: ON_BY_DEFAULT.has(t.title) }))
);

export default function OnboardingPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

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
        setStatus("Feil: Klarte ikke å gjøre klar familien. Last inn siden på nytt.");
        setLoading(false);
        return;
      }

      const setup = await getAdminSetupStatus();
      if (setup.error) {
        console.error(setup.error);
        setStatus("Feil: Klarte ikke å hente oppsettet. Last inn siden på nytt.");
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
      setQrError("Ikke innlogget.");
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
      setQrError(payload.error ?? "Kunne ikke lage QR-lenke.");
      return;
    }

    setClaimUrl(payload.claimUrl);
  };

  // Barn og oppgaver maa ligge i databasen foer QR-koden vises: forelderen skanner
  // den med en gang, og en iPad som lander paa /kids uten profiler er en blindvei.
  const persistSetup = async (): Promise<boolean> => {
    if (!familyId) {
      setStatus("Feil: Noe gikk galt. Last inn siden på nytt.");
      return false;
    }

    setSaving(true);
    setStatus("");

    if (familyName.trim()) {
      const familyUpdate = await supabase.from("families").update({ name: familyName.trim() }).eq("id", familyId);
      if (familyUpdate.error) {
        setSaving(false);
        console.error(familyUpdate.error.message);
        setStatus("Feil: Noe gikk galt under lagringen. Prøv igjen.");
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
        setStatus("Feil: Noe gikk galt under lagringen. Prøv igjen.");
        return false;
      }
    }

    if (!hasTasksAlready) {
      const taskRows = taskTemplates
        .filter((task) => task.enabled)
        .map((task) => ({
          family_id: familyId,
          title: task.title,
          amount_ore: task.amountOre,
          active: true,
        }));

      if (taskRows.length > 0) {
        const taskInsert = await supabase.from("tasks").insert(taskRows);
        if (taskInsert.error) {
          setSaving(false);
          console.error(taskInsert.error.message);
          setStatus("Feil: Noe gikk galt under lagringen. Prøv igjen.");
          return false;
        }
      }
    }

    const settingsUpdate = await supabase.from("families").update({ approval_mode: approvalMode, savings_percent: savingsPercent })
      .eq("id", familyId);
    if (settingsUpdate.error) {
      setSaving(false);
      console.error(settingsUpdate.error.message);
      setStatus("Feil: Noe gikk galt under lagringen. Prøv igjen.");
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
      <main className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Laster">
        <span className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
      </main>
    );
  }

  const isError = status.startsWith("Feil:");

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <header className="px-1 pt-2">
          <p className="text-sm font-semibold text-muted-foreground">Steg {step} av 5</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Kom i gang</h1>
          <div className="mt-4 grid grid-cols-5 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`h-2 rounded-full transition ${n <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </header>

        {step === 1 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">Familie</h2>
            <label className="mt-4 block space-y-1.5 text-sm">
              <span className="text-foreground/80">Familienavn (valgfritt)</span>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="For eksempel: Hansen"
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
              <span>Jeg godtar <a href="/personvern" className="font-semibold underline underline-offset-4">vilkår og personvern</a> for å teste tjenesten.</span>
            </label>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Neste
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">Legg til barn</h2>
            {hasChildrenAlready && (
              <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Familien har allerede barn registrert. Du kan likevel legge til flere.
              </p>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Barnets navn"
                className="rounded-xl border border-border bg-card px-3 py-2.5"
              />
              <button
                type="button"
                onClick={addChildDraft}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary/40"
              >
                Legg til barn
              </button>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-foreground/85">Velg figur (barnet kan bytte selv senere)</p>
              <FigurePicker value={childAvatar} onChange={setChildAvatar} />
            </div>

            <div className="mt-5 space-y-2">
              {childrenDrafts.map((child, index) => (
                <div key={`${child.name}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <KidAvatar avatarKey={child.avatarKey} size={32} />
                    <span>{child.name}</span>
                  </div>
                  <button type="button" onClick={() => removeChildDraft(index)} className="text-xs text-red-700 hover:text-red-800">
                    Fjern
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                Tilbake
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canContinueStep2}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Neste
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">Oppgaver</h2>
            {hasTasksAlready && (
              <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Familien har allerede oppgaver. Du kan hoppe videre eller legge til flere.
              </p>
            )}
            <div className="mt-4 space-y-3">
              {taskTemplates.map((task) => (
                <div key={task.key} className="grid items-center gap-3 rounded-xl border border-border bg-card p-3 md:grid-cols-[auto_1fr_120px]">
                  <input type="checkbox" checked={task.enabled} onChange={() => toggleTask(task.key)} className="h-4 w-4" />
                  <div className="text-sm">{task.title}</div>
                  <input
                    type="text"
                    defaultValue={(task.amountOre / 100).toString()}
                    onChange={(e) => updateTaskAmount(task.key, e.target.value)}
                    className="rounded border border-border bg-card px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Valgt: {selectedTaskCount} oppgaver.</p>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                Tilbake
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!canContinueStep3}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Neste
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">Godkjenning og sparing</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm">
                <input
                  type="radio"
                  name="approvalMode"
                  checked={approvalMode === "REQUIRE_APPROVAL"}
                  onChange={() => setApprovalMode("REQUIRE_APPROVAL")}
                />
                <span>
                  Krev godkjenning
                  <span className="block text-muted-foreground">Barn sender krav, forelder godkjenner manuelt.</span>
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
                  Auto-godkjenn
                  <span className="block text-muted-foreground">Krav godkjennes automatisk.</span>
                </span>
              </label>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold">Sparing</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                En del av alt barnet tjener settes av automatisk. Du kan endre dette senere under Innstillinger.
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
                    {pct === 0 ? "Av" : `${pct} %`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-secondary p-3 text-sm text-foreground/80">
              Oppsummering: {childrenDrafts.length} nye barn, {selectedTaskCount} nye oppgaver,{" "}
              {approvalMode === "REQUIRE_APPROVAL" ? "krever godkjenning" : "godkjennes automatisk"},{" "}
              {savingsPercent === 0 ? "ingen sparing" : `${savingsPercent} % sparing`}.
            </div>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(3)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                Tilbake
              </button>
              <button
                type="button"
                onClick={() => void goToBarnemodus()}
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Lagrer..." : "Neste"}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold tracking-tight">Koble til iPaden</h2>
            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Barn og oppgaver er lagret. Na gjenstar bare enheten barna skal bruke.
            </p>
            <p className="mt-3 text-sm text-foreground/80">
              Barnesiden kjører på en delt iPad i kiosk-modus. Åpne QR-koden under på iPaden (eller skann den) for å koble
              nettbrettet til familien. Barnet velger sin egen profil hver gang - ingenting lagres permanent på enheten.
            </p>

            <div className="mt-4">
              {qrBusy && <p className="text-sm text-muted-foreground">Lager QR-kode...</p>}

              {qrError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">Feil: {qrError}</p>
              )}

              {claimUrl && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="mb-3 text-sm font-semibold text-amber-800">Skann QR med iPad</div>
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
                      {qrCopied ? "Kopiert" : "Kopier lenke"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void openQr(true)}
                      disabled={qrBusy}
                      className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Regenerer QR
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
                  Lag QR-kode
                </button>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Du finner alltid QR-koden igjen under Admin - Enheter.
            </p>

            <div className="mt-5 flex justify-between">
              <button type="button" onClick={() => setStep(4)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold">
                Tilbake
              </button>
              <button
                type="button"
                onClick={() => router.replace("/admin/inbox")}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Begynn a bruke appen
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
