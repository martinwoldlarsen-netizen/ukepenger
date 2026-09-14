import { supabase } from "./supabase";

export type Child = {
  id: string;
  name: string;
  balanceOre: number;
};

export type PendingClaim = {
  id: string;
  createdAt: string;
  amountOre: number;
  childName: string;
  taskTitle: string;
};

export type Task = {
  id: string;
  title: string;
  amountOre: number;
};

export async function getFamilyId(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.family_id) throw new Error("Fant ingen familie for denne kontoen.");
  return data.family_id as string;
}

export async function getChildren(familyId: string): Promise<Child[]> {
  const [childrenRes, claimsRes] = await Promise.all([
    supabase
      .from("children")
      .select("id, name")
      .eq("family_id", familyId)
      .eq("active", true)
      .order("name"),
    supabase
      .from("claims")
      .select("child_id, amount_ore")
      .eq("family_id", familyId)
      .eq("status", "APPROVED"),
  ]);

  if (childrenRes.error) throw childrenRes.error;
  if (claimsRes.error) throw claimsRes.error;

  const balances = new Map<string, number>();
  for (const claim of claimsRes.data ?? []) {
    const current = balances.get(claim.child_id) ?? 0;
    balances.set(claim.child_id, current + (claim.amount_ore ?? 0));
  }

  return (childrenRes.data ?? []).map((child) => ({
    id: child.id,
    name: child.name,
    balanceOre: balances.get(child.id) ?? 0,
  }));
}

export async function getPendingClaims(familyId: string): Promise<PendingClaim[]> {
  const { data, error } = await supabase
    .from("claims")
    .select("id, created_at, amount_ore, children(name), tasks(title)")
    .eq("family_id", familyId)
    .eq("status", "SENT")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((claim) => {
    const child = claim.children as { name: string } | { name: string }[] | null;
    const task = claim.tasks as { title: string } | { title: string }[] | null;
    return {
      id: claim.id,
      createdAt: claim.created_at,
      amountOre: claim.amount_ore ?? 0,
      childName: (Array.isArray(child) ? child[0]?.name : child?.name) ?? "Ukjent barn",
      taskTitle: (Array.isArray(task) ? task[0]?.title : task?.title) ?? "Butikksalg",
    };
  });
}

export async function decideClaim(
  claimId: string,
  status: "APPROVED" | "REJECTED",
  userId: string
) {
  const { error } = await supabase
    .from("claims")
    .update({ status, decided_at: new Date().toISOString(), decided_by: userId })
    .eq("id", claimId);

  if (error) throw error;
}

export async function getTasks(familyId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, amount_ore")
    .eq("family_id", familyId)
    .eq("active", true)
    .order("title");

  if (error) throw error;

  return (data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    amountOre: task.amount_ore ?? 0,
  }));
}
