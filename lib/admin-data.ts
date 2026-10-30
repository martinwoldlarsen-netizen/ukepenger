"use client";

// Datalag for admin: SWR-cache slik at fanebytte viser forrige data med en
// gang og oppdaterer i bakgrunnen, i stedet for "Laster..." hver gang.
// Spørringene er de samme som sidene brukte før; RLS gjelder som vanlig.

import { currentLang } from "@/lib/use-lang";
import type { Lang } from "@/lib/i18n";
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

const ERR_TEXT = {
  nb: { generic: "Noe gikk galt. Prøv igjen.", loggedOut: "Du er logget ut. Logg inn på nytt.", network: "Fikk ikke kontakt med serveren. Sjekk nettet og prøv igjen." },
  en: { generic: "Something went wrong. Please try again.", loggedOut: "You have been signed out. Please sign in again.", network: "Couldn't reach the server. Check your connection and try again." },
  uk: { generic: "Щось пішло не так. Спробуйте ще раз.", loggedOut: "Ви вийшли з облікового запису. Увійдіть знову.", network: "Немає зв’язку із сервером. Перевірте інтернет і спробуйте ще раз." },
};

export function friendlyError(error: unknown, fallback?: string) {
  const e = ERR_TEXT[currentLang()];
  fallback ??= e.generic;
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (message) console.error("[admin]", message);
  if (/jwt|token|innlogging|session/i.test(message)) return e.loggedOut;
  if (/failed to fetch|network/i.test(message)) return e.network;
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
  weekly_allowance_ore?: number;
  allowance_weekday?: number;
  language?: string | null;
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
          .select("id, name, avatar_key, active, created_at, weekly_allowance_ore, allowance_weekday, language")
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
    map[id] ?? { id, name: { nb: "Ukjent barn", en: "Unknown child", uk: "Невідома дитина" }[currentLang()], avatar_key: null, active: false, emoji: "🙂", color: { bg: "var(--secondary)", ink: "var(--foreground)" } };
}

/* Oppgaver */

export type AdminTask = {
  id: string;
  title: string;
  amount_ore: number;
  active: boolean;
  created_at?: string;
  category?: string | null;
  icon?: string | null;
  // Navnet på andre språk (barnas språk), skrevet av forelderen.
  title_i18n?: Partial<Record<Lang, string>> | null;
};

export function useTasks(familyId: string | null) {
  return useSWR(
    familyId ? ["tasks", familyId] : null,
    async () =>
      check(
        await supabase
          .from("tasks")
          .select("id, title, amount_ore, active, created_at, category, icon, title_i18n")
          .eq("family_id", familyId as string)
          .is("archived_at", null)
          .order("created_at", { ascending: false })
      ) as AdminTask[],
    swrDefaults
  );
}

// Per barn og oppgave: om barnet har oppgaven, og egen lønn (null = vanlig pris).
// Mangler raden, har barnet oppgaven til vanlig pris.
export type ChildTaskSetting = { child_id: string; task_id: string; enabled: boolean; amount_ore: number | null };

export function useChildTaskSettings(familyId: string | null) {
  return useSWR(
    familyId ? ["child-task-settings-all", familyId] : null,
    async () =>
      // RLS gir bare radene for barna i familien.
      check(await supabase.from("child_task_settings").select("child_id, task_id, enabled, amount_ore")) as ChildTaskSetting[],
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
const TITLE_TEXT = {
  nb: { bonus: "Bonus", sale: "Butikksalg", task: "Oppgave", allowance: "📅 Ukepenger" },
  en: { bonus: "Bonus", sale: "Shop sale", task: "Task", allowance: "📅 Pocket money" },
  uk: { bonus: "Бонус", sale: "Продаж", task: "Завдання", allowance: "📅 Кишенькові" },
};

export function taskTitleOf(claim: { task_id: string | null; tasks: PendingClaim["tasks"]; note?: string | null }) {
  const w = TITLE_TEXT[currentLang()];
  // Gaver («🎁 Gave fra …») og ukepenger («📅 Ukepenger») har allerede egen tekst.
  if (!claim.task_id) {
    if (!claim.note) return w.sale;
    if (claim.note === "📅 Ukepenger") return w.allowance;
    return /^\p{Extended_Pictographic}/u.test(claim.note) ? claim.note : `${w.bonus}: ${claim.note}`;
  }
  const t = Array.isArray(claim.tasks) ? claim.tasks[0] : claim.tasks;
  return t?.title ?? w.task;
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
