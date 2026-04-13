import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t, type Locale } from "@/lib/i18n";
import { ApproveButton, RejectButton } from "./_actions";
import type { RewardRequestRow } from "@/schemas/reward";
import { nowDate } from "@/lib/datetime/clock";
import { BackButton } from "@/components/ui/back-button";

type Row = Pick<
  RewardRequestRow,
  | "id"
  | "reward_title_snapshot"
  | "cost_snapshot"
  | "status"
  | "requested_at"
  | "decided_at"
  | "decision_note"
  | "requested_by"
>;

function fmt(ts: string) {
  return ts.slice(0, 16).replace("T", " ");
}

export default async function RewardRequestsPage() {
  const { user, family } = await requireUser();
  const locale = ((family as unknown as Record<string, unknown>).locale as string || "ko") as Locale;
  if (user.role !== "parent") redirect("/rewards");

  const supabase = await createClient();

  // All child members for name lookup.
  const { data: members } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("family_id", family.id)
    .eq("role", "child");
  const nameMap = new Map(
    ((members ?? []) as Array<{ id: string; display_name: string }>).map((m) => [
      m.id,
      m.display_name,
    ]),
  );

  const { data: pending } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_title_snapshot, cost_snapshot, status, requested_at, decided_at, decision_note, requested_by",
    )
    .eq("family_id", family.id)
    .eq("status", "requested")
    .order("requested_at", { ascending: true });

  const todayStart = nowDate();
  todayStart.setHours(0, 0, 0, 0);
  const { data: approvedToday } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_title_snapshot, cost_snapshot, status, requested_at, decided_at, decision_note, requested_by",
    )
    .eq("family_id", family.id)
    .eq("status", "approved")
    .gte("decided_at", todayStart.toISOString())
    .order("decided_at", { ascending: false });

  const sevenDaysAgo = nowDate();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentClosed } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_title_snapshot, cost_snapshot, status, requested_at, decided_at, decision_note, requested_by",
    )
    .eq("family_id", family.id)
    .in("status", ["rejected", "cancelled"])
    .gte("decided_at", sevenDaysAgo.toISOString())
    .order("decided_at", { ascending: false });

  const pendingRows = (pending ?? []) as Row[];
  const approvedRows = (approvedToday ?? []) as Row[];
  const closedRows = (recentClosed ?? []) as Row[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback="/rewards" />
      <h1 className="text-2xl font-bold">{t("rewards.requests_title", locale)}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("rewards.pending", locale)} ({pendingRows.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pendingRows.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("rewards.pending_none", locale)}</p>
          )}
          {pendingRows.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div>
                <div className="font-semibold">{r.reward_title_snapshot}</div>
                <div className="text-xs text-muted-foreground">
                  {nameMap.get(r.requested_by) ?? t("rewards.child_fallback", locale)} · {r.cost_snapshot.toLocaleString()}pt · {fmt(r.requested_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <ApproveButton requestId={r.id} />
                <RejectButton requestId={r.id} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("rewards.approved_today", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {approvedRows.length === 0 && (
            <p className="text-muted-foreground">{t("rewards.approved_none", locale)}</p>
          )}
          {approvedRows.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b py-1 last:border-0">
              <span>
                {nameMap.get(r.requested_by) ?? t("rewards.child_fallback", locale)} · {r.reward_title_snapshot}
              </span>
              <span className="text-xs text-muted-foreground">
                -{r.cost_snapshot.toLocaleString()}pt
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("rewards.closed_title", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {closedRows.length === 0 && (
            <p className="text-muted-foreground">{t("rewards.closed_none", locale)}</p>
          )}
          {closedRows.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b py-1 last:border-0">
              <span>
                {nameMap.get(r.requested_by) ?? t("rewards.child_fallback", locale)} · {r.reward_title_snapshot}
              </span>
              <Badge variant={r.status === "rejected" ? "destructive" : "outline"}>
                {r.status === "rejected" ? t("rewards.status_rejected", locale) : t("rewards.status_cancelled", locale)}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
