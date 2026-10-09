import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

// Er den innloggede (Bearer) eier av tjenesten (tabellen app_owners)?
export async function requireOwner(request: Request): Promise<{ supabase: SupabaseClient; userId: string } | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = getServiceSupabaseClient();
  if (!token || !url || !anonKey || !supabase) return null;
  const me = (await createClient(url, anonKey).auth.getUser(token)).data.user;
  if (!me) return null;
  const owner = await supabase.from("app_owners").select("user_id").eq("user_id", me.id).maybeSingle();
  return owner.data ? { supabase, userId: me.id } : null;
}

// Familiene til eierne – brukes for å sende varsel om nye kontaktmeldinger.
export async function ownerFamilyIds(supabase: SupabaseClient): Promise<string[]> {
  const owners = await supabase.from("app_owners").select("user_id");
  const ids = (owners.data ?? []).map((o) => o.user_id as string);
  if (ids.length === 0) return [];
  const profiles = await supabase.from("profiles").select("family_id").in("user_id", ids);
  return [...new Set((profiles.data ?? []).map((p) => p.family_id as string))];
}
