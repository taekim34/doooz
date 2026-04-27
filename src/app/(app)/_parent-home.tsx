import { FadeUp } from "@/components/molecules";
import { EyebrowLabel, SectionLabel, StatCard } from "@/components/atoms";
import { KidRow } from "@/components/molecules/kid-row";
import { ApprovalList } from "./_approval-list";
import { nowDate } from "@/lib/datetime/clock";
import { t, type Locale } from "@/lib/i18n";
import Link from "next/link";
import type { Route } from "next";

type Kid = {
  id: string;
  display_name: string;
  level: number;
  current_balance: number;
  lifetime_earned: number;
  character_id: string | null;
};

type Task = {
  id: string;
  assignee_id: string;
  title: string;
  points: number;
  status: string;
  template_id: string | null;
};

type Approval = {
  id: string;
  kidName: string;
  taskTitle: string;
  points: number;
  createdAt: string;
};


function EmptyStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[14px] bg-[color:var(--surface-raised)] p-3">
      <div className="text-[22px] font-extrabold tracking-[-0.02em] text-[color:var(--ink-subtle)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
        {value}
      </div>
      <div className="text-[11px] font-semibold tracking-[-0.01em] text-[color:var(--ink-subtle)] whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

export function ParentHome({
  familyName,
  locale,
  kids,
  tasks,
  approvals,
  weeklyPoints,
  streakDays,
}: {
  familyName: string;
  locale: Locale;
  kids: Kid[];
  tasks: Task[];
  approvals: Approval[];
  weeklyPoints: number;
  streakDays: number;
}) {
  const totalTasks = tasks.length;
  const totalDone = tasks.filter((c) => c.status === "completed").length;

  // Empty state — no kids yet.
  if (kids.length === 0) {
    const todayLabel = nowDate().toLocaleDateString(
      locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US",
      { month: "long", day: "numeric", weekday: "long" },
    );
    return (
      <div
        className="relative -mx-4 -mt-4 flex min-h-[calc(100vh-4rem)] flex-col bg-[color:var(--bg)] pb-8 text-[color:var(--ink)] md:-mx-8 md:-mt-8"
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-2">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--ink-subtle)] whitespace-nowrap">
            {todayLabel}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
            {familyName}
          </h1>
        </div>

        {/* Stats — all zeros in gray */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-3">
          <EmptyStatCard label={t("home.pending_approvals", locale)} value="0" />
          <EmptyStatCard label={t("home.today_done", locale)} value="0" />
          <EmptyStatCard label={t("home.weekly_points", locale)} value="0" />
        </div>

        {/* Empty state — centered */}
        <div className="flex flex-1 flex-col items-center justify-center px-7 py-5 text-center">
          <div aria-hidden className="mb-3 text-[48px] leading-none">
            👨‍👩‍👧‍👦
          </div>
          <div className="mb-1.5 text-base font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
            {t("home.no_children_title", locale)}
          </div>
          <div className="text-sm font-normal leading-normal tracking-[-0.01em] text-[color:var(--ink-subtle)]">
            {t("home.no_children_desc", locale)}
          </div>
        </div>

        {/* CTAs pinned to bottom */}
        <div className="flex flex-col gap-2 px-5 pt-2 pb-6">
          <Link
            href="/family/invite"
            className="flex h-12 w-full items-center justify-center rounded-[10px] text-[15px] font-bold tracking-[-0.01em] text-[color:var(--on-accent)]"
            style={{
              background: "#FF6B6B",
              boxShadow: "0 10px 24px -14px rgba(255,107,107,0.45)",
            }}
          >
            {t("home.view_invite_code", locale)}
          </Link>
          <Link
            href={"/signup" as Route}
            className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] text-[15px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]"
          >
            {t("home.create_child_account", locale)}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-lg pb-8 lg:max-w-5xl"
      style={{ fontFeatureSettings: '"tnum" 1' }}
    >
      {/* Header — spans full width on lg */}
      <FadeUp>
        <div className="px-6 pb-7 pt-8">
          <EyebrowLabel>
            {nowDate().toLocaleDateString(
              locale === "ko"
                ? "ko-KR"
                : locale === "ja"
                  ? "ja-JP"
                  : "en-US",
              { month: "long", day: "numeric", weekday: "short" },
            )}
          </EyebrowLabel>
          <h1 className="mt-1 text-[32px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[color:var(--ink)]">
            {familyName}
          </h1>
        </div>
      </FadeUp>

      {/* Stats grid — 3 columns */}
      <FadeUp delay={80}>
        <div className="grid grid-cols-3 gap-2 px-6">
          <StatCard
            label={t("home.today_done", locale)}
            value={`${totalDone}/${totalTasks}`}
          />
          <StatCard
            label={t("home.weekly_points", locale)}
            value={weeklyPoints.toLocaleString()}
          />
          <StatCard
            label={t("home.streak", locale)}
            value={`${streakDays}${t("common.day_suffix", locale)}`}
          />
        </div>
      </FadeUp>

      {/* Two-column grid on lg+ */}
      <div className="lg:grid lg:grid-cols-[1.35fr_1fr] lg:gap-7">
        {/* LEFT column — main content */}
        <div>
          {/* Kid list */}
          <FadeUp delay={160}>
            <div className="px-6">
              <SectionLabel>{t("home.section_kids", locale)}</SectionLabel>
              <div className="space-y-1">
                {kids.map((k) => {
                  const kidTasks = tasks.filter((c) => c.assignee_id === k.id);
                  const done = kidTasks.filter(
                    (c) => c.status === "completed",
                  ).length;
                  return (
                    <KidRow
                      key={k.id}
                      href={`/children/${k.id}`}
                      characterId={k.character_id ?? ""}
                      name={k.display_name}
                      level={k.level}
                      progress={kidTasks.length > 0 ? Math.round((done / kidTasks.length) * 100) : 0}
                      completedCount={done}
                      totalCount={kidTasks.length}
                    />
                  );
                })}
              </div>
            </div>
          </FadeUp>
        </div>

        {/* RIGHT column — sidebar (sticky on lg+) */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {/* Approval section */}
          {approvals.length > 0 && (
            <FadeUp delay={200}>
              <div className="px-6">
                <div className="flex items-center gap-2 py-3">
                  <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-[color:var(--ink-subtle)]">
                    {t("home.section_approvals", locale)}
                  </span>
                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 text-[11px] font-bold text-white" style={{ fontFeatureSettings: '"tnum" 1' }}>
                    {approvals.length}
                  </span>
                </div>
                <ApprovalList approvals={approvals} />
              </div>
            </FadeUp>
          )}

          {/* Quick actions */}
          <FadeUp delay={240}>
            <div className="mt-6 grid grid-cols-2 gap-2 px-6">
              <Link
                href={"/tasks/manage" as Route}
                className="flex h-12 items-center justify-center rounded-[10px] bg-[color:var(--ink)] text-[15px] font-bold text-white"
                style={{
                  boxShadow: "var(--shadow-card-parent)",
                }}
              >
                {t("home.new_task", locale)}
              </Link>
              <Link
                href={"/points" as Route}
                className="flex h-12 items-center justify-center rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] text-[15px] font-bold text-[color:var(--ink)]"
              >
                {t("home.report", locale)}
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </div>
  );
}
