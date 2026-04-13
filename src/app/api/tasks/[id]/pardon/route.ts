import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/tasks/:id/pardon
 * Parent-only. Delegates to the SQL function pardon_task which:
 *   - asserts caller role = parent + same family
 *   - flips instance status -> 'pardoned'
 *   - if transitioning from 'overdue', inserts a compensating +50 adjustment
 *     to reverse the prior penalty ledger entry.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return apiError(401, "unauthorized");
  }

  // Defensive role check. RLS + function also enforce this.
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") {
    return apiError(403, "forbidden");
  }

  const { data, error } = await supabase.rpc("pardon_task", {
    p_instance_id: id,
  });

  if (error) {
    const msg = error.message || "";
    const status = msg.includes("FORBIDDEN") || msg.includes("AUTH")
      ? 403
      : msg.includes("NOT_FOUND")
        ? 404
        : msg.includes("INVALID")
          ? 422
          : 400;
    const label = status === 403 ? "forbidden" : status === 404 ? "not found" : "operation failed";
    return apiError(status, label);
  }

  return NextResponse.json({ ok: true, data });
}
