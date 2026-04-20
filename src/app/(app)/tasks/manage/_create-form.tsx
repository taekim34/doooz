"use client";

/**
 * Task template create form (v2 spec #1, #5, #7).
 *
 * - Points quick-pick: [50][100][150][custom]. Default 100.
 * - Assignee dropdown filtered to children only.
 * - Recurrence radio [once / repeat].
 *     once → single deadline date
 *     repeat → start_date + optional end_date + weekday chips (Sun-Sat)
 * - On submit emits a JSON `recurrence` field matching the jsonb shape.
 */

import { useMemo, useState, useTransition, type CSSProperties, type FocusEvent } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";

type Child = { id: string; display_name: string };

type Props = {
  childrenList: Child[];
  todayLocal: string;
  createAction: (formData: FormData) => Promise<void>;
};

const QUICK_POINTS: ReadonlyArray<number> = [50, 100, 150];

const inputStyle: CSSProperties = {
  height: 48,
  width: "100%",
  borderRadius: 10,
  padding: "0 16px",
  outline: "none",
  background: "var(--surface-raised)",
  border: "1px solid var(--border-subtle)",
  fontSize: 16,
  fontWeight: 500,
  color: "var(--ink)",
  transition: "border-color 150ms, background 150ms",
  boxSizing: "border-box",
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  color: "var(--ink-subtle)",
  letterSpacing: "0.15em",
};

function focusOn(e: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--ink)";
  e.currentTarget.style.background = "var(--surface)";
}
function focusOff(e: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--border-subtle)";
  e.currentTarget.style.background = "var(--surface-raised)";
}

export function CreateTaskForm({ childrenList, todayLocal, createAction }: Props) {
  const t = useT();
  const WEEKDAY_LABELS = t("common.weekdays").split(",");
  // Mockup order: Mon-Sun. We preserve Sun-Sat data (0..6) but render in Mon→Sun order.
  const DISPLAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0];
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
    if (mode === "once") setMode("weekly");
  }

  function onSubmit(fd: FormData) {
    // Client-side guards
    if (!hasChildren) {
      toast.error(t("tasks.error_no_children"));
      return;
    }
    if (!title.trim()) {
      toast.error(t("tasks.error_no_title"));
      return;
    }
    if (!assigneeId) {
      toast.error(t("tasks.error_no_assignee"));
      return;
    }
    if (!Number.isFinite(pointsValue) || pointsValue < 1 || pointsValue > 10000) {
      toast.error(t("tasks.error_points_range"));
      return;
    }
    if (mode === "weekly" && days.length === 0) {
      toast.error(t("tasks.error_no_days"));
      return;
    }
    if (mode === "once" && !deadline) {
      toast.error(t("tasks.error_no_deadline"));
      return;
    }

    const recurrence =
      mode === "once"
        ? { kind: "once" as const, due_date: deadline }
        : { kind: "weekly" as const, days };

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
        toast.error((e as Error).message || t("tasks.error_save_failed"));
      }
    });
  }

  return (
    <form
      action={onSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {/* Title */}
      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={fieldLabelStyle}>{t("tasks.title_label")}</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("tasks.title_placeholder")}
          onFocus={focusOn}
          onBlur={focusOff}
          style={inputStyle}
        />
      </label>

      {/* Points + Assignee side by side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={fieldLabelStyle}>{t("tasks.points_label")}</span>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={10000}
              step={5}
              value={quickPoints === "custom" ? customPoints : (quickPoints as number)}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setCustomPoints(v);
                setQuickPoints("custom");
              }}
              onFocus={focusOn}
              onBlur={focusOff}
              style={{
                ...inputStyle,
                paddingRight: 40,
                fontFeatureSettings: '"tnum" 1',
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--ink-subtle)",
                pointerEvents: "none",
              }}
            >
              pt
            </span>
          </div>
          {/* Quick points chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUICK_POINTS.map((p) => {
              const on = quickPoints === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickPoints(p)}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 9999,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: on ? "var(--on-accent)" : "var(--ink)",
                    background: on ? "var(--ink)" : "var(--surface-sunken)",
                    border: "none",
                    transition: "background 160ms, color 160ms",
                  }}
                >
                  {p}pt
                </button>
              );
            })}
          </div>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={fieldLabelStyle}>{t("tasks.assignee_label")}</span>
          <div style={{ position: "relative" }}>
            {hasChildren ? (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  paddingRight: 40,
                  cursor: "pointer",
                }}
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
                style={{
                  ...inputStyle,
                  color: "var(--ink-subtle)",
                  paddingRight: 40,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option>{t("tasks.no_children")}</option>
              </select>
            )}
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              aria-hidden
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <path
                d="M1.5 1.5l4.5 5 4.5-5"
                stroke="var(--ink-subtle)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </label>
      </div>

      {/* Recurrence */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={fieldLabelStyle}>{t("tasks.recurrence_label")}</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {DISPLAY_ORDER.map((v) => {
            const on = mode === "weekly" && days.includes(v);
            const weekend = v === 0 || v === 6;
            const lbl = WEEKDAY_LABELS[v] ?? "";
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleDay(v)}
                aria-pressed={on}
                style={{
                  height: 36,
                  minWidth: 36,
                  padding: "0 12px",
                  borderRadius: 9999,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  color: on ? "var(--on-accent)" : weekend ? "var(--ink-subtle)" : "var(--ink)",
                  background: on ? "var(--ink)" : "var(--surface-sunken)",
                  border: "none",
                  transition: "background 160ms, color 160ms",
                  letterSpacing: "-0.01em",
                }}
              >
                {lbl}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => {
              if (mode === "once") {
                setMode("weekly");
              } else {
                setMode("once");
                setDays([]);
              }
            }}
            aria-pressed={mode === "once"}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 9999,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: mode === "once" ? "var(--on-accent)" : "var(--ink)",
              background: mode === "once" ? "var(--ink)" : "var(--surface-sunken)",
              border: "none",
              transition: "background 160ms, color 160ms",
            }}
          >
            {t("tasks.no_repeat")}
          </button>
        </div>

        {/* Inline date fields — compact */}
        {mode === "once" ? (
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-subtle)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("tasks.deadline_label")}
            </span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={todayLocal}
              onFocus={focusOn}
              onBlur={focusOff}
              style={inputStyle}
              required
            />
          </label>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-subtle)",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("tasks.start_date")}
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
                style={inputStyle}
                required
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-subtle)",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("tasks.end_date")}
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onFocus={focusOn}
                onBlur={focusOff}
                style={inputStyle}
              />
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !hasChildren}
        style={{
          marginTop: 2,
          height: 48,
          width: "100%",
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 700,
          color: "#fff",
          background: "var(--ink)",
          border: "none",
          cursor: isPending || !hasChildren ? "not-allowed" : "pointer",
          letterSpacing: "-0.01em",
          boxShadow:
            "0 1px 2px rgba(10,10,10,0.04), 0 12px 28px -16px rgba(10,10,10,0.4)",
          transition: "transform 200ms cubic-bezier(0.16,1,0.3,1), opacity 200ms",
          opacity: isPending || !hasChildren ? 0.6 : 1,
        }}
      >
        {t("tasks.add_button")}
      </button>
    </form>
  );
}
