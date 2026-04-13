import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("users")
    .select("role, family_id")
    .eq("id", authUser.id)
    .single();
  if (!me || (me as { role: string }).role !== "parent") {
    return NextResponse.json({ error: "parent only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const targetUserId = (body.user_id as string | undefined) ?? authUser.id;

  const { data, error } = await supabase.rpc("evaluate_badges", { p_user_id: targetUserId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ newBadges: data ?? [] });
}
