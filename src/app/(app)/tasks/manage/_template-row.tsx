"use client";

/**
 * Task template row — display + simple edit (title/points/assignee) + delete.
 *
 * For v2 we moved recurrence editing out of this row. Recurrence is now a
 * discriminated union jsonb and better handled by the richer create-form.
 * To change recurrence, parents delete and re-add.
 */

import { useState, useTransition, type FocusEvent } from "react";
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

const inputClass = "h-10 w-full rounded-[10px] px-3.5 outline-none bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] text-sm font-medium text-[color:var(--ink)] transition-[border-color,background] duration-150 box-border";

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
      <div className="flex items-center gap-3 p-3.5 px-4 rounded-[14px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)]">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-[color:var(--ink)] truncate tracking-[-0.01em]">
            {template.title}
          </div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-medium text-[color:var(--ink-subtle)] tracking-[-0.01em]">
              {template.recurrenceText}
            </span>
            <span
              aria-hidden
              className="w-[3px] h-[3px] rounded-full bg-[color:var(--border)]"
            />
            <span className="text-[12px] font-bold text-[color:var(--accent)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
              +{template.points} pt
            </span>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[color:var(--ink-muted)] px-1 py-1.5 whitespace-nowrap"
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
                className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[color:var(--error-strong)] px-1 py-1.5 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
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
                className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[color:var(--error-strong)] px-1 py-1.5 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
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
      className="grid gap-2.5 p-3.5 rounded-[14px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] grid-cols-2"
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
        className={`${inputClass} col-span-full`}
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
        className={inputClass}
        required
      />

      <select
        name="assignee_id"
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        onFocus={focusOn}
        onBlur={focusOff}
        className={`${inputClass} appearance-none`}
      >
        {assignees.map((a) => (
          <option key={a.id} value={a.id}>
            {a.display_name}
          </option>
        ))}
      </select>

      <div className="flex gap-2 col-span-full">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-4.5 rounded-full text-[13px] font-bold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {t("tasks.save")}
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="h-10 px-4.5 rounded-full text-[13px] font-bold text-[color:var(--ink)] bg-[color:var(--surface-sunken)] border-none cursor-pointer tracking-[-0.01em]"
        >
          {t("tasks.cancel")}
        </button>
      </div>
      <p className="m-0 text-[11px] text-[color:var(--ink-subtle)] col-span-full">
        {t("tasks.recurrence_hint")}
      </p>
    </form>
  );
}
