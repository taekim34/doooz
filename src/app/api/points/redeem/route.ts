import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeemInputSchema } from "@/schemas/point";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = redeemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.flatten() }, { status: 400 });
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
    return NextResponse.json({ error: msg }, { status: code });
  }
  return NextResponse.json(data);
}
