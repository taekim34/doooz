import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/tasks/:id/complete
 * Delegates to SQL function complete_task which is idempotent:
 * re-calling with an already-completed instance returns the prior
 * result with `idempotent: true` and does NOT double-credit.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const { data, error } = await supabase.rpc("complete_task", {
    p_instance_id: id,
    p_actor_id: authUser.id,
  });

  if (error) {
    const msg = error.message || "";
    // Map SQL exceptions to HTTP status codes per spec Section 7.
    const status = msg.includes("FORBIDDEN") || msg.includes("AUTH")
      ? 403
      : msg.includes("NOT_FOUND")
        ? 404
        : msg.includes("INVALID")
          ? 422
          : msg.includes("duplicate key") || msg.includes("unique")
            ? 409
            : 400;
    const label = status === 403 ? "forbidden" : status === 404 ? "not found" : status === 409 ? "conflict" : "operation failed";
    return apiError(status, label);
  }

  return NextResponse.json(data);
}
