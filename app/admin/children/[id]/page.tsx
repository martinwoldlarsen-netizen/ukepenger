"use client";

import { KidAvatar } from "@/components/avatars/KidAvatar";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft, Gift, ListChecks, Plus, X } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, ListSkeleton, Switch, cx, focusRing } from "@/components/ui";
import { useToast } from "@/components/ui/feedback";
import { adminFetch, friendlyError, swrDefaults, useAdminIdentity, useChildren, useTasks } from "@/lib/admin-data";
import { formatKr, parseKrToOre } from "@/lib/money";
import { supabase } from "@/lib/supabaseClient";

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

export default function AdminChildDetailPage() {
  const params = useParams<{ id: string }>();
  const childId = params.id;
  const toast = useToast();
  const { familyId } = useAdminIdentity();
  const children = useChildren(familyId);
  const tasks = useTasks(familyId);

  const settings = useSWR(
    familyId ? ["child-task-settings", childId] : null,
    async () => {
      const res = await supabase.from("child_task_settings").select("task_id, enabled").eq("child_id", childId);
      if (res.error) throw new Error(res.error.message);
      const map: Record<string, boolean> = {};
      for (const row of (res.data ?? []) as Array<{ task_id: string; enabled: boolean }>) map[row.task_id] = row.enabled;
      return map;
    },
    swrDefaults
  );

  const wishlist = useSWR(
    familyId ? ["wishlist", childId] : null,
    async () => (await adminFetch<{ items?: WishlistItem[] }>(`/api/admin/wishlist/list?childId=${encodeURIComponent(childId)}`)).items ?? [],
    swrDefaults
  );

  const [formOpen, setFormOpen] = useState(false);
  const [wishTitle, setWishTitle] = useState("");
  const [wishPrice, setWishPrice] = useState("");
  const [wishNote, setWishNote] = useState("");
  const [saving, setSaving] = useState(false);

  const child = children.data?.find((c) => c.id === childId);
  const activeTasks = (tasks.data ?? []).filter((t) => t.active);
  const isEnabled = (taskId: string) => settings.data?.[taskId] !== false;

  const toggleTask = async (taskId: string) => {
    const next = !isEnabled(taskId);
    try {
      await settings.mutate(
        async (current) => {
          const res = await supabase.from("child_task_settings").upsert({ child_id: childId, task_id: taskId, enabled: next });
          if (res.error) throw new Error(res.error.message);
          return { ...(current ?? {}), [taskId]: next };
        },
        { optimisticData: (current) => ({ ...(current ?? {}), [taskId]: next }), rollbackOnError: true, revalidate: false }
      );
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre.") });
    }
  };

  const createWish = async () => {
    if (saving) return;
    const targetOre = parseKrToOre(wishPrice);
    if (!wishTitle.trim()) {
      toast({ kind: "error", text: "Skriv hva ønsket er." });
      return;
    }
    if (typeof targetOre !== "number" || targetOre <= 0) {
      toast({ kind: "error", text: "Skriv prisen som et tall, f.eks. 299." });
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/api/admin/wishlist/create", {
        method: "POST",
        body: JSON.stringify({ childId, title: wishTitle.trim(), targetOre, note: wishNote.trim() || undefined }),
      });
      toast({ text: `«${wishTitle.trim()}» er lagt til` });
      setWishTitle("");
      setWishPrice("");
      setWishNote("");
      setFormOpen(false);
      await wishlist.mutate();
    } catch (error) {
      toast({ kind: "error", text: friendlyError(error, "Klarte ikke å lagre ønsket.") });
    } finally {
      setSaving(false);
    }
  };

  if (!familyId || (children.isLoading && !children.data)) return <ListSkeleton rows={3} />;

  if (!child) {
    return (
      <EmptyState emoji="🔍" title="Fant ikke barnet">
        <Link href="/admin/children" className="mt-2 inline-flex font-semibold text-primary underline underline-offset-4">
          Tilbake til Barn
        </Link>
      </EmptyState>
    );
  }

  return (
    <section className="space-y-5">
      <Link href="/admin/children" className={cx("-mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground", focusRing)}>
        <ArrowLeft className="size-4" /> Alle barn
      </Link>

      <div className="flex items-center gap-4 rounded-3xl p-5" style={{ background: child.color.bg, color: child.color.ink }}>
        <KidAvatar avatarKey={child.avatar_key} size={64} />
        <p className="text-3xl font-extrabold tracking-tight">{child.name}</p>
      </div>

      <Card className="space-y-4">
        <CardHeader icon={<ListChecks className="size-5" />} title="Oppgaver" description={`Velg hvilke oppgaver ${child.name} ser på barnesiden.`} />
        {tasks.isLoading && !tasks.data ? (
          <ListSkeleton rows={2} />
        ) : activeTasks.length === 0 ? (
          <p className="rounded-2xl bg-secondary px-4 py-3 text-muted-foreground">Ingen aktive oppgaver. Lag oppgaver under Oppgaver.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {activeTasks.map((task) => (
              <li key={task.id} className="px-4 py-3">
                <Switch
                  checked={isEnabled(task.id)}
                  onChange={() => void toggleTask(task.id)}
                  label={task.title}
                  description={`${formatKr(task.amount_ore)} · ${isEnabled(task.id) ? "vises" : "skjult"}`}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <CardHeader
          icon={<Gift className="size-5" />}
          title="Ønsker"
          description={`Det ${child.name} sparer til. Nye ønsker fra barnet godkjennes under Krav.`}
        />

        {wishlist.isLoading && !wishlist.data ? (
          <ListSkeleton rows={2} />
        ) : (wishlist.data ?? []).length === 0 ? (
          <p className="rounded-2xl bg-secondary px-4 py-3 text-muted-foreground">Ingen ønsker ennå.</p>
        ) : (
          <ul className="space-y-2">
            {(wishlist.data ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.title}</p>
                  {item.note && <p className="truncate text-sm text-muted-foreground">{item.note}</p>}
                </div>
                {item.status === "PROPOSED" ? (
                  <Badge tone="warning">Venter i Krav</Badge>
                ) : (
                  <span className="font-num font-bold">{item.target_ore !== null ? formatKr(item.target_ore) : ""}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {formOpen ? (
          <form
            className="animate-pop space-y-4 rounded-2xl bg-secondary/60 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createWish();
            }}
          >
            <div className="flex items-center justify-between">
              <p className="font-bold">Nytt ønske</p>
              <button type="button" aria-label="Lukk" onClick={() => setFormOpen(false)} className={cx("flex size-10 items-center justify-center rounded-full hover:bg-secondary", focusRing)}>
                <X className="size-5" />
              </button>
            </div>
            <Field label="Hva ønsker barnet seg?">
              <Input value={wishTitle} onChange={(e) => setWishTitle(e.target.value)} placeholder="F.eks. ny sykkel" autoFocus maxLength={80} />
            </Field>
            <Field label="Pris">
              <span className="relative block">
                <Input value={wishPrice} onChange={(e) => setWishPrice(e.target.value)} placeholder="299" inputMode="decimal" className="pr-12" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
              </span>
            </Field>
            <Field label="Notat (valgfritt)">
              <Input value={wishNote} onChange={(e) => setWishNote(e.target.value)} placeholder="Farge, modell …" />
            </Field>
            <Button type="submit" block loading={saving} disabled={!wishTitle.trim() || !wishPrice.trim()}>
              Legg til ønske
            </Button>
          </form>
        ) : (
          <Button variant="secondary" block icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
            Legg til ønske
          </Button>
        )}
      </Card>
    </section>
  );
}
