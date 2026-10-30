import { NextResponse } from "next/server";
import { kioskMayUseChild, verifyKioskRequest } from "@/lib/kiosk-auth";
import { computeProgress, totalBadgeKey } from "@/lib/progress";
import { TOTAL_MILESTONES, bigEvery, payFrom, taskTrophy, type TrophySettings } from "@/lib/trophies";
import { getServiceSupabaseClient } from "@/lib/server-supabase";
import { asLang } from "@/lib/i18n";
import { localTaskTitle, localizeClaimTasks } from "@/lib/task-title";

export async function GET(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  const childId = new URL(request.url).searchParams.get("childId")?.trim() ?? "";
  if (!kioskMayUseChild(auth, childId)) return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  const supabase = getServiceSupabaseClient();
  if (!supabase || !childId) return NextResponse.json({ error: "Mangler barn." }, { status: 400 });

  const childRes = await supabase.from("children").select("family_id, language").eq("id", childId).maybeSingle();
  if (!childRes.data || childRes.data.family_id !== auth.familyId) {
    return NextResponse.json({ error: "Ingen tilgang til barnet." }, { status: 403 });
  }

  const [claimsRes, wishesRes, familyRes, tasksRes] = await Promise.all([
    supabase
      .from("claims")
      .select("task_id, status, amount_ore, saved_ore, created_at, decided_at, tasks(title, title_i18n)")
      .eq("child_id", childId)
      .in("status", ["APPROVED", "PAID"])
      .limit(5000),
    supabase.from("wishlist_items").select("id", { count: "exact", head: true }).eq("child_id", childId).eq("status", "PAID"),
    supabase.from("families").select("trophy_settings").eq("id", auth.familyId).maybeSingle(),
    supabase.from("tasks").select("id, title, title_i18n, active, icon").eq("family_id", auth.familyId).is("archived_at", null),
  ]);
  if (claimsRes.error) return NextResponse.json({ error: "Klarte ikke å hente." }, { status: 400 });

  // Oppgavenavn på barnets språk, som i oppgavelisten.
  const lang = asLang(childRes.data.language);
  const claims = localizeClaimTasks(claimsRes.data ?? [], lang);
  const progress = computeProgress(claims, wishesRes.count ?? 0);
  const settings = (familyRes.data?.trophy_settings ?? {}) as TrophySettings;

  // Bonus foreldrene har lovet for totalmilepæler vises på merket.
  if (settings.enabled) {
    for (const n of TOTAL_MILESTONES) {
      const amount = Number(settings.totals?.[String(n)] ?? 0);
      const b = progress.badges.find((x) => x.key === totalBadgeKey(n));
      if (b && amount > 0) b.bonusOre = amount;
    }
  }

  // Ett trofé per oppgave (aktive, og skjulte som barnet allerede har gjort).
  const counts: Record<string, number> = {};
  for (const c of claims) if (c.task_id) counts[c.task_id] = (counts[c.task_id] ?? 0) + 1;
  // Trofeer slått av: ingen trofeskap på barnesiden.
  progress.trophies = settings.hidden
    ? []
    : (tasksRes.data ?? [])
        .filter((t) => t.active || counts[t.id])
        .map((t) => ({ ...taskTrophy(t.id, localTaskTitle(t, lang), counts[t.id] ?? 0, settings), icon: t.icon ?? null }))
        .sort((a, b) => b.level - a.level || b.count - a.count || a.name.localeCompare(b.name, lang));
  progress.trophiesPay = Boolean(settings.enabled) && !settings.hidden;
  progress.trophyRules = { bigEvery: bigEvery(settings), payFrom: payFrom(settings) };
  return NextResponse.json(progress);
}
