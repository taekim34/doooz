import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/points/penalty/[id]/cancel
 * Parent cancels a penalty — marks task_instance as 'rejected' and inserts
 * a compensating adjustment to reverse the deduction.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  if (!me || me.role !== "parent") return apiError(403, "forbidden");

  const { data: instance } = await supabase
    .from("task_instances")
    .select("id, family_id, assignee_id, title, points, status")
    .eq("id", id)
    .single();
  if (!instance) return apiError(404, "not found");
  if (instance.family_id !== me.family_id) return apiError(403, "forbidden");
  if (instance.status !== "penalty") return apiError(400, "not a penalty");

  const { error: ptErr } = await supabase.from("point_transactions").insert({
    family_id: me.family_id,
    user_id: instance.assignee_id,
    amount: -instance.points,
    kind: "adjustment",
    reason: `벌점 취소: ${instance.title}`,
    related_task_id: null,
    actor_id: me.id,
  });
  if (ptErr) return apiError(500, "operation failed");

  await supabase
    .from("task_instances")
    .update({ status: "rejected" })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
