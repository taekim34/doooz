import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: row } = await supabase
    .from("users")
    .select("family_id")
    .eq("id", authUser.id)
    .single();
  if (!row) return NextResponse.json({ error: "no user row" }, { status: 400 });

  const { data, error } = await supabase.rpc("ensure_today_instances", {
    p_user_id: authUser.id,
    p_family_id: (row as { family_id: string }).family_id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ created: data ?? 0 });
}
