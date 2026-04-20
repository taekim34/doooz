"use client";

/**
 * Task template row — display + simple edit (title/points/assignee) + delete.
 *
 * For v2 we moved recurrence editing out of this row. Recurrence is now a
 * discriminated union jsonb and better handled by the richer create-form.
 * To change recurrence, parents delete and re-add.
 */

import { useState, useTransition, type CSSProperties, type FocusEvent } from "react";
import { updateTaskTemplate } from "@/features/tasks/actions";
import { useT } from "@/lib/i18n/useT";

export type TemplateRowKid = { id: string; display_name: string };

export type TemplateRowData = {
  id: string;
  title: string;
  points: number;
  recurrenceText: string;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  assignee_id: string;
};

type Props = {
  template: TemplateRowData;
  assignees: TemplateRowKid[];
  deleteAction?: (formData: FormData) => Promise<void>;
  permanentDeleteAction?: (formData: FormData) => Promise<void>;
};

const inputStyle: CSSProperties = {
  height: 40,
  width: "100%",
  borderRadius: 10,
  padding: "0 14px",
  outline: "none",
  background: "var(--surface-raised)",
  border: "1px solid var(--border-subtle)",
  fontSize: 14,
  fontWeight: 500,
  color: "var(--ink)",
  transition: "border-color 150ms, background 150ms",
  boxSizing: "border-box",
};

function focusOn(e: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--ink)";
  e.currentTarget.style.background = "var(--surface)";
}
function focusOff(e: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--border-subtle)";
  e.currentTarget.style.background = "var(--surface-raised)";
}

export function TemplateRow({ template, assignees, deleteAction, permanentDeleteAction }: Props) {
  const t = useT();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(template.title);
  const [points, setPoints] = useState<number>(template.points);
  const [assigneeId, setAssigneeId] = useState(template.assignee_id);
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 14,
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {template.title}
          </div>
          <div
            style={{
              marginTop: 3,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-subtle)",
                letterSpacing: "-0.01em",
              }}
            >
              {template.recurrenceText}
            </span>
            <span
              aria-hidden
              style={{
                width: 3,
                height: 3,
                borderRadius: 9999,
                background: "var(--border)",
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent)",
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              +{template.points} pt
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-muted)",
              padding: "6px 4px",
              whiteSpace: "nowrap",
            }}
          >
            {t("tasks.edit")}
          </button>
          {deleteAction && (
            <form
              action={(fd) => {
                startTransition(() => deleteAction(fd));
              }}
            >
              <input type="hidden" name="id" value={template.id} />
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: isPending ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--error-strong)",
                  padding: "6px 4px",
                  whiteSpace: "nowrap",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {t("tasks.delete")}
              </button>
            </form>
          )}
          {permanentDeleteAction && (
            <form
              action={(fd) => {
                if (!confirm(t("tasks.permanent_delete_confirm"))) return;
                startTransition(() => permanentDeleteAction(fd));
              }}
            >
              <input type="hidden" name="id" value={template.id} />
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: isPending ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--error-strong)",
                  padding: "6px 4px",
                  whiteSpace: "nowrap",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {t("tasks.permanent_delete")}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await updateTaskTemplate(fd);
          setIsEditing(false);
        });
      }}
      style={{
        display: "grid",
        gap: 10,
        padding: 14,
        borderRadius: 14,
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <input type="hidden" name="id" value={template.id} />

      <input
        name="title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("tasks.title_label")}
        onFocus={focusOn}
        onBlur={focusOff}
        style={{ ...inputStyle, gridColumn: "1 / -1" }}
        required
      />

      <input
        type="number"
        name="points"
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        min={1}
        max={10000}
        onFocus={focusOn}
        onBlur={focusOff}
        style={inputStyle}
        required
      />

      <select
        name="assignee_id"
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        onFocus={focusOn}
        onBlur={focusOff}
        style={{
          ...inputStyle,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
        }}
      >
        {assignees.map((a) => (
          <option key={a.id} value={a.id}>
            {a.display_name}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 8, gridColumn: "1 / -1" }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            height: 40,
            padding: "0 18px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--on-accent)",
            background: "var(--ink)",
            border: "none",
            cursor: isPending ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {t("tasks.save")}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          style={{
            height: 40,
            padding: "0 18px",
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            background: "var(--surface-sunken)",
            border: "none",
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          {t("tasks.cancel")}
        </button>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "var(--ink-subtle)",
          gridColumn: "1 / -1",
        }}
      >
        {t("tasks.recurrence_hint")}
      </p>
    </form>
  );
}
