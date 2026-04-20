"use client";

import { useState, useMemo } from "react";
import { useT } from "@/lib/i18n/useT";
import { TaskCheckbox } from "./_checkbox";

type TaskItem = {
  id: string;
  title: string;
  points: number;
  status: string;
  readOnly?: boolean;
  isBeg?: boolean;
  trailing?: string;
};

type Props = {
  tasks: TaskItem[];
  todayDone: number;
  todayTotal: number;
};

export function KidTaskList({ tasks, todayDone, todayTotal }: Props) {
  const t = useT();
  const [filter, setFilter] = useState<"all" | "undone" | "done">("all");

  const filtered = useMemo(() => {
    if (filter === "undone") return tasks.filter((t) => t.status !== "completed" && t.status !== "pardoned");
    if (filter === "done") return tasks.filter((t) => t.status === "completed" || t.status === "pardoned");
    return tasks;
  }, [filter, tasks]);

  const pct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const filters = [
    { key: "all" as const, label: t("tasks.filter_all") },
    { key: "undone" as const, label: t("tasks.filter_undone") },
    { key: "done" as const, label: t("tasks.filter_done") },
  ];

  return (
    <div>
      {/* Sticky header with progress */}
      <div className="sticky top-0 z-10 px-5 pb-3 pt-4"
        style={{
          background: "linear-gradient(180deg, rgba(255,245,236,0.95) 0%, rgba(255,245,236,0.7) 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.3px" }}>
            {t("tasks.today")}
          </h2>
          <div className="flex items-center gap-1.5 whitespace-nowrap" style={{ fontFeatureSettings: '"tnum" 1' }}>
            <span className="text-[13px] font-bold" style={{ color: "#FF6B9D" }}>
              {todayDone}/{todayTotal}
            </span>
            <span className="text-[13px] font-medium" style={{ color: "rgba(45,27,61,0.55)" }}>
              {t("tasks.completed")}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(45,27,61,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-base ease-spring"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg,#FF6B9D,#FFA07A)",
              boxShadow: "0 0 8px rgba(255,107,157,0.5)",
            }}
          />
        </div>

        {/* Filter chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          {filters.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="shrink-0 whitespace-nowrap rounded-full text-[13px] font-semibold"
                style={{
                  padding: "6px 14px",
                  border: on ? "none" : "1px solid rgba(45,27,61,0.12)",
                  background: on ? "linear-gradient(90deg,#FF6B9D,#FFA07A)" : "rgba(255,255,255,0.7)",
                  color: on ? "var(--on-accent)" : "var(--ink)",
                  boxShadow: on ? "0 6px 14px -4px rgba(255,107,157,0.45)" : "none",
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <ul className="flex flex-col gap-3 px-5 pb-32 pt-1" style={{ listStyle: "none", margin: 0 }}>
        {filtered.length === 0 && (
          <li className="py-8 text-center text-sm" style={{ color: "rgba(45,27,61,0.4)" }}>
            {t("tasks.no_today")}
          </li>
        )}
        {filtered.map((task, i) => (
          <li
            key={task.id}
            className="animate-dzTlRise"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <TaskCheckbox
              id={task.id}
              title={task.title}
              points={task.points}
              status={task.status}
              readOnly={task.readOnly}
              isBeg={task.isBeg}
              trailing={task.trailing}
              variant="kid-card"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
