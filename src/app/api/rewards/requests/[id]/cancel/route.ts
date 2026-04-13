import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const { error } = await supabase.rpc("cancel_reward_request", { p_request_id: id });

  if (error) {
    const msg = error.message || "";
    const status = msg.includes("FORBIDDEN") ? 403 : msg.includes("NOT_FOUND") ? 404 : msg.includes("INVALID_STATE") ? 422 : 400;
    return apiError(status, "operation failed");
  }

  return NextResponse.json({ ok: true });
}
