import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { familyToday } from "@/lib/datetime/family-tz";
import { TemplateRow } from "./_template-row";
import { CreateTaskForm } from "./_create-form";
import { updateTaskTemplate } from "@/features/tasks/actions";
import { recurrenceSchema } from "@/schemas/task";
import { BackButton } from "@/components/ui/back-button";
import { t as i18n, type Locale } from "@/lib/i18n";

async function createAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") redirect("/tasks");

  const title = String(formData.get("title") || "");
  const assignee_id = String(formData.get("assignee_id") || "");
  const points = Number(formData.get("points") || 100);
  const recurrenceRaw = String(formData.get("recurrence") || "");
  const start_date = String(formData.get("start_date") || "");
  const end_date = (String(formData.get("end_date") || "") || null) as string | null;

  // Parse & validate recurrence jsonb.
  let recurrence: unknown;
  try {
    recurrence = JSON.parse(recurrenceRaw);
  } catch {
    redirect("/tasks/manage?error=recurrence_invalid");
  }
  const rParsed = recurrenceSchema.safeParse(recurrence);
  if (!rParsed.success) {
    redirect("/tasks/manage?error=recurrence_invalid");
  }
  if (rParsed.data.kind === "weekly" && rParsed.data.days.length === 0) {
    redirect("/tasks/manage?error=no_days");
  }

  // Defensive: assignee must be a child in our family (trigger also enforces).
  const { data: target } = await supabase
    .from("users")
    .select("id, family_id, role")
    .eq("id", assignee_id)
    .single();
  if (!target || target.family_id !== me.family_id || target.role !== "child") {
    redirect("/tasks/manage?error=assignee_must_be_child");
  }

  if (!Number.isFinite(points) || points < 1 || points > 10000) {
    redirect("/tasks/manage?error=points_range");
  }

  await supabase.from("task_templates").insert({
    family_id: me.family_id,
    assignee_id,
    title,
    points,
    recurrence: rParsed.data as unknown as Json,
    start_date,
    end_date,
    active: true,
    created_by: authUser.id,
  });
  revalidatePath("/tasks/manage");
}

async function deleteAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") redirect("/tasks");
  await supabase.from("task_templates").update({ active: false }).eq("id", id);
  revalidatePath("/tasks/manage");
}

type RawTemplate = {
  id: string;
  title: string;
  points: number;
  recurrence: unknown;
  assignee_id: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
};

function describeRecurrence(r: unknown, locale: Locale): string {
  const parsed = recurrenceSchema.safeParse(r);
  if (!parsed.success) return "—";
  if (parsed.data.kind === "once") return `${i18n("tasks.recurrence_once", locale)} · ~${parsed.data.due_date}`;
  const labels = i18n("common.weekdays", locale).split(",");
  if (parsed.data.days.length === 0) return i18n("tasks.recurrence_undecided", locale);
  if (parsed.data.days.length === 7) return i18n("tasks.recurrence_daily", locale);
  return parsed.data.days.map((d) => labels[d]).join("/");
}

export default async function TaskManagePage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  if (user.role !== "parent") redirect("/tasks");
  const supabase = await createClient();
  const todayLocal = familyToday(family.timezone);

  const { data: kids } = await supabase
    .from("users")
    .select("id, display_name, role")
    .eq("family_id", family.id)
    .eq("role", "child")
    .order("display_name");

  const [activeRes, endedRes] = await Promise.all([
    supabase
      .from("task_templates")
      .select("id, title, points, recurrence, assignee_id, active, start_date, end_date")
      .eq("family_id", family.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("task_templates")
      .select("id, title, points, recurrence, assignee_id, active, start_date, end_date")
      .eq("family_id", family.id)
      .eq("active", false)
      .order("created_at", { ascending: false }),
  ]);

  const kidList = (kids ?? []) as Array<{ id: string; display_name: string; role: string }>;
  const activeList = (activeRes.data ?? []) as RawTemplate[];
  const endedList = (endedRes.data ?? []) as RawTemplate[];

  function isRecurring(t: RawTemplate): boolean {
    const parsed = recurrenceSchema.safeParse(t.recurrence);
    return parsed.success && parsed.data.kind === "weekly";
  }

  function renderChildTemplates(templates: RawTemplate[], showDelete: boolean) {
    const recurring = templates.filter(isRecurring);
    const once = templates.filter((t) => !isRecurring(t));
    return (
      <>
        {recurring.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{i18n("tasks.recurring", locale)}</p>
            {recurring.map((t) => (
              <TemplateRow
                key={t.id}
                template={{
                  id: t.id,
                  title: t.title,
                  points: t.points,
                  recurrenceText: describeRecurrence(t.recurrence, locale),
                  start_date: t.start_date,
                  end_date: t.end_date,
                  active: t.active,
                  assignee_id: t.assignee_id,
                }}
                assignees={kidList.map((k) => ({ id: k.id, display_name: k.display_name }))}
                deleteAction={showDelete ? deleteAction : undefined}
              />
            ))}
          </div>
        )}
        {once.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{i18n("tasks.once", locale)}</p>
            {once.map((t) => (
              <TemplateRow
                key={t.id}
                template={{
                  id: t.id,
                  title: t.title,
                  points: t.points,
                  recurrenceText: describeRecurrence(t.recurrence, locale),
                  start_date: t.start_date,
                  end_date: t.end_date,
                  active: t.active,
                  assignee_id: t.assignee_id,
                }}
                assignees={kidList.map((k) => ({ id: k.id, display_name: k.display_name }))}
                deleteAction={showDelete ? deleteAction : undefined}
              />
            ))}
          </div>
        )}
        {recurring.length === 0 && once.length === 0 && (
          <p className="text-sm text-muted-foreground">{i18n("tasks.none", locale)}</p>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallback="/tasks" />
      <h1 className="text-2xl font-bold">{i18n("tasks.manage_title", locale)}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{i18n("tasks.new_task", locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTaskForm
            childrenList={kidList.map((k) => ({ id: k.id, display_name: k.display_name }))}
            todayLocal={todayLocal}
            createAction={createAction}
          />
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold">{i18n("tasks.in_progress", locale)}</h2>
      {kidList.map((kid) => {
        const mine = activeList.filter((t) => t.assignee_id === kid.id);
        return (
          <Card key={kid.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {kid.display_name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{mine.length}{i18n("tasks.count_suffix", locale)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderChildTemplates(mine, true)}
            </CardContent>
          </Card>
        );
      })}

      {endedList.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-muted-foreground">{i18n("tasks.ended", locale)}</h2>
          {kidList.map((kid) => {
            const mine = endedList.filter((t) => t.assignee_id === kid.id);
            if (mine.length === 0) return null;
            return (
              <Card key={`ended-${kid.id}`}>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">
                    {kid.display_name}
                    <span className="ml-2 text-xs font-normal">{mine.length}{i18n("tasks.count_suffix", locale)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderChildTemplates(mine, false)}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
