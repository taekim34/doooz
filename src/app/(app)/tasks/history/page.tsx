import Link from "next/link";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { familyToday, toFamilyDate } from "@/lib/datetime/family-tz";
import { BackButton, SectionLabel, StatCard } from "@/components/atoms";
import { TaskCheckbox } from "../_checkbox";
import { HistoryControls } from "./_controls";
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
  const selectedDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;

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

  // Compute summary stats (4 metrics: done / missed / pending / earned)
  const summary = rows.reduce(
    (acc, r) => {
      if (r.status === "completed") {
        acc.done += 1;
        acc.earned += r.points;
      } else if (r.status === "overdue") {
        acc.missed += 1;
      } else if (r.status === "pending" || r.status === "requested") {
        acc.pending += 1;
      } else if (r.status === "pardoned") {
        acc.done += 1; // pardoned counts as resolved (not pending / missed)
      }
      return acc;
    },
    { done: 0, missed: 0, pending: 0, earned: 0 },
  );

  // Group by child name for parent "all" view
  const childNameMap = new Map(children.map((c) => [c.id, c.display_name]));
  const grouped = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    const key =
      isParent && !selectedChildId
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
  const readOnly = !isParent;

  // Localize date header (e.g. "4월 18일 토요일", "Apr 18 Sat")
  const dateObj = new Date(`${selectedDate}T00:00:00`);
  const intlLocale = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";
  const humanDate = new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(dateObj);

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
      {/* Fixed header area */}
      <div
        style={{
          padding: "8px 20px 12px",
          maxWidth: 720,
          marginInline: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 0 14px",
          }}
        >
          <BackButton href="/tasks" />
          <SectionLabel as="span">{isParent ? "PARENT" : "KID"}</SectionLabel>
          <span style={{ width: 36, height: 36 }} />
        </div>

        <h1
          style={{
            margin: "0 0 18px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {t("tasks.history_title", locale)}
        </h1>

        {/* Date navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 4px",
          }}
        >
          <Link
            href={`/tasks/history?date=${prevDate}${selectedChildId ? `&child=${selectedChildId}` : ""}`}
            aria-label={t("tasks.history_prev", locale)}
            style={navBtnStyle}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3l-5 5 5 5"
                stroke="var(--ink)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                whiteSpace: "nowrap",
              }}
            >
              {humanDate}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ink-subtle)",
                letterSpacing: "0.06em",
                marginTop: 2,
              }}
            >
              {dateObj.getFullYear()}
            </div>
          </div>
          {canGoNext ? (
            <Link
              href={`/tasks/history?date=${nextDate}${selectedChildId ? `&child=${selectedChildId}` : ""}`}
              aria-label={t("tasks.history_next", locale)}
              style={navBtnStyle}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 3l5 5-5 5"
                  stroke="var(--ink)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : (
            <span
              aria-disabled
              style={{ ...navBtnStyle, cursor: "default", opacity: 0.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 3l5 5-5 5"
                  stroke="var(--ink-subtle)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>

        {/* Child filter chips (parent) + date picker */}
        <HistoryControls
          childList={children}
          currentChildId={selectedChildId}
          currentDate={selectedDate}
          isParent={isParent}
        />

        {/* Summary strip (4 metrics) */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
          }}
        >
          <StatCard label={t("tasks.completed", locale)} value={summary.done} />
          <StatCard label={t("tasks.missed", locale)} value={summary.missed} />
          <StatCard label={t("home.status_pending", locale)} value={summary.pending} />
          <StatCard label={t("tasks.earned", locale)} value={`${summary.earned}pt`} />
        </div>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 20px 24px",
          maxWidth: 720,
          marginInline: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {rows.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: "48px 0",
              textAlign: "center",
              fontSize: 13.5,
              color: "var(--ink-subtle)",
            }}
          >
            {t("tasks.history_date_empty", locale)}
          </p>
        ) : (
          Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName} style={{ marginBottom: 20 }}>
              {isParent && !selectedChildId && (
                <div style={{ padding: "6px 4px 10px" }}>
                  <SectionLabel as="span">{groupName}</SectionLabel>
                </div>
              )}
              <div>
                {items.map((r) => {
                  if (readOnly) {
                    // Child — read-only visual row with status dot
                    return <HistoryReadOnlyRow key={r.id} row={r} />;
                  }
                  return (
                    <div
                      key={r.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <TaskCheckbox
                        id={r.id}
                        title={r.title}
                        points={r.points}
                        status={r.status}
                        canPardon={isParent && r.template_id !== null}
                        readOnly={r.template_id === null}
                        isBeg={r.template_id === null}
                        variant="parent-row"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  display: "flex",
  height: 36,
  width: 36,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 9999,
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  cursor: "pointer",
  padding: 0,
  textDecoration: "none",
};


function HistoryReadOnlyRow({
  row,
}: {
  row: { id: string; title: string; points: number; status: string };
}) {
  const dot =
    row.status === "completed"
      ? { color: "var(--success)", ring: "rgba(34,197,94,0.18)" }
      : row.status === "overdue"
        ? { color: "var(--error)", ring: "rgba(239,68,68,0.16)" }
        : row.status === "pardoned"
          ? { color: "var(--warning)", ring: "rgba(245,158,11,0.18)" }
          : { color: "var(--ink-disabled)", ring: "rgba(212,212,216,0.30)" };

  const isMissed = row.status === "overdue";
  const titleColor = isMissed ? "var(--ink-subtle)" : "var(--ink)";
  const titleStrike = isMissed ? "line-through" : "none";
  const pointsColor =
    row.status === "completed"
      ? "var(--accent)"
      : row.status === "pardoned"
        ? "var(--warning)"
        : "var(--ink-subtle)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        height: 52,
        padding: "0 4px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          position: "relative",
          width: 16,
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 9999,
            background: dot.ring,
          }}
        />
        <span
          style={{
            position: "relative",
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: dot.color,
          }}
        />
      </span>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 15,
          fontWeight: 500,
          color: titleColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textDecoration: titleStrike,
          letterSpacing: "-0.01em",
        }}
      >
        {row.title}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          fontFeatureSettings: '"tnum" 1',
          color: pointsColor,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        +{row.points} pt
      </span>
    </div>
  );
}
