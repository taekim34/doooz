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
    <div
      className="relative flex items-center justify-between"
      style={{ padding: "16px 20px 8px" }}
    >
      <Link
        href={"/settings" as Route}
        aria-label="menu"
        style={{
          height: 44,
          width: 44,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 6px 16px -8px rgba(45,27,61,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MenuIcon />
      </Link>

      {showOverdue ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 9999,
            padding: "8px 14px",
            background: "linear-gradient(90deg, #FEE2E2, #FECACA)",
            boxShadow:
              "0 8px 20px -10px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>⚠️</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#B91C1C",
              letterSpacing: "-0.2px",
            }}
          >
            {overdueLabel}
          </span>
        </div>
      ) : showStreak ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 9999,
            padding: "8px 14px",
            background: "linear-gradient(90deg,#FFF3E0,#FFE4E9)",
            boxShadow:
              "0 8px 20px -10px rgba(255,107,157,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>🔥</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: -0.2,
              color: "var(--ink)",
            }}
          >
            {streakLabel}
          </span>
        </div>
      ) : (
        <span aria-hidden style={{ width: 1 }} />
      )}

      <Link
        href={"/points" as Route}
        aria-label="notifications"
        style={{
          height: 44,
          width: 44,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 6px 16px -8px rgba(45,27,61,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        className="relative -mx-4 -mt-4 md:-mx-8 md:-mt-8 pb-8 min-h-[calc(100vh-4rem)] md:min-h-screen"
        style={{
          color: "var(--ink)",
          background: KID_BG_GRADIENT,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <KidTopBar
          streakDays={streakDays}
          overdueCount={0}
          streakLabel={streakLabel}
          overdueLabel={overdueLabel}
        />

        {/* Simple character hero */}
        <div
          style={{
            margin: "10px 16px 0",
            padding: "20px 16px 22px",
            borderRadius: 22,
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 16px 40px -24px rgba(10,10,10,0.15)",
            textAlign: "center",
          }}
        >
          <div aria-hidden style={{ fontSize: 72, lineHeight: 1, marginBottom: 10 }}>
            🐣
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 9999,
              background: "var(--surface)",
              border: "1px solid rgba(255,107,157,0.2)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Lv.1 · 병아리
          </div>

          {/* 0/100 XP bar */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                height: 8,
                borderRadius: 9999,
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(10,10,10,0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "0%",
                  height: "100%",
                  background: "linear-gradient(90deg, #FF6B9D 0%, #FFA07A 100%)",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink-subtle)",
                letterSpacing: "-0.01em",
                fontFeatureSettings: '"tnum" 1',
                whiteSpace: "nowrap",
              }}
            >
              0 / 100 XP
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "20px 28px",
          }}
        >
          <div aria-hidden style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>
            😴
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
              marginBottom: 6,
            }}
          >
            {t("home.no_tasks_title")}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "var(--ink-subtle)",
              letterSpacing: "-0.01em",
              lineHeight: 1.5,
            }}
          >
            {t("home.no_tasks_desc")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative -mx-4 -mt-4 md:-mx-8 md:-mt-8 pb-8"
      style={{
        minHeight: "calc(100vh - 4rem)",
        color: "var(--ink)",
        background: KID_BG_GRADIENT,
      }}
    >
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -80,
          left: -64,
          height: 256,
          width: 256,
          borderRadius: 9999,
          filter: "blur(48px)",
          opacity: 0.5,
          background: "radial-gradient(circle,#FFB4C6 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 160,
          right: -80,
          height: 288,
          width: 288,
          borderRadius: 9999,
          filter: "blur(48px)",
          opacity: 0.4,
          background: "radial-gradient(circle,#FFD5B8 0%, transparent 70%)",
          pointerEvents: "none",
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
          <div style={{ padding: "16px 20px 0" }}>
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
                  <div
                    className="mt-1 text-[28px] font-bold leading-tight"
                    style={{ color: "var(--ink)", letterSpacing: "-0.3px" }}
                  >
                    {user.display_name}
                  </div>
                  <div
                    className="mt-0.5 text-[13px] font-medium"
                    style={{ color: "rgba(45,27,61,0.55)" }}
                  >
                    {nextThreshold ? (
                      <>
                        {t("home.next_level_prefix")}{" "}
                        <span className="font-bold" style={{ color: "var(--accent)" }}>
                          {(nextThreshold - user.lifetime_earned).toLocaleString()}pt
                        </span>
                      </>
                    ) : (
                      <span className="font-bold" style={{ color: "var(--accent)" }}>
                        {t("home.max_level")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative mt-6">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: "rgba(45,27,61,0.6)" }}
                  >
                    {t("home.exp")}
                  </span>
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "var(--ink)" }}
                  >
                    <span style={{ color: "var(--accent)" }}>
                      {user.lifetime_earned.toLocaleString()}
                    </span>
                    <span style={{ color: "rgba(45,27,61,0.4)" }}>
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
          <div style={{ padding: "28px 20px 0" }}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2
                className="text-[20px] font-extrabold"
                style={{ color: "var(--ink)", letterSpacing: "-0.3px" }}
              >
                {t("home.today_tasks")}
              </h2>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[13px] font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {doneCount}/{todayTasks.length}
                </span>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(45,27,61,0.55)" }}
                >
                  {t("home.completed")}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {todayTasks.length === 0 && (
                <div className="flex flex-col items-center py-10">
                  <span className="text-[48px] leading-none">😴</span>
                  <p
                    className="mt-4 text-center text-[16px] font-semibold"
                    style={{ color: "var(--ink)" }}
                  >
                    {t("home.no_tasks_title")}
                  </p>
                  <p
                    className="mt-1 text-center text-[14px] font-normal"
                    style={{ color: "var(--ink-subtle)" }}
                  >
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
                      className="relative flex w-full items-center gap-4"
                      style={{
                        padding: "16px 16px 16px 14px",
                        borderLeft: "2px solid #FCA5A5",
                        borderRadius: 22,
                        background: "#FEF2F2",
                        boxShadow:
                          "0 16px 32px -18px rgba(239,68,68,0.18), inset 0 1px 0 rgba(255,255,255,0.5)",
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          height: 44,
                          width: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 9999,
                          background:
                            "linear-gradient(135deg,#FEE2E2,#FECACA)",
                          fontSize: 22,
                        }}
                      >
                        ⚠️
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "var(--error-strong)",
                          }}
                        >
                          {task.title}
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--error-strong)",
                          }}
                        >
                          +{task.points} pt
                        </div>
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 9999,
                          background: "var(--error-strong)",
                          color: "var(--on-accent)",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
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
          <div style={{ padding: "24px 20px 0" }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("home.badges")}</CardTitle>
              </CardHeader>
              <CardContent>
                {earnedBadges.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--ink-subtle)" }}>
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
          <div
            className="flex justify-center"
            style={{ marginTop: 32, padding: "0 20px 40px" }}
          >
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
              <span style={{ fontSize: 16 }}>✨</span>
              <span
                className="text-base font-bold"
                style={{ letterSpacing: "-0.2px" }}
              >
                {t("home.beg_more")}
              </span>
              <span
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: "linear-gradient(135deg,#FF6B9D,#FFA07A)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
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

