"use client";

import type { User } from "@supabase/supabase-js";
import { getDeviceSessionFromDocument } from "@/lib/device-session.shared";
import { supabase } from "@/lib/supabaseClient";

export type ApprovalMode = "REQUIRE_APPROVAL" | "AUTO_APPROVE";

// Login -> AdminLayout -> hver enkelt admin/*-side kaller alle
// getCurrentAdminContext()/getAdminSetupStatus() i sitt eget mount-effect.
// auth.getUser() er IKKE et lokalt oppslag - det er et ekte nettverkskall mot
// Supabase sin auth-server - saa uten cache betyr en enkelt navigasjon til
// /admin/inbox rett etter innlogging 3-4 runder med getUser() + profiles-sporring
// foer noe vises. Cachen holder bare identitet (bruker + familyId), aldri
// faktiske data-sporringer, saa RLS paa de virkelige kallene er upaavirket.
type CachedIdentity = {
  user: User;
  familyId: string | null;
  expiresAt: number;
};

const IDENTITY_CACHE_TTL_MS = 15_000;
let identityCache: CachedIdentity | null = null;

// Kalles fra utlogging saa en ny bruker som logger inn i samme fane ikke kan
// arve forrige brukers cachede familyId innenfor TTL-vinduet.
export function clearAdminIdentityCache() {
  identityCache = null;
}

type EnsureFamilyResult = {
  familyId: string | null;
  error: string | null;
};

export type SetupStatus = {
  familyId: string | null;
  hasChildren: boolean;
  hasTasks: boolean;
  needsOnboarding: boolean;
  error: string | null;
};

export async function getCurrentSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { user: null, error: error.message };
  }
  return { user: data.user, error: null };
}

export async function getFamilyIdForUser(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { familyId: null, error: error.message };
  return { familyId: (data?.family_id as string | undefined) ?? null, error: null };
}

export async function ensureFamilyForUser(user: { id: string; email?: string | null }): Promise<EnsureFamilyResult> {
  const existing = await getFamilyIdForUser(user.id);
  if (existing.familyId) return { familyId: existing.familyId, error: null };

  const familyNameSeed = user.email?.split("@")[0]?.trim();
  const familyName = familyNameSeed ? `${familyNameSeed} sin familie` : "Min familie";

  const familyInsert = await supabase
    .from("families")
    .insert({ name: familyName })
    .select("id")
    .single();

  if (familyInsert.error || !familyInsert.data) {
    return { familyId: null, error: familyInsert.error?.message ?? "Kunne ikke opprette familie." };
  }

  const familyId = familyInsert.data.id as string;

  const profileInsert = await supabase.from("profiles").insert({
    user_id: user.id,
    family_id: familyId,
    role: "ADMIN",
  });

  if (profileInsert.error) {
    const retry = await getFamilyIdForUser(user.id);
    if (retry.familyId) return { familyId: retry.familyId, error: null };
    return { familyId: null, error: profileInsert.error.message };
  }

  return { familyId, error: null };
}

// Delt av getAdminSetupStatus() og getCurrentAdminContext() slik at de to
// kallene (som naesten alltid skjer rett etter hverandre paa samme side) bare
// gjoer ett nettverksoppslag av "hvem er innlogget / hvilken familie" til
// sammen, i stedet for ett hver.
async function resolveIdentity(): Promise<{ user: User | null; familyId: string | null; error: string | null }> {
  if (identityCache && identityCache.expiresAt > Date.now()) {
    return { user: identityCache.user, familyId: identityCache.familyId, error: null };
  }

  const { user, error: userError } = await getCurrentSessionUser();
  if (userError || !user) {
    return { user: null, familyId: null, error: userError ?? "Ikke innlogget." };
  }

  const profile = await getFamilyIdForUser(user.id);
  if (profile.error) {
    return { user, familyId: null, error: profile.error };
  }

  // Kun vellykkede oppslag caches - en forbigaaende feil skal fortsatt proves
  // paa nytt ved neste kall, ikke gjentas fra cache i 15 sekunder.
  identityCache = { user, familyId: profile.familyId, expiresAt: Date.now() + IDENTITY_CACHE_TTL_MS };
  return { user, familyId: profile.familyId, error: null };
}

export async function getAdminSetupStatus(): Promise<SetupStatus> {
  const { user, familyId, error: identityError } = await resolveIdentity();
  if (!user) {
    return {
      familyId: null,
      hasChildren: false,
      hasTasks: false,
      needsOnboarding: false,
      error: identityError ?? "Ikke innlogget.",
    };
  }

  if (identityError || !familyId) {
    return {
      familyId: null,
      hasChildren: false,
      hasTasks: false,
      needsOnboarding: true,
      error: identityError,
    };
  }

  const [childrenRes, tasksRes] = await Promise.all([
    supabase.from("children").select("id", { head: true, count: "exact" }).eq("family_id", familyId),
    supabase.from("tasks").select("id", { head: true, count: "exact" }).eq("family_id", familyId),
  ]);

  if (childrenRes.error || tasksRes.error) {
    return {
      familyId,
      hasChildren: false,
      hasTasks: false,
      needsOnboarding: true,
      error: childrenRes.error?.message ?? tasksRes.error?.message ?? "Kunne ikke lese setup-status.",
    };
  }

  const hasChildren = (childrenRes.count ?? 0) > 0;
  const hasTasks = (tasksRes.count ?? 0) > 0;

  return {
    familyId,
    hasChildren,
    hasTasks,
    needsOnboarding: !hasChildren || !hasTasks,
    error: null,
  };
}

export async function getCurrentAdminContext() {
  const { user, familyId, error: identityError } = await resolveIdentity();
  if (!user) {
    return { user: null, familyId: null, error: identityError ?? "Ikke innlogget." };
  }

  if (identityError || !familyId) {
    return { user, familyId: null, error: identityError ?? "Fant ingen familie for bruker." };
  }

  return { user, familyId, error: null };
}

export async function getCurrentFamilyContext() {
  const admin = await getCurrentAdminContext();
  if (admin.familyId) {
    return { user: admin.user, familyId: admin.familyId, deviceId: null, source: "admin" as const, error: null };
  }

  const deviceSession = getDeviceSessionFromDocument();
  if (!deviceSession) {
    return { user: null, familyId: null, deviceId: null, source: null, error: admin.error ?? "Ingen familie." };
  }

  const res = await supabase
    .from("devices")
    .select("id, family_id, revoked_at, token_hash")
    .eq("id", deviceSession.deviceId)
    .maybeSingle();

  if (res.error || !res.data) {
    return { user: null, familyId: null, deviceId: null, source: null, error: "Enheten er ikke gyldig." };
  }

  if (res.data.revoked_at) {
    return { user: null, familyId: null, deviceId: null, source: null, error: "Enheten er deaktivert." };
  }

  if (res.data.token_hash !== deviceSession.tokenHash) {
    return { user: null, familyId: null, deviceId: null, source: null, error: "Enheten er ikke gyldig." };
  }

  const familyId = (res.data.family_id as string | undefined) ?? null;
  if (!familyId) {
    return { user: null, familyId: null, deviceId: null, source: null, error: "Familie ikke funnet." };
  }

  return { user: null, familyId, deviceId: res.data.id as string, source: "device" as const, error: null };
}
