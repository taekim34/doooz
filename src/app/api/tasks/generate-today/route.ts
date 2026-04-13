import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const { data: row } = await supabase
    .from("users")
    .select("family_id")
    .eq("id", authUser.id)
    .single();
  if (!row) return apiError(400, "invalid input");

  const { data, error } = await supabase.rpc("ensure_today_instances", {
    p_user_id: authUser.id,
    p_family_id: row.family_id,
  });
  if (error) return apiError(400, "operation failed");
  return NextResponse.json({ created: data ?? 0 });
}
