import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { familyToday } from "@/lib/datetime/family-tz";
import { getStage, progressToNextLevel } from "@/lib/level";
import { computeStreak } from "@/lib/streak";
import { KidHome } from "./_kid-home";
import { ParentHome } from "./_parent-home";
import type { Locale } from "@/lib/i18n";

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

    const [{ data: tasks }, { data: overdueTasks }, { data: earnedBadges }, { data: completions }] =
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
          .eq("status", "overdue"),
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

    const todayOnly = ((tasks ?? []) as Array<{
      id: string; title: string; points: number; status: string; due_date: string; template_id: string | null;
    }>).filter((c) => c.due_date === today);

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
        overdueCount={(overdueTasks ?? []).length}
        earnedBadges={(earnedBadges ?? []) as Array<{ badge_id: string; badges: { name: string; icon: string } | null }>}
        streakDays={streakDays}
      />
    );
  }

  // Parent path
  const [{ data: members }, { data: todaysTasks }] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, level, current_balance, lifetime_earned, character_id")
      .eq("family_id", family.id)
      .eq("role", "child"),
    supabase
      .from("task_instances")
      .select("id, assignee_id, title, points, status, template_id")
      .eq("family_id", family.id)
      .eq("due_date", today)
      .order("title"),
  ]);

  return (
    <ParentHome
      familyName={family.name}
      locale={locale}
      kids={(members ?? []) as Array<{
        id: string; display_name: string; level: number; current_balance: number; lifetime_earned: number; character_id: string | null;
      }>}
      tasks={(todaysTasks ?? []) as Array<{
        id: string; assignee_id: string; title: string; points: number; status: string; template_id: string | null;
      }>}
    />
  );
}
