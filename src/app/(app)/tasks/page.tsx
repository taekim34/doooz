import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { familyToday } from "@/lib/datetime/family-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCheckbox } from "./_checkbox";
import { BegForm } from "./_beg-form";
import { BegActions } from "./_beg-actions";
import { BegCancelButton } from "./_beg-cancel";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

type Task = {
  id: string;
  title: string;
  points: number;
  status: string;
  due_date: string;
  assignee_id: string;
  template_id: string | null;
};

type Member = { id: string; display_name: string; role: string };

function daysBetween(fromYmd: string, toYmd: string): number {
  const fp = fromYmd.split("-").map(Number);
  const tp = toYmd.split("-").map(Number);
  // UTC arithmetic is fine: both dates are plain yyyy-mm-dd calendar days.
  // eslint-disable-next-line no-restricted-syntax
  const from = Date.UTC(fp[0] ?? 1970, (fp[1] ?? 1) - 1, fp[2] ?? 1);
  // eslint-disable-next-line no-restricted-syntax
  const to = Date.UTC(tp[0] ?? 1970, (tp[1] ?? 1) - 1, tp[2] ?? 1);
  return Math.round((to - from) / 86_400_000);
}

export default async function TasksPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();
  const today = familyToday(family.timezone);

  await supabase.rpc("ensure_today_instances", {
    p_user_id: user.id,
    p_family_id: family.id,
  });

  const [tasksRes, membersRes] = await Promise.all([
    supabase
      .from("task_instances")
      .select("id, title, points, status, due_date, assignee_id, template_id")
      .eq("family_id", family.id)
      .in("status", ["pending", "completed", "overdue", "pardoned", "requested", "rejected"])
      .gte("due_date", today) // today + future
      .order("due_date"),
    supabase
      .from("users")
      .select("id, display_name, role")
      .eq("family_id", family.id)
      .order("display_name"),
  ]);

  // Also fetch overdue (past) + today's non-pending (completed/pardoned) for done section.
  const { data: overdueOrPast } = await supabase
    .from("task_instances")
    .select("id, title, points, status, due_date, assignee_id")
    .eq("family_id", family.id)
    .in("status", ["overdue"])
    .lt("due_date", today);

  const upcomingAll = ((tasksRes.data ?? []) as Task[]);
  const past = ((overdueOrPast ?? []) as Task[]);
  const all: Task[] = [...upcomingAll, ...past];
  const members = (membersRes.data ?? []) as Member[];

  // Child view
  if (user.role === "child") {
    const mine = all.filter((c) => c.assignee_id === user.id);
    // Today: pending + completed + pardoned all in one list (pending first, then done)
    const todayAll = mine
      .filter((c) => c.due_date === today && c.status !== "requested")
      .sort((a, b) => {
        const order: Record<string, number> = { pending: 0, overdue: 1, pardoned: 2, completed: 3, rejected: 4 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      });
    const todayDone = todayAll.filter((c) => c.status === "completed" || c.status === "pardoned").length;
    const myRequested = mine.filter((c) => c.status === "requested");
    const upcoming = mine
      .filter((c) => c.due_date > today && c.status === "pending")
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    const overdue = mine.filter((c) => c.status === "overdue");

    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("tasks.title", locale)}</h1>
          <Link href="/tasks/history" className="text-sm text-primary underline">
            {t("tasks.history", locale)}
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("tasks.today", locale)} · {today}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {todayDone}/{todayAll.length} {t("tasks.completed", locale)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayAll.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("tasks.no_today", locale)}</p>
            )}
            {todayAll.map((c) => (
              <TaskCheckbox
                key={c.id}
                id={c.id}
                title={c.title}
                points={c.points}
                status={c.status}
                readOnly={c.status === "pardoned" || c.status === "rejected" || (c.template_id === null && c.status === "completed")}
                isBeg={c.template_id === null}
              />
            ))}
          </CardContent>
        </Card>

        {upcoming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("tasks.upcoming", locale)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((c) => {
                const d = daysBetween(today, c.due_date);
                return (
                  <TaskCheckbox
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    points={c.points}
                    status={c.status}
                    readOnly
                    trailing={d > 0 ? `D-${d}` : t("tasks.history_today", locale)}
                  />
                );
              })}
            </CardContent>
          </Card>
        )}

        {overdue.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">{t("tasks.missed", locale)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdue.map((c) => (
                <TaskCheckbox
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  points={c.points}
                  status={c.status}
                  readOnly
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("tasks.beg_title", locale)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("tasks.beg_desc", locale)}
            </p>
            <BegForm />
            {myRequested.length > 0 && (
              <div className="space-y-2 pt-3 border-t">
                <p className="text-sm font-medium text-orange-700">{t("home.status_beg_pending", locale)} ({myRequested.length})</p>
                {myRequested.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⏳</span>
                      <span className="text-sm font-medium">{c.title}</span>
                    </div>
                    <BegCancelButton id={c.id} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parent view — grouped by child, with pardon buttons on pending/overdue.
  const children = members.filter((m) => m.role === "child");
  const requested = all.filter((c) => c.status === "requested");
  const nameMap = new Map(members.map((m) => [m.id, m.display_name]));

  const grouped = children.map((m) => {
    const mine = all.filter((c) => c.assignee_id === m.id);
    return {
      member: m,
      todayList: mine.filter((c) => c.due_date === today && !["completed", "requested", "rejected"].includes(c.status)),
      overdue: mine.filter((c) => c.status === "overdue"),
      doneToday: mine.filter((c) => c.due_date === today && c.status === "completed"),
    };
  });

  const totalToday = all.filter((c) => c.due_date === today).length;
  const doneCount = all.filter(
    (c) => c.due_date === today && c.status === "completed",
  ).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("tasks.title", locale)}</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/tasks/history" className="text-primary underline">
            {t("tasks.history", locale)}
          </Link>
          <Link href="/tasks/manage" className="text-primary underline">
            {t("tasks.manage", locale)}
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {today} · {t("tasks.completed", locale)} {doneCount}/{totalToday}
          </CardTitle>
        </CardHeader>
      </Card>

      {requested.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">{t("tasks.beg_requests", locale)} ({requested.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requested.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded border p-2">
                <div>
                  <span className="text-xs text-muted-foreground">{nameMap.get(c.assignee_id)}</span>
                  <p className="text-sm font-medium">{c.title}</p>
                </div>
                <BegActions id={c.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {grouped.map(({ member, todayList, overdue, doneToday }) => (
        <Card key={member.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {member.display_name}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                · {t("tasks.history_today", locale)} {doneToday.length}/{todayList.length + doneToday.length}
                {overdue.length > 0 ? ` · ${t("tasks.missed", locale)} ${overdue.length}` : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayList.length === 0 && overdue.length === 0 && doneToday.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("tasks.none", locale)}</p>
            )}
            {todayList.map((c) => (
              <TaskCheckbox
                key={c.id}
                id={c.id}
                title={c.title}
                points={c.points}
                status={c.status}
                canPardon
              />
            ))}
            {overdue.map((c) => (
              <TaskCheckbox
                key={c.id}
                id={c.id}
                title={c.title}
                points={c.points}
                status={c.status}
                canPardon
              />
            ))}
            {doneToday.map((c) => (
              <TaskCheckbox
                key={c.id}
                id={c.id}
                title={c.title}
                points={c.points}
                status={c.status}
                isBeg={c.template_id === null}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
