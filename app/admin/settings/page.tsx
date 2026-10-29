"use client";

import useSWR from "swr";
import { CheckCheck, ChevronRight, PiggyBank, Trophy } from "lucide-react";
import { Card, CardHeader, ListSkeleton, Switch, cx, focusRing } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { friendlyError, swrDefaults, useAdminIdentity } from "@/lib/admin-data";
import type { ApprovalMode } from "@/lib/family-client";
import { formatKr } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { DeleteAccountCard } from "./DeleteAccountCard";
import { NotificationsCard } from "./NotificationsCard";
import { Languages } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang, useText } from "@/lib/use-lang";

const TEXT = {
  nb: {
    saved: "Lagret", saveFailed: "Klarte ikke å lagre.", approval: "Godkjenning", approvalDesc: "Skal en voksen godkjenne hver oppgave før pengene havner hos barnet?",
    iApprove: "Jeg godkjenner", auto: "Automatisk", saving: "Sparing",
    savingDesc: "En fast del av alt barnet tjener settes av automatisk når en oppgave blir godkjent. Gjelder oppgaver som godkjennes fra nå av.", off: "Av",
    example: (owed: string, saved: string) => <>En oppgave til 20 kr gir <strong className="text-foreground">{owed}</strong> til gode og <strong className="text-foreground">{saved}</strong> i sparegrisen.</>,
    showPiggy: "Vis sparegrisen for barna", showPiggyDesc: "Barnet ser hvor mye det har spart.", trophies: "Trofeer og bonus", trophiesDesc: "Nivåer per oppgave og bonus som går automatisk til barna",
    language: "Språk", languageDesc: "Språket du ser appen på. Barnas språk velger du på hvert barn under Barn.",
  },
  en: {
    saved: "Saved", saveFailed: "Couldn't save.", approval: "Approval", approvalDesc: "Should an adult approve each task before the money goes to the child?",
    iApprove: "I approve", auto: "Automatic", saving: "Savings",
    savingDesc: "A fixed share of everything the child earns is set aside automatically when a task is approved. Applies to tasks approved from now on.", off: "Off",
    example: (owed: string, saved: string) => <>A task worth 20 kr gives <strong className="text-foreground">{owed}</strong> owed and <strong className="text-foreground">{saved}</strong> in the piggy bank.</>,
    showPiggy: "Show the piggy bank to the children", showPiggyDesc: "The child sees how much they have saved.", trophies: "Trophies and bonuses", trophiesDesc: "Levels per task and bonuses that go to the children automatically",
    language: "Language", languageDesc: "The language you see the app in. You choose each child's language under Children.",
  },
  uk: {
    saved: "Збережено", saveFailed: "Не вдалося зберегти.", approval: "Схвалення", approvalDesc: "Чи має дорослий схвалювати кожне завдання, перш ніж гроші отримає дитина?",
    iApprove: "Я схвалюю", auto: "Автоматично", saving: "Заощадження",
    savingDesc: "Фіксована частка всього, що заробляє дитина, автоматично відкладається, коли завдання схвалено. Діє для завдань, схвалених відтепер.", off: "Вимк.",
    example: (owed: string, saved: string) => <>Завдання за 20 kr дає <strong className="text-foreground">{owed}</strong> до виплати й <strong className="text-foreground">{saved}</strong> у скарбничку.</>,
    showPiggy: "Показувати дітям скарбничку", showPiggyDesc: "Дитина бачить, скільки відклала.", trophies: "Трофеї та бонуси", trophiesDesc: "Рівні для кожного завдання й бонуси, які діти отримують автоматично",
    language: "Мова", languageDesc: "Мова, якою ви бачите застосунок. Мову для кожної дитини обирають у розділі «Діти».",
  },
};

const SAVINGS_OPTIONS = [0, 5, 10, 15, 20, 25];

type FamilySettings = { approval_mode: ApprovalMode; savings_percent: number; show_savings_to_kids: boolean };

export default function AdminSettingsPage() {
  const t = useText(TEXT);
  const lang = useLang();
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
      toast({ text: t.saved });
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, t.saveFailed) });
    }
  };

  if (!settings.data) return <ListSkeleton rows={2} />;
  const s = settings.data;
  const exampleSaved = Math.floor((2000 * s.savings_percent) / 100);

  return (
    <section className="space-y-5">
      <Card>
        <CardHeader icon={<Languages className="size-5" />} title={t.language} description={t.languageDesc} />
        <div className="mt-4">
          <LanguageSwitcher full align="left" />
        </div>
      </Card>
      <NotificationsCard />
      <Card>
        <CardHeader icon={<CheckCheck className="size-5" />} title={t.approval} description={t.approvalDesc} />
        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary p-1.5">
          {(
            [
              ["REQUIRE_APPROVAL", t.iApprove],
              ["AUTO_APPROVE", t.auto],
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
          title={t.saving}
          description={t.savingDesc}
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
              {pct === 0 ? t.off : `${pct} %`}
            </button>
          ))}
        </div>
        {s.savings_percent > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t.example(formatKr(2000 - exampleSaved, lang), formatKr(exampleSaved, lang))}
          </p>
        )}
        <div className="mt-5 rounded-2xl bg-secondary px-4 py-3.5">
          <Switch
            checked={s.show_savings_to_kids}
            onChange={(next) => void save({ show_savings_to_kids: next })}
            label={t.showPiggy}
            description={t.showPiggyDesc}
          />
        </div>
      </Card>
      <Link href="/admin/trophies" className={cx("flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:bg-secondary", focusRing)}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Trophy className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-bold">{t.trophies}</span>
          <span className="block text-sm text-muted-foreground">{t.trophiesDesc}</span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </Link>
      <DeleteAccountCard />
    </section>
  );
}
