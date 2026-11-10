// Felles henting for barnesiden. Profilvelgeren og barnets side bruker samme
// SWR-nøkler, så data som allerede er hentet vises med én gang (og oppdateres
// i bakgrunnen), og et nytt figurvalg vises med en gang begge steder.

export type ChildRow = {
  id: string;
  name: string;
  avatar_key: string | null;
  language?: string | null;
  color?: string | null;
  // Enheten tilhører dette barnet (egen telefon): ingen profilvelger.
  personal?: boolean;
  // Barnet har kode som må tastes før siden åpnes.
  has_pin?: boolean;
};

export type TaskRow = {
  id: string;
  title: string;
  amount_ore: number;
  active: boolean;
  icon?: string | null;
};

export type WishlistItem = {
  id: string;
  title: string;
  target_ore: number | null;
  suggested_ore: number | null;
  emoji?: string | null;
  status: "PROPOSED" | "ACTIVE" | "PAID";
  created_by: "PARENT" | "CHILD";
  note: string | null;
};

export type TasksPayload = {
  error?: string;
  child?: ChildRow;
  tasks?: TaskRow[];
  cooldowns?: Record<string, number>;
  pending_ore?: number;
  approved_ore?: number;
  paid_ore?: number;
  earned_ore?: number;
  saved_ore?: number | null;
  savings_percent?: number;
  allowance?: { amount_ore: number; weekday: number } | null;
};

export type KidPageData = { tasks: TasksPayload; wishlist: WishlistItem[] | null };

export const KIDS_BOOTSTRAP_KEY = "kids-bootstrap";
export const kidPageKey = (childId: string) => ["kid-page", childId] as const;

// Billett fra /api/kids/pin etter riktig kode. Ligger bare i nettleserens økt
// (sessionStorage), og slettes når profilvelgeren vises igjen.
const PIN_PREFIX = "uk_pin_";

export function getPinTicket(childId: string): string | null {
  try {
    return sessionStorage.getItem(PIN_PREFIX + childId);
  } catch {
    return null;
  }
}

export function setPinTicket(childId: string, ticket: string | null) {
  try {
    if (ticket) sessionStorage.setItem(PIN_PREFIX + childId, ticket);
    else sessionStorage.removeItem(PIN_PREFIX + childId);
  } catch {
    // privat modus
  }
}

export function clearPinTickets() {
  try {
    for (const key of Object.keys(sessionStorage)) if (key.startsWith(PIN_PREFIX)) sessionStorage.removeItem(key);
  } catch {
    // privat modus
  }
}

// Headere for kall som gjelder ett barn (med billetten når barnet har kode).
export function kidHeaders(childId: string, extra?: Record<string, string>): Record<string, string> {
  const ticket = getPinTicket(childId);
  return { ...(extra ?? {}), ...(ticket ? { "x-kid-pin": ticket } : {}) };
}

// Serveren ber om koden (billetten mangler eller er utløpt).
export const PIN_REQUIRED = "PIN";

export async function fetchKidsBootstrap(): Promise<ChildRow[]> {
  const res = await fetch("/api/kids/bootstrap", { credentials: "include" });
  const payload = (await res.json().catch(() => ({}))) as { error?: string; children?: ChildRow[] };
  if (!res.ok || payload.error) throw new Error(payload.error ?? "Kiosk-session mangler eller er ugyldig.");
  return payload.children ?? [];
}

export async function fetchKidPage(childId: string): Promise<KidPageData> {
  const [tasksRes, wishlistRes] = await Promise.all([
    fetch(`/api/kids/tasks?childId=${encodeURIComponent(childId)}`, { credentials: "include", headers: kidHeaders(childId) }),
    fetch(`/api/kids/wishlist?childId=${encodeURIComponent(childId)}`, { credentials: "include", headers: kidHeaders(childId) }),
  ]);
  const tasks = (await tasksRes.json().catch(() => ({}))) as TasksPayload & { pin?: boolean };
  if (tasks.pin) {
    setPinTicket(childId, null);
    throw new Error(PIN_REQUIRED);
  }
  if (!tasksRes.ok || tasks.error || !tasks.child) throw new Error(tasks.error ?? "Klarte ikke laste oppgavene.");
  const wishlist = (await wishlistRes.json().catch(() => ({}))) as { error?: string; items?: WishlistItem[] };
  return { tasks, wishlist: wishlistRes.ok && !wishlist.error ? (wishlist.items ?? []) : null };
}
