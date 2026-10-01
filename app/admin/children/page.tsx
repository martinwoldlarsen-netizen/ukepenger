"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ChevronRight, Plus, X } from "lucide-react";
import { Button, Card, EmptyState, Field, Input, ListSkeleton, cx, focusRing } from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui/feedback";
import { type AdminChild, friendlyError, swrDefaults, useAdminIdentity, useChildren } from "@/lib/admin-data";
import { AVATAR_OPTIONS, DEFAULT_AVATAR_KEY } from "@/lib/avatars";
import { formatKr } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

type ChildStats = { dueOre: number; paidOre: number; savedOre: number; pendingCount: number };
const EMPTY_STATS: ChildStats = { dueOre: 0, paidOre: 0, savedOre: 0, pendingCount: 0 };

async function loadStats(familyId: string) {
  const res = await supabase.from("claims").select("child_id, status, amount_ore, saved_ore").eq("family_id", familyId);
  if (res.error) throw new Error(res.error.message);
  const stats: Record<string, ChildStats> = {};
  for (const claim of (res.data ?? []) as Array<{ child_id: string; status: string; amount_ore: number; saved_ore: number | null }>) {
    const s = (stats[claim.child_id] ??= { ...EMPTY_STATS });
    if (claim.status === "SENT") s.pendingCount += 1;
    if (claim.status === "APPROVED") s.dueOre += claim.amount_ore;
    if (claim.status === "PAID") s.paidOre += claim.amount_ore;
    if (claim.status === "APPROVED" || claim.status === "PAID") s.savedOre += claim.saved_ore ?? 0;
  }
  return stats;
}

function AvatarPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Velg figur">
      {AVATAR_OPTIONS.map((avatar) => {
        const selected = value === avatar.key;
        return (
          <button
            key={avatar.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={avatar.label}
            title={avatar.label}
            onClick={() => onChange(avatar.key)}
            className={cx(
              "flex aspect-square min-h-11 items-center justify-center rounded-2xl text-2xl transition active:scale-95",
              focusRing,
              selected ? "bg-primary/12 ring-2 ring-primary" : "bg-secondary hover:bg-accent"
            )}
          >
            {avatar.emoji}
          </button>
        );
      })}
    </div>
  );
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
              <p className="mb-2 text-sm font-semibold text-foreground/85">Velg figur</p>
              <AvatarPicker value={avatarKey} onChange={setAvatarKey} />
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
                  className={cx("flex size-14 shrink-0 items-center justify-center rounded-full bg-white/85 text-3xl transition hover:scale-105", focusRing)}
                >
                  {child.emoji}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xl font-extrabold tracking-tight">{child.name}</p>
                  {s.pendingCount > 0 && <p className="text-sm font-semibold">{s.pendingCount} venter på godkjenning</p>}
                </div>
              </div>

              {editingAvatarFor === child.id && (
                <div className="animate-pop border-b border-border p-4">
                  <AvatarPicker value={child.avatar_key ?? DEFAULT_AVATAR_KEY} onChange={(key) => void updateAvatar(child, key)} />
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

              <div className="flex gap-2 px-4 pb-4">
                <Link
                  href={`/admin/children/${child.id}`}
                  className={cx("inline-flex min-h-11 flex-1 items-center justify-between gap-2 rounded-2xl border border-border px-4 text-[15px] font-semibold transition hover:bg-secondary", focusRing)}
                >
                  Oppgaver og ønsker <ChevronRight className="size-4" />
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
                  <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-xl opacity-70">{child.emoji}</span>
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
