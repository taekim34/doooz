import { FadeUp } from "@/components/ui/fade-up";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { StatCard } from "@/components/ui/stat-card";
import { KidRow } from "@/components/ui/kid-row";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getStage } from "@/lib/level";
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

export function ParentHome({
  familyName,
  locale,
  kids,
  tasks,
}: {
  familyName: string;
  locale: Locale;
  kids: Kid[];
  tasks: Task[];
}) {
  const totalTasks = tasks.length;
  const totalDone = tasks.filter((c) => c.status === "completed").length;
  const pendingApprovals = tasks.filter(
    (c) => c.status === "requested",
  ).length;

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8">
      {/* Header */}
      <FadeUp>
        <EyebrowLabel>
          {new Date().toLocaleDateString(
            locale === "ko"
              ? "ko-KR"
              : locale === "ja"
                ? "ja-JP"
                : "en-US",
            { month: "long", day: "numeric", weekday: "short" },
          )}
        </EyebrowLabel>
        <h1
          className="mt-1 text-2xl font-extrabold"
          style={{ color: "var(--ink)" }}
        >
          {familyName}
        </h1>
      </FadeUp>

      {/* Stats grid */}
      <FadeUp delay={80}>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label={t("home.total_tasks", locale)}
            value={totalTasks}
          />
          <StatCard label={t("home.completed", locale)} value={totalDone} />
          <StatCard
            label={t("home.pending_approvals", locale)}
            value={pendingApprovals}
          />
        </div>
      </FadeUp>

      {/* Kid list */}
      <FadeUp delay={160}>
        <div className="space-y-1">
          {kids.length === 0 && (
            <Card>
              <CardContent
                className="p-6 text-sm"
                style={{ color: "var(--muted)" }}
              >
                {t("home.no_children", locale)}{" "}
                <Link
                  href="/family/invite"
                  className="underline"
                  style={{ color: "var(--accent-color)" }}
                >
                  {t("home.invite_code", locale)}
                </Link>
              </CardContent>
            </Card>
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
      </FadeUp>

      {/* Quick actions */}
      <FadeUp delay={240}>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={"/tasks/manage" as Route}
            className={buttonVariants({ className: "w-full" })}
          >
            {t("home.new_task", locale)}
          </Link>
          <Link
            href={"/points" as Route}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            {t("home.report", locale)}
          </Link>
        </div>
      </FadeUp>
    </div>
  );
}
