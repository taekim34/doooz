"use client";
import { FadeUp } from "@/components/ui/fade-up";
import { CharacterAvatar } from "@/components/ui/character-avatar";
import { LevelPill } from "@/components/ui/level-pill";
import { ProgressTrack } from "@/components/ui/progress-track";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { StreakBadge } from "@/components/ui/streak-badge";
import { TaskCard } from "@/components/ui/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CelebrationOverlay } from "@/components/ui/celebration-overlay";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";
import type { CharacterStage } from "@/lib/level";

type Task = {
  id: string;
  title: string;
  points: number;
  status: string;
  template_id: string | null;
};

type Badge = {
  badge_id: string;
  badges: { name: string; icon: string } | null;
};

type KidHomeProps = {
  user: {
    id: string;
    display_name: string;
    level: number;
    current_balance: number;
    lifetime_earned: number;
    character_id: string | null;
  };
  stage: CharacterStage;
  progressFraction: number;
  nextThreshold: number | null;
  todayTasks: Task[];
  overdueCount: number;
  earnedBadges: Badge[];
  streakDays: number;
};

export function KidHome({
  user,
  stage,
  progressFraction,
  nextThreshold,
  todayTasks,
  overdueCount,
  earnedBadges,
  streakDays,
}: KidHomeProps) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [celebration, setCelebration] = useState<{
    taskTitle: string;
    points: number;
    leveledUp: boolean;
    newLevel?: number;
  } | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  function getStatus(task: Task) {
    return localStatuses[task.id] ?? task.status;
  }

  async function onToggle(task: Task) {
    if (pending) return;
    const current = getStatus(task);
    const isDone = current === "completed";
    const next = isDone ? "pending" : "completed";
    setLocalStatuses((prev) => ({ ...prev, [task.id]: next }));

    startTransition(async () => {
      try {
        const endpoint = isDone ? "uncomplete" : "complete";
        const res = await fetch(`/api/tasks/${task.id}/${endpoint}`, { method: "POST" });
        if (!res.ok) {
          setLocalStatuses((prev) => ({ ...prev, [task.id]: current }));
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("tasks.error_complete_failed"));
          return;
        }
        const j = await res.json();
        if (!isDone && !j.idempotent) {
          setCelebration({
            taskTitle: task.title,
            points: task.points,
            leveledUp: !!j.leveledUp,
            newLevel: j.leveledUp ? (user.level + 1) : undefined,
          });
        }
        if (isDone) {
          toast.success(t("tasks.uncomplete_success", { points: String(task.points), balance: String(j.balance) }));
        }
        router.refresh();
      } catch {
        setLocalStatuses((prev) => ({ ...prev, [task.id]: current }));
        toast.error(t("tasks.error_network"));
      }
    });
  }

  const doneCount = todayTasks.filter((tk) => getStatus(tk) === "completed").length;

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      {/* Streak */}
      {streakDays > 0 && (
        <FadeUp className="flex justify-center">
          <StreakBadge days={streakDays} label={t("home.streak_days")} />
        </FadeUp>
      )}

      {/* Hero card */}
      <FadeUp delay={80}>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-5 p-6">
            <div className="relative">
              <CharacterAvatar characterId={user.character_id} stage={stage} size="hero" />
              <div className="absolute -bottom-1 -right-1">
                <LevelPill level={user.level} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <EyebrowLabel>{t("home.role_adventurer")}</EyebrowLabel>
              <div className="text-lg font-bold" style={{ color: "var(--ink)" }}>
                {user.display_name}
              </div>
              <ProgressTrack value={Math.round(progressFraction * 100)} className="mt-2" />
              <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                {user.lifetime_earned.toLocaleString()} / {nextThreshold?.toLocaleString() ?? "MAX"} pt
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs" style={{ color: "var(--muted)" }}>{t("home.current_points")}</div>
              <div className="text-3xl font-extrabold gradient-text">
                {user.current_balance.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeUp>

      {/* Today's missions */}
      <FadeUp delay={160}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("home.today_tasks")}</CardTitle>
              <span className="text-sm font-semibold" style={{ color: "var(--accent-color)" }}>
                {doneCount}/{todayTasks.length}
              </span>
            </div>
            {overdueCount > 0 && (
              <span className="text-xs text-red-500">
                {t("home.missed_count").replace("{count}", String(overdueCount))}
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-1">
            {todayTasks.length === 0 && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>{t("home.no_tasks")}</p>
            )}
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                points={task.points}
                done={getStatus(task) === "completed"}
                isBeg={task.template_id === null}
                onToggle={() => onToggle(task)}
                disabled={pending || getStatus(task) === "overdue" || getStatus(task) === "pardoned"}
              />
            ))}
          </CardContent>
        </Card>
      </FadeUp>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <FadeUp delay={240}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("home.badges")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {earnedBadges.map((b) => (
                  <div
                    key={b.badge_id}
                    className="flex flex-col items-center rounded-lg p-3 min-w-[72px]"
                    style={{
                      border: "1px solid color-mix(in srgb, var(--accent-color) 30%, transparent)",
                      background: "color-mix(in srgb, var(--accent-color) 5%, transparent)",
                    }}
                  >
                    <span className="text-4xl">{b.badges?.icon}</span>
                    <span className="mt-1 text-[10px] font-medium text-center">{b.badges?.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeUp>
      )}

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationOverlay
          characterId={user.character_id}
          stage={stage}
          taskTitle={celebration.taskTitle}
          points={celebration.points}
          leveledUp={celebration.leveledUp}
          newLevel={celebration.newLevel}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
