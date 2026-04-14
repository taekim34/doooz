import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/family/delete
 * Hard-deletes the entire family via atomic RPC. Only the admin (earliest parent) can do this.
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

  // Atomic RPC: admin check + nullify NO ACTION FKs + delete family in one transaction
  // Returns array of user IDs for auth cleanup
  const { data: userIds, error: rpcErr } = await admin.rpc("delete_family", {
    p_family_id: me.family_id,
    p_admin_id: me.id,
  });

  if (rpcErr) {
    if (rpcErr.message.includes("NOT_ADMIN")) {
      return apiError(403, "only family admin can delete family");
    }
    console.error("[FAMILY DELETE] rpc failed:", rpcErr.message);
    return apiError(500, "delete failed");
  }

  // Delete all auth users (outside transaction — Supabase Auth is a separate service)
  for (const uid of (userIds as string[]) ?? []) {
    const { error: authErr } = await admin.auth.admin.deleteUser(uid);
    if (authErr) {
      console.error(`[FAMILY DELETE] auth delete failed for ${uid}:`, authErr.message);
    }
  }

  return NextResponse.json({ success: true });
}
