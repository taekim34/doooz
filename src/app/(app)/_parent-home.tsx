import { FadeUp } from "@/components/ui/fade-up";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { SectionLabel } from "@/components/ui/section-label";
import { StatCard } from "@/components/ui/stat-card";
import { KidRow } from "@/components/ui/kid-row";
import { ApprovalList } from "./_approval-list";
import { getStage } from "@/lib/level";
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

  return (
    <div
      className="mx-auto max-w-lg pb-8"
      style={{ fontFeatureSettings: '"tnum" 1' }}
    >
      {/* Header */}
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

      {/* Kid list */}
      <FadeUp delay={160}>
        <div className="px-6">
          <SectionLabel>{t("home.section_kids", locale)}</SectionLabel>
          <div className="space-y-1">
            {kids.length === 0 && (
              <div
                className="rounded-[14px] p-6 text-sm"
                style={{
                  background: "var(--card)",
                  color: "var(--muted)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {t("home.no_children", locale)}{" "}
                <Link
                  href="/family/invite"
                  className="underline"
                  style={{ color: "var(--accent-color)" }}
                >
                  {t("home.invite_code", locale)}
                </Link>
              </div>
            )}
            {kids.map((k) => {
              const kidTasks = tasks.filter((c) => c.assignee_id === k.id);
              const done = kidTasks.filter(
                (c) => c.status === "completed",
              ).length;
              return (
                <KidRow
                  key={k.id}
                  href={`/children/${k.id}`}
                  characterId={k.character_id}
                  stage={getStage(k.level)}
                  name={k.display_name}
                  level={k.level}
                  done={done}
                  total={kidTasks.length}
                />
              );
            })}
          </div>
        </div>
      </FadeUp>

      {/* Approval section */}
      {approvals.length > 0 && (
        <FadeUp delay={200}>
          <div className="px-6">
            <SectionLabel>{t("home.section_approvals", locale)}</SectionLabel>
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
            style={{ backgroundColor: "#0A0A0A" }}
          >
            {t("home.new_task", locale)}
          </Link>
          <Link
            href={"/points" as Route}
            className="flex h-12 items-center justify-center rounded-[10px] text-[15px] font-bold"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E5E5",
              color: "#0A0A0A",
            }}
          >
            {t("home.report", locale)}
          </Link>
        </div>
      </FadeUp>
    </div>
  );
}
