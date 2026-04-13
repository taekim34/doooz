import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/chores/:id/pardon
 * Parent-only. Delegates to the SQL function pardon_chore which:
 *   - asserts caller role = parent + same family
 *   - flips instance status -> 'pardoned'
 *   - if transitioning from 'overdue', inserts a compensating +50 adjustment
 *     to reverse the prior penalty ledger entry.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Defensive role check. RLS + function also enforce this.
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  const meRow = me as { role: string } | null;
  if (!meRow || meRow.role !== "parent") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>)(
    "pardon_chore",
    { p_instance_id: id },
  );

  if (error) {
    const msg = error.message || "";
    const status = msg.includes("FORBIDDEN") || msg.includes("AUTH")
      ? 403
      : msg.includes("NOT_FOUND")
        ? 404
        : msg.includes("INVALID")
          ? 422
          : 400;
    return NextResponse.json({ error: msg, code: error.code ?? null }, { status });
  }

  return NextResponse.json({ ok: true, data });
}
