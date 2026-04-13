"use client";

/**
 * Task template row — display + simple edit (title/points/assignee) + delete.
 *
 * For v2 we moved recurrence editing out of this row. Recurrence is now a
 * discriminated union jsonb and better handled by the richer create-form.
 * To change recurrence, parents delete and re-add.
 */

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export function TemplateRow({ template, assignees, deleteAction, permanentDeleteAction }: Props) {
  const t = useT();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(template.title);
  const [points, setPoints] = useState<number>(template.points);
  const [assigneeId, setAssigneeId] = useState(template.assignee_id);
  const [isPending, startTransition] = useTransition();

  const assigneeName =
    assignees.find((a) => a.id === template.assignee_id)?.display_name ?? "—";

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between rounded border p-2 text-sm">
        <div>
          <div className="font-medium">{template.title}</div>
          <div className="text-xs text-muted-foreground">
            {assigneeName} · {template.recurrenceText} · {template.points}pt
            {template.start_date ? ` · ${template.start_date}` : ""}
            {template.end_date ? ` ~ ${template.end_date}` : ""}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            {t("tasks.edit")}
          </Button>
          {deleteAction && (
            <form
              action={(fd) => {
                startTransition(() => deleteAction(fd));
              }}
            >
              <input type="hidden" name="id" value={template.id} />
              <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
                {t("tasks.delete")}
              </Button>
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
              <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
                {t("tasks.permanent_delete")}
              </Button>
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
      className="grid gap-2 rounded border p-2 sm:grid-cols-2"
    >
      <input type="hidden" name="id" value={template.id} />

      <Input
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("tasks.title_label")}
        required
      />

      <Input
        type="number"
        name="points"
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        min={1}
        max={10000}
        required
      />

      <select
        name="assignee_id"
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="h-10 rounded-md border px-3 text-sm sm:col-span-2"
      >
        {assignees.map((a) => (
          <option key={a.id} value={a.id}>
            {a.display_name}
          </option>
        ))}
      </select>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("tasks.save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsEditing(false)}
        >
          {t("tasks.cancel")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        {t("tasks.recurrence_hint")}
      </p>
    </form>
  );
}
