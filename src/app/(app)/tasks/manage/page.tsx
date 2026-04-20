import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { familyToday } from "@/lib/datetime/family-tz";
import { BackButton, SectionLabel } from "@/components/atoms";
import { TemplateRow } from "./_template-row";
import { CreateTaskForm } from "./_create-form";
import { recurrenceSchema } from "@/schemas/task";
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

async function permanentDeleteAction(formData: FormData) {
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
  await supabase.from("task_templates").delete().eq("id", id).eq("active", false);
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


  return (
    <div
      style={{
        position: "relative",
        minHeight: "100%",
        width: "100%",
        background: "var(--bg)",
        color: "var(--ink)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="max-w-[720px] lg:max-w-[960px]"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 20px 32px",
          WebkitOverflowScrolling: "touch",
          marginInline: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 0 14px",
          }}
        >
          <BackButton href="/tasks" />
          <SectionLabel as="span">PARENT</SectionLabel>
          <span style={{ width: 36, height: 36 }} />
        </div>

        <h1
          style={{
            margin: "4px 0 4px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {i18n("tasks.manage_title", locale)}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 500,
            color: "var(--ink-subtle)",
            letterSpacing: "-0.01em",
          }}
        >
          {i18n("tasks.history_parent_guide", locale)}
        </p>

        {/* Two-column grid on lg+: left = create form (sticky), right = template list */}
        <div className="lg:grid lg:grid-cols-[420px_1fr] lg:gap-8">
          {/* Left column: Create new task */}
          <section style={{ marginTop: 22 }} className="lg:sticky lg:top-20 lg:self-start">
            <SectionLabel as="span" className="flex items-center">{i18n("tasks.new_task", locale)}</SectionLabel>
            <div style={{ marginTop: 10 }}>
              <CreateTaskForm
                childrenList={kidList.map((k) => ({ id: k.id, display_name: k.display_name }))}
                todayLocal={todayLocal}
                createAction={createAction}
              />
            </div>
          </section>

          {/* Right column: Existing templates + ended */}
          <div>
            {/* Existing templates, grouped by kid */}
            {kidList.map((kid) => {
              const mine = activeList.filter((t) => t.assignee_id === kid.id);
              return (
                <section key={kid.id} style={{ marginTop: 28 }}>
                  <div className="flex items-center">
                    <SectionLabel as="span">{kid.display_name}</SectionLabel>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--ink-subtle)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {mine.length}
                      {i18n("tasks.count_suffix", locale)}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {mine.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-subtle)" }}>
                        {i18n("tasks.manage_empty", locale)}
                      </p>
                    ) : (
                      mine.map((tpl) => (
                        <TemplateRow
                          key={tpl.id}
                          template={{
                            id: tpl.id,
                            title: tpl.title,
                            points: tpl.points,
                            recurrenceText: describeRecurrence(tpl.recurrence, locale),
                            start_date: tpl.start_date,
                            end_date: tpl.end_date,
                            active: tpl.active,
                            assignee_id: tpl.assignee_id,
                          }}
                          assignees={kidList.map((k) => ({ id: k.id, display_name: k.display_name }))}
                          deleteAction={deleteAction}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}

            {/* Ended templates */}
            {endedList.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <SectionLabel as="span" className="flex items-center">{i18n("tasks.ended", locale)}</SectionLabel>
                {kidList.map((kid) => {
                  const mine = endedList.filter((t) => t.assignee_id === kid.id);
                  if (mine.length === 0) return null;
                  return (
                    <div key={`ended-${kid.id}`} style={{ marginTop: 14 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--ink-subtle)",
                          letterSpacing: "-0.01em",
                          marginBottom: 8,
                        }}
                      >
                        {kid.display_name}
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--ink-disabled)",
                          }}
                        >
                          {mine.length}
                          {i18n("tasks.count_suffix", locale)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {mine.map((tpl) => (
                          <TemplateRow
                            key={tpl.id}
                            template={{
                              id: tpl.id,
                              title: tpl.title,
                              points: tpl.points,
                              recurrenceText: describeRecurrence(tpl.recurrence, locale),
                              start_date: tpl.start_date,
                              end_date: tpl.end_date,
                              active: tpl.active,
                              assignee_id: tpl.assignee_id,
                            }}
                            assignees={kidList.map((k) => ({ id: k.id, display_name: k.display_name }))}
                            permanentDeleteAction={permanentDeleteAction}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        </div>

        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}
