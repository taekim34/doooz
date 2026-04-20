import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale } from "@/lib/i18n";
import { formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import Link from "next/link";
import { BackButton } from "@/components/atoms";
import { WantButton, CancelRequestButton } from "./_actions";
import type { RewardRequestRow, RewardRequestStatus } from "@/schemas/reward";

const STATUS_KEYS: Record<RewardRequestStatus, string> = {
  requested: "rewards.waiting",
  approved: "rewards.approved",
  rejected: "rewards.rejected",
  cancelled: "rewards.cancelled",
};

const STATUS_META: Record<
  RewardRequestStatus,
  { icon: string; bg: string; fg: string }
> = {
  requested: { icon: "⏳", bg: "var(--surface-sunken)", fg: "var(--ink-muted)" },
  approved: { icon: "🎉", bg: "rgba(34,197,94,0.14)", fg: "var(--success)" },
  rejected: { icon: "❌", bg: "rgba(239,68,68,0.12)", fg: "var(--error)" },
  cancelled: { icon: "•", bg: "var(--surface-sunken)", fg: "var(--ink-muted)" },
};

import { emojiForTitle } from "@/features/rewards/emoji";

export default async function RewardsPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  // Parents have a dedicated approvals view.
  if (user.role === "parent") redirect("/rewards/requests");

  const supabase = await createClient();

  const { data: rewards } = await supabase
    .from("rewards")
    .select("id, title, cost")
    .eq("family_id", family.id)
    .eq("active", true)
    .order("cost");

  const { data: myRequests } = await supabase
    .from("reward_requests")
    .select(
      "id, reward_id, reward_title_snapshot, cost_snapshot, status, requested_at, decision_note",
    )
    .eq("requested_by", user.id)
    .order("requested_at", { ascending: false })
    .limit(30);

  const list = (rewards ?? []) as Array<{ id: string; title: string; cost: number }>;
  const requests = (myRequests ?? []) as Array<
    Pick<
      RewardRequestRow,
      "id" | "reward_id" | "reward_title_snapshot" | "cost_snapshot" | "status" | "requested_at" | "decision_note"
    >
  >;

  return (
    <div
      className="relative mx-auto max-w-3xl rounded-3xl px-5 pt-5 pb-7 text-[color:var(--ink)]"
      style={{
        background:
          "linear-gradient(180deg, #FFF5EC 0%, #FFE4E9 40%, #E5EFFF 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <BackButton href="/" variant="glass" />
          <h1 className="m-0 text-xl font-extrabold tracking-tight whitespace-nowrap">

            {t("rewards.title", locale)}
          </h1>
        </div>
        <div
          className="inline-flex items-center gap-1.5"
          style={{
            height: 34,
            padding: "0 12px 0 10px",
            borderRadius: 9999,
            background: "var(--surface)",
            border: "1px solid rgba(255,107,157,0.25)",
            boxShadow: "0 4px 14px -6px rgba(10,10,10,0.08)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span
            aria-hidden
            className="flex items-center justify-center"
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: "var(--accent-gradient)",
              fontSize: 10,
              color: "#fff",
              fontWeight: 800,
            }}
          >
            ★
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--accent)",
              fontFeatureSettings: '"tnum" 1',
              letterSpacing: "-0.01em",
            }}
          >
            {user.current_balance.toLocaleString()} pt
          </span>
        </div>
      </div>

      {/* Rewards grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">

        {list.map((r, index) => {
          const afford = user.current_balance >= r.cost;
          return (
            <div
              key={r.id}
              className="animate-dzTlRise flex flex-col items-center"
              style={{
                opacity: 0,
                animationDelay: `${index * 40}ms`,
                padding: "18px 14px 14px",
                background: "var(--surface)",
                borderRadius: 22,
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow:
                  "0 14px 32px -20px rgba(10,10,10,0.18), 0 2px 4px rgba(10,10,10,0.04)",
                gap: 8,
              }}
            >
              <span
                aria-hidden
                style={{
                  fontSize: 40,
                  lineHeight: 1,
                  marginTop: 4,
                  filter: afford ? "none" : "grayscale(0.3)",
                  opacity: afford ? 1 : 0.7,
                }}
              >
                {emojiForTitle(r.title)}
              </span>
              <div
                className="text-center"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: afford ? "var(--accent)" : "var(--ink-subtle)",
                  fontFeatureSettings: '"tnum" 1',
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {r.cost.toLocaleString()} pt
              </div>
              <WantButton
                rewardId={r.id}
                cost={r.cost}
                balance={user.current_balance}
                affordLabel={t("rewards.want", locale)}
                insufficientLabel={t("rewards.insufficient", locale)}
              />
              {!afford && (
                <span className="sr-only">
                  {t("rewards.insufficient", locale)}
                </span>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <p
            className="col-span-2"
            style={{ fontSize: 13, color: "var(--ink-subtle)", letterSpacing: "-0.01em" }}
          >
            {t("rewards.none", locale)}
          </p>
        )}
      </div>

      {/* My requests */}
      <div className="mt-6 mb-2.5">
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--ink-subtle)",
            letterSpacing: "0.15em",
          }}
        >
          {t("rewards.my_requests", locale)}
        </div>
      </div>
      <div
        style={{
          padding: "4px 14px",
          background: "var(--surface)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow:
            "0 10px 28px -20px rgba(10,10,10,0.14), 0 1px 2px rgba(10,10,10,0.03)",
        }}
      >
        {requests.length === 0 && (
          <div
            className="text-center"
            style={{
              padding: "18px 8px",
              color: "var(--ink-subtle)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            {t("rewards.no_requests", locale)}
          </div>
        )}
        {requests.map((r, i) => {
          const meta = STATUS_META[r.status];
          return (
            <div
              key={r.id}
              className="animate-dzTlRise flex items-center"
              style={{
                opacity: 0,
                animationDelay: `${i * 40}ms`,
                gap: 12,
                padding: "14px 0",
                borderBottom:
                  i === requests.length - 1 ? "none" : "1px solid var(--divider)",
              }}
            >
              <div
                className="min-w-0 flex-1"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.reward_title_snapshot}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: "var(--ink-subtle)",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.cost_snapshot.toLocaleString()} pt ·{" "}
                  {formatDateInFamilyTz(
                    r.requested_at,
                    family.timezone,
                    "yyyy-MM-dd HH:mm",
                  )}
                </div>
                {r.decision_note && r.status === "rejected" && (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 11.5,
                      color: "var(--ink-subtle)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t("rewards.note", locale)}: {r.decision_note}
                  </div>
                )}
              </div>
              <span
                className="inline-flex items-center"
                style={{
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 9999,
                  background: meta.bg,
                  color: meta.fg,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span aria-hidden>{meta.icon}</span>
                <span>{t(STATUS_KEYS[r.status], locale)}</span>
              </span>
              {r.status === "requested" && (
                <CancelRequestButton requestId={r.id} />
              )}
            </div>
          );
        })}
      </div>

      <div
        className="mt-4"
        style={{
          fontSize: 12,
          color: "var(--ink-subtle)",
          letterSpacing: "-0.01em",
        }}
      >
        <Link
          href="/points/history"
          className="underline"
          style={{ color: "var(--ink-subtle)" }}
        >
          {t("rewards.view_points", locale)}
        </Link>
      </div>
    </div>
  );
}
