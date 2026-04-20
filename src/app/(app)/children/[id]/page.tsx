import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BackButton, StatCard } from "@/components/atoms";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage } from "@/lib/level";
import { familyToday, formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import { getRank } from "@/features/children/rank";
import { t, type Locale } from "@/lib/i18n";
import { tileGrad } from "@/lib/tile-grad";
import { Section } from "@/components/organisms";

const ACCENT = "var(--accent)";

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

  const doneCount = taskList.filter((t) => t.status === "completed").length;

  function statusMeta(status: string) {
    if (status === "completed")
      return { dot: "var(--success)", text: "var(--ink)", strike: true, label: "+" };
    if (status === "overdue" || status === "pardoned")
      return { dot: "var(--error)", text: "var(--ink-subtle)", strike: false, label: "+" };
    return { dot: "#C7C7CC", text: "var(--ink)", strike: false, label: "+" };
  }

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",      }}
    >
      {/* Back */}
      <div
        style={{
          padding: "12px 20px 8px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <BackButton href="/" />
      </div>

      <div className="mx-auto max-w-md" style={{ padding: "4px 20px 28px" }}>
        {/* Hero */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: tileGrad(child.character_id, child.id),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 10px 24px -18px rgba(10,10,10,0.18)",
            }}
          >
            <span aria-hidden style={{ fontSize: 36, lineHeight: 1 }}>
              {characterEmoji(child.character_id, stage)}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {child.display_name}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "0 10px",
                borderRadius: 9999,
                background: ACCENT,
                color: "var(--on-accent)",
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              Lv.{child.level}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          <StatCard
            value={`${child.current_balance.toLocaleString()} pt`}
            label={t("children.current_points", locale)}
          />
          <StatCard
            value={`${doneCount}/${taskList.length}`}
            label={
              locale === "ko"
                ? "오늘 완료"
                : locale === "ja"
                  ? "今日完了"
                  : "Today"
            }
          />
          <StatCard
            value={`#${rank.rank}`}
            label={t("children.ranking", locale)}
          />
        </div>

        {/* Today's tasks */}
        <Section
          title={t("children.today_tasks", locale)}
          hint={`${doneCount}/${taskList.length}`}
        >
          {taskList.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-subtle)",
                padding: "10px 0",
                margin: 0,
              }}
            >
              {t("children.no_tasks_today", locale)}
            </p>
          ) : (
            <div>
              {taskList.map((task, i) => {
                const meta = statusMeta(task.status);
                return (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      height: 48,
                      borderBottom:
                        i === taskList.length - 1
                          ? "none"
                          : "1px solid var(--border)",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 9999,
                        background: meta.dot,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: meta.text,
                        letterSpacing: "-0.01em",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textDecoration: meta.strike ? "line-through" : "none",
                        textDecorationColor: "var(--ink-subtle)",
                      }}
                    >
                      {task.title}
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color:
                          task.status === "completed" ? "var(--success)" : "var(--ink)",
                        letterSpacing: "-0.01em",
                        fontFeatureSettings: '"tnum" 1',
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      +{task.points} pt
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
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-subtle)",
                padding: "10px 0",
                margin: 0,
              }}
            >
              {t("children.no_history", locale)}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 2px",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9999,
                        background: "var(--surface-sunken)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 14,
                      }}
                    >
                      <span aria-hidden>
                        {tx.kind === "penalty"
                          ? "😢"
                          : positive
                            ? "✨"
                            : "🎁"}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--ink)",
                          letterSpacing: "-0.01em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.kind === "adjustment" &&
                          `${t("children.adjustment", locale)} · `}
                        {tx.reason}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 400,
                          color: "var(--ink-subtle)",
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dateStr}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color:
                          tx.kind === "penalty" || tx.amount < 0
                            ? "var(--error)"
                            : "var(--success)",
                        letterSpacing: "-0.01em",
                        fontFeatureSettings: '"tnum" 1',
                        whiteSpace: "nowrap",
                        flexShrink: 0,
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
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-subtle)",
                padding: "10px 0",
                margin: 0,
              }}
            >
              {t("children.no_badges", locale)}
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              {badges.map((b) => (
                <div
                  key={b.badge_id}
                  style={{
                    padding: "12px 6px 10px",
                    borderRadius: 14,
                    background: "var(--surface-raised)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span aria-hidden style={{ fontSize: 30, lineHeight: 1 }}>
                    {b.badges?.icon}
                  </span>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                    }}
                  >
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


