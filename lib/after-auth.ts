"use client";

import type { User } from "@supabase/supabase-js";
import { getAdminSetupStatus, getFamilyIdForUser, primeAdminIdentity } from "@/lib/family-client";
import { peekPendingInvitePath } from "@/lib/pending-invite";
import { supabase } from "@/lib/supabaseClient";

// Besteforeldre som trykker «Lag profil» på besteforeldre-siden: vi husker
// det mens de logger inn (også via Google/Apple og e-postbekreftelse), så de
// kommer tilbake og får kontoen koblet til lenken.
const GUEST_KEY = "uk_pending_guest";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function rememberPendingGuest() {
  try {
    localStorage.setItem(GUEST_KEY, String(Date.now()));
  } catch {
    // Privat modus: de må trykke «Lag profil» på nytt etter innlogging.
  }
}

export function hasPendingGuest() {
  try {
    const at = Number(localStorage.getItem(GUEST_KEY));
    if (at && Date.now() - at < MAX_AGE_MS) return true;
    localStorage.removeItem(GUEST_KEY);
  } catch {
    // ignorer
  }
  return false;
}

export function clearPendingGuest() {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    // ignorer
  }
}

// Hvor skal en innlogget bruker? Foreldre → appen (eller oppstart).
// Besteforelder-konto → besteforeldre-siden. Helt ny konto → «Hva vil du?».
// Ingen familie lages automatisk her; det skjer først når de velger
// «Start ny familie».
export async function pathAfterAuth(user: User): Promise<string> {
  const invitePath = peekPendingInvitePath();
  if (invitePath) return invitePath;
  if (hasPendingGuest()) return "/besteforeldre/bli-med";

  const family = await getFamilyIdForUser(user.id);
  if (family.familyId) {
    primeAdminIdentity(user, family.familyId);
    const setup = await getAdminSetupStatus();
    return setup.needsOnboarding ? "/onboarding" : "/admin/inbox";
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    const res = await fetch("/api/guest/me", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
    const payload = res?.ok ? ((await res.json().catch(() => ({}))) as { isGuest?: boolean }) : {};
    if (payload.isGuest) return "/besteforeldre";
  }
  return "/velkommen";
}
