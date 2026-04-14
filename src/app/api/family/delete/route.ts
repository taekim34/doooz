import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/family/delete
 * Hard-deletes the entire family. Only the admin (earliest parent by created_at) can do this.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const body = await req.json();
  if (body.confirmation !== "DELETE") {
    return apiError(400, "confirmation required");
  }

  // Get current user info
  const { data: me } = await supabase
    .from("users")
    .select("id, family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me) return apiError(404, "user not found");

  const admin = createAdminClient();

  // Check if this user is the admin (earliest parent)
  const { data: earliestParent } = await admin
    .from("users")
    .select("id")
    .eq("family_id", me.family_id)
    .eq("role", "parent")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!earliestParent || earliestParent.id !== me.id) {
    return apiError(403, "only family admin can delete family");
  }

  // 1. Get all user IDs in the family
  const { data: familyUsers } = await admin
    .from("users")
    .select("id")
    .eq("family_id", me.family_id);
  const userIds = (familyUsers ?? []).map((u) => u.id);

  // 2. Delete reward_requests where family_id (RESTRICT on reward_id blocks CASCADE)
  await admin
    .from("reward_requests")
    .delete()
    .eq("family_id", me.family_id);

  // 3. Set point_transactions.actor_id = NULL where family_id (NO ACTION FK)
  // NOTE: requires DB migration to make actor_id nullable (ALTER TABLE point_transactions ALTER COLUMN actor_id DROP NOT NULL)
  await admin
    .from("point_transactions")
    .update({ actor_id: null } as never)
    .eq("family_id", me.family_id);

  // 4. Delete families row (CASCADE handles users, rewards, task_instances, task_templates, family_rollover_log, point_transactions)
  const { error: deleteErr } = await admin
    .from("families")
    .delete()
    .eq("id", me.family_id);
  if (deleteErr) {
    console.error("[FAMILY DELETE] families delete failed:", deleteErr);
    return apiError(500, "delete failed");
  }

  // 5. Delete all auth users
  for (const uid of userIds) {
    const { error: authErr } = await admin.auth.admin.deleteUser(uid);
    if (authErr) {
      console.error(`[FAMILY DELETE] auth delete failed for ${uid}:`, authErr);
    }
  }

  return NextResponse.json({ success: true });
}
