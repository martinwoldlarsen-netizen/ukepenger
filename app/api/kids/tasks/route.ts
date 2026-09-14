import { NextResponse } from "next/server";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type ChildRow = {
  id: string;
  family_id: string;
  name: string;
  avatar_key: string | null;
  active: boolean;
};

type TaskRow = {
  id: string;
  title: string;
  amount_ore: number;
  active: boolean;
};

type ChildTaskSettingRow = {
  task_id: string;
  enabled: boolean;
};

type ClaimRow = {
  task_id: string;
  created_at: string;
};

type BalanceClaimRow = {
  amount_ore: number;
  status: "SENT" | "APPROVED" | "PAID";
};

export async function GET(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }

  const url = new URL(request.url);
  const childId = url.searchParams.get("childId")?.trim() ?? "";
  if (!childId) {
    return NextResponse.json({ error: "Mangler childId." }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  const childRes = await supabase
    .from("children")
    .select("id, family_id, name, avatar_key, active")
    .eq("id", childId)
    .maybeSingle();

  if (childRes.error || !childRes.data) {
    return NextResponse.json({ error: childRes.error?.message ?? "Barn ikke funnet." }, { status: 404 });
  }

  const child = childRes.data as ChildRow;
  if (!child.active) {
    return NextResponse.json({ error: "Barnet er inaktivt." }, { status: 400 });
  }
  if (child.family_id !== auth.familyId) {
    return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  }

  const [tasksRes, settingsRes, recentClaimsRes, balanceClaimsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, amount_ore, active")
      .eq("family_id", auth.familyId)
      .eq("active", true)
      .order("title", { ascending: true }),
    supabase.from("child_task_settings").select("task_id, enabled").eq("child_id", childId),
    supabase
      .from("claims")
      .select("task_id, created_at")
      .eq("child_id", childId)
      .gte("created_at", new Date(Date.now() - 10_000).toISOString()),
    supabase.from("claims").select("amount_ore, status").eq("child_id", childId).in("status", ["SENT", "APPROVED", "PAID"]),
  ]);

  if (tasksRes.error || settingsRes.error || recentClaimsRes.error || balanceClaimsRes.error) {
    return NextResponse.json(
      {
        error:
          tasksRes.error?.message ??
          settingsRes.error?.message ??
          recentClaimsRes.error?.message ??
          balanceClaimsRes.error?.message ??
          "Ukjent feil.",
      },
      { status: 400 }
    );
  }

  const enabledMap: Record<string, boolean> = {};
  for (const row of (settingsRes.data ?? []) as ChildTaskSettingRow[]) {
    enabledMap[row.task_id] = row.enabled;
  }

  const visibleTasks = ((tasksRes.data ?? []) as TaskRow[]).filter((task) => enabledMap[task.id] !== false);
  const cooldowns: Record<string, number> = {};
  for (const claim of (recentClaimsRes.data ?? []) as ClaimRow[]) {
    const cooldownUntil = new Date(claim.created_at).getTime() + 10_000;
    cooldowns[claim.task_id] = Math.max(cooldowns[claim.task_id] ?? 0, cooldownUntil);
  }

  let pending_ore = 0;
  let approved_ore = 0;
  let paid_ore = 0;
  for (const claim of (balanceClaimsRes.data ?? []) as BalanceClaimRow[]) {
    if (claim.status === "SENT") pending_ore += claim.amount_ore;
    if (claim.status === "APPROVED") approved_ore += claim.amount_ore;
    if (claim.status === "PAID") paid_ore += claim.amount_ore;
  }
  // "Tjent totalt" er alt barnet har opparbeidet seg: det som staar til gode pluss
  // det som allerede er utbetalt. Dette tallet skal aldri ga ned etter en utbetaling.
  const earned_ore = approved_ore + paid_ore;

  return NextResponse.json({
    child: { id: child.id, name: child.name, avatar_key: child.avatar_key },
    tasks: visibleTasks,
    cooldowns,
    pending_ore,
    approved_ore,
    paid_ore,
    earned_ore,
  });
}
