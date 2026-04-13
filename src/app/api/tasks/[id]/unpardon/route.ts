import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError(401, "unauthorized");

  const { error } = await supabase.rpc("unpardon_task", {
    p_instance_id: id,
  });
  if (error) {
    const msg = error.message || "";
    const code = msg.includes("FORBIDDEN") ? 403 : msg.includes("NOT_FOUND") ? 404 : 400;
    const label = code === 403 ? "forbidden" : code === 404 ? "not found" : "operation failed";
    return apiError(code, label);
  }
  return NextResponse.json({ ok: true });
}
