"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";

type TaskRow = {
  id: string;
  title: string;
  amount_ore: number;
  active: boolean;
};

function formatKr(ore: number) {
  return `${(ore / 100).toFixed(2)} kr`;
}

export default function AdminTasksPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [title, setTitle] = useState("");
  const [amountNok, setAmountNok] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextFamilyId?: string) => {
    const id = nextFamilyId ?? familyId;
    if (!id) return;
    const res = await supabase
      .from("tasks")
      .select("id, title, amount_ore, active")
      .eq("family_id", id)
      .order("created_at", { ascending: false });

    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }

    setTasks((res.data ?? []) as TaskRow[]);
  }, [familyId]);

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

  const createTask = async () => {
    if (!familyId) return;
    setStatus("");
    if (!title.trim()) {
      setStatus("Skriv en oppgavetittel.");
      return;
    }

    const parsedAmount = Number(amountNok.replace(",", "."));
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      setStatus("Ugyldig beløp.");
      return;
    }

    const amountOre = Math.round(parsedAmount * 100);
    const res = await supabase.from("tasks").insert({
      family_id: familyId,
      title: title.trim(),
      amount_ore: amountOre,
      active: true,
    });

    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }

    setTitle("");
    setAmountNok("");
    setStatus("Oppgave opprettet.");
    await load();
  };

  const toggleActive = async (task: TaskRow) => {
    setStatus("");
    const res = await supabase.from("tasks").update({ active: !task.active }).eq("id", task.id);
    if (res.error) {
      setStatus(`Feil: ${res.error.message}`);
      return;
    }
    await load();
  };

  if (loading) return <div className="text-foreground/80">Laster...</div>;

  const isError = status.startsWith("Feil:");
  const disableCreate = title.trim().length === 0 || amountNok.trim().length === 0;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <h3 className="mb-3 text-base font-semibold tracking-tight">Ny oppgave</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tittel</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="For eksempel: Rydde rommet"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Beløp (kr)</span>
            <input
              value={amountNok}
              onChange={(e) => setAmountNok(e.target.value)}
              placeholder="25"
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <button
            type="button"
            onClick={() => void createTask()}
            disabled={disableCreate}
            className="self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/70 text-foreground/80">
            <tr>
              <th className="px-4 py-3">Tittel</th>
              <th className="px-4 py-3">Beløp</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Handling</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-border text-foreground">
                <td className="px-4 py-3">{task.title}</td>
                <td className="px-4 py-3">{formatKr(task.amount_ore)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      task.active ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-foreground/80"
                    }`}
                  >
                    {task.active ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggleActive(task)}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground transition hover:border-primary/40 hover:bg-secondary"
                  >
                    {task.active ? "Deaktiver" : "Aktiver"}
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>
                  Ingen oppgaver ennå. Lag den første oppgaven over.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}