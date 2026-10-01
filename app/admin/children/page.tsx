"use client";

import { formatKr } from "@/lib/money";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AVATAR_OPTIONS, DEFAULT_AVATAR_KEY, getAvatarByKey } from "@/lib/avatars";
import { getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type ChildRow = {
  id: string;
  name: string;
  avatar_key: string | null;
  active: boolean;
};

type ClaimRow = {
  child_id: string;
  status: string;
  amount_ore: number;
  saved_ore: number | null;
};

type ChildStats = {
  dueOre: number;
  paidOre: number;
  savedOre: number;
  totalCount: number;
};

export default function AdminChildrenPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [statsByChild, setStatsByChild] = useState<Record<string, ChildStats>>({});
  const [name, setName] = useState("");
  const [avatarKey, setAvatarKey] = useState(DEFAULT_AVATAR_KEY);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async (nextFamilyId?: string) => {
    const id = nextFamilyId ?? familyId;
    if (!id) return;

    let childrenQuery = supabase
      .from("children")
      .select("id, name, avatar_key, active")
      .eq("family_id", id);
    if (!showInactive) {
      childrenQuery = childrenQuery.eq("active", true);
    }
    const childrenRes = await childrenQuery.order("created_at", { ascending: false });

    if (childrenRes.error) {
      setStatus(`Feil: ${childrenRes.error.message}`);
      return;
    }

    setChildren((childrenRes.data ?? []) as ChildRow[]);

    const claimsRes = await supabase
      .from("claims")
      .select("child_id, status, amount_ore, saved_ore")
      .eq("family_id", id);

    if (claimsRes.error) {
      setStatus(`Feil: ${claimsRes.error.message}`);
      return;
    }

    const nextStats: Record<string, ChildStats> = {};
    for (const claim of (claimsRes.data ?? []) as ClaimRow[]) {
      if (!nextStats[claim.child_id]) {
        nextStats[claim.child_id] = { dueOre: 0, paidOre: 0, savedOre: 0, totalCount: 0 };
      }
      if (claim.status === "SENT") {
        nextStats[claim.child_id].totalCount += 1;
      }
      if (claim.status === "APPROVED") {
        nextStats[claim.child_id].dueOre += claim.amount_ore;
      }
      if (claim.status === "PAID") {
        nextStats[claim.child_id].paidOre += claim.amount_ore;
      }
      if (claim.status === "APPROVED" || claim.status === "PAID") {
        nextStats[claim.child_id].savedOre += claim.saved_ore ?? 0;
      }
    }

    setStatsByChild(nextStats);
  }, [familyId, showInactive]);

  useEffect(() => {
    const run = async () => {
      const ctx = await getCurrentAdminContext();
      if (!ctx.familyId) {
        setLoading(false);
        setStatus("Fant ikke familie.");
        return;
      }

      setFamilyId(ctx.familyId);
      await load(ctx.familyId);
      setLoading(false);
    };

    void run();
  }, [load]);

  const createChild = async () => {
    if (!familyId) return;
    setStatus("");
    if (!name.trim()) {
      setStatus("Skriv navn.");
      return;
    }

    const res = await supabase.from("children").insert({
      family_id: familyId,
      name: name.trim(),
      avatar_key: avatarKey,
      active: true,
    });

    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }

    setName("");
    setAvatarKey(DEFAULT_AVATAR_KEY);
    setStatus("Barn opprettet.");
    await load();
  };

  const toggleActive = async (child: ChildRow) => {
    if (child.active) {
      const confirmed = window.confirm(
        "Fjerne barnet? Barnet settes som inaktivt og forsvinner fra appen. Historikk beholdes."
      );
      if (!confirmed) return;
    }
    setStatus("");
    const res = await supabase.from("children").update({ active: !child.active }).eq("id", child.id);
    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }
    await load();
  };

  const updateAvatar = async (childId: string, nextAvatarKey: string) => {
    setStatus("");
    const res = await supabase.from("children").update({ avatar_key: nextAvatarKey }).eq("id", childId);
    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }
    setChildren((prev) => prev.map((child) => (child.id === childId ? { ...child, avatar_key: nextAvatarKey } : child)));
  };

  if (loading) return <div className="text-foreground/80">Laster...</div>;

  const isError = status.startsWith("Feil:");
  const disableCreate = name.trim().length === 0;
  const visibleChildren = showInactive ? children : children.filter((child) => child.active);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <h3 className="mb-3 text-base font-semibold tracking-tight">Legg til barn</h3>
        <div className="flex flex-col gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Navn</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="For eksempel: Nora"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Velg avatar</div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => setAvatarKey(avatar.key)}
                  className={`rounded-xl border px-3 py-2 text-lg ${
                    avatarKey === avatar.key ? "border-primary bg-secondary" : "border-border bg-card"
                  }`}
                  title={avatar.label}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void createChild()}
            disabled={disableCreate}
            className="self-start rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Opprett
          </button>
        </div>
      </div>

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

      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Oversikt per barn</h3>
            <span className="text-sm text-muted-foreground">Til gode, utbetalt, spart og krav som venter</span>
          </div>
          <button
            type="button"
            onClick={() => setShowInactive((prev) => !prev)}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/40 hover:bg-secondary"
          >
            {showInactive ? "Skjul inaktive" : "Vis inaktive"}
          </button>
        </div>
        {visibleChildren.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ingen barn a vise.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleChildren.map((child) => {
              const stats = statsByChild[child.id] ?? { dueOre: 0, paidOre: 0, savedOre: 0, totalCount: 0 };
              const avatar = getAvatarByKey(child.avatar_key);
              return (
                <div key={child.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="text-lg">{avatar.emoji}</span>
                      <span>{child.name}</span>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        child.active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-foreground/80"
                      }`}
                    >
                      {child.active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="rounded-xl bg-secondary/70 px-3 py-2">
                      <div>Til gode</div>
                      <div className="font-num mt-0.5 text-base font-bold text-primary">{formatKr(stats.dueOre)}</div>
                    </div>
                    <div className="rounded-xl bg-secondary/70 px-3 py-2">
                      <div>Utbetalt</div>
                      <div className="font-num mt-0.5 text-base font-bold text-foreground">{formatKr(stats.paidOre)}</div>
                    </div>
                    <div className="rounded-xl bg-secondary/70 px-3 py-2">
                      <div>Spart</div>
                      <div className="font-num mt-0.5 text-base font-bold text-foreground">{formatKr(stats.savedOre)}</div>
                    </div>
                    <div className="rounded-xl bg-secondary/70 px-3 py-2">
                      <div>Krav som venter</div>
                      <div className="font-num mt-0.5 text-base font-bold text-foreground">{stats.totalCount}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/70 text-foreground/80">
            <tr>
              <th className="px-4 py-3">Barn</th>
              <th className="px-4 py-3">Avatar</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Handling</th>
            </tr>
          </thead>
          <tbody>
            {visibleChildren.map((child) => (
              <tr key={child.id} className="border-t border-border text-foreground">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getAvatarByKey(child.avatar_key).emoji}</span>
                    <span>{child.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={child.avatar_key ?? DEFAULT_AVATAR_KEY}
                    onChange={(e) => void updateAvatar(child.id, e.target.value)}
                    className="rounded-xl border border-border bg-card px-2 py-1.5"
                  >
                    {AVATAR_OPTIONS.map((avatar) => (
                      <option key={avatar.key} value={avatar.key}>
                        {avatar.emoji} {avatar.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      child.active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-foreground/80"
                    }`}
                  >
                    {child.active ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleActive(child)}
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/40 hover:bg-secondary"
                    >
                      {child.active ? "Fjern" : "Gjenopprett"}
                    </button>
                    <Link
                      href={`/admin/children/${child.id}`}
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/40 hover:bg-secondary"
                    >
                      Oppgave-tilganger
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {visibleChildren.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>
                  Ingen barn ennå. Legg til første barn over.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
