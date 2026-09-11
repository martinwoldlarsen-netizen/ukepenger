import { supabase } from "./supabase";

export async function getFamilyIdForUser(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { familyId: null, error: error.message };
  return { familyId: (data?.family_id as string | undefined) ?? null, error: null };
}
