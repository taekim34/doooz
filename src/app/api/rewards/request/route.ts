import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const body = (await req.json().catch(() => ({}))) as { reward_id?: string };
  if (!body.reward_id) {
    return apiError(400, "reward_id required");
  }

  const { data, error } = await supabase.rpc("request_reward", {
    p_reward_id: body.reward_id,
  });

  if (error) {
    const msg = error.message || "";
    const status = msg.includes("INSUFFICIENT_BALANCE")
      ? 409
      : msg.includes("FORBIDDEN") || msg.includes("AUTH")
        ? 403
        : msg.includes("NOT_FOUND")
          ? 404
          : 400;
    return apiError(status, "operation failed");
  }

  return NextResponse.json({ id: data });
}
