"use client";

/**
 * Chore template create form (v2 spec #1, #5, #7).
 *
 * - Points quick-pick: [50][100][150][custom]. Default 100.
 * - Assignee dropdown filtered to children only.
 * - Recurrence radio [once / repeat].
 *     once → single deadline date
 *     repeat → start_date + optional end_date + weekday chips (Sun-Sat)
 * - On submit emits a JSON `recurrence` field matching the jsonb shape.
 */

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";

type Child = { id: string; display_name: string };

type Props = {
  childrenList: Child[];
  todayLocal: string;
  createAction: (formData: FormData) => Promise<void>;
};

const QUICK_POINTS: ReadonlyArray<number> = [50, 100, 150];
// WEEKDAY_LABELS derived from i18n inside the component via t("common.weekdays")

export function CreateChoreForm({ childrenList, todayLocal, createAction }: Props) {
  const t = useT();
  const WEEKDAY_LABELS = t("common.weekdays").split(",");
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState(childrenList[0]?.id ?? "");
  const [quickPoints, setQuickPoints] = useState<number | "custom">(100);
  const [customPoints, setCustomPoints] = useState<number>(100);
  const [mode, setMode] = useState<"once" | "weekly">("weekly");
  const [deadline, setDeadline] = useState<string>(todayLocal);
  const [startDate, setStartDate] = useState<string>(todayLocal);
  const [endDate, setEndDate] = useState<string>("");
  const [days, setDays] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();

  const pointsValue = useMemo(() => {
    if (quickPoints === "custom") return customPoints;
    return quickPoints;
  }, [quickPoints, customPoints]);

  const hasChildren = childrenList.length > 0;

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  function onSubmit(fd: FormData) {
    // Client-side guards
    if (!hasChildren) {
      toast.error(t("chores.error_no_children"));
      return;
    }
    if (!title.trim()) {
      toast.error(t("chores.error_no_title"));
      return;
    }
    if (!assigneeId) {
      toast.error(t("chores.error_no_assignee"));
      return;
    }
    if (!Number.isFinite(pointsValue) || pointsValue < 1 || pointsValue > 10000) {
      toast.error(t("chores.error_points_range"));
      return;
    }
    if (mode === "weekly" && days.length === 0) {
      toast.error(t("chores.error_no_days"));
      return;
    }
    if (mode === "once" && !deadline) {
      toast.error(t("chores.error_no_deadline"));
      return;
    }

    const recurrence =
      mode === "once"
        ? { kind: "once" as const, due_date: deadline }
        : { kind: "weekly" as const, days };

    // Sanitize FormData then re-set the fields we control.
    fd.set("title", title.trim());
    fd.set("assignee_id", assigneeId);
    fd.set("points", String(pointsValue));
    fd.set("recurrence", JSON.stringify(recurrence));
    if (mode === "once") {
      fd.set("start_date", todayLocal);
      fd.set("end_date", deadline);
    } else {
      fd.set("start_date", startDate || todayLocal);
      if (endDate) fd.set("end_date", endDate);
      else fd.delete("end_date");
    }

    startTransition(async () => {
      try {
        await createAction(fd);
        setTitle("");
        setDays([]);
      } catch (e) {
        toast.error((e as Error).message || t("chores.error_save_failed"));
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t("chores.title_label")}</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("chores.title_placeholder")}
          required
        />
      </div>

      {/* Points quick-pick */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t("chores.points_label")}</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_POINTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setQuickPoints(p)}
              className={`rounded-md border px-3 py-2 text-sm transition ${
                quickPoints === p
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {p}pt
            </button>
          ))}
          <button
            type="button"
            onClick={() => setQuickPoints("custom")}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              quickPoints === "custom"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {t("chores.custom_input")}
          </button>
          {quickPoints === "custom" && (
            <Input
              type="number"
              min={1}
              max={10000}
              value={customPoints}
              onChange={(e) => setCustomPoints(Number(e.target.value))}
              className="w-32"
            />
          )}
        </div>
      </div>

      {/* Assignee (children only) */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t("chores.assignee_label")}</label>
        {hasChildren ? (
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="h-10 w-full rounded-md border px-3 text-sm"
            required
          >
            {childrenList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.display_name}
              </option>
            ))}
          </select>
        ) : (
          <select
            disabled
            className="h-10 w-full rounded-md border px-3 text-sm text-muted-foreground"
          >
            <option>{t("chores.no_children")}</option>
          </select>
        )}
      </div>

      {/* Recurrence */}
      <div>
        <label className="mb-1 block text-sm font-medium">{t("chores.recurrence_label")}</label>
        <div className="mb-3 flex gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="recurrence_mode"
              checked={mode === "once"}
              onChange={() => setMode("once")}
            />
            {t("chores.no_repeat")}
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="recurrence_mode"
              checked={mode === "weekly"}
              onChange={() => setMode("weekly")}
            />
            {t("chores.repeat")}
          </label>
        </div>

        {mode === "once" ? (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t("chores.deadline_label")}
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={todayLocal}
              required
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t("chores.start_date")}
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t("chores.end_date")}
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs text-muted-foreground">
                  {t("chores.weekday_label")}
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}
                    className="text-xs text-primary underline"
                  >
                    {t("chores.select_all")}
                  </button>
                  <span className="text-xs text-muted-foreground">·</span>
                  <button
                    type="button"
                    onClick={() => setDays([])}
                    className="text-xs text-primary underline"
                  >
                    {t("chores.deselect_all")}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((lbl, idx) => {
                  const selected = days.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`h-10 w-10 rounded-full border text-sm transition ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !hasChildren}>
        {t("chores.add_button")}
      </Button>
    </form>
  );
}
