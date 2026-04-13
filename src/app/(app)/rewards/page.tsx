import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t, type Locale } from "@/lib/i18n";
import { formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import Link from "next/link";
import { WantButton, CancelRequestButton } from "./_actions";
import type { RewardRequestRow, RewardRequestStatus } from "@/schemas/reward";

const STATUS_KEYS: Record<RewardRequestStatus, string> = {
  requested: "rewards.waiting",
  approved: "rewards.approved",
  rejected: "rewards.rejected",
  cancelled: "rewards.cancelled",
};

const STATUS_VARIANT: Record<RewardRequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
  requested: "secondary",
  approved: "default",
  rejected: "destructive",
  cancelled: "outline",
};

export default async function RewardsPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  // Parents have a dedicated approvals view.
  if (user.role === "parent") redirect("/rewards/requests");

  const supabase = await createClient();

  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, title, cost")
    .eq("family_id", family.id)
    .eq("active", true)
    .order("cost");

  const { data: myRequests } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_id, reward_title_snapshot, cost_snapshot, status, requested_at, decision_note",
    )
    .eq("requested_by", user.id)
    .order("requested_at", { ascending: false })
    .limit(30);

  const list = (rewards ?? []) as Array<{ id: string; title: string; cost: number }>;
  const requests = (myRequests ?? []) as Array<
    Pick<
      RewardRequestRow,
      "id" | "reward_id" | "reward_title_snapshot" | "cost_snapshot" | "status" | "requested_at" | "decision_note"
    >
  >;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("rewards.title", locale)}</h1>
        <div className="text-sm text-muted-foreground">
          {t("rewards.my_points", locale)}: <span className="font-semibold">{user.current_balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-muted-foreground">
                  {r.cost.toLocaleString()} pt
                </div>
              </div>
              <WantButton rewardId={r.id} cost={r.cost} balance={user.current_balance} />
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("rewards.none", locale)}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("rewards.my_requests", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("rewards.no_requests", locale)}</p>
          )}
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border p-3 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.reward_title_snapshot}</span>
                  <Badge variant={STATUS_VARIANT[r.status]}>{t(STATUS_KEYS[r.status], locale)}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.cost_snapshot.toLocaleString()} pt · {formatDateInFamilyTz(r.requested_at, family.timezone, "yyyy-MM-dd HH:mm")}
                </div>
                {r.decision_note && r.status === "rejected" && (
                  <div className="mt-1 text-xs text-muted-foreground">{t("rewards.note", locale)}: {r.decision_note}</div>
                )}
              </div>
              {r.status === "requested" && <CancelRequestButton requestId={r.id} />}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        <Link href="/points/history" className="underline">
          {t("rewards.view_points", locale)}
        </Link>
      </div>
    </div>
  );
}
