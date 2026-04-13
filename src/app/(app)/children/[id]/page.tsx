import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage, progressToNextLevel } from "@/lib/level";
import { familyToday, formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import { getRank } from "@/features/children/rank";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { TaskCheckbox } from "../../tasks/_checkbox";
import { t, type Locale } from "@/lib/i18n";

interface ChildRow {
  id: string;
  family_id: string;
  role: "parent" | "child";
  display_name: string;
  character_id: string | null;
  current_balance: number;
  lifetime_earned: number;
  level: number;
}

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  if (user.role !== "parent") redirect("/");

  const supabase = await createClient();
  const { data: childRow } = await supabase
    .from("users")
    .select(
      "id, family_id, role, display_name, character_id, current_balance, lifetime_earned, level",
    )
    .eq("id", id)
    .maybeSingle();

  const child = childRow as ChildRow | null;
  if (!child || child.family_id !== family.id || child.role !== "child") {
    notFound();
  }

  const today = familyToday(family.timezone);
  const [{ data: tasks }, { data: txs }, { data: earnedBadges }] = await Promise.all([
    supabase
      .from("task_instances")
      .select("id, title, points, status")
      .eq("assignee_id", child.id)
      .eq("due_date", today)
      .order("created_at"),
    supabase
      .from("point_transactions")
      .select("id, amount, reason, kind, created_at, task_instances(due_date)")
      .eq("user_id", child.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("user_badges")
      .select("badge_id, earned_at, badges(name, icon)")
      .eq("user_id", child.id)
      .order("earned_at", { ascending: false }),
  ]);

  const rank = await getRank(child.id, family.id);
  const stage = getStage(child.level);
  const progress = progressToNextLevel(child.lifetime_earned);

  const taskList = (tasks ?? []) as Array<{
    id: string;
    title: string;
    points: number;
    status: string;
  }>;
  const txList = (txs ?? []) as Array<{
    id: string;
    amount: number;
    reason: string;
    kind: string;
    created_at: string;
    task_instances: { due_date: string } | null;
  }>;
  const badges = (earnedBadges ?? []) as Array<{
    badge_id: string;
    badges: { name: string; icon: string | null } | null;
  }>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback="/" />

      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <div className="text-6xl">{characterEmoji(child.character_id, stage)}</div>
          <div className="flex-1">
            <div className="text-xl font-bold">{child.display_name}</div>
            <div className="text-sm text-muted-foreground">
              Lv.{child.level} · {t("children.ranking", locale)} {rank.rank}/{rank.total}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.round(progress.fraction * 100)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {child.lifetime_earned.toLocaleString()} /{" "}
              {progress.nextThreshold?.toLocaleString() ?? "MAX"} pt
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{t("children.current_points", locale)}</div>
            <div className="text-3xl font-bold">
              {child.current_balance.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("children.today_tasks", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {taskList.length === 0 && (
            <p className="text-muted-foreground">{t("children.no_tasks_today", locale)}</p>
          )}
          {taskList.map((c) => (
            <TaskCheckbox
              key={c.id}
              id={c.id}
              title={c.title}
              points={c.points}
              status={c.status}
              readOnly
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("children.recent_points", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {txList.length === 0 && <p className="text-muted-foreground">{t("children.no_history", locale)}</p>}
          {txList.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b py-1 last:border-0"
            >
              <span>
                <span className="text-muted-foreground">{tx.task_instances?.due_date ?? formatDateInFamilyTz(tx.created_at, family.timezone, "yyyy-MM-dd")}</span>{" "}
                {tx.kind === "penalty" && "😢 "}
                {tx.kind === "adjustment" && `${t("children.adjustment", locale)} · `}
                {tx.reason}
              </span>
              <span
                className={
                  tx.kind === "penalty"
                    ? "text-red-600"
                    : tx.amount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                }
              >
                {tx.amount >= 0 ? "+" : ""}
                {tx.amount}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("children.badges", locale)} ({badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {badges.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("children.no_badges", locale)}</p>
            )}
            {badges.map((b) => (
              <span key={b.badge_id} className="rounded-full border px-3 py-1 text-xs">
                {b.badges?.icon} {b.badges?.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
