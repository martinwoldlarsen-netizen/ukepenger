import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getDeviceSessionFromRequest } from "@/lib/device-session";

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

type ProfileRow = {
  family_id: string | null;
};

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getFamilyIdForAdminToken(client: SupabaseClient, token: string) {
  const userRes = await client.auth.getUser(token);
  if (userRes.error || !userRes.data.user) return null;
  const profileRes = await client
    .from("profiles")
    .select("family_id")
    .eq("user_id", userRes.data.user.id)
    .maybeSingle();
  if (profileRes.error) return null;
  const profile = profileRes.data ? (profileRes.data as unknown as ProfileRow) : null;
  return profile?.family_id ?? null;
}

export async function POST(request: Request) {
  const client = getServerSupabase();
  if (!client) {
    return NextResponse.json({ error: "Supabase ikke konfigurert." }, { status: 500 });
  }

  const body = (await request.json()) as { childId?: string; taskId?: string };
  const childId = body.childId?.trim();
  const taskId = body.taskId?.trim();

  if (!childId || !taskId) {
    return NextResponse.json({ error: "Mangler childId/taskId." }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const adminFamilyId = bearerToken ? await getFamilyIdForAdminToken(client, bearerToken) : null;

  let deviceFamilyId: string | null = null;
  const deviceSession = getDeviceSessionFromRequest(request);
  if (deviceSession) {
    const deviceRes = await client
      .from("devices")
      .select("id, family_id, token_hash, revoked_at")
      .eq("id", deviceSession.deviceId)
      .eq("token_hash", deviceSession.tokenHash)
      .maybeSingle();

    if (!deviceRes.error && deviceRes.data && !deviceRes.data.revoked_at) {
      deviceFamilyId = (deviceRes.data.family_id as string | undefined) ?? null;
    }
  }

  const [childRes, taskRes] = await Promise.all([
    client.from("children").select("id, family_id, active").eq("id", childId).maybeSingle(),
    client.from("tasks").select("id, family_id, amount_ore, active").eq("id", taskId).maybeSingle(),
  ]);

  if (childRes.error || !childRes.data) {
    return NextResponse.json({ error: childRes.error?.message ?? "Barn ikke funnet." }, { status: 400 });
  }
  if (taskRes.error || !taskRes.data) {
    return NextResponse.json({ error: taskRes.error?.message ?? "Oppgave ikke funnet." }, { status: 400 });
  }

  const child = childRes.data as ChildRow;
  const task = taskRes.data as TaskRow;

  if (!child.active || !task.active) {
    return NextResponse.json({ error: "Barn eller oppgave er inaktiv." }, { status: 400 });
  }
  if (child.family_id !== task.family_id) {
    return NextResponse.json({ error: "Barn og oppgave tilhører ikke samme familie." }, { status: 400 });
  }

  const allowedFamilyId = adminFamilyId ?? deviceFamilyId;
  if (!allowedFamilyId) {
    return NextResponse.json({ error: "Ikke autorisert." }, { status: 401 });
  }
  if (allowedFamilyId !== child.family_id) {
    return NextResponse.json({ error: "Ingen tilgang til denne familien." }, { status: 403 });
  }

  const settingRes = await client
    .from("child_task_settings")
    .select("enabled, amount_ore")
    .eq("child_id", childId)
    .eq("task_id", taskId)
    .maybeSingle();

  if (settingRes.error) {
    return NextResponse.json({ error: settingRes.error.message }, { status: 400 });
  }

  const enabled = settingRes.data ? Boolean(settingRes.data.enabled) : true;
  if (!enabled) {
    return NextResponse.json({ error: "Oppgaven er deaktivert for barnet." }, { status: 400 });
  }

  const tenSecondsAgoIso = new Date(Date.now() - 10_000).toISOString();
  const dupRes = await client
    .from("claims")
    .select("id, created_at")
    .eq("child_id", childId)
    .eq("task_id", taskId)
    .gte("created_at", tenSecondsAgoIso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (dupRes.error) {
    return NextResponse.json({ error: dupRes.error.message }, { status: 400 });
  }
  if ((dupRes.data ?? []).length > 0) {
    return NextResponse.json({ error: "Duplikat: vent 10 sekunder før nytt krav." }, { status: 429 });
  }

  const famRes = await client.from("families").select("id, approval_mode").eq("id", child.family_id).maybeSingle();
  if (famRes.error || !famRes.data) {
    return NextResponse.json({ error: famRes.error?.message ?? "Familie ikke funnet." }, { status: 400 });
  }

  const family = famRes.data as FamilyRow;
  const status = family.approval_mode === "AUTO_APPROVE" ? "APPROVED" : "SENT";

  const insertRes = await client.from("claims").insert({
    family_id: family.id,
    child_id: childId,
    task_id: taskId,
    // Egen lønn for barnet, ellers oppgavens vanlige pris.
    amount_ore: settingRes.data?.amount_ore ?? task.amount_ore,
    status,
  });

  if (insertRes.error) {
    return NextResponse.json({ error: insertRes.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status });
}


