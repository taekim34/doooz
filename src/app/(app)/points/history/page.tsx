import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale } from "@/lib/i18n";
import { formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import Link from "next/link";
import { BackButton, SectionLabel } from "@/components/atoms";
import type { Route } from "next";
import { HistoryControls, type FilterKind } from "./_controls";
import { txMeta } from "@/lib/tx-meta";

const PAGE_SIZE = 50;

type TxKind = "task_reward" | "redemption" | "adjustment" | "bonus" | "penalty";

type Tx = {
  id: string;
  amount: number;
  reason: string;
  kind: string;
  created_at: string;
  user_id: string;
  actor_id: string | null;
  task_instances: { due_date: string } | null;
};

function toFilterKind(s: string | undefined): FilterKind {
  if (s === "task" || s === "reward" || s === "adjust") return s;
  return "all";
}

/** Map the filter pill to the DB `kind` values. */
function dbKindsFor(filter: FilterKind): TxKind[] | null {
  switch (filter) {
    case "task":
      return ["task_reward", "penalty"];
    case "reward":
      return ["redemption"];
    case "adjust":
      return ["adjustment", "bonus"];
    case "all":
    default:
      return null;
  }
}

export default async function PointsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; child?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();

  const filter = toFilterKind(sp.filter);

  // Parents may filter by child. Children see only their own.
  const { data: kids } =
    user.role === "parent"
      ? await supabase
          .from("users")
          .select("id, display_name")
          .eq("family_id", family.id)
          .eq("role", "child")
          .order("display_name")
      : { data: null };
  const kidList = (kids ?? []) as Array<{ id: string; display_name: string }>;

  const selectedChild = user.role === "parent" ? (sp.child ?? "") : user.id;

  let q = supabase
    .from("point_transactions")
    .select(
      "id, amount, reason, kind, created_at, user_id, actor_id, task_instances(due_date)",
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (user.role === "child") {
    q = q.eq("user_id", user.id);
  } else if (selectedChild) {
    q = q.eq("user_id", selectedChild);
  } else {
    q = q.eq("family_id", family.id);
  }

  const kindFilter = dbKindsFor(filter);
  if (kindFilter) {
    q = q.in("kind", kindFilter);
  }

  if (sp.before) q = q.lt("created_at", sp.before);

  const { data } = await q;
  const rows = (data ?? []) as Tx[];
  const last = rows[rows.length - 1];

  // Resolve actor display names (family members — parents and kids).
  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((v): v is string => !!v)),
  );
  let actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", actorIds);
    actorMap = new Map(
      ((actors ?? []) as Array<{ id: string; display_name: string }>).map(
        (a) => [a.id, a.display_name],
      ),
    );
  }

  const nameMap = new Map(kidList.map((k) => [k.id, k.display_name]));

  function buildMore(before: string): Route {
    const p = new URLSearchParams();
    if (selectedChild) p.set("child", selectedChild);
    if (filter !== "all") p.set("filter", filter);
    p.set("before", before);
    return (`/points/history?${p.toString()}`) as Route;
  }

  return (
    <div
      className="mx-auto max-w-2xl"
      style={{        color: "var(--ink)",
      }}
    >
      {/* Header */}
      <div className="mb-4" style={{ padding: "8px 0 0" }}>
        {/* Top bar: back + role eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 0 14px",
          }}
        >
          <BackButton href="/points" />
          <SectionLabel as="span">{user.role === "parent" ? "PARENT" : "KID"}</SectionLabel>
          <span style={{ width: 36, height: 36 }} />
        </div>

        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {t("points.title", locale)}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-subtle)",
            letterSpacing: "-0.01em",
          }}
        >
          {t("points.history_subtitle", locale)}
        </p>

        <HistoryControls
          role={user.role}
          kids={kidList}
          selectedChildId={selectedChild}
          currentFilter={filter}
        />
      </div>

      {/* Transaction list */}
      {rows.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-subtle)",
          }}
        >
          {t("points.no_history_full", locale)}
        </div>
      ) : (
        <div
          style={{
            padding: "4px 14px",
            background: "var(--bg)",
            borderRadius: 16,
            border: "1px solid var(--border)",
          }}
        >
          {rows.map((tx, i) => (
            <HistoryRow
              key={tx.id}
              tx={tx}
              last={i === rows.length - 1}
              timezone={family.timezone}
              locale={locale}
              showWho={
                user.role === "parent" && !selectedChild
                  ? nameMap.get(tx.user_id)
                  : undefined
              }
              actorName={tx.actor_id ? actorMap.get(tx.actor_id) : undefined}
            />
          ))}
        </div>
      )}

      {rows.length === PAGE_SIZE && last && (
        <div style={{ marginTop: 14 }}>
          <Link
            href={buildMore(last.created_at)}
            style={{
              display: "block",
              height: 40,
              lineHeight: "40px",
              width: "100%",
              borderRadius: 10,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            {t("points.more", locale)}
          </Link>
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  tx,
  last,
  timezone,
  locale,
  showWho,
  actorName,
}: {
  tx: Tx;
  last: boolean;
  timezone: string;
  locale: Locale;
  showWho?: string;
  actorName?: string;
}) {
  const meta = txMeta(tx.kind);
  const isPos = tx.amount >= 0;
  const isPenalty = tx.kind === "penalty";
  const isAdjustment = tx.kind === "adjustment";

  const whenRaw =
    tx.task_instances?.due_date ??
    formatDateInFamilyTz(tx.created_at, timezone, "yyyy-MM-dd");

  const label =
    (isPenalty ? t("points.missed_task", locale) + " · " : "") +
    (isAdjustment ? t("points.adjustment", locale) + " · " : "") +
    tx.reason;

  const source = actorName ?? "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid var(--divider)",
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          display: "flex",
          height: 32,
          width: 32,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          background: meta.bg,
          fontSize: 15,
        }}
      >
        {meta.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {showWho && <span style={{ fontWeight: 700 }}>{showWho} · </span>}
          {label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            fontWeight: 400,
            color: "var(--ink-subtle)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {whenRaw}
          {source ? ` · ${source}` : ""}
        </div>
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: isPos ? "var(--success)" : "var(--error)",
          fontFeatureSettings: '"tnum" 1',
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {isPos ? "+" : "−"}
        {Math.abs(tx.amount)} pt
      </span>
    </div>
  );
}
