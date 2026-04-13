import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("unpardon_chore" as never, {
    p_instance_id: id,
  } as never);
  if (error) {
    const msg = error.message || "";
    const code = msg.includes("FORBIDDEN") ? 403 : msg.includes("NOT_FOUND") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status: code });
  }
  return NextResponse.json({ ok: true });
}
