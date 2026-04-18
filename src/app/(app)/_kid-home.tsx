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
import { GlowBlob } from "@/components/ui/glow-blob";
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
    <div className="relative mx-auto max-w-lg space-y-6 pb-8">
      <GlowBlob className="-top-20 -left-16 h-64 w-64" color="#FFB4C6" style={{ opacity: 0.5 }} />
      <GlowBlob className="top-40 -right-20 h-72 w-72" color="#FFD5B8" style={{ opacity: 0.4 }} />

      {/* Streak */}
      {streakDays > 0 && (
        <FadeUp className="flex justify-center">
          <StreakBadge days={streakDays} label={t("home.streak_days")} />
        </FadeUp>
      )}

      {/* Hero card */}
      <FadeUp delay={80}>
        <div
          className="relative overflow-hidden rounded-[22px]"
          style={{
            padding: "28px 24px 24px",
            background: "var(--card)",
            boxShadow: "0 20px 40px -16px rgba(45,27,61,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 h-36"
            style={{ background: "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--accent-color) 20%, transparent) 0%, transparent 60%)" }}
          />
          <div className="relative flex items-center gap-5">
            <div className="relative">
              <CharacterAvatar characterId={user.character_id} stage={stage} size="hero" />
              <div className="absolute -bottom-1.5 -right-2">
                <LevelPill level={user.level} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <EyebrowLabel>{t("home.role_adventurer")}</EyebrowLabel>
              <div className="mt-1 text-[28px] font-bold leading-tight" style={{ color: "var(--ink)", letterSpacing: "-0.3px" }}>
                {user.display_name}
              </div>
              <div className="mt-0.5 text-[13px] font-medium" style={{ color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}>
                {t("home.next_level_prefix")}{" "}
                <span className="font-bold" style={{ color: "var(--accent-color)" }}>
                  {nextThreshold ? (nextThreshold - user.lifetime_earned).toLocaleString() : 0}pt
                </span>
              </div>
            </div>
          </div>
          <div className="relative mt-6">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold" style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}>
                {t("home.exp")}
              </span>
              <span className="text-[13px] font-bold" style={{ color: "var(--ink)" }}>
                <span style={{ color: "var(--accent-color)" }}>{user.lifetime_earned.toLocaleString()}</span>
                <span style={{ color: "color-mix(in srgb, var(--ink) 40%, transparent)" }}> / {nextThreshold?.toLocaleString() ?? "MAX"} pt</span>
              </span>
            </div>
            <ProgressTrack value={Math.round(progressFraction * 100)} />
          </div>
        </div>
      </FadeUp>

      {/* Today's missions */}
      <FadeUp delay={160}>
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[20px] font-extrabold" style={{ color: "var(--ink)", letterSpacing: "-0.3px" }}>
              {t("home.today_tasks")}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold" style={{ color: "var(--accent-color)" }}>
                {doneCount}/{todayTasks.length}
              </span>
              <span className="text-[13px] font-medium" style={{ color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}>
                {t("home.completed")}
              </span>
            </div>
          </div>
          {overdueCount > 0 && (
            <span className="text-xs text-red-500">
              {t("home.missed_count").replace("{count}", String(overdueCount))}
            </span>
          )}
          <div className="space-y-3">
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
          </div>
        </div>
      </FadeUp>

      {/* Badges - always show */}
      <FadeUp delay={240}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("home.badges")}</CardTitle>
          </CardHeader>
          <CardContent>
            {earnedBadges.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>{t("home.no_badges")}</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </FadeUp>

      {/* Beg more FAB */}
      <FadeUp delay={320}>
        <div className="flex justify-center">
          <a
            href="/tasks"
            className="flex items-center gap-2 rounded-full py-2 pl-6 pr-2 text-white transition-spring hover:translate-y-[-2px]"
            style={{
              background: "#1A0F26",
              boxShadow: "0 18px 36px -12px rgba(26,15,38,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-base font-bold" style={{ letterSpacing: "-0.2px" }}>{t("home.beg_more")}</span>
            <span
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "var(--accent-gradient)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3.5 8h9m0 0L8.5 4m4 4l-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </a>
        </div>
      </FadeUp>

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
