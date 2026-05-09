import { TaskCheckbox } from "./_checkbox";
import { BegActions } from "./_beg-actions";
import { PenaltyForm } from "../children/[id]/_penalty-form";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

type Task = {
  id: string;
  title: string;
  points: number;
  status: string;
  due_date: string;
  assignee_id: string;
  template_id: string | null;
};

type Member = { id: string; display_name: string; role: string };

type GroupedChild = {
  member: Member;
  todayList: Task[];
  overdue: Task[];
  doneToday: Task[];
};

type Props = {
  locale: Locale;
  humanToday: string;
  doneCount: number;
  totalToday: number;
  requested: Task[];
  nameMap: Map<string, string>;
  grouped: GroupedChild[];
};

export function ParentTasks({
  locale,
  humanToday,
  doneCount,
  totalToday,
  requested,
  nameMap,
  grouped,
}: Props) {
  return (
    <div className="-m-4 md:-m-8 min-h-full bg-[color:var(--bg)] text-[color:var(--ink)]">
      {/* Header */}
      <header className="px-6 pt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[color:var(--ink)]">
          {t("tasks.title", locale)}
        </h1>
        <div className="mt-1 text-[13px] font-semibold text-[color:var(--ink-subtle)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
          {t("tasks.tab_today", locale)} · {humanToday}
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="mt-5 flex gap-6 border-b border-[color:var(--border)] px-6">
        <span
          className="cursor-default pb-2.5 text-[15px] font-semibold text-[color:var(--ink)] -mb-px border-b-2 border-[color:var(--accent)]"
        >
          {t("tasks.tab_today", locale)}
        </span>
        <Link
          href="/tasks/history"
          className="pb-2.5 text-[15px] font-semibold no-underline text-[color:var(--ink-subtle)] -mb-px border-b-2 border-transparent"
        >
          {t("tasks.tab_weekly", locale)}
        </Link>
        <Link
          href="/tasks/manage"
          className="pb-2.5 text-[15px] font-semibold no-underline text-[color:var(--ink-subtle)] -mb-px border-b-2 border-transparent"
        >
          {t("tasks.tab_template", locale)}
        </Link>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-2 px-6 py-4">
        <span className="text-[13px] font-bold text-[color:var(--accent)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
          {doneCount}/{totalToday}
        </span>
        <span className="text-[13px] font-medium text-[color:var(--ink-subtle)]">
          {t("tasks.completed", locale)}
        </span>
      </div>

      {/* Beg requests */}
      {requested.length > 0 && (
        <div className="px-6 pb-4">
          <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
            <h3 className="mb-3 text-[14px] font-bold text-[#D97706]">
              {t("tasks.beg_requests", locale)} ({requested.length})
            </h3>
            <div className="flex flex-col gap-3">
              {requested.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[12px] font-medium text-[color:var(--ink-subtle)]">{nameMap.get(c.assignee_id)}</span>
                    <span className="block truncate text-[14px] font-semibold text-[color:var(--ink)]">{c.title}</span>
                  </div>
                  <BegActions id={c.id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per-child sections */}
      <div className="px-6 pb-28">
        {grouped.map(({ member, todayList, overdue, doneToday }, gi) => {
          const childDone = doneToday.length;
          const childTotal = todayList.length + doneToday.length;
          const gradients = [
            "linear-gradient(135deg,#FFE4E9,#FFF5EC)",
            "linear-gradient(135deg,#E5EFFF,#FFE4E9)",
            "linear-gradient(135deg,#D1FAE5,#E5EFFF)",
          ];
          const avatars = ["🦊", "🐰", "🐻", "🐱", "🐶"];
          const grad = gradients[gi % gradients.length] ?? gradients[0];
          const avatar = avatars[gi % avatars.length] ?? avatars[0];

          return (
            <div key={member.id} className={gi === 0 ? "" : "mt-7"}>
              {/* Kid header */}
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-lg"
                  style={{ background: grad }}
                >
                  {avatar}
                </span>
                <span className="text-[14px] font-bold text-[color:var(--ink)]">
                  {member.display_name}
                </span>
                <span
                  className="whitespace-nowrap text-[12px] font-bold uppercase"
                  style={{
                    color: "var(--ink-subtle)",
                    letterSpacing: "0.15em",
                    fontFeatureSettings: '"tnum" 1',
                  }}
                >
                  {childDone}/{childTotal}
                  {overdue.length > 0 ? ` · ${t("tasks.missed_yesterday", locale)} ${overdue.length}` : ""}
                </span>
              </div>

              {/* Task rows */}
              <ul className="mt-2 list-none p-0">
                {todayList.length === 0 && overdue.length === 0 && doneToday.length === 0 && (
                  <li className="py-4 text-center text-[13px] text-[color:var(--ink-subtle)]">
                    {t("tasks.none", locale)}
                  </li>
                )}
                {[...todayList, ...overdue, ...doneToday].map((c, i, arr) => (
                  <li
                    key={c.id}
                    style={{
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <TaskCheckbox
                      id={c.id}
                      title={c.title}
                      points={c.points}
                      status={c.status}
                      canPardon={c.status !== "completed"}
                      isBeg={c.template_id === null}
                      variant="parent-row"
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-2">
                <PenaltyForm childId={member.id} />
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB — Add task */}
      <Link
        href="/tasks/manage"
        aria-label={t("tasks.new_task", locale)}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full border-none no-underline"
        style={{
          background: "var(--ink)",
          boxShadow: "0 14px 28px -8px rgba(10,10,10,0.45)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </Link>
    </div>
  );
}
