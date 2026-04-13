import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { reward_id?: string };
  if (!body.reward_id) {
    return NextResponse.json({ error: "reward_id required" }, { status: 400 });
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
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ id: data });
}
