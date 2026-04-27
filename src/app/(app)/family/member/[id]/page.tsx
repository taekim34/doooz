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
    <div className="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--ink)]">
      {/* Back */}
      <div className="flex items-center px-5 pt-3 pb-2">
        <BackButton href="/family" />
      </div>

      <div className="mx-auto max-w-md px-5 pt-1 pb-7">
        {/* Hero */}
        <div className="mb-[18px] flex items-center gap-3.5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: tileGrad(member.character_id, member.id),
              boxShadow: "0 10px 24px -18px rgba(10,10,10,0.18)",
            }}
          >
            <span aria-hidden className="text-[36px] leading-none">
              {characterEmoji(member.character_id, stage)}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <h1 className="m-0 whitespace-nowrap text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
              {member.display_name}
            </h1>
            <span className="inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full bg-[color:var(--accent)] px-[9px] text-[11px] font-extrabold tracking-[-0.01em] text-[color:var(--on-accent)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
              Lv.{member.level}
            </span>
            <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-[color:var(--surface-sunken)] px-2 text-xs font-semibold tracking-[-0.01em] text-[color:var(--ink-subtle)]">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Stats 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            value={`${member.current_balance.toLocaleString()} pt`}
            label={t("points.current", locale)}
          />
          <StatCard
            value={`${member.lifetime_earned.toLocaleString()} pt`}
            label={t("points.lifetime", locale)}
          />
          <StatCard
            value={`${activeDays}${t("common.day_suffix", locale)}`}
            label={t("member.active_days", locale)}
          />
          <StatCard value={joinDate} label={t("member.join_date", locale)} />
        </div>

        {/* Transactions */}
        <Section title={t("points.history", locale)}>
          {txList.length === 0 ? (
            <p className="m-0 py-2.5 text-[13px] text-[color:var(--ink-subtle)]">
              {t("points.no_history", locale)}
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {txList.map((tx) => {
                const isZero = tx.amount === 0;
                const positive = tx.amount > 0;
                const amountColor = isZero
                  ? "var(--ink-subtle)"
                  : positive
                    ? "var(--success)"
                    : "var(--error)";
                const amountText = isZero
                  ? t("common.approved", locale)
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
                        {tx.reason}
                      </div>
                      <div className="whitespace-nowrap text-xs font-normal tracking-[-0.01em] text-[color:var(--ink-subtle)]">
                        {dateStr}
                      </div>
                    </div>
                    <span
                      className="shrink-0 whitespace-nowrap text-sm font-bold tracking-[-0.01em]"
                      style={{
                        color: amountColor,
                        fontFeatureSettings: '"tnum" 1',
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
            <p className="m-0 py-2.5 text-[13px] text-[color:var(--ink-subtle)]">
              {t("home.no_badges", locale)}
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

        {/* Reset password (parent viewing child only) */}
        {currentUser.role === "parent" && isChild && (
          <div className="mt-5 text-center">
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
