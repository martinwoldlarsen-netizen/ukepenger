"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCheck, PiggyBank } from "lucide-react";
import { formatKr } from "@/lib/money";
import { type ApprovalMode, getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

const SAVINGS_OPTIONS = [0, 5, 10, 15, 20, 25];

export default function AdminSettingsPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("REQUIRE_APPROVAL");
  const [savingsPercent, setSavingsPercent] = useState(0);
  const [showSavingsToKids, setShowSavingsToKids] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextFamilyId?: string) => {
    const id = nextFamilyId ?? familyId;
    if (!id) return;
    const res = await supabase
      .from("families")
      .select("approval_mode, savings_percent, show_savings_to_kids")
      .eq("id", id)
      .maybeSingle();
    if (res.error || !res.data) {
      setStatus(`Feil: ${res.error?.message ?? "Familie ikke funnet."}`);
      return;
    }
    setApprovalMode((res.data.approval_mode as ApprovalMode) ?? "REQUIRE_APPROVAL");
    setSavingsPercent(res.data.savings_percent ?? 0);
    setShowSavingsToKids(res.data.show_savings_to_kids ?? true);
  }, [familyId]);

  useEffect(() => {
    const run = async () => {
      const ctx = await getCurrentAdminContext();
      if (!ctx.familyId) {
        setStatus("Fant ikke familie.");
        setLoading(false);
        return;
      }
      setFamilyId(ctx.familyId);
      await load(ctx.familyId);
      setLoading(false);
    };
    void run();
  }, [load]);

  const save = async (patch: Record<string, unknown>, onSaved: () => void) => {
    if (!familyId || saving) return;
    setSaving(true);
    setStatus("");
    const res = await supabase.from("families").update(patch).eq("id", familyId);
    setSaving(false);
    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }
    onSaved();
    setStatus("Lagret.");
  };

  if (loading) return <div className="text-muted-foreground">Laster…</div>;

  const isError = status.startsWith("Feil:");

  return (
    <section className="max-w-2xl space-y-5">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
            <CheckCheck className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold tracking-tight">Godkjenning av krav</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Skal en voksen godkjenne hver oppgave før pengene havner hos barnet?
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
          {(
            [
              ["REQUIRE_APPROVAL", "Krever godkjenning"],
              ["AUTO_APPROVE", "Godkjenn automatisk"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              disabled={saving}
              aria-pressed={approvalMode === mode}
              onClick={() => approvalMode !== mode && void save({ approval_mode: mode }, () => setApprovalMode(mode))}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                approvalMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <PiggyBank className="size-5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold tracking-tight">Sparing</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              En fast del av alt barnet tjener settes av automatisk når et krav blir godkjent. Resten kan brukes
              som vanlig. Gjelder krav som godkjennes fra nå av.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SAVINGS_OPTIONS.map((pct) => (
            <button
              key={pct}
              type="button"
              disabled={saving}
              aria-pressed={savingsPercent === pct}
              onClick={() =>
                savingsPercent !== pct && void save({ savings_percent: pct }, () => setSavingsPercent(pct))
              }
              className={`font-num rounded-2xl border py-3 text-base font-bold transition disabled:opacity-60 ${
                savingsPercent === pct
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              {pct === 0 ? "Av" : `${pct} %`}
            </button>
          ))}
        </div>
        {savingsPercent > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Eksempel: en oppgave til 20 kr gir <strong className="text-foreground">{formatKr(2000 - Math.floor((2000 * savingsPercent) / 100))}</strong> til
            gode og <strong className="text-foreground">{formatKr(Math.floor((2000 * savingsPercent) / 100))}</strong> på sparekontoen.
          </p>
        )}

        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3.5">
          <span>
            <span className="block text-sm font-semibold">Vis sparingen for barna</span>
            <span className="block text-sm text-muted-foreground">Barnet ser sparegrisen sin på barnesiden.</span>
          </span>
          <input
            type="checkbox"
            className="peer sr-only"
            checked={showSavingsToKids}
            disabled={saving}
            onChange={(e) => {
              const next = e.target.checked;
              void save({ show_savings_to_kids: next }, () => setShowSavingsToKids(next));
            }}
          />
          <span
            aria-hidden="true"
            className="relative h-7 w-12 shrink-0 rounded-full bg-border transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-card after:shadow after:transition peer-checked:after:translate-x-5"
          />
        </label>
      </div>

      {status && (
        <p
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            isError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {status}
        </p>
      )}
    </section>
  );
}

