import { createClient } from "@/lib/supabase/server";

/**
 * Returns the 1-based rank of a child within their family by
 * `lifetime_earned DESC`. Ties share the lower rank (stable order by id).
 * Only `role='child'` rows participate.
 */
export async function getRank(
  childId: string,
  familyId: string,
): Promise<{ rank: number; total: number }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, lifetime_earned")
    .eq("family_id", familyId)
    .eq("role", "child")
    .order("lifetime_earned", { ascending: false })
    .order("id", { ascending: true });

  const rows = (data ?? []) as Array<{ id: string; lifetime_earned: number }>;
  const idx = rows.findIndex((r) => r.id === childId);
  return {
    rank: idx < 0 ? 0 : idx + 1,
    total: rows.length,
  };
}
