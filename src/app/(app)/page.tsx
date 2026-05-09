import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { familyToday, familyYesterday } from "@/lib/datetime/family-tz";
import { getStage, progressToNextLevel } from "@/lib/level";
import { computeStreak } from "@/lib/streak";
import { KidHome } from "./_kid-home";
import { ParentHome } from "./_parent-home";
import type { Locale } from "@/lib/i18n";

function daysAheadLabel(today: string, due: string, tomorrow: string): string {
  const [yT, mT, dT] = today.split("-").map(Number);
  const [yD, mD, dD] = due.split("-").map(Number);
  // eslint-disable-next-line no-restricted-syntax
  const days = Math.round(
    (Date.UTC(yD ?? 1970, (mD ?? 1) - 1, dD ?? 1) -
      Date.UTC(yT ?? 1970, (mT ?? 1) - 1, dT ?? 1)) /
      86_400_000,
  );
  if (days <= 0) return "";
  if (days === 1) return tomorrow;
  return `D-${days}`;
}

export default async function HomePage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();
  const today = familyToday(family.timezone);

  if (user.role === "child") {
    await supabase.rpc("ensure_today_instances", {
      p_user_id: user.id,
      p_family_id: family.id,
    });

    // Past-due overdue tasks are intentionally not fetched — penalty has
    // already been applied by the cron, so they should not clutter today's
    // view. Future-due tasks ride along in `tasks` and are split into a
    // separate "미리하기" section in KidHome (not counted in today's totals).
    const yesterday = familyYesterday(family.timezone);
    const [{ data: tasks }, { data: yesterdayOverdue }, { data: earnedBadges }, { data: completions }] =
      await Promise.all([
        supabase
          .from("task_instances")
          .select("id, title, points, status, due_date, template_id")
          .eq("assignee_id", user.id)
          .gte("due_date", today)
          .in("status", ["pending", "completed", "rejected", "pardoned", "requested"])
          .order("due_date"),
        supabase
          .from("task_instances")
          .select("id")
          .eq("assignee_id", user.id)
          .eq("status", "overdue")
          .eq("due_date", yesterday),
        supabase
          .from("user_badges")
          .select("badge_id, earned_at, badges(name, icon)")
          .eq("user_id", user.id)
          .order("earned_at", { ascending: false }),
        supabase
          .from("task_instances")
          .select("completed_at")
          .eq("assignee_id", user.id)
          .eq("status", "completed")
          .not("completed_at", "is", null),
      ]);

    type KidTask = {
      id: string; title: string; points: number; status: string; due_date: string; template_id: string | null;
    };
    const allTasks = (tasks ?? []) as KidTask[];
    const todayOnly = allTasks.filter((c) => c.due_date === today);
    const tomorrowLabel =
      locale === "ja" ? "明日" : locale === "en" ? "Tomorrow" : "내일";
    const upcoming = allTasks
      .filter((c) => c.due_date > today && c.status === "pending")
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .map((c) => ({ ...c, trailing: daysAheadLabel(today, c.due_date, tomorrowLabel) }));

    const streakDays = computeStreak(
      ((completions ?? []) as Array<{ completed_at: string }>).map((c) => new Date(c.completed_at)),
      family.timezone,
    );

    const stage = getStage(user.level);
    const progress = progressToNextLevel(user.lifetime_earned);

    return (
      <KidHome
        user={{
          id: user.id,
          display_name: user.display_name,
          level: user.level,
          current_balance: user.current_balance,
          lifetime_earned: user.lifetime_earned,
          character_id: user.character_id,
        }}
        stage={stage}
        progressFraction={progress.fraction}
        nextThreshold={progress.nextThreshold}
        todayTasks={todayOnly}
        upcomingTasks={upcoming}
        overdueCount={(yesterdayOverdue ?? []).length}
        earnedBadges={(earnedBadges ?? []) as Array<{ badge_id: string; badges: { name: string; icon: string } | null }>}
        streakDays={streakDays}
      />
    );
  }

  // Parent path
  const [{ data: members }, { data: todaysTasks }, { data: pendingBegs }] =
    await Promise.all([
      supabase
        .from("users")
        .select(
          "id, display_name, level, current_balance, lifetime_earned, character_id",
        )
        .eq("family_id", family.id)
        .eq("role", "child"),
      supabase
        .from("task_instances")
        .select("id, assignee_id, title, points, status, template_id")
        .eq("family_id", family.id)
        .eq("due_date", today)
        .order("title"),
      supabase
        .from("task_instances")
        .select("id, title, points, created_at, assignee_id")
        .eq("family_id", family.id)
        .eq("status", "requested")
        .order("created_at", { ascending: false }),
    ]);

  // Build approval objects with kid names
  const kidMap = new Map(
    ((members ?? []) as Array<{ id: string; display_name: string }>).map(
      (k) => [k.id, k.display_name],
    ),
  );
  const approvals = (
    (pendingBegs ?? []) as Array<{
      id: string;
      title: string;
      points: number;
      created_at: string;
      assignee_id: string;
    }>
  ).map((b) => ({
    id: b.id,
    kidName: kidMap.get(b.assignee_id) ?? "",
    taskTitle: b.title,
    points: b.points,
    createdAt: b.created_at,
  }));

  return (
    <ParentHome
      familyName={family.name}
      locale={locale}
      kids={
        (members ?? []) as Array<{
          id: string;
          display_name: string;
          level: number;
          current_balance: number;
          lifetime_earned: number;
          character_id: string | null;
        }>
      }
      tasks={
        (todaysTasks ?? []) as Array<{
          id: string;
          assignee_id: string;
          title: string;
          points: number;
          status: string;
          template_id: string | null;
        }>
      }
      approvals={approvals}
      weeklyPoints={0}
      streakDays={0}
    />
  );
}
