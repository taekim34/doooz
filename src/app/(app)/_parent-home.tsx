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
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: "var(--surface-raised)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "var(--ink-subtle)",
          letterSpacing: "-0.02em",
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink-subtle)",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
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
        className="relative -mx-4 -mt-4 md:-mx-8 md:-mt-8 pb-8"
        style={{
          minHeight: "calc(100vh - 4rem)",
          background: "var(--bg)",
          color: "var(--ink)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              whiteSpace: "nowrap",
            }}
          >
            {todayLabel}
          </div>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {familyName}
          </h1>
        </div>

        {/* Stats — all zeros in gray */}
        <div
          style={{
            padding: "12px 20px 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          <EmptyStatCard label={t("home.pending_approvals", locale)} value="0" />
          <EmptyStatCard label={t("home.today_done", locale)} value="0" />
          <EmptyStatCard label={t("home.weekly_points", locale)} value="0" />
        </div>

        {/* Empty state — centered */}
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
            👨‍👩‍👧‍👦
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
            {t("home.no_children_title", locale)}
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
            {t("home.no_children_desc", locale)}
          </div>
        </div>

        {/* CTAs pinned to bottom */}
        <div
          style={{
            padding: "8px 20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Link
            href="/family/invite"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 10,
              background: "#FF6B6B",
              color: "var(--on-accent)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 24px -14px rgba(255,107,107,0.45)",
            }}
          >
            {t("home.view_invite_code", locale)}
          </Link>
          <Link
            href={"/signup" as Route}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 10,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
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
          <h1
            className="mt-1 text-[32px] font-extrabold leading-[1.2]"
            style={{
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
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
            value={`${streakDays}${locale === "ko" ? "일" : locale === "ja" ? "日" : "d"}`}
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
                  <span
                    className="text-[12px] font-bold uppercase tracking-[0.15em]"
                    style={{ color: "var(--ink-subtle)" }}
                  >
                    {t("home.section_approvals", locale)}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      height: 18,
                      minWidth: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 9999,
                      padding: "0 6px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      background: "var(--accent)",
                      fontFeatureSettings: '"tnum" 1',
                    }}
                  >
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
                className="flex h-12 items-center justify-center rounded-[10px] text-[15px] font-bold text-white"
                style={{
                  backgroundColor: "var(--ink)",
                  boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
                }}
              >
                {t("home.new_task", locale)}
              </Link>
              <Link
                href={"/points" as Route}
                className="flex h-12 items-center justify-center rounded-[10px] text-[15px] font-bold"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--ink)",
                }}
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
