import { NextResponse, after } from "next/server";
import { formatKr } from "@/lib/money";
import { notifyParents } from "@/lib/push";
import { verifyKioskRequest } from "@/lib/kiosk-auth";
import { getServiceSupabaseClient } from "@/lib/server-supabase";

type ChildRow = {
  id: string;
  family_id: string;
  active: boolean;
};

type TaskRow = {
  id: string;
  family_id: string;
  amount_ore: number;
  active: boolean;
};

type FamilyRow = {
  id: string;
  approval_mode: "REQUIRE_APPROVAL" | "AUTO_APPROVE";
};

export async function POST(request: Request) {
  const auth = await verifyKioskRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Kiosk-session mangler eller er ugyldig." }, { status: 401 });
  }

  const body = (await request.json()) as { childId?: string; taskId?: string };
  const childId = body.childId?.trim() ?? "";
  const taskId = body.taskId?.trim() ?? "";
  if (!childId || !taskId) {
    return NextResponse.json({ error: "Mangler childId/taskId." }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server mangler service role key." }, { status: 500 });
  }

  const [childRes, taskRes] = await Promise.all([
    supabase.from("children").select("id, family_id, active, name").eq("id", childId).maybeSingle(),
    supabase.from("tasks").select("id, family_id, amount_ore, active, title").eq("id", taskId).maybeSingle(),
  ]);

  if (childRes.error || !childRes.data) {
    return NextResponse.json({ error: childRes.error?.message ?? "Barn ikke funnet." }, { status: 404 });
  }
  if (taskRes.error || !taskRes.data) {
    return NextResponse.json({ error: taskRes.error?.message ?? "Oppgave ikke funnet." }, { status: 404 });
  }

  const child = childRes.data as ChildRow;
  const task = taskRes.data as TaskRow;

  if (!child.active || !task.active) {
    return NextResponse.json({ error: "Barn eller oppgave er inaktiv." }, { status: 400 });
  }
  if (child.family_id !== auth.familyId || task.family_id !== auth.familyId) {
    return NextResponse.json({ error: "Ingen tilgang til familien." }, { status: 403 });
  }

  const settingRes = await supabase
    .from("child_task_settings")
    .select("enabled")
    .eq("child_id", childId)
    .eq("task_id", taskId)
    .maybeSingle();

  if (settingRes.error) {
    return NextResponse.json({ error: settingRes.error.message }, { status: 400 });
  }
  if (settingRes.data && !settingRes.data.enabled) {
    return NextResponse.json({ error: "Oppgaven er deaktivert for barnet." }, { status: 400 });
  }

  const duplicateRes = await supabase
    .from("claims")
    .select("id")
    .eq("child_id", childId)
    .eq("task_id", taskId)
    .gte("created_at", new Date(Date.now() - 10_000).toISOString())
    .limit(1);
  if (duplicateRes.error) {
    return NextResponse.json({ error: duplicateRes.error.message }, { status: 400 });
  }
  if ((duplicateRes.data ?? []).length > 0) {
    return NextResponse.json({ error: "Vent 10 sekunder for samme oppgave." }, { status: 429 });
  }

  const familyRes = await supabase.from("families").select("id, approval_mode").eq("id", auth.familyId).maybeSingle();
  if (familyRes.error || !familyRes.data) {
    return NextResponse.json({ error: familyRes.error?.message ?? "Familie ikke funnet." }, { status: 404 });
  }

  const family = familyRes.data as FamilyRow;
  const status = family.approval_mode === "AUTO_APPROVE" ? "APPROVED" : "SENT";

  const insertRes = await supabase.from("claims").insert({
    family_id: auth.familyId,
    child_id: childId,
    task_id: taskId,
    amount_ore: task.amount_ore,
    status,
  });

  if (insertRes.error) {
    return NextResponse.json({ error: insertRes.error.message }, { status: 400 });
  }

  if (status === "SENT") {
    const c = childRes.data as { name?: string };
    const t = taskRes.data as { title?: string };
    after(() =>
      notifyParents(supabase, auth.familyId, {
        title: `${c.name ?? "Barnet"} har gjort en oppgave`,
        body: `${t.title ?? "Oppgave"} · ${formatKr(task.amount_ore)}. Trykk for å godkjenne.`,
        tag: "claims",
      })
    );
  }

  return NextResponse.json({ ok: true, status });
}
