"use client";

import useSWR from "swr";
import { CheckCheck, PiggyBank } from "lucide-react";
import { Card, CardHeader, ListSkeleton, Switch, cx, focusRing } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { friendlyError, swrDefaults, useAdminIdentity } from "@/lib/admin-data";
import type { ApprovalMode } from "@/lib/family-client";
import { formatKr } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import { NotificationsCard } from "./NotificationsCard";

const SAVINGS_OPTIONS = [0, 5, 10, 15, 20, 25];

type FamilySettings = { approval_mode: ApprovalMode; savings_percent: number; show_savings_to_kids: boolean };

export default function AdminSettingsPage() {
  const toast = useToast();
  const { familyId } = useAdminIdentity();
  const settings = useSWR(
    familyId ? ["family-settings", familyId] : null,
    async () => {
      const res = await supabase.from("families").select("approval_mode, savings_percent, show_savings_to_kids").eq("id", familyId as string).maybeSingle();
      if (res.error || !res.data) throw new Error(res.error?.message ?? "Fant ikke familien");
      return {
        approval_mode: (res.data.approval_mode as ApprovalMode) ?? "REQUIRE_APPROVAL",
        savings_percent: res.data.savings_percent ?? 0,
        show_savings_to_kids: res.data.show_savings_to_kids ?? true,
      } as FamilySettings;
    },
    swrDefaults
  );

  // Lagres med en gang; skjermen oppdateres før svaret kommer.
  const save = async (patch: Partial<FamilySettings>) => {
    if (!familyId || !settings.data) return;
    try {
      await settings.mutate(
        async (current) => {
          const res = await supabase.from("families").update(patch).eq("id", familyId);
          if (res.error) throw new Error(res.error.message);
          return { ...(current as FamilySettings), ...patch };
        },
        { optimisticData: (current) => ({ ...(current as FamilySettings), ...patch }), rollbackOnError: true, revalidate: false }
      );
      toast({ text: "Lagret" });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre.") });
    }
  };

  if (!settings.data) return <ListSkeleton rows={2} />;
  const s = settings.data;
  const exampleSaved = Math.floor((2000 * s.savings_percent) / 100);

  return (
    <section className="space-y-5">
      <NotificationsCard />
      <Card>
        <CardHeader icon={<CheckCheck className="size-5" />} title="Godkjenning" description="Skal en voksen godkjenne hver oppgave før pengene havner hos barnet?" />
        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary p-1.5">
          {(
            [
              ["REQUIRE_APPROVAL", "Jeg godkjenner"],
              ["AUTO_APPROVE", "Automatisk"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={s.approval_mode === mode}
              onClick={() => s.approval_mode !== mode && void save({ approval_mode: mode })}
              className={cx("min-h-11 rounded-xl px-3 text-sm font-semibold transition", focusRing, s.approval_mode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          icon={<PiggyBank className="size-5" />}
          title="Sparing"
          description="En fast del av alt barnet tjener settes av automatisk når en oppgave blir godkjent. Gjelder oppgaver som godkjennes fra nå av."
        />
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SAVINGS_OPTIONS.map((pct) => (
            <button
              key={pct}
              type="button"
              aria-pressed={s.savings_percent === pct}
              onClick={() => s.savings_percent !== pct && void save({ savings_percent: pct })}
              className={cx(
                "font-num min-h-12 rounded-2xl border text-base font-bold transition",
                focusRing,
                s.savings_percent === pct ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card hover:border-primary/40 hover:bg-secondary"
              )}
            >
              {pct === 0 ? "Av" : `${pct} %`}
            </button>
          ))}
        </div>
        {s.savings_percent > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            En oppgave til 20 kr gir <strong className="text-foreground">{formatKr(2000 - exampleSaved)}</strong> til gode og{" "}
            <strong className="text-foreground">{formatKr(exampleSaved)}</strong> i sparegrisen.
          </p>
        )}
        <div className="mt-5 rounded-2xl bg-secondary px-4 py-3.5">
          <Switch
            checked={s.show_savings_to_kids}
            onChange={(next) => void save({ show_savings_to_kids: next })}
            label="Vis sparegrisen for barna"
            description="Barnet ser hvor mye det har spart."
          />
        </div>
      </Card>
    </section>
  );
}
