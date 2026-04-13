import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const { data: me } = await supabase
    .from("users")
    .select("role, family_id")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") {
    return apiError(403, "parent only");
  }

  const body = await req.json().catch(() => ({}));
  const targetUserId = (body.user_id as string | undefined) ?? authUser.id;

  // Verify target user belongs to same family
  if (targetUserId !== authUser.id) {
    const { data: target } = await supabase
      .from("users")
      .select("family_id")
      .eq("id", targetUserId)
      .single();
    if (!target || target.family_id !== me.family_id) {
      return apiError(403, "forbidden");
    }
  }

  const { data, error } = await supabase.rpc("evaluate_badges", { p_user_id: targetUserId });
  if (error) return apiError(400, "operation failed");
  return NextResponse.json({ newBadges: data ?? [] });
}
