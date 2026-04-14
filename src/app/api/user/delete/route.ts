import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/user/delete
 * Hard-deletes the current user (non-admin member) via atomic RPC.
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

  const { data: me } = await supabase
    .from("users")
    .select("id, family_id")
    .eq("id", authUser.id)
    .single();
  if (!me) return apiError(404, "user not found");

  const admin = createAdminClient();

  // Atomic RPC: nullify NO ACTION FKs + delete user row in one transaction
  const { error: rpcErr } = await admin.rpc("delete_member", {
    p_user_id: me.id,
    p_family_id: me.family_id,
  });

  if (rpcErr) {
    if (rpcErr.message.includes("IS_ADMIN")) {
      return apiError(403, "Admin must use family delete");
    }
    console.error("[USER DELETE] rpc failed:", rpcErr.message);
    return apiError(500, "delete failed");
  }

  // Delete auth user (outside transaction — Supabase Auth is a separate service)
  const { error: authErr } = await admin.auth.admin.deleteUser(me.id);
  if (authErr) {
    console.error("[USER DELETE] auth delete failed:", authErr.message);
    // DB row is already gone; log but don't block
  }

  return NextResponse.json({ success: true });
}
