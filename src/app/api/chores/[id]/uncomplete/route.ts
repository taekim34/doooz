import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { data, error } = await supabase.rpc("uncomplete_chore", {
    p_instance_id: id,
    p_actor_id: authUser.id,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("CHORE_NOT_FOUND"))
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (msg.includes("FORBIDDEN"))
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (msg.includes("NOT_COMPLETED"))
      return NextResponse.json({ error: "NOT_COMPLETED" }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json(data);
}
