"use client";

import { TaskCheckbox } from "./_checkbox";
import { BegForm } from "./_beg-form";
import { BegCancelButton } from "./_beg-cancel";
import { BegFab } from "./_beg-fab";
import { KidTaskList } from "./_kid-task-list";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

type TaskItem = {
  id: string;
  title: string;
  points: number;
  status: string;
  readOnly: boolean;
  isBeg: boolean;
};

type UpcomingTask = {
  id: string;
  title: string;
  points: number;
  status: string;
  due_date: string;
  trailing: string;
};

type RequestTask = {
  id: string;
  title: string;
};

type OverdueTask = {
  id: string;
  title: string;
  points: number;
  status: string;
};

type Props = {
  allTaskItems: TaskItem[];
  todayDone: number;
  todayTotal: number;
  upcoming: UpcomingTask[];
  yesterdayOverdue: OverdueTask[];
  myPending: RequestTask[];
  myRejected: RequestTask[];
  myApproved: RequestTask[];
  locale: Locale;
};

export function KidTasks({
  allTaskItems,
  todayDone,
  todayTotal,
  upcoming,
  yesterdayOverdue,
  myPending,
  myRejected,
  myApproved,
  locale,
}: Props) {
  const hasRequests = myPending.length > 0 || myRejected.length > 0 || myApproved.length > 0;

  return (
    <div className="-m-4 md:-m-8 min-h-full">
      {/* Decorative blur orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full opacity-40"
        style={{
          filter: "blur(48px)",
          background: "radial-gradient(circle,#FFB4C6 0%, transparent 70%)",
        }}
      />

      {/* Main filtered task list with sticky header */}
      <KidTaskList
        tasks={allTaskItems}
        todayDone={todayDone}
        todayTotal={todayTotal}
      />

      {/* Yesterday overdue section */}
      {yesterdayOverdue.length > 0 && (
        <div className="px-5 pb-4">
          <h3 className="mb-3 text-[15px] font-bold text-red-600">
            {t("tasks.missed_yesterday", locale)}
          </h3>
          <div className="flex flex-col gap-3">
            {yesterdayOverdue.map((c) => (
              <TaskCheckbox
                key={c.id}
                id={c.id}
                title={c.title}
                points={c.points}
                status={c.status}
                readOnly
                variant="kid-card"
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <div className="px-5 pb-4">
          <h3 className="mb-3 text-[15px] font-bold text-[color:var(--ink)]">
            {t("tasks.upcoming", locale)}
          </h3>
          <div className="flex flex-col gap-3">
            {upcoming.map((c) => (
              <TaskCheckbox
                key={c.id}
                id={c.id}
                title={c.title}
                points={c.points}
                status={c.status}
                trailing={c.trailing}
                variant="kid-card"
              />
            ))}
          </div>
        </div>
      )}

      {/* Beg form — card style */}
      <div className="px-5 pb-4" id="beg-form-section">
        <div className="rounded-[22px] bg-white p-4"
          style={{
            boxShadow: "0 12px 28px -18px rgba(45,27,61,0.1), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 1.5px rgba(156,163,175,0.2)",
          }}
        >
          <h3 className="mb-1 text-[15px] font-bold text-[color:var(--ink)]">
            {t("tasks.beg_title", locale)}
          </h3>
          <p className="mb-3 text-[12px] text-[rgba(45,27,61,0.5)]">
            {t("tasks.beg_desc", locale)}
          </p>
          <BegForm />
        </div>
      </div>

      {/* My Requests */}
      {hasRequests && (
        <div className="px-5 pb-4">
          <h3 className="mb-3 text-[15px] font-bold text-[color:var(--ink)]">
            {t("tasks.my_requests", locale)}
          </h3>
          <div className="flex flex-col gap-2">
            {myPending.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl bg-white p-3"
                style={{
                  boxShadow: "0 12px 28px -18px rgba(45,27,61,0.1), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 1.5px rgba(245,158,11,0.3)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ background: "var(--gradient-warning)" }}
                  >⏳</span>
                  <span className="text-[14px] font-semibold text-[color:var(--ink)]">{c.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-[color:var(--warning-bg)] text-[#D97706]"
                  >
                    {t("tasks.beg_waiting", locale)}
                  </span>
                  <BegCancelButton id={c.id} />
                </div>
              </div>
            ))}
            {myRejected.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl bg-white p-3"
                style={{
                  boxShadow: "0 12px 28px -18px rgba(45,27,61,0.1), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 1.5px rgba(239,68,68,0.25)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ background: "linear-gradient(135deg,#FEE2E2,#F3F4F6)" }}
                  >❌</span>
                  <span className="text-[14px] font-semibold text-[rgba(45,27,61,0.5)]">{c.title}</span>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-[color:var(--error-bg)] text-[color:var(--error-strong)]"
                >
                  {t("tasks.beg_failed", locale)}
                </span>
              </div>
            ))}
            {myApproved.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl bg-white p-3"
                style={{
                  boxShadow: "0 12px 28px -18px rgba(45,27,61,0.1), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 0 1.5px rgba(16,185,129,0.3)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                    style={{ background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)" }}
                  >✅</span>
                  <span className="text-[14px] font-semibold text-[color:var(--ink)]">{c.title}</span>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold bg-[color:var(--success-bg)] text-[#059669]"
                >
                  {t("tasks.beg_approved", locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History link — small text link to review past records */}
      <div className="flex justify-center pb-32">
        <Link
          href="/tasks/history"
          className="text-[13px] font-semibold underline text-[rgba(45,27,61,0.45)]"
        >
          {t("tasks.history", locale)}
        </Link>
      </div>

      {/* FAB — triggers the Beg flow (scrolls to beg form) */}
      <BegFab label={t("tasks.beg_more", locale)} targetId="beg-form-section" />
    </div>
  );
}
