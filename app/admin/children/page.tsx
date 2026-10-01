"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ChevronRight, Plus, X } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, ListSkeleton, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { type AdminChild, friendlyError, swrDefaults, useAdminIdentity, useChildren } from "@/lib/admin-data";
import { DEFAULT_AVATAR_KEY } from "@/lib/avatars";
import { FigurePicker } from "@/components/avatars/FigurePicker";
import { KidAvatar } from "@/components/avatars/KidAvatar";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

type ChildStats = { dueOre: number; paidOre: number; savedOre: number; pendingCount: number; weekOre: number };
const EMPTY_STATS: ChildStats = { dueOre: 0, paidOre: 0, savedOre: 0, pendingCount: 0, weekOre: 0 };
const BONUS_AMOUNTS = [10, 20, 50, 100];

async function loadStats(familyId: string) {
  const res = await supabase.from("claims").select("child_id, status, amount_ore, saved_ore, decided_at, created_at").eq("family_id", familyId);
  if (res.error) throw new Error(res.error.message);
  const stats: Record<string, ChildStats> = {};
  const weekAgo = Date.now() - 7 * 86_400_000;
  for (const claim of (res.data ?? []) as Array<{ child_id: string; status: string; amount_ore: number; saved_ore: number | null; decided_at: string | null; created_at: string }>) {
    const s = (stats[claim.child_id] ??= { ...EMPTY_STATS });
    if (claim.status === "SENT") s.pendingCount += 1;
    if (claim.status === "APPROVED") s.dueOre += claim.amount_ore;
    if (claim.status === "PAID") s.paidOre += claim.amount_ore;
    if (claim.status === "APPROVED" || claim.status === "PAID") {
      s.savedOre += claim.saved_ore ?? 0;
      if (new Date(claim.decided_at ?? claim.created_at).getTime() >= weekAgo) s.weekOre += claim.amount_ore + (claim.saved_ore ?? 0);
    }
  }
  return stats;
}

export default function AdminChildrenPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { familyId } = useAdminIdentity();
  const children = useChildren(familyId);
  const stats = useSWR(familyId ? ["child-stats", familyId] : null, () => loadStats(familyId as string), swrDefaults);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarKey, setAvatarKey] = useState(DEFAULT_AVATAR_KEY);
  const [saving, setSaving] = useState(false);
  const [editingAvatarFor, setEditingAvatarFor] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [bonusFor, setBonusFor] = useState<string | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusText, setBonusText] = useState("");
  const [bonusSaving, setBonusSaving] = useState(false);
  const { userId } = useAdminIdentity();

  // Bonus lagres som et godkjent krav uten oppgave, med teksten i note.
  // Sparing trekkes som for andre godkjente krav.
  const giveBonus = async (child: AdminChild) => {
    const amountOre = parseKrToOre(bonusAmount);
    if (typeof amountOre !== "number" || amountOre <= 0) {
      toast({ kind: "error", text: "Velg eller skriv et beløp." });
      return;
    }
    if (!familyId || bonusSaving) return;
    setBonusSaving(true);
    const now = new Date().toISOString();
    const res = await supabase.from("claims").insert({
      family_id: familyId,
      child_id: child.id,
      task_id: null,
      amount_ore: amountOre,
      status: "APPROVED",
      note: bonusText.trim().slice(0, 120) || "Bonus",
      decided_at: now,
      decided_by: userId,
    });
    setBonusSaving(false);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å gi bonus.") });
      return;
    }
    toast({ text: `🎁 ${formatKr(amountOre)} i bonus til ${child.name}` });
    setBonusFor(null);
    setBonusAmount("");
    setBonusText("");
    await stats.mutate();
  };

  const all = children.data ?? [];
  const active = all.filter((c) => c.active);
  const inactive = all.filter((c) => !c.active);

  const createChild = async () => {
    if (!familyId || saving || !name.trim()) return;
    setSaving(true);
    const res = await supabase.from("children").insert({ family_id: familyId, name: name.trim(), avatar_key: avatarKey, active: true });
    setSaving(false);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message, "Klarte ikke å legge til barnet.") });
      return;
    }
    toast({ text: `${name.trim()} er lagt til` });
    setName("");
    setAvatarKey(DEFAULT_AVATAR_KEY);
    setFormOpen(false);
    await children.mutate();
  };

  const setActive = async (child: AdminChild, nextActive: boolean) => {
    if (!nextActive) {
      const ok = await confirm({
        title: `Fjerne ${child.name}?`,
        text: "Barnet forsvinner fra barnesiden. Historikken beholdes, og du kan hente barnet tilbake senere.",
        confirmLabel: "Fjern",
        danger: true,
      });
      if (!ok) return;
    }
    const res = await supabase.from("children").update({ active: nextActive }).eq("id", child.id);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message) });
      return;
    }
    toast({ text: nextActive ? `${child.name} er tilbake` : `${child.name} er fjernet` });
    await children.mutate();
  };

  const updateAvatar = async (child: AdminChild, key: string) => {
    setEditingAvatarFor(null);
    const res = await supabase.from("children").update({ avatar_key: key }).eq("id", child.id);
    if (res.error) {
      toast({ kind: "error", text: friendlyError(res.error.message) });
      return;
    }
    await children.mutate();
  };

  if (!familyId || (children.isLoading && !children.data)) return <ListSkeleton rows={3} />;

  return (
    <section className="space-y-5">
      {formOpen ? (
        <Card className="animate-pop space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Legg til barn</h2>
            <button type="button" aria-label="Lukk" onClick={() => setFormOpen(false)} className={cx("flex size-10 items-center justify-center rounded-full hover:bg-secondary", focusRing)}>
              <X className="size-5" />
            </button>
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createChild();
            }}
          >
            <Field label="Navn">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Nora" autoFocus maxLength={40} />
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground/85">Velg figur (barnet kan bytte selv senere)</p>
              <FigurePicker value={avatarKey} onChange={setAvatarKey} />
            </div>
            <Button type="submit" block size="lg" loading={saving} disabled={!name.trim()}>
              Legg til
            </Button>
          </form>
        </Card>
      ) : (
        <Button size="lg" block icon={<Plus className="size-5" />} onClick={() => setFormOpen(true)}>
          Legg til barn
        </Button>
      )}

      {active.length === 0 && (
        <EmptyState emoji="👶" title="Ingen barn ennå">
          Legg til det første barnet, så dukker det opp på barnesiden.
        </EmptyState>
      )}

      {active.length > 0 && stats.data && (
        <div className="rounded-[2rem] bg-primary p-5 text-primary-foreground shadow-lg sm:p-6">
          <p className="text-sm font-semibold opacity-80">Hele familien</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Til gode", active.reduce((sum, c) => sum + (stats.data?.[c.id]?.dueOre ?? 0), 0)],
              ["Spart", active.reduce((sum, c) => sum + (stats.data?.[c.id]?.savedOre ?? 0), 0)],
              ["Utbetalt", active.reduce((sum, c) => sum + (stats.data?.[c.id]?.paidOre ?? 0), 0)],
              ["Tjent siste 7 dager", active.reduce((sum, c) => sum + (stats.data?.[c.id]?.weekOre ?? 0), 0)],
            ].map(([label, ore]) => (
              <div key={label as string} className="rounded-2xl bg-primary-foreground/12 px-3 py-2.5">
                <dt className="text-xs font-semibold opacity-80">{label}</dt>
                <dd className="font-num mt-0.5 text-lg font-bold">{formatKr(ore as number)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {active.map((child) => {
          const s = stats.data?.[child.id] ?? EMPTY_STATS;
          return (
            <li key={child.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-3 p-4" style={{ background: child.color.bg, color: child.color.ink }}>
                <button
                  type="button"
                  onClick={() => setEditingAvatarFor(editingAvatarFor === child.id ? null : child.id)}
                  aria-label={`Bytt figur for ${child.name}`}
                  className={cx("shrink-0 rounded-full transition hover:scale-105", focusRing)}
                >
                  <KidAvatar avatarKey={child.avatar_key} size={56} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xl font-extrabold tracking-tight">{child.name}</p>
                  {s.pendingCount > 0 && <p className="text-sm font-semibold">{s.pendingCount} venter på godkjenning</p>}
                </div>
              </div>

              {editingAvatarFor === child.id && (
                <div className="animate-pop border-b border-border p-4">
                  <FigurePicker value={child.avatar_key} onChange={(key) => void updateAvatar(child, key)} />
                </div>
              )}

              <dl className="grid grid-cols-3 gap-2 p-4">
                {[
                  ["Til gode", s.dueOre, "text-primary"],
                  ["Spart", s.savedOre, ""],
                  ["Utbetalt", s.paidOre, ""],
                ].map(([label, ore, tone]) => (
                  <div key={label as string} className="rounded-2xl bg-secondary/70 px-3 py-2.5">
                    <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
                    <dd className={cx("font-num mt-0.5 text-base font-bold", tone as string)}>{stats.data ? formatKr(ore as number) : "…"}</dd>
                  </div>
                ))}
              </dl>

              {bonusFor === child.id ? (
                <form
                  className="animate-pop mx-4 mb-4 space-y-3 rounded-2xl bg-amber-50 p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void giveBonus(child);
                  }}
                >
                  <p className="font-bold">🎁 Bonus til {child.name}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {BONUS_AMOUNTS.map((kr) => (
                      <button
                        key={kr}
                        type="button"
                        aria-pressed={bonusAmount === String(kr)}
                        onClick={() => setBonusAmount(String(kr))}
                        className={cx(
                          "font-num min-h-11 rounded-xl border text-sm font-bold transition",
                          focusRing,
                          bonusAmount === String(kr) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
                        )}
                      >
                        {kr} kr
                      </button>
                    ))}
                  </div>
                  <Input value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} inputMode="decimal" placeholder="Annet beløp (kr)" />
                  <Input value={bonusText} onChange={(e) => setBonusText(e.target.value)} maxLength={120} placeholder="Hvorfor? F.eks. hjalp til ekstra" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => setBonusFor(null)}>
                      Avbryt
                    </Button>
                    <Button type="submit" loading={bonusSaving} disabled={!bonusAmount.trim()}>
                      Gi bonus
                    </Button>
                  </div>
                </form>
              ) : null}

              <div className="flex gap-2 px-4 pb-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBonusFor(bonusFor === child.id ? null : child.id);
                    setBonusAmount("");
                    setBonusText("");
                  }}
                >
                  🎁 Bonus
                </Button>
                <Link
                  href={`/admin/children/${child.id}`}
                  className={cx("inline-flex min-h-11 flex-1 items-center justify-between gap-2 rounded-2xl border border-border px-4 text-[15px] font-semibold transition hover:bg-secondary", focusRing)}
                >
                  Detaljer <ChevronRight className="size-4" />
                </Link>
                <Button variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => void setActive(child, false)}>
                  Fjern
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {inactive.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowInactive((v) => !v)} className={cx("min-h-10 rounded-xl px-1 text-sm font-semibold text-muted-foreground hover:text-foreground", focusRing)}>
            {showInactive ? "Skjul fjernede barn" : `Vis fjernede barn (${inactive.length})`}
          </button>
          {showInactive && (
            <ul className="mt-2 space-y-2">
              {inactive.map((child) => (
                <li key={child.id} className="flex items-center gap-3 rounded-3xl border border-dashed border-border bg-card/60 p-3">
                  <span className="opacity-70"><KidAvatar avatarKey={child.avatar_key} size={40} /></span>
                  <span className="flex-1 font-semibold text-muted-foreground">{child.name}</span>
                  <Button variant="secondary" size="sm" onClick={() => void setActive(child, true)}>
                    Hent tilbake
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
