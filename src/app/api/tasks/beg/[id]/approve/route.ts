import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nowDate } from "@/lib/datetime/clock";
import { pushToChild } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/tasks/beg/[id]/approve
 * Parent approves a beg request, sets points, auto-completes.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const { data: me } = await supabase
    .from("users")
    .select("id, family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") {
    return apiError(403, "forbidden");
  }

  // Get family locale
  const { data: famRow } = await supabase.from("families").select("locale").eq("id", me.family_id).single();
  const locale = (famRow?.locale || "ko") as Locale;

  const body = await req.json();
  const points = Number(body.points);
  if (!Number.isFinite(points) || points < 1 || points > 10000) {
    return apiError(400, "points must be 1-10000");
  }

  // Fetch the requested task
  const { data: instance } = await supabase
    .from("task_instances")
    .select("id, family_id, assignee_id, title, status")
    .eq("id", id)
    .single();
  if (!instance) return apiError(404, "not found");

  if (instance.family_id !== me.family_id) {
    return apiError(403, "forbidden");
  }
  if (instance.status !== "requested") {
    return apiError(400, "invalid request state");
  }

  // Update to completed with points
  const { error: updateErr } = await supabase
    .from("task_instances")
    .update({ status: "completed", points, completed_at: nowDate().toISOString() })
    .eq("id", id);
  if (updateErr) {
    return apiError(500, "operation failed");
  }

  // Award points — trg_update_user_point_cache auto-updates balance/lifetime/level
  const { error: ptErr } = await supabase.from("point_transactions").insert({
    family_id: me.family_id,
    user_id: instance.assignee_id,
    amount: points,
    kind: "task_reward",
    reason: "beg approved: " + instance.title,
    related_task_id: id,
    actor_id: me.id,
  });
  if (ptErr) {
    return apiError(500, "operation failed");
  }

  // Evaluate badges for the child
  await supabase.rpc("evaluate_badges", { p_user_id: instance.assignee_id });

  // Push to child
  try {
    await pushToChild(instance.assignee_id, {
      title: t("push.beg_approve_title", locale),
      body: t("push.beg_approve_body", locale).replace("{title}", instance.title).replace("{points}", String(points)),
      url: "/tasks",
    });
  } catch (e) {
    console.error("[PUSH] beg approve push failed:", e);
  }

  return NextResponse.json({ ok: true });
}
