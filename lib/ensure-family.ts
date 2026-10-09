import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileRow = {
  family_id: string | null;
};

export async function ensureFamilyForUser(supabase: SupabaseClient, userId: string): Promise<string> {
  const profileRes = await supabase
    .from("profiles")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileRes.error) {
    throw new Error(profileRes.error.message);
  }

  const profile = (profileRes.data as ProfileRow | null) ?? null;
  if (!profile) {
    throw new Error("Fant ikke admin-profil.");
  }

  if (profile.family_id) {
    return profile.family_id;
  }

  // Egen id og ingen «select» etter insert: nye brukere kan ikke lese
  // familien før profilen peker på den (sikkerhetsreglene).
  const newFamilyId = randomUUID();
  const familyInsert = await supabase.from("families").insert({ id: newFamilyId });
  if (familyInsert.error) {
    throw new Error(familyInsert.error.message);
  }

  const profileUpdate = await supabase
    .from("profiles")
    .update({ family_id: newFamilyId })
    .eq("user_id", userId)
    .is("family_id", null);

  if (profileUpdate.error) {
    throw new Error(profileUpdate.error.message);
  }

  const verifyProfile = await supabase
    .from("profiles")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (verifyProfile.error) {
    throw new Error(verifyProfile.error.message);
  }

  const verifiedFamilyId = (verifyProfile.data as ProfileRow | null)?.family_id ?? null;
  if (!verifiedFamilyId) {
    throw new Error("Fant ikke familie etter opprettelse.");
  }

  return verifiedFamilyId;
}
