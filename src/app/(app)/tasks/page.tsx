import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { familyToday, familyYesterday } from "@/lib/datetime/family-tz";
import { KidTasks } from "./_kid-tasks";
import { ParentTasks } from "./_parent-tasks";
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

  const yesterday = familyYesterday(family.timezone);

  const [tasksRes, yesterdayOverdueRes, membersRes] = await Promise.all([
    supabase
      .from("task_instances")
      .select("id, title, points, status, due_date, assignee_id, template_id")
      .eq("family_id", family.id)
      .in("status", ["pending", "completed", "pardoned", "requested", "rejected", "penalty"])
      .gte("due_date", today)
      .order("due_date"),
    supabase
      .from("task_instances")
      .select("id, title, points, status, due_date, assignee_id, template_id")
      .eq("family_id", family.id)
      .eq("status", "overdue")
      .eq("due_date", yesterday),
    supabase
      .from("users")
      .select("id, display_name, role")
      .eq("family_id", family.id)
      .order("display_name"),
  ]);

  const all: Task[] = [
    ...((tasksRes.data ?? []) as Task[]),
    ...((yesterdayOverdueRes.data ?? []) as Task[]),
  ];
  const members = (membersRes.data ?? []) as Member[];

  // ═══════════════════════════════════════════════
  // CHILD VIEW
  // ═══════════════════════════════════════════════
  if (user.role === "child") {
    const mine = all.filter((c) => c.assignee_id === user.id);
    const todayAll = mine
      .filter((c) => c.due_date === today && c.status !== "requested" && c.status !== "rejected")
      .sort((a, b) => {
        const order: Record<string, number> = { pending: 0, pardoned: 1, completed: 2 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      });
    const todayDone = todayAll.filter((c) => c.status === "completed" || c.status === "pardoned").length;
    const myPending = mine.filter((c) => c.status === "requested");
    const myRejected = mine.filter((c) => c.status === "rejected");
    const myApproved = mine.filter((c) => c.due_date === today && c.status === "completed" && c.template_id === null);

    const allTaskItems = todayAll.map((c) => ({
      id: c.id,
      title: c.title,
      points: c.points,
      status: c.status,
      readOnly: c.status === "pardoned" || c.status === "penalty" || (c.template_id === null && c.status === "completed"),
      isBeg: c.template_id === null,
    }));

    const upcoming = mine
      .filter((c) => c.due_date > today && c.status === "pending")
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .map((c) => {
        const d = daysBetween(today, c.due_date);
        return {
          id: c.id,
          title: c.title,
          points: c.points,
          status: c.status,
          due_date: c.due_date,
          trailing: d > 0 ? `D-${d}` : t("tasks.history_today", locale),
        };
      });

    const yesterdayOverdue = mine
      .filter((c) => c.status === "overdue" && c.due_date === yesterday)
      .map((c) => ({ id: c.id, title: c.title, points: c.points, status: c.status }));

    return (
      <KidTasks
        allTaskItems={allTaskItems}
        todayDone={todayDone}
        todayTotal={todayAll.length}
        upcoming={upcoming}
        yesterdayOverdue={yesterdayOverdue}
        myPending={myPending.map((c) => ({ id: c.id, title: c.title }))}
        myRejected={myRejected.map((c) => ({ id: c.id, title: c.title }))}
        myApproved={myApproved.map((c) => ({ id: c.id, title: c.title }))}
        locale={locale}
      />
    );
  }

  // ═══════════════════════════════════════════════
  // PARENT VIEW
  // ═══════════════════════════════════════════════
  const children = members.filter((m) => m.role === "child");
  const requested = all.filter((c) => c.status === "requested");
  const nameMap = new Map(members.map((m) => [m.id, m.display_name]));

  const grouped = children.map((m) => {
    const mine = all.filter((c) => c.assignee_id === m.id);
    return {
      member: m,
      todayList: mine.filter((c) => c.due_date === today && !["completed", "requested", "rejected"].includes(c.status)),
      overdue: mine.filter((c) => c.status === "overdue" && c.due_date === yesterday),
      doneToday: mine.filter((c) => c.due_date === today && c.status === "completed"),
    };
  });

  const totalToday = all.filter((c) => c.due_date === today).length;
  const doneCount = all.filter((c) => c.due_date === today && c.status === "completed").length;

  const todayDateObj = new Date(`${today}T00:00:00`);
  const intlLocale = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
  const humanToday = new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(todayDateObj);

  return (
    <ParentTasks
      locale={locale}
      humanToday={humanToday}
      doneCount={doneCount}
      totalToday={totalToday}
      requested={requested}
      nameMap={nameMap}
      grouped={grouped}
    />
  );
}
