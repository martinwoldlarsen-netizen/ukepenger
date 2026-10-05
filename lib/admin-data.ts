"use client";

// Datalag for admin: SWR-cache slik at fanebytte viser forrige data med en
// gang og oppdaterer i bakgrunnen, i stedet for "Laster..." hver gang.
// Spørringene er de samme som sidene brukte før; RLS gjelder som vanlig.

import useSWR, { type SWRConfiguration } from "swr";
import { getCurrentAdminContext } from "@/lib/family-client";
import { supabase } from "@/lib/supabaseClient";
import { getAvatarByKey } from "@/lib/avatars";
import { kidColor } from "@/app/kids/_lib/palette";

export const swrDefaults: SWRConfiguration = {
  revalidateOnFocus: true,
  dedupingInterval: 4_000,
  keepPreviousData: true,
};

/* Feilmeldinger: aldri vis rå databasefeil til brukeren */

// Feil fra våre egne API-ruter er skrevet for brukeren og kan vises som de er.
export class UserFacingError extends Error {}

const TECHNICAL = /violates|constraint|duplicate key|relation|column|syntax|permission denied|PGRST|JSON|HTTP \d+|undefined|null/i;

export function friendlyError(error: unknown, fallback = "Noe gikk galt. Prøv igjen.") {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (message) console.error("[admin]", message);
  if (/jwt|token|innlogging|session/i.test(message)) return "Du er logget ut. Logg inn på nytt.";
  if (/failed to fetch|network/i.test(message)) return "Fikk ikke kontakt med serveren. Sjekk nettet og prøv igjen.";
  if (error instanceof UserFacingError && message && !TECHNICAL.test(message)) return message;
  return fallback;
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? ([] as unknown)) as T;
}

/* Innlogget admin */

export function useAdminIdentity() {
  const { data, isLoading } = useSWR(
    "admin-identity",
    async () => {
      const ctx = await getCurrentAdminContext();
      return { familyId: ctx.familyId ?? null, userId: ctx.user?.id ?? null };
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  return { familyId: data?.familyId ?? null, userId: data?.userId ?? null, isLoading };
}

export async function getAccessToken() {
  const res = await supabase.auth.getSession();
  const token = res.data.session?.access_token;
  if (!token) throw new Error("Mangler innlogging");
  return token;
}

// Kall mot våre egne /api/admin-ruter med innloggingstoken.
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  const payload = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || payload.error) throw payload.error ? new UserFacingError(payload.error) : new Error(`HTTP ${res.status}`);
  return payload;
}

/* Barn */

export type AdminChild = {
  id: string;
  name: string;
  avatar_key: string | null;
  active: boolean;
  created_at?: string;
  emoji: string;
  color: { bg: string; ink: string };
};

// Fargen følger samme rekkefølge som profilvelgeren på barnesiden (aktive barn
// sortert på navn), så Emma har samme farge for barna og for de voksne.
export function useChildren(familyId: string | null) {
  return useSWR(
    familyId ? ["children", familyId] : null,
    async () => {
      const rows = check(
        await supabase
          .from("children")
          .select("id, name, avatar_key, active, created_at")
          .eq("family_id", familyId as string)
          .order("name", { ascending: true })
      ) as Omit<AdminChild, "emoji" | "color">[];
      let activeIndex = 0;
      return rows.map((row) => ({
        ...row,
        emoji: getAvatarByKey(row.avatar_key).emoji,
        color: kidColor(row.active ? activeIndex++ : 0),
      })) as AdminChild[];
    },
    swrDefaults
  );
}

export function childLookup(children: AdminChild[] | undefined) {
  const map: Record<string, AdminChild> = {};
  for (const child of children ?? []) map[child.id] = child;
  return (id: string) =>
    map[id] ?? { id, name: "Ukjent barn", avatar_key: null, active: false, emoji: "🙂", color: { bg: "var(--secondary)", ink: "var(--foreground)" } };
}

/* Oppgaver */

export type AdminTask = { id: string; title: string; amount_ore: number; active: boolean; created_at?: string };

export function useTasks(familyId: string | null) {
  return useSWR(
    familyId ? ["tasks", familyId] : null,
    async () =>
      check(
        await supabase
          .from("tasks")
          .select("id, title, amount_ore, active, created_at")
          .eq("family_id", familyId as string)
          .order("created_at", { ascending: false })
      ) as AdminTask[],
    swrDefaults
  );
}

/* Krav som venter */

export type PendingClaim = {
  id: string;
  created_at: string;
  amount_ore: number;
  child_id: string;
  task_id: string | null;
  note?: string | null;
  tasks: { title: string } | { title: string }[] | null;
};

// Krav uten oppgave er enten en bonus (har tekst) eller et butikksalg.
export function taskTitleOf(claim: { task_id: string | null; tasks: PendingClaim["tasks"]; note?: string | null }) {
  if (!claim.task_id) return claim.note ? `Bonus: ${claim.note}` : "Butikksalg";
  const t = Array.isArray(claim.tasks) ? claim.tasks[0] : claim.tasks;
  return t?.title ?? "Oppgave";
}

export function usePendingClaims(familyId: string | null) {
  return useSWR(
    familyId ? ["claims-sent", familyId] : null,
    async () =>
      check(
        await supabase
          .from("claims")
          .select("id, created_at, amount_ore, child_id, task_id, note, tasks(title)")
          .eq("family_id", familyId as string)
          .eq("status", "SENT")
          .order("created_at", { ascending: false })
      ) as PendingClaim[],
    { ...swrDefaults, refreshInterval: 30_000 }
  );
}

export type PendingWish = {
  id: string;
  child_id: string;
  title: string;
  status: "PROPOSED" | "ACTIVE";
  target_ore: number | null;
  suggested_ore: number | null;
  balance_ore: number;
  emoji?: string | null;
  purchase_requested_at?: string | null;
  created_at: string;
};

export function usePendingWishes(familyId: string | null) {
  return useSWR(
    familyId ? ["wishes-pending", familyId] : null,
    async () => (await adminFetch<{ items?: PendingWish[] }>("/api/admin/wishlist/pending")).items ?? [],
    { ...swrDefaults, refreshInterval: 30_000, shouldRetryOnError: false }
  );
}
