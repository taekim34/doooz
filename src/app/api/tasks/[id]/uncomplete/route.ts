import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

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
    return apiError(401, "unauthorized");

  const { data, error } = await supabase.rpc("uncomplete_task", {
    p_instance_id: id,
    p_actor_id: authUser.id,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("TASK_NOT_FOUND"))
      return apiError(404, "not found");
    if (msg.includes("FORBIDDEN"))
      return apiError(403, "forbidden");
    if (msg.includes("NOT_COMPLETED"))
      return apiError(409, "not completed");
    return apiError(500, "operation failed");
  }

  return NextResponse.json(data);
}
