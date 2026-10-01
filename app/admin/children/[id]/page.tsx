"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type TaskRow = {
  id: string;
  title: string;
  active: boolean;
};

type ChildRow = {
  id: string;
  name: string;
};

type ChildTaskSettingRow = {
  task_id: string;
  enabled: boolean;
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

function formatKr(ore: number) {
  return `${(ore / 100).toFixed(2)} kr`;
}

export default function AdminChildTaskSettingsPage() {
  const params = useParams<{ id: string }>();
  const childId = params.id;

  const [familyId, setFamilyId] = useState<string | null>(null);
  const [child, setChild] = useState<ChildRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const [wishlistTitle, setWishlistTitle] = useState("");
  const [wishlistTargetKr, setWishlistTargetKr] = useState("");
  const [wishlistNote, setWishlistNote] = useState("");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistStatus, setWishlistStatus] = useState("");
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextFamilyId?: string) => {
    const id = nextFamilyId ?? familyId;
    if (!id) return;

    const [childRes, taskRes, settingsRes] = await Promise.all([
      supabase.from("children").select("id, name").eq("family_id", id).eq("id", childId).maybeSingle(),
      supabase.from("tasks").select("id, title, active").eq("family_id", id).order("created_at", { ascending: false }),
      supabase.from("child_task_settings").select("task_id, enabled").eq("child_id", childId),
    ]);

    if (childRes.error || !childRes.data) {
      setStatus(`Feil: ${childRes.error?.message ?? "Barn ikke funnet."}`);
      return;
    }
    if (taskRes.error) {
      setStatus(`Feil: ${taskRes.error.message}`);
      return;
    }
    if (settingsRes.error) {
      setStatus(`Feil: ${settingsRes.error.message}`);
      return;
    }

    const map: Record<string, boolean> = {};
    for (const row of (settingsRes.data ?? []) as ChildTaskSettingRow[]) {
      map[row.task_id] = row.enabled;
    }

    setChild(childRes.data as ChildRow);
    setTasks((taskRes.data ?? []) as TaskRow[]);
    setEnabledMap(map);
  }, [childId, familyId]);

  const loadWishlist = useCallback(async () => {
    setWishlistStatus("");
    setWishlistLoading(true);

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) {
      setWishlistItems([]);
      setWishlistLoading(false);
      setWishlistStatus("Feil: Mangler innloggingstoken. Logg inn på nytt.");
      return;
    }

    const response = await fetch(`/api/admin/wishlist/list?childId=${encodeURIComponent(childId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; items?: WishlistItem[] };
    setWishlistLoading(false);

    if (!response.ok || payload.error) {
      setWishlistItems([]);
      setWishlistStatus(`Feil: ${payload.error ?? "Kunne ikke hente ønskeliste."}`);
      return;
    }

    setWishlistItems(payload.items ?? []);
  }, [childId]);

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
      await loadWishlist();
      setLoading(false);
    };

    void run();
  }, [childId, load, loadWishlist]);

  const isEnabled = (taskId: string) => enabledMap[taskId] !== false;

  const toggle = async (taskId: string) => {
    setStatus("");
    const nextEnabled = !isEnabled(taskId);
    const res = await supabase.from("child_task_settings").upsert({
      child_id: childId,
      task_id: taskId,
      enabled: nextEnabled,
    });

    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }

    setEnabledMap((prev) => ({ ...prev, [taskId]: nextEnabled }));
  };

  const createWishlistItem = async () => {
    setWishlistStatus("");
    const title = wishlistTitle.trim();
    const targetKr = Number(wishlistTargetKr);
    const targetOre = Number.isFinite(targetKr) ? Math.round(targetKr * 100) : 0;

    if (!title) {
      setWishlistStatus("Feil: Skriv tittel.");
      return;
    }
    if (!Number.isInteger(targetOre) || targetOre <= 0) {
      setWishlistStatus("Feil: Skriv gyldig beløp i kr.");
      return;
    }

    const sessionRes = await supabase.auth.getSession();
    const accessToken = sessionRes.data.session?.access_token;
    if (!accessToken) {
      setWishlistStatus("Feil: Mangler innloggingstoken. Logg inn på nytt.");
      return;
    }

    setWishlistSaving(true);
    const response = await fetch("/api/admin/wishlist/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        childId,
        title,
        targetOre,
        note: wishlistNote.trim() || undefined,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setWishlistSaving(false);

    if (!response.ok || payload.error) {
      setWishlistStatus(`Feil: ${payload.error ?? "Kunne ikke lagre onskeliste-item."}`);
      return;
    }

    setWishlistTitle("");
    setWishlistTargetKr("");
    setWishlistNote("");
    setWishlistStatus("Onskeliste-item lagt til.");
    await loadWishlist();
  };

  if (loading) return <div className="text-foreground/80">Laster...</div>;
  if (!child) return <div className="text-foreground/80">Barn ikke funnet.</div>;

  const isError = status.startsWith("Feil:");
  const parsedTargetKr = Number(wishlistTargetKr);
  const parsedTargetOre = Number.isFinite(parsedTargetKr) ? Math.round(parsedTargetKr * 100) : 0;
  const canSubmitWishlist = wishlistTitle.trim().length > 0 && parsedTargetOre > 0 && !wishlistSaving;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Oppgave-tilganger: {child.name}</h2>
        <Link
          href="/admin/children"
          className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-secondary"
        >
          Tilbake
        </Link>
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold tracking-tight">Ønskeliste</h3>
          <span className="text-xs text-muted-foreground">Legg til et ønske selv</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tittel</span>
            <input
              value={wishlistTitle}
              onChange={(e) => setWishlistTitle(e.target.value)}
              placeholder="For eksempel: Ny sykkel"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Beløp (kr)</span>
            <input
              value={wishlistTargetKr}
              onChange={(e) => setWishlistTargetKr(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="299.00"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notat (valgfritt)</span>
            <input
              value={wishlistNote}
              onChange={(e) => setWishlistNote(e.target.value)}
              placeholder="Farge, modell, osv."
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void createWishlistItem()}
          disabled={!canSubmitWishlist}
          className="mt-3 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {wishlistSaving ? "Lagrer..." : "Legg til"}
        </button>
        {wishlistStatus && (
          <p
            className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
              wishlistStatus.startsWith("Feil:")
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {wishlistStatus}
          </p>
        )}

        <div className="mt-4 rounded-2xl border border-border bg-card p-3">
          <h4 className="text-sm font-semibold text-foreground">Eksisterende ønsker</h4>
          {wishlistLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">Laster...</p>
          ) : wishlistItems.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Ingen ønskeliste ennå.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {wishlistItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                      {item.created_by === "CHILD" && <span className="ml-2 text-xs font-normal text-muted-foreground">(barnets ønske)</span>}
                    </p>
                    <span className="text-xs text-foreground/80">
                      {item.status === "PROPOSED"
                        ? "Venter på godkjenning i Krav"
                        : item.target_ore !== null
                          ? `Sparemål ${formatKr(item.target_ore)}`
                          : "-"}
                    </span>
                  </div>
                  {item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/70 text-foreground/80">
            <tr>
              <th className="px-4 py-3">Oppgave</th>
              <th className="px-4 py-3">Aktiv oppgave</th>
              <th className="px-4 py-3">Synlig for barn</th>
              <th className="px-4 py-3">Handling</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-border text-foreground">
                <td className="px-4 py-3">{task.title}</td>
                <td className="px-4 py-3">{task.active ? "Ja" : "Nei"}</td>
                <td className="px-4 py-3">{isEnabled(task.id) ? "Ja" : "Nei"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggle(task.id)}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/40 hover:bg-secondary"
                  >
                    {isEnabled(task.id) ? "Skjul" : "Vis"}
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>
                  Ingen oppgaver funnet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
