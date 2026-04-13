import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage, progressToNextLevel, getLevelTitle } from "@/lib/level";
import { familyToday, formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { StageProgress } from "@/app/(app)/characters/_stage-progress";
import { TaskCheckbox } from "@/app/(app)/tasks/_checkbox";
import { t, type Locale } from "@/lib/i18n";

interface MemberRow {
  id: string;
  family_id: string;
  role: "parent" | "child";
  display_name: string;
  character_id: string | null;
  current_balance: number;
  lifetime_earned: number;
  level: number;
  created_at: string;
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;

  const supabase = await createClient();
  const { data: memberRow } = await supabase
    .from("users")
    .select("id, family_id, role, display_name, character_id, current_balance, lifetime_earned, level, created_at")
    .eq("id", id)
    .maybeSingle();

  const member = memberRow as MemberRow | null;
  if (!member || member.family_id !== family.id) notFound();

  const today = familyToday(family.timezone);
  const stage = getStage(member.level);
  const progress = progressToNextLevel(member.lifetime_earned);
  const isChild = member.role === "child";

  // Parallel queries
  const [tasksRes, txsRes, badgesRes, statsRes] = await Promise.all([
    // Today's tasks (child only)
    isChild
      ? supabase
          .from("task_instances")
          .select("id, title, points, status, template_id")
          .eq("assignee_id", member.id)
          .eq("due_date", today)
          .in("status", ["pending", "completed", "overdue", "pardoned"])
          .order("created_at")
      : { data: null },
    // Recent point transactions
    supabase
      .from("point_transactions")
      .select("id, amount, reason, kind, created_at, task_instances(due_date)")
      .eq("user_id", member.id)
      .order("created_at", { ascending: false })
      .limit(20),
    // Earned badges
    supabase
      .from("user_badges")
      .select("badge_id, earned_at, badges(name, icon)")
      .eq("user_id", member.id)
      .order("earned_at", { ascending: false }),
    // Stats: total completed, total days
    isChild
      ? supabase
          .from("task_instances")
          .select("id, status, due_date")
          .eq("assignee_id", member.id)
          .eq("status", "completed")
          .not("template_id", "is", null)
      : { data: null },
  ]);

  const taskList = (tasksRes.data ?? []) as Array<{
    id: string; title: string; points: number; status: string; template_id: string | null;
  }>;
  const txList = (txsRes.data ?? []) as Array<{
    id: string; amount: number; reason: string; kind: string; created_at: string;
    task_instances: { due_date: string } | null;
  }>;
  const badges = (badgesRes.data ?? []) as Array<{
    badge_id: string; badges: { name: string; icon: string | null } | null;
  }>;
  const completedTasks = (statsRes.data ?? []) as Array<{ id: string; due_date: string }>;

  // Stats
  const totalCompleted = completedTasks.length;
  const activeDays = new Set(completedTasks.map((c) => c.due_date)).size;
  const joinDate = formatDateInFamilyTz(member.created_at, family.timezone, "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback="/family" />

      {/* Profile card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-6">
            <div className="text-7xl">{characterEmoji(member.character_id, stage)}</div>
            <div className="flex-1">
              <div className="text-xl font-bold">{member.display_name}</div>
              <div className="text-sm text-muted-foreground">
                {member.role === "parent" ? t("family.role_parent", locale) : t("family.role_child", locale)}
              </div>
              <div className="text-lg font-semibold mt-1">
                Lv.{member.level} · {getLevelTitle(member.level, (k) => t(k, locale))}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round(progress.fraction * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {member.lifetime_earned.toLocaleString()} / {progress.nextThreshold?.toLocaleString() ?? "MAX"} pt
              </div>
            </div>
          </div>
          {isChild && <StageProgress currentStage={stage} locale={locale} />}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{member.current_balance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{t("points.current", locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{member.lifetime_earned.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{t("points.lifetime", locale)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{badges.length}</div>
            <div className="text-xs text-muted-foreground">{t("characters.badges", locale)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Child stats */}
      {isChild && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{totalCompleted}</div>
              <div className="text-xs text-muted-foreground">{t("tasks.completed", locale)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{activeDays}</div>
              <div className="text-xs text-muted-foreground">{t("member.active_days", locale)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{joinDate}</div>
              <div className="text-xs text-muted-foreground">{t("member.join_date", locale)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's tasks (child only) */}
      {isChild && taskList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("home.today_tasks", locale)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {taskList.map((c) => (
              <TaskCheckbox
                key={c.id}
                id={c.id}
                title={c.title}
                points={c.points}
                status={c.status}
                readOnly
                isBeg={c.template_id === null}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>{t("characters.badges", locale)} ({badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {badges.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("home.no_badges", locale)}</p>
            )}
            {badges.map((b) => (
              <div key={b.badge_id} className="flex flex-col items-center rounded-lg border border-primary/30 bg-primary/5 p-3 min-w-[72px]">
                <span className="text-3xl">{b.badges?.icon}</span>
                <span className="mt-1 text-[10px] font-medium text-center">{b.badges?.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("points.history", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {txList.length === 0 && <p className="text-muted-foreground">{t("points.no_history", locale)}</p>}
          {txList.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between border-b py-1 last:border-0">
              <span>
                <span className="text-muted-foreground">{tx.task_instances?.due_date?.slice(5) ?? formatDateInFamilyTz(tx.created_at, family.timezone, "MM-dd")}</span>{" "}
                {tx.reason}
              </span>
              <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
                {tx.amount >= 0 ? "+" : ""}{tx.amount}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
