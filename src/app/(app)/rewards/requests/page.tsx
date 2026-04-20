import Link from "next/link";
import { BackButton, SectionLabel } from "@/components/atoms";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale } from "@/lib/i18n";
import { ApproveButton, RejectButton } from "./_actions";
import type { RewardRequestRow } from "@/schemas/reward";
import { nowDate } from "@/lib/datetime/clock";
import { formatDateInFamilyTz } from "@/lib/datetime/family-tz";

type Row = Pick<
  RewardRequestRow,
  | "id"
  | "reward_title_snapshot"
  | "cost_snapshot"
  | "status"
  | "requested_at"
  | "decided_at"
  | "decision_note"
  | "requested_by"
>;

const KID_EMOJIS = ["🦊", "🐻", "🐼", "🐰", "🐵", "🐯", "🦁", "🐸", "🐨", "🐶", "🐱", "🐹"];
function kidEmojiForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return KID_EMOJIS[h % KID_EMOJIS.length] ?? "🦊";
}

function fmt(ts: string, timezone: string) {
  return formatDateInFamilyTz(ts, timezone, "yyyy-MM-dd HH:mm");
}

export default async function RewardRequestsPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  if (user.role !== "parent") redirect("/rewards");

  const supabase = await createClient();

  // All child members for name lookup.
  const { data: members } = await supabase
    .from("users")
    .select("id, display_name")
    .eq("family_id", family.id)
    .eq("role", "child");
  const nameMap = new Map(
    ((members ?? []) as Array<{ id: string; display_name: string }>).map((m) => [
      m.id,
      m.display_name,
    ]),
  );

  const { data: pending } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_title_snapshot, cost_snapshot, status, requested_at, decided_at, decision_note, requested_by",
    )
    .eq("family_id", family.id)
    .eq("status", "requested")
    .order("requested_at", { ascending: true });

  const todayStart = nowDate();
  todayStart.setHours(0, 0, 0, 0);
  const { data: approvedToday } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_title_snapshot, cost_snapshot, status, requested_at, decided_at, decision_note, requested_by",
    )
    .eq("family_id", family.id)
    .eq("status", "approved")
    .gte("decided_at", todayStart.toISOString())
    .order("decided_at", { ascending: false });

  const sevenDaysAgo = nowDate();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentClosed } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_title_snapshot, cost_snapshot, status, requested_at, decided_at, decision_note, requested_by",
    )
    .eq("family_id", family.id)
    .in("status", ["rejected", "cancelled"])
    .gte("decided_at", sevenDaysAgo.toISOString())
    .order("decided_at", { ascending: false });

  const pendingRows = (pending ?? []) as Row[];
  const approvedRows = (approvedToday ?? []) as Row[];
  const closedRows = (recentClosed ?? []) as Row[];


  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 12px",
    borderRadius: 14,
    background: "var(--surface-raised)",
  };

  const emptyStyle = {
    padding: "22px 16px",
    borderRadius: 14,
    background: "var(--surface-raised)",
    textAlign: "center" as const,
    color: "var(--ink-subtle)",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "-0.01em",
  };

  return (
    <div
      className="mx-auto max-w-3xl"
      style={{        background: "var(--bg)",
        color: "var(--ink)",
        padding: "12px 20px 28px",
      }}
    >
      <div
        style={{
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          marginLeft: -8,
        }}
      >
        <BackButton href="/rewards" />
      </div>

      <h1
        style={{
          margin: "0 0 6px",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        {t("rewards.requests_title", locale)}
      </h1>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ink-subtle)",
          letterSpacing: "-0.01em",
          lineHeight: 1.45,
        }}
      >
        {t("rewards.pending", locale)}
      </p>

      {/* Pending */}
      <section style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <SectionLabel as="span">{t("rewards.pending", locale)}</SectionLabel>
          {pendingRows.length > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: 9999,
                background: "var(--accent)",
                color: "var(--on-accent)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {pendingRows.length}
            </span>
          )}
        </div>

        {pendingRows.length === 0 ? (
          <div style={emptyStyle}>{t("rewards.pending_none", locale)}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingRows.map((r) => {
              const kidName =
                nameMap.get(r.requested_by) ??
                t("rewards.child_fallback", locale);
              return (
                <div key={r.id} style={rowStyle}>
                  <span
                    aria-hidden
                    style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}
                  >
                    {kidEmojiForId(r.requested_by)}
                  </span>

                  <div
                    className="min-w-0 flex-1"
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--ink)",
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {kidName}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 400,
                          color: "var(--ink-subtle)",
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        · {fmt(r.requested_at, family.timezone)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink-subtle)",
                        letterSpacing: "-0.01em",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.reward_title_snapshot}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ink)",
                          fontFeatureSettings: '"tnum" 1',
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        · {r.cost_snapshot.toLocaleString()} pt
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <ApproveButton requestId={r.id} />
                    <RejectButton requestId={r.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Approved today */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 10 }}>
          <SectionLabel as="span">
            {t("rewards.approved_today", locale)}
          </SectionLabel>
        </div>

        {approvedRows.length === 0 ? (
          <div style={emptyStyle}>{t("rewards.approved_none", locale)}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {approvedRows.map((r) => {
              const kidName =
                nameMap.get(r.requested_by) ??
                t("rewards.child_fallback", locale);
              return (
                <HistoryRow
                  key={r.id}
                  kidName={kidName}
                  kidEmoji={kidEmojiForId(r.requested_by)}
                  rewardTitle={r.reward_title_snapshot}
                  cost={r.cost_snapshot}
                  when={fmt(
                    r.decided_at ?? r.requested_at,
                    family.timezone,
                  )}
                  statusLabel={t("rewards.approved", locale)}
                  bg="rgba(34,197,94,0.12)"
                  fg="var(--success)"
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Recent closed (rejected / cancelled) */}
      <section>
        <div style={{ marginBottom: 10 }}>
          <SectionLabel as="span">{t("rewards.closed_title", locale)}</SectionLabel>
        </div>

        {closedRows.length === 0 ? (
          <div style={emptyStyle}>{t("rewards.closed_none", locale)}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {closedRows.map((r) => {
              const kidName =
                nameMap.get(r.requested_by) ??
                t("rewards.child_fallback", locale);
              const isRejected = r.status === "rejected";
              return (
                <HistoryRow
                  key={r.id}
                  kidName={kidName}
                  kidEmoji={kidEmojiForId(r.requested_by)}
                  rewardTitle={r.reward_title_snapshot}
                  cost={r.cost_snapshot}
                  when={fmt(
                    r.decided_at ?? r.requested_at,
                    family.timezone,
                  )}
                  statusLabel={
                    isRejected
                      ? t("rewards.status_rejected", locale)
                      : t("rewards.status_cancelled", locale)
                  }
                  bg={
                    isRejected
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(107,114,128,0.12)"
                  }
                  fg={isRejected ? "var(--error)" : "var(--ink-muted)"}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryRow({
  kidName,
  kidEmoji,
  rewardTitle,
  cost,
  when,
  statusLabel,
  bg,
  fg,
}: {
  kidName: string;
  kidEmoji: string;
  rewardTitle: string;
  cost: number;
  when: string;
  statusLabel: string;
  bg: string;
  fg: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 12px",
        borderRadius: 14,
        background: "var(--surface-raised)",
      }}
    >
      <span
        aria-hidden
        style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}
      >
        {kidEmoji}
      </span>
      <div
        className="min-w-0 flex-1"
        style={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {kidName}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "var(--ink-subtle)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            · {when}
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-subtle)",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {rewardTitle}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              fontFeatureSettings: '"tnum" 1',
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            · {cost.toLocaleString()} pt
          </span>
        </div>
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "5px 10px",
          borderRadius: 9999,
          background: bg,
          color: fg,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {statusLabel}
      </span>
    </div>
  );
}
