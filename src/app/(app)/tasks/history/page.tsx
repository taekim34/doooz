import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { familyToday, toFamilyDate } from "@/lib/datetime/family-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCheckbox } from "../_checkbox";
import { HistoryControls } from "./_controls";
import { BackButton } from "@/components/ui/back-button";
import { t, type Locale } from "@/lib/i18n";

type Props = {
  searchParams: Promise<{ date?: string; child?: string }>;
};

export default async function TaskHistoryPage({ searchParams }: Props) {
  const params = await searchParams;
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();
  const today = familyToday(family.timezone);
  const isParent = user.role === "parent";

  // Selected date (default: today)
  const selectedDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
    ? params.date
    : today;

  // Fetch children list for tabs (parent only)
  let children: Array<{ id: string; display_name: string }> = [];
  if (isParent) {
    const { data } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("family_id", family.id)
      .eq("role", "child")
      .order("display_name");
    children = (data ?? []) as typeof children;
  }

  // Active child filter
  const selectedChildId = isParent ? (params.child ?? null) : user.id;

  // Query instances for selected date
  let q = supabase
    .from("task_instances")
    .select("id, title, points, status, due_date, assignee_id, template_id")
    .eq("family_id", family.id)
    .eq("due_date", selectedDate)
    .order("title");

  if (selectedChildId) {
    q = q.eq("assignee_id", selectedChildId);
  }

  const { data } = await q;
  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    points: number;
    status: string;
    due_date: string;
    assignee_id: string;
    template_id: string | null;
  }>;

  // Group by child name for parent "all" view
  const childNameMap = new Map(children.map((c) => [c.id, c.display_name]));
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    const key = isParent && !selectedChildId
      ? (childNameMap.get(r.assignee_id) ?? t("tasks.filter_other", locale))
      : "items";
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  // Navigation helpers
  const prevDate = (() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    return toFamilyDate(d, family.timezone);
  })();
  const nextDate = (() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    return toFamilyDate(d, family.timezone);
  })();
  const canGoNext = selectedDate < today;
  const isPastDate = selectedDate < today;
  // Children can only modify today's tasks; parents can modify any date.
  const childReadOnly = !isParent && isPastDate;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackButton fallback="/tasks" />
      <h1 className="text-2xl font-bold">{t("tasks.history_title", locale)}</h1>

      <HistoryControls
        childList={children}
        currentChildId={selectedChildId}
        currentDate={selectedDate}
        isParent={isParent}
      />

      {/* Date nav arrows */}
      <div className="flex items-center justify-between text-sm">
        <a
          href={`/tasks/history?date=${prevDate}${selectedChildId ? `&child=${selectedChildId}` : ""}`}
          className="rounded border px-3 py-1 hover:bg-muted"
        >
          {t("tasks.history_prev", locale)}
        </a>
        <span className="font-medium">{selectedDate}</span>
        {canGoNext ? (
          <a
            href={`/tasks/history?date=${nextDate}${selectedChildId ? `&child=${selectedChildId}` : ""}`}
            className="rounded border px-3 py-1 hover:bg-muted"
          >
            {t("tasks.history_next", locale)}
          </a>
        ) : (
          <span className="rounded border px-3 py-1 text-muted-foreground">{t("tasks.history_today", locale)}</span>
        )}
      </div>

      {/* Results */}
      {Object.entries(grouped).map(([groupName, items]) => (
        <Card key={groupName}>
          {isParent && !selectedChildId && (
            <CardHeader>
              <CardTitle className="text-base">{groupName}</CardTitle>
            </CardHeader>
          )}
          <CardContent className="space-y-2 pt-4">
            {items.map((r) => (
              <TaskCheckbox
                key={r.id}
                id={r.id}
                title={r.title}
                points={r.points}
                status={r.status}
                canPardon={isParent && !childReadOnly && r.template_id !== null}
                readOnly={childReadOnly || r.template_id === null}
                isBeg={r.template_id === null}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {rows.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("tasks.history_empty", locale)}
        </p>
      )}
    </div>
  );
}
