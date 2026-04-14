import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/user/delete
 * Hard-deletes the current user (non-admin member).
 * Admin (earliest parent by created_at) must use /api/family/delete instead.
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

  // Check if this user is the admin (earliest parent)
  const admin = createAdminClient();
  const { data: earliestParent } = await admin
    .from("users")
    .select("id")
    .eq("family_id", me.family_id)
    .eq("role", "parent")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (earliestParent && earliestParent.id === me.id) {
    return apiError(403, "Admin must use family delete");
  }

  // 1. Set point_transactions.actor_id = NULL where actor_id = user_id
  // NOTE: requires DB migration to make actor_id nullable (ALTER TABLE point_transactions ALTER COLUMN actor_id DROP NOT NULL)
  await admin
    .from("point_transactions")
    .update({ actor_id: null } as never)
    .eq("actor_id", me.id);

  // 2. Delete reward_requests where requested_by = user_id
  await admin
    .from("reward_requests")
    .delete()
    .eq("requested_by", me.id);

  // 3. Delete user from users table (CASCADE handles task_instances, task_templates, user_badges, push_subscriptions, point_transactions with user_id)
  const { error: deleteErr } = await admin
    .from("users")
    .delete()
    .eq("id", me.id);
  if (deleteErr) {
    console.error("[USER DELETE] users delete failed:", deleteErr);
    return apiError(500, "delete failed");
  }

  // 4. Delete auth user
  const { error: authErr } = await admin.auth.admin.deleteUser(me.id);
  if (authErr) {
    console.error("[USER DELETE] auth delete failed:", authErr);
    // User row already gone; auth cleanup failure is logged but not blocking
  }

  return NextResponse.json({ success: true });
}
