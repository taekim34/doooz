import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BackButton, StatCard } from "@/components/atoms";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { CharacterIcon } from "@/components/molecules/character-icon";
import { getStage } from "@/lib/level";
import { familyToday, formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import { getRank } from "@/features/children/rank";
import { t, type Locale } from "@/lib/i18n";
import { formatPointsReason } from "@/features/points/format-reason";
import { tileGrad } from "@/lib/tile-grad";
import { Section } from "@/components/organisms";
import { PenaltyForm } from "./_penalty-form";

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
  const [{ data: tasks }, { data: txs }, { data: earnedBadges }] =
    await Promise.all([
      supabase
        .from("task_instances")
        .select("id, title, points, status")
        .eq("assignee_id", child.id)
        .eq("due_date", today)
        .order("created_at"),
      supabase
        .from("point_transactions")
        .select(
          "id, amount, reason, kind, created_at, task_instances(due_date)",
        )
        .eq("user_id", child.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("user_badges")
        .select("badge_id, earned_at, badges(name, icon)")
        .eq("user_id", child.id)
        .order("earned_at", { ascending: false }),
    ]);

  const rank = await getRank(child.id, family.id);
  const stage = getStage(child.level);

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

  const nonPenaltyTasks = taskList.filter((t) => t.status !== "penalty");
  const doneCount = nonPenaltyTasks.filter((t) => t.status === "completed").length;

  function statusMeta(status: string) {
    if (status === "completed")
      return { dot: "var(--success)", text: "var(--ink)", strike: true };
    if (status === "penalty")
      return { dot: "var(--error)", text: "var(--error)", strike: false };
    if (status === "overdue" || status === "pardoned")
      return { dot: "var(--error)", text: "var(--ink-subtle)", strike: false };
    return { dot: "#C7C7CC", text: "var(--ink)", strike: false };
  }

  return (
    <div className="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--ink)]">
      {/* Back */}
      <div className="flex items-center px-5 pt-3 pb-2">
        <BackButton href="/" />
      </div>

      <div className="mx-auto max-w-md px-5 pt-1 pb-7">
        {/* Hero */}
        <div className="mb-[18px] flex items-center gap-3.5">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: tileGrad(child.character_id, child.id),
              boxShadow: "0 10px 24px -18px rgba(10,10,10,0.18)",
            }}
          >
            <CharacterIcon
              id={child.character_id}
              stage={stage}
              pixelSize={84}
            />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="m-0 truncate text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
              {child.display_name}
            </h1>
            <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full bg-[color:var(--accent)] px-2.5 text-[11.5px] font-extrabold tracking-[-0.01em] text-[color:var(--on-accent)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
              Lv.{child.level}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            value={`${child.current_balance.toLocaleString()} pt`}
            label={t("children.current_points", locale)}
          />
          <StatCard
            value={`${doneCount}/${nonPenaltyTasks.length}`}
            label={t("children.today_complete", locale)}
          />
          <StatCard
            value={`#${rank.rank}`}
            label={t("children.ranking", locale)}
          />
        </div>

        {/* Penalty */}
        <div className="flex justify-end">
          <PenaltyForm childId={child.id} />
        </div>

        {/* Today's tasks */}
        <Section
          title={t("children.today_tasks", locale)}
          hint={`${doneCount}/${nonPenaltyTasks.length}`}
        >
          {taskList.length === 0 ? (
            <p className="m-0 py-2.5 text-[13px] text-[color:var(--ink-subtle)]">
              {t("children.no_tasks_today", locale)}
            </p>
          ) : (
            <div>
              {taskList.map((task, i) => {
                const meta = statusMeta(task.status);
                return (
                  <div
                    key={task.id}
                    className="flex h-12 items-center gap-2.5"
                    style={{
                      borderBottom:
                        i === taskList.length - 1
                          ? "none"
                          : "1px solid var(--border)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: meta.dot }}
                    />
                    <div
                      className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.01em]"
                      style={{
                        color: meta.text,
                        textDecoration: meta.strike ? "line-through" : "none",
                        textDecorationColor: "var(--ink-subtle)",
                      }}
                    >
                      {task.title}
                    </div>
                    <span
                      className="shrink-0 whitespace-nowrap text-sm font-bold tracking-[-0.01em]"
                      style={{
                        color:
                          task.status === "penalty" ? "var(--error)" : task.status === "completed" ? "var(--success)" : "var(--ink)",
                        fontFeatureSettings: '"tnum" 1',
                      }}
                    >
                      {task.points < 0 ? task.points : `+${task.points}`} pt
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Transactions */}
        <Section title={t("children.recent_points", locale)}>
          {txList.length === 0 ? (
            <p className="m-0 py-2.5 text-[13px] text-[color:var(--ink-subtle)]">
              {t("children.no_history", locale)}
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {txList.map((tx) => {
                const positive = tx.amount > 0;
                const dateStr =
                  tx.task_instances?.due_date ??
                  formatDateInFamilyTz(
                    tx.created_at,
                    family.timezone,
                    "MM-dd",
                  );
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-2.5 px-0.5 py-2.5"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-sunken)] text-sm">
                      <span aria-hidden>
                        {tx.kind === "penalty"
                          ? "😢"
                          : positive
                            ? "✨"
                            : "🎁"}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-px">
                      <div className="truncate text-sm font-medium tracking-[-0.01em] text-[color:var(--ink)]">
                        {(() => {
                          const r = formatPointsReason(tx.reason, locale);
                          const isCode = r !== tx.reason;
                          return (
                            <>
                              {tx.kind === "adjustment" && !isCode &&
                                `${t("children.adjustment", locale)} · `}
                              {r}
                            </>
                          );
                        })()}
                      </div>
                      <div className="whitespace-nowrap text-xs font-normal tracking-[-0.01em] text-[color:var(--ink-subtle)]">
                        {dateStr}
                      </div>
                    </div>
                    <span
                      className="shrink-0 whitespace-nowrap text-sm font-bold tracking-[-0.01em]"
                      style={{
                        color:
                          tx.kind === "penalty" || tx.amount < 0
                            ? "var(--error)"
                            : "var(--success)",
                        fontFeatureSettings: '"tnum" 1',
                      }}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount.toLocaleString()} pt
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Badges */}
        <Section
          title={t("children.badges", locale)}
          hint={`${badges.length}`}
        >
          {badges.length === 0 ? (
            <p className="m-0 py-2.5 text-[13px] text-[color:var(--ink-subtle)]">
              {t("children.no_badges", locale)}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {badges.map((b) => (
                <div
                  key={b.badge_id}
                  className="flex flex-col items-center gap-1.5 rounded-[14px] bg-[color:var(--surface-raised)] px-1.5 pt-3 pb-2.5"
                >
                  <span aria-hidden className="text-[30px] leading-none">
                    {b.badges?.icon}
                  </span>
                  <div className="w-full truncate text-center text-[11px] font-medium tracking-[-0.01em] text-[color:var(--ink)]">
                    {b.badges?.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
