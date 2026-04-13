import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeemInputSchema } from "@/schemas/point";
import { apiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const body = await req.json().catch(() => ({}));
  const parsed = redeemInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "invalid input");
  }

  const { data, error } = await supabase.rpc("redeem_points", {
    p_user_id: parsed.data.user_id,
    p_amount: parsed.data.amount,
    p_reason: parsed.data.reason,
    p_actor_id: authUser.id,
    p_reward_id: parsed.data.reward_id ?? undefined,
  });
  if (error) {
    const msg = error.message || "";
    const code = msg.includes("FORBIDDEN")
      ? 403
      : msg.includes("NOT_FOUND")
        ? 404
        : msg.includes("UNDERFLOW")
          ? 422
          : msg.includes("INVALID")
            ? 422
            : 400;
    return apiError(code, "operation failed");
  }
  return NextResponse.json(data);
}
