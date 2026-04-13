import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage, progressToNextLevel } from "@/lib/level";
import { familyToday } from "@/lib/datetime/family-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t, type Locale } from "@/lib/i18n";

import Link from "next/link";
import type { Route } from "next";

export default async function HomePage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();
  const today = familyToday(family.timezone);

  // Ensure today's instances exist for children.
  if (user.role === "child") {
    await supabase.rpc("ensure_today_instances", {
      p_user_id: user.id,
      p_family_id: family.id,
    });
  }

  if (user.role === "child") {
    const { data: tasks } = await supabase
      .from("task_instances")
      .select("id, title, points, status, due_date, template_id")
      .eq("assignee_id", user.id)
      .gte("due_date", today)
      .in("status", ["pending", "completed", "rejected"])
      .order("due_date");

    const { data: overdueTasks } = await supabase
      .from("task_instances")
      .select("id")
      .eq("assignee_id", user.id)
      .eq("status", "overdue");

    const { data: earnedBadges } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at, badges(name, icon)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    const todayOnly = ((tasks ?? []) as Array<{
      id: string;
      title: string;
      points: number;
      status: string;
      due_date: string;
      template_id: string | null;
    }>).filter((c) => c.due_date === today);
    const overdueCount = (overdueTasks ?? []).length;

    const stage = getStage(user.level);
    const progress = progressToNextLevel(user.lifetime_earned);

    return (
      <div className="mx-auto max-w-3xl space-y-6">

        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            <div className="text-6xl">{characterEmoji(user.character_id, stage)}</div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">{user.display_name}</div>
              <div className="text-xl font-bold">Lv. {user.level}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round(progress.fraction * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {user.lifetime_earned.toLocaleString()} /{" "}
                {progress.nextThreshold?.toLocaleString() ?? "MAX"} pt
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{t("home.current_points", locale)}</div>
              <div className="text-3xl font-bold">{user.current_balance.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("home.today_tasks", locale)}
              {overdueCount > 0 && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                  {t("home.missed_count", locale).replace("{count}", String(overdueCount))}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayOnly.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("home.no_tasks", locale)}</p>
            )}
            {todayOnly.map((c) => {
              const isBeg = c.template_id === null;
              const icon = c.status === "completed"
                ? (isBeg ? "🎉" : "✅")
                : c.status === "rejected" ? "❌" : "⬜";
              return (
                <Link
                  key={c.id}
                  href="/tasks"
                  className={`flex items-center justify-between rounded-md border p-3 hover:bg-accent ${
                    isBeg && c.status === "completed" ? "bg-green-50 border-green-200" : ""
                  } ${c.status === "rejected" ? "bg-red-50 border-red-200" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span>{icon}</span>
                    <span className={c.status === "completed" && !isBeg ? "text-muted-foreground line-through" : ""}>
                      {c.title}
                    </span>
                    {isBeg && c.status === "completed" && (
                      <span className="text-[10px] font-medium text-green-600">{t("home.beg_success", locale)}</span>
                    )}
                    {c.status === "rejected" && (
                      <span className="text-[10px] font-medium text-red-600">{t("home.beg_failed", locale)}</span>
                    )}
                  </div>
                  <Badge variant="secondary">{c.points > 0 ? `+${c.points}` : "-"}</Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("home.badges", locale)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {((earnedBadges ?? []) as Array<{ badge_id: string; badges: { name: string; icon: string } | null }>)
                .map((b) => (
                  <div key={b.badge_id} className="flex flex-col items-center rounded-lg border border-primary/30 bg-primary/5 p-3 min-w-[72px]">
                    <span className="text-4xl">{b.badges?.icon}</span>
                    <span className="mt-1 text-[10px] font-medium text-center">{b.badges?.name}</span>
                  </div>
                ))}
              {(earnedBadges ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">{t("home.no_badges", locale)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parent dashboard — children overview grid + quick actions.
  const { data: members } = await supabase
    .from("users")
    .select("id, display_name, level, current_balance, lifetime_earned, character_id")
    .eq("family_id", family.id)
    .eq("role", "child");

  const { data: todaysTasks } = await supabase
    .from("task_instances")
    .select("id, assignee_id, title, points, status, template_id")
    .eq("family_id", family.id)
    .eq("due_date", today)
    .order("title");

  const kidList = (members ?? []) as Array<{
    id: string;
    display_name: string;
    level: number;
    current_balance: number;
    lifetime_earned: number;
    character_id: string | null;
  }>;
  const taskList = (todaysTasks ?? []) as Array<{
    id: string;
    assignee_id: string;
    title: string;
    points: number;
    status: string;
    template_id: string | null;
  }>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{family.name}</h1>
        <p className="text-sm text-muted-foreground">{t("home.today_summary", locale)}</p>
      </div>

      {kidList.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {t("home.no_children", locale)}{" "}
            <Link href="/family/invite" className="text-primary underline">
              {t("home.invite_code", locale)}
            </Link>
          </CardContent>
        </Card>
      )}

      {kidList.map((k) => {
        const kidTasks = taskList.filter((c) => c.assignee_id === k.id);
        const total = kidTasks.length;
        const done = kidTasks.filter((c) => c.status === "completed").length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <Card key={k.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Link href={`/children/${k.id}` as Route} className="flex items-center gap-3 hover:opacity-80">
                  <span className="text-3xl">
                    {characterEmoji(k.character_id, getStage(k.level))}
                  </span>
                  <div>
                    <CardTitle className="text-base">{k.display_name}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      Lv.{k.level} · {k.current_balance.toLocaleString()}pt
                    </div>
                  </div>
                </Link>
                <div className="text-right">
                  <div className="text-2xl font-bold">{done}/{total}</div>
                  <div className="text-xs text-muted-foreground">{t("home.completed", locale)}</div>
                </div>
              </div>
              {total > 0 && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {kidTasks.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("home.no_tasks", locale)}</p>
              )}
              {kidTasks.map((c) => {
                const isBeg = c.template_id === null;
                const icon = c.status === "completed"
                  ? (isBeg ? "🎉" : "✅")
                  : c.status === "rejected"
                    ? "❌"
                    : c.status === "requested"
                      ? "⏳"
                      : c.status === "overdue"
                        ? "🔴"
                        : "⬜";
                const label = isBeg && c.status === "completed"
                  ? t("home.beg_success", locale)
                  : c.status === "rejected"
                    ? t("home.beg_failed", locale)
                    : c.status === "requested"
                      ? t("home.beg_waiting", locale)
                      : null;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                      isBeg && c.status === "completed" ? "bg-green-50" : ""
                    } ${c.status === "rejected" ? "bg-red-50" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <span className={c.status === "completed" && !isBeg ? "text-muted-foreground line-through" : ""}>
                        {c.title}
                      </span>
                      {label && (
                        <span className={`text-[10px] font-medium ${
                          c.status === "completed" ? "text-green-600" : c.status === "rejected" ? "text-red-600" : "text-yellow-600"
                        }`}>
                          {label}
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary">{c.points > 0 ? `+${c.points}` : "-"}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
