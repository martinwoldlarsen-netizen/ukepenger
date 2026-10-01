"use client";

// Når noen åpner en invitasjonslenke uten å være innlogget, husker vi lenken
// her mens de logger inn (også via Google/Apple, som går innom
// /auth/callback). Etter innlogging sendes de tilbake til invitasjonen i
// stedet for å få laget en ny, tom familie.

const KEY = "uk_pending_invite";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function rememberPendingInvite(token: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, at: Date.now() }));
  } catch {
    // Privat modus o.l.: brukeren må da åpne lenken på nytt etter innlogging.
  }
}

export function peekPendingInvitePath(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string; at?: number };
    if (!parsed.token || !/^[a-f0-9]{16,128}$/i.test(parsed.token) || Date.now() - (parsed.at ?? 0) > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return `/invite/${parsed.token}`;
  } catch {
    return null;
  }
}

export function clearPendingInvite() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorer
  }
}
