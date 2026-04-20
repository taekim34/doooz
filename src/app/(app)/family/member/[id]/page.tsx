import { notFound } from "next/navigation";
import Link from "next/link";
import { BackButton, SectionLabel, StatCard } from "@/components/atoms";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage } from "@/lib/level";
import { formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import { ResetPasswordButton } from "@/app/(app)/family/member/_reset-password";
import { t, type Locale } from "@/lib/i18n";
import { tileGrad } from "@/lib/tile-grad";
import { Section } from "@/components/organisms";

const ACCENT = "var(--accent)";

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
  const { user: currentUser, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;

  const supabase = await createClient();
  const { data: memberRow } = await supabase
    .from("users")
    .select(
      "id, family_id, role, display_name, character_id, current_balance, lifetime_earned, level, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  const member = memberRow as MemberRow | null;
  if (!member || member.family_id !== family.id) notFound();

  const stage = getStage(member.level);
  const isChild = member.role === "child";

  const [txsRes, badgesRes, statsRes] = await Promise.all([
    supabase
      .from("point_transactions")
      .select("id, amount, reason, kind, created_at, task_instances(due_date)")
      .eq("user_id", member.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("user_badges")
      .select("badge_id, earned_at, badges(name, icon)")
      .eq("user_id", member.id)
      .order("earned_at", { ascending: false }),
    isChild
      ? supabase
          .from("task_instances")
          .select("id, status, due_date")
          .eq("assignee_id", member.id)
          .eq("status", "completed")
          .not("template_id", "is", null)
      : { data: null },
  ]);

  const txList = (txsRes.data ?? []) as Array<{
    id: string;
    amount: number;
    reason: string;
    kind: string;
    created_at: string;
    task_instances: { due_date: string } | null;
  }>;
  const badges = (badgesRes.data ?? []) as Array<{
    badge_id: string;
    badges: { name: string; icon: string | null } | null;
  }>;
  const completedTasks = (statsRes.data ?? []) as Array<{
    id: string;
    due_date: string;
  }>;

  const activeDays = new Set(completedTasks.map((c) => c.due_date)).size;
  const joinDate = formatDateInFamilyTz(
    member.created_at,
    family.timezone,
    "yyyy.MM.dd",
  );

  const roleLabel =
    member.role === "parent"
      ? t("family.role_parent", locale)
      : t("family.role_child", locale);

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
        <BackButton href="/family" />
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
              background: tileGrad(member.character_id, member.id),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 10px 24px -18px rgba(10,10,10,0.18)",
            }}
          >
            <span aria-hidden style={{ fontSize: 36, lineHeight: 1 }}>
              {characterEmoji(member.character_id, stage)}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
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
              }}
            >
              {member.display_name}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 22,
                padding: "0 9px",
                borderRadius: 9999,
                background: ACCENT,
                color: "var(--on-accent)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              Lv.{member.level}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 22,
                padding: "0 8px",
                borderRadius: 9999,
                background: "var(--surface-sunken)",
                color: "var(--ink-subtle)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Stats 2x2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <StatCard
            value={`${member.current_balance.toLocaleString()} pt`}
            label={t("points.current", locale)}
          />
          <StatCard
            value={`${member.lifetime_earned.toLocaleString()} pt`}
            label={t("points.lifetime", locale)}
          />
          <StatCard
            value={`${activeDays}${locale === "ko" ? "일" : locale === "ja" ? "日" : "d"}`}
            label={t("member.active_days", locale)}
          />
          <StatCard value={joinDate} label={t("member.join_date", locale)} />
        </div>

        {/* Transactions */}
        <Section title={t("points.history", locale)}>
          {txList.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-subtle)",
                padding: "10px 0",
                margin: 0,
              }}
            >
              {t("points.no_history", locale)}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {txList.map((tx) => {
                const isZero = tx.amount === 0;
                const positive = tx.amount > 0;
                const amountColor = isZero
                  ? "var(--ink-subtle)"
                  : positive
                    ? "var(--success)"
                    : "var(--error)";
                const amountText = isZero
                  ? locale === "ko"
                    ? "승인"
                    : locale === "ja"
                      ? "承認"
                      : "Approved"
                  : (positive ? "+" : "") +
                    tx.amount.toLocaleString() +
                    " pt";
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
                        color: amountColor,
                        letterSpacing: "-0.01em",
                        fontFeatureSettings: '"tnum" 1',
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {amountText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Badges */}
        <Section
          title={t("characters.badges", locale)}
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
              {t("home.no_badges", locale)}
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

        {/* Reset password (parent viewing child only) */}
        {currentUser.role === "parent" && isChild && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <ResetPasswordButton
              userId={member.id}
              memberName={member.display_name}
            />
          </div>
        )}
      </div>
    </div>
  );
}


