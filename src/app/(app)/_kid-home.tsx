"use client";
import { FadeUp, TaskCard } from "@/components/molecules";
import { CharacterAvatar } from "@/components/molecules/character-avatar";
import { LevelPill, EyebrowLabel } from "@/components/atoms";
import { ProgressTrack } from "@/components/atoms/progress-track";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CelebrationOverlay } from "@/components/organisms";
import Link from "next/link";
import type { Route } from "next";
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


const KID_BG_GRADIENT =
  "linear-gradient(135deg, #FFF5EC 0%, #FFE4E9 40%, #E5EFFF 100%)";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 5h12M3 9h12M3 13h8"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
      <path
        d="M9 2.5a5 5 0 00-5 5v3l-1.5 3h13L14 10.5v-3a5 5 0 00-5-5zM7 17a2 2 0 004 0"
        stroke="var(--ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TopBarProps = {
  streakDays: number;
  overdueCount: number;
  streakLabel: string;
  overdueLabel: string;
};

function KidTopBar({
  streakDays,
  overdueCount,
  streakLabel,
  overdueLabel,
}: TopBarProps) {
  const showOverdue = overdueCount > 0;
  const showStreak = !showOverdue && streakDays > 0;
  return (
    <div className="relative flex items-center justify-between px-5 pt-4 pb-2">
      <Link
        href={"/settings" as Route}
        aria-label="menu"
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <MenuIcon />
      </Link>

      {showOverdue ? (
        <div
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2"
          style={{
            background: "linear-gradient(90deg, #FEE2E2, #FECACA)",
            boxShadow:
              "0 8px 20px -10px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <span className="text-sm leading-none">⚠️</span>
          <span className="text-sm font-bold tracking-[-0.2px] text-[#B91C1C]">
            {overdueLabel}
          </span>
        </div>
      ) : showStreak ? (
        <div
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2"
          style={{
            background: "linear-gradient(90deg,#FFF3E0,#FFE4E9)",
            boxShadow:
              "0 8px 20px -10px rgba(255,107,157,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <span className="text-[15px] leading-none">🔥</span>
          <span className="text-sm font-bold tracking-[-0.2px] text-[color:var(--ink)]">
            {streakLabel}
          </span>
        </div>
      ) : (
        <span aria-hidden className="w-px" />
      )}

      <Link
        href={"/points" as Route}
        aria-label="notifications"
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <BellIcon />
      </Link>
    </div>
  );
}

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
    previousLevel?: number;
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
            previousLevel: j.leveledUp ? user.level : undefined,
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
  const isEmpty = todayTasks.length === 0 && overdueCount === 0;
  const streakLabel = t("home.streak_days", { days: String(streakDays) });
  const overdueLabel = t("home.overdue_badge", { count: String(overdueCount) });

  // Empty state — mockup: simpler hero + centered empty message, no FAB/badges.
  if (isEmpty) {
    return (
      <div
        className="relative -mx-4 -mt-4 md:-mx-8 md:-mt-8 flex min-h-[calc(100vh-4rem)] flex-col pb-8 text-[color:var(--ink)] md:min-h-screen"
        style={{ background: KID_BG_GRADIENT }}
      >
        <KidTopBar
          streakDays={streakDays}
          overdueCount={0}
          streakLabel={streakLabel}
          overdueLabel={overdueLabel}
        />

        {/* Simple character hero */}
        <div
          className="mx-4 mt-2.5 rounded-[22px] text-center"
          style={{
            padding: "20px 16px 22px",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 16px 40px -24px rgba(10,10,10,0.15)",
          }}
        >
          <div aria-hidden className="mb-2.5 text-[72px] leading-none">
            🐣
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,107,157,0.2)] bg-[color:var(--surface)] px-2.5 py-1 text-xs font-bold tracking-[-0.01em] text-[color:var(--accent)] whitespace-nowrap"
          >
            Lv.1 · 병아리
          </div>

          {/* 0/100 XP bar */}
          <div className="mt-3.5">
            <div
              className="h-2 overflow-hidden rounded-full border border-[rgba(10,10,10,0.05)]"
              style={{ background: "rgba(255,255,255,0.8)" }}
            >
              <div
                className="h-full w-0"
                style={{ background: "linear-gradient(90deg, #FF6B9D 0%, #FFA07A 100%)" }}
              />
            </div>
            <div className="mt-1.5 text-xs font-semibold tracking-[-0.01em] text-[color:var(--ink-subtle)] whitespace-nowrap" style={{ fontFeatureSettings: '"tnum" 1' }}>
              0 / 100 XP
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 flex-col items-center justify-center px-7 py-5 text-center">
          <div aria-hidden className="mb-3 text-[48px] leading-none">
            😴
          </div>
          <div className="mb-1.5 text-base font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
            {t("home.no_tasks_title")}
          </div>
          <div className="text-sm font-normal leading-normal tracking-[-0.01em] text-[color:var(--ink-subtle)]">
            {t("home.no_tasks_desc")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative -mx-4 -mt-4 pb-8 text-[color:var(--ink)] md:-mx-8 md:-mt-8"
      style={{
        minHeight: "calc(100vh - 4rem)",
        background: KID_BG_GRADIENT,
      }}
    >
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full opacity-50"
        style={{
          filter: "blur(48px)",
          background: "radial-gradient(circle,#FFB4C6 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full opacity-40"
        style={{
          filter: "blur(48px)",
          background: "radial-gradient(circle,#FFD5B8 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-lg pb-8">
        {/* Top bar */}
        <KidTopBar
          streakDays={streakDays}
          overdueCount={overdueCount}
          streakLabel={streakLabel}
          overdueLabel={overdueLabel}
        />

        {/* Hero card */}
        <FadeUp delay={80}>
          <div className="px-5 pt-4">
            <div
              className="relative overflow-hidden rounded-[22px]"
              style={{
                padding: "28px 24px 24px",
                background: "var(--surface)",
                boxShadow:
                  "0 20px 40px -16px rgba(45,27,61,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 top-0 h-36"
                style={{
                  background:
                    "radial-gradient(120% 120% at 50% 0%, #FFE4E9 0%, transparent 60%)",
                }}
              />
              <div className="relative flex items-center gap-5">
                <div className="relative">
                  <CharacterAvatar
                    characterId={user.character_id ?? ""}
                    size="xl"
                    level={user.level}
                  />
                  <div className="absolute -bottom-1.5 -right-2">
                    <LevelPill level={user.level} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <EyebrowLabel>{t("home.role_adventurer")}</EyebrowLabel>
                  <div className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.3px] text-[color:var(--ink)]">
                    {user.display_name}
                  </div>
                  <div className="mt-0.5 text-[13px] font-medium text-[rgba(45,27,61,0.55)]">
                    {nextThreshold ? (
                      <>
                        {t("home.next_level_prefix")}{" "}
                        <span className="font-bold text-[color:var(--accent)]">
                          {(nextThreshold - user.lifetime_earned).toLocaleString()}pt
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-[color:var(--accent)]">
                        {t("home.max_level")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative mt-6">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold text-[rgba(45,27,61,0.6)]">
                    {t("home.exp")}
                  </span>
                  <span className="text-[13px] font-bold text-[color:var(--ink)]">
                    <span className="text-[color:var(--accent)]">
                      {user.lifetime_earned.toLocaleString()}
                    </span>
                    <span className="text-[rgba(45,27,61,0.4)]">
                      {" "}/ {nextThreshold?.toLocaleString() ?? "MAX"} pt
                    </span>
                  </span>
                </div>
                <ProgressTrack value={Math.round(progressFraction * 100)} />
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Today's missions */}
        <FadeUp delay={160}>
          <div className="px-5 pt-7">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[20px] font-extrabold tracking-[-0.3px] text-[color:var(--ink)]">
                {t("home.today_tasks")}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-[color:var(--accent)]">
                  {doneCount}/{todayTasks.length}
                </span>
                <span className="text-[13px] font-medium text-[rgba(45,27,61,0.55)]">
                  {t("home.completed")}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {todayTasks.length === 0 && (
                <div className="flex flex-col items-center py-10">
                  <span className="text-[48px] leading-none">😴</span>
                  <p className="mt-4 text-center text-[16px] font-semibold text-[color:var(--ink)]">
                    {t("home.no_tasks_title")}
                  </p>
                  <p className="mt-1 text-center text-[14px] font-normal text-[color:var(--ink-subtle)]">
                    {t("home.no_tasks_desc")}
                  </p>
                </div>
              )}
              {todayTasks.map((task) => {
                const status = getStatus(task);
                const isOverdue = status === "overdue";

                if (isOverdue) {
                  return (
                    <div
                      key={task.id}
                      className="relative flex w-full items-center gap-4 rounded-[22px] border-l-2 border-l-[#FCA5A5] bg-[#FEF2F2]"
                      style={{
                        padding: "16px 16px 16px 14px",
                        boxShadow:
                          "0 16px 32px -18px rgba(239,68,68,0.18), inset 0 1px 0 rgba(255,255,255,0.5)",
                      }}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[22px]"
                        style={{ background: "linear-gradient(135deg,#FEE2E2,#FECACA)" }}
                      >
                        ⚠️
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[17px] font-semibold text-[color:var(--error-strong)]">
                          {task.title}
                        </div>
                        <div className="mt-0.5 text-[13px] font-bold text-[color:var(--error-strong)]">
                          +{task.points} pt
                        </div>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center rounded-full bg-[color:var(--error-strong)] px-2.5 py-1 text-[11px] font-extrabold tracking-[-0.01em] text-[color:var(--on-accent)] whitespace-nowrap"
                      >
                        {t("home.overdue_label")}
                      </span>
                    </div>
                  );
                }

                return (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    points={task.points}
                    status={status === "completed" ? "completed" : status === "pardoned" ? "pardoned" : status === "overdue" ? "overdue" : "pending"}
                    onToggle={pending || status === "pardoned" ? undefined : () => onToggle(task)}
                  />
                );
              })}
            </div>
          </div>
        </FadeUp>

        {/* Badges */}
        <FadeUp delay={240}>
          <div className="px-5 pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("home.badges")}</CardTitle>
              </CardHeader>
              <CardContent>
                {earnedBadges.length === 0 ? (
                  <p className="text-sm text-[color:var(--ink-subtle)]">
                    {t("home.no_badges")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {earnedBadges.map((b) => (
                      <div
                        key={b.badge_id}
                        className="flex flex-col items-center rounded-lg p-3 min-w-[72px]"
                        style={{
                          border:
                            "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                          background:
                            "color-mix(in srgb, var(--accent) 5%, transparent)",
                        }}
                      >
                        <span className="text-4xl">{b.badges?.icon}</span>
                        <span className="mt-1 text-[10px] font-medium text-center">
                          {b.badges?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </FadeUp>

        {/* Beg more FAB */}
        <FadeUp delay={320}>
          <div className="mt-8 flex justify-center px-5 pb-10">
            <a
              href="/tasks"
              className="flex items-center gap-2 rounded-full text-white transition-spring hover:translate-y-[-2px]"
              style={{
                padding: "8px 8px 8px 24px",
                background: "#1A0F26",
                boxShadow:
                  "0 18px 36px -12px rgba(26,15,38,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-base">✨</span>
              <span className="text-base font-bold tracking-[-0.2px]">
                {t("home.beg_more")}
              </span>
              <span
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: "var(--accent-gradient)",
                  boxShadow: "var(--shadow-inset-white)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          </div>
        </FadeUp>

        {/* Celebration overlay */}
        {celebration && (
          <CelebrationOverlay
            open={true}
            onClose={() => setCelebration(null)}
            taskTitle={celebration.taskTitle}
            points={celebration.points}
            levelUp={celebration.leveledUp && celebration.newLevel && celebration.previousLevel ? { from: celebration.previousLevel, to: celebration.newLevel } : undefined}
            characterId={user.character_id ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
