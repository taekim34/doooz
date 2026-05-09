"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";
import { StatusBadge } from "@/components/ui/status-badge";

type TaskCheckboxProps = {
  id: string;
  title: string;
  points: number;
  status: string;
  /** Parent view: allow pardon action on pending/overdue instances. */
  canPardon?: boolean;
  /** Read-only variant — no toggle, no pardon. e.g. upcoming list for children. */
  readOnly?: boolean;
  /** Optional trailing text (e.g. D-3 countdown). */
  trailing?: string;
  /** This task was created via the beg feature. */
  isBeg?: boolean;
  /** Visual variant: "default" uses classic style, "kid-card" uses mockup card style, "parent-row" uses minimal row style. */
  variant?: "default" | "kid-card" | "parent-row";
};

export function TaskCheckbox({
  id,
  title,
  points,
  status,
  canPardon = false,
  readOnly = false,
  trailing,
  isBeg = false,
  variant = "default",
}: TaskCheckboxProps) {
  const router = useRouter();
  const t = useT();
  const [localStatus, setLocalStatus] = useState(status);
  useEffect(() => { setLocalStatus(status); }, [status]);
  const [pending, startTransition] = useTransition();

  const isDone = localStatus === "completed";
  const isPardoned = localStatus === "pardoned";
  const isOverdue = localStatus === "overdue";
  const isRejected = localStatus === "rejected";
  const isRequested = localStatus === "requested";
  const isPenalty = localStatus === "penalty";
  const isInteractive = !readOnly && !isPardoned && !isOverdue && !isRejected && !isBeg && !isRequested && !isPenalty;

  async function onToggle() {
    if (pending || !isInteractive) return;
    const prev = localStatus;
    const nextDone = !isDone;
    setLocalStatus(nextDone ? "completed" : "pending"); // optimistic
    startTransition(async () => {
      try {
        if (nextDone) {
          const res = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
          if (!res.ok) {
            setLocalStatus(prev);
            const j = await res.json().catch(() => ({}));
            toast.error(j.error || t("tasks.error_complete_failed"));
            return;
          }
          const j = (await res.json()) as {
            balance: number;
            leveledUp?: boolean;
            newBadges?: string[];
            idempotent?: boolean;
          };
          if (!j.idempotent) {
            toast.success(t("tasks.complete_success", { points: String(points), balance: String(j.balance) }));
            if (j.leveledUp) toast.success(t("tasks.level_up"));
            for (const b of j.newBadges ?? []) toast.success(t("tasks.new_badge", { badge: b }));
          }
        } else {
          const res = await fetch(`/api/tasks/${id}/uncomplete`, { method: "POST" });
          if (!res.ok) {
            setLocalStatus(prev);
            const j = await res.json().catch(() => ({}));
            toast.error(j.error || t("tasks.error_uncomplete_failed"));
            return;
          }
          const j = (await res.json()) as { balance: number };
          toast.success(t("tasks.uncomplete_success", { points: String(points), balance: String(j.balance) }));
        }
        router.refresh();
      } catch (e) {
        setLocalStatus(prev);
        toast.error((e as Error).message || t("tasks.error_network"));
      }
    });
  }

  async function onPardon() {
    if (pending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${id}/pardon`, { method: "POST" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("tasks.error_pardon_failed"));
          return;
        }
        setLocalStatus("pardoned");
        toast.success(t("tasks.pardon_success"));
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message || t("tasks.error_network"));
      }
    });
  }

  async function onUnpardon() {
    if (pending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks/${id}/unpardon`, { method: "POST" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("tasks.error_unpardon_failed"));
          return;
        }
        setLocalStatus("pending");
        toast.success(t("tasks.unpardon_success"));
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message || t("tasks.error_network"));
      }
    });
  }

  // ─── Kid Card variant (mockup style) ───
  if (variant === "kid-card") {
    return (
      <KidCardVariant
        id={id}
        title={title}
        points={points}
        localStatus={localStatus}
        isDone={isDone}
        isPardoned={isPardoned}
        isOverdue={isOverdue}
        isRejected={isRejected}
        isRequested={isRequested}
        isInteractive={isInteractive}
        isBeg={isBeg}
        readOnly={readOnly}
        pending={pending}
        trailing={trailing}
        onToggle={onToggle}
        onPardon={onPardon}
        onUnpardon={onUnpardon}
        canPardon={canPardon}
        t={t}
      />
    );
  }

  // ─── Parent Row variant ───
  if (variant === "parent-row") {
    const dotColor = isDone ? "var(--success-strong)"
      : isPenalty ? "var(--error)"
      : isOverdue ? "var(--error)"
      : isPardoned ? "var(--warning)"
      : isRequested ? "#F97316"
      : "var(--ink-disabled)";
    const statusText = isDone ? t("tasks.completed")
      : isPenalty ? t("tasks.penalty_label")
      : isOverdue ? t("tasks.missed")
      : isPardoned ? t("tasks.pardon_label")
      : t("home.status_pending");
    const statusColor = isDone ? "var(--success-strong)"
      : isPenalty ? "var(--error)"
      : isOverdue ? "var(--error)"
      : isPardoned ? "var(--warning)"
      : "var(--ink-subtle)";

    return (
      <div
        className="flex items-center gap-2.5"
        style={{
          minHeight: 52,
          padding: isPardoned ? "10px 8px" : "0 4px",
          background: isPardoned ? "#FEFCE8" : "transparent",
          borderRadius: isPardoned ? 10 : 0,
          marginBottom: isPardoned ? 6 : 0,
        }}
      >
        {/* Status dot */}
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: dotColor }}
        />
        {/* Title — clickable for toggle */}
        <button
          type="button"
          onClick={onToggle}
          disabled={pending || !isInteractive}
          className="min-w-0 flex-1 truncate text-left text-[15px] font-semibold"
          style={{
            color: isDone || isPardoned ? "var(--ink-subtle)" : "var(--ink)",
            textDecoration: isDone || isPardoned ? "line-through" : "none",
          }}
        >
          {title}
        </button>
        {/* Points */}
        <span
          className="shrink-0 whitespace-nowrap text-[13px] font-bold"
          style={{
            color: isPenalty ? "var(--error)" : isPardoned ? "var(--ink-subtle)" : "var(--ink)",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {points < 0 ? points : `+${points}`}
        </span>
        {/* Pardon action on overdue rows (parent only) */}
        {canPardon && isOverdue && (
          <button
            type="button"
            onClick={onPardon}
            disabled={pending}
            className="shrink-0 whitespace-nowrap disabled:opacity-60"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 28,
              padding: "0 10px",
              borderRadius: 9999,
              background: "var(--surface)",
              border: "1px solid #FCD34D",
              color: "#92400E",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {t("tasks.pardon")}
          </button>
        )}
        {/* Pardoned pill + unpardon */}
        {isPardoned ? (
          <>
            <span
              className="shrink-0 whitespace-nowrap"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 22,
                padding: "0 8px",
                borderRadius: 9999,
                background: "var(--warning-bg)",
                color: "#92400E",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "-0.01em",
              }}
            >
              {t("tasks.pardon_label")}
            </span>
            {canPardon && (
              <button
                type="button"
                onClick={onUnpardon}
                disabled={pending}
                className="shrink-0 whitespace-nowrap disabled:opacity-60"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: pending ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-subtle)",
                  padding: "4px 0",
                }}
              >
                {t("tasks.pardon_cancel")}
              </button>
            )}
          </>
        ) : (
          !isOverdue && (
            <span
              className="shrink-0 whitespace-nowrap text-[12px] font-semibold"
              style={{ color: statusColor, minWidth: 32, textAlign: "right" }}
            >
              {statusText}
            </span>
          )
        )}
        {/* Pending pardon action for non-overdue non-done (extra) */}
        {canPardon && !isOverdue && !isDone && !isPardoned && (
          <button
            type="button"
            onClick={onPardon}
            disabled={pending}
            className="shrink-0 rounded-full border border-yellow-300 bg-white px-2.5 py-1 text-[11px] text-yellow-800 hover:bg-yellow-50 disabled:opacity-60"
          >
            {t("tasks.pardon")}
          </button>
        )}
        {/* Chevron */}
        {!isPardoned && (
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0">
            <path d="M1 1l5 5-5 5" stroke="var(--ink-disabled)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    );
  }

  // ─── Default variant (unchanged original) ───
  const statusBadge = (() => {
    if (isBeg && isDone) {
      return (
        <StatusBadge variant="success" className="px-2 py-1">
          {t("tasks.beg_success")} +{points}
        </StatusBadge>
      );
    }
    if (isBeg && isRequested) {
      return (
        <StatusBadge variant="pending" className="px-2 py-1">
          {t("home.status_beg_pending")}
        </StatusBadge>
      );
    }
    if (isRejected) {
      return (
        <StatusBadge variant="danger" className="px-2 py-1 font-normal">
          {t("tasks.beg_failed")}
        </StatusBadge>
      );
    }
    if (isPardoned) {
      return (
        <StatusBadge variant="warning" className="px-2 py-1 font-normal">
          {t("tasks.pardon_label")}
        </StatusBadge>
      );
    }
    if (isOverdue) {
      return (
        <StatusBadge variant="danger" className="px-2 py-1 font-normal">
          {t("tasks.missed")}
        </StatusBadge>
      );
    }
    if (isPenalty) {
      return (
        <StatusBadge variant="danger" className="px-2 py-1 font-normal">
          {t("tasks.penalty_label")} {points}
        </StatusBadge>
      );
    }
    return <span className="text-sm font-semibold">+{points}</span>;
  })();

  // Read-only: chip-style label, no interactive elements
  if (readOnly) {
    const chipVariant = isDone
      ? "success" as const
      : isRejected
        ? "danger" as const
        : isOverdue
          ? "danger" as const
          : isPardoned
            ? "warning" as const
            : isRequested
              ? "pending" as const
              : "neutral" as const;
    const chipLabel = isBeg
      ? (isDone ? `${t("tasks.beg_success")} +${points}` : isRejected ? t("tasks.beg_failed") : isRequested ? t("home.status_beg_pending") : t("home.status_pending"))
      : (isDone ? t("home.status_done") : isOverdue ? t("home.status_overdue") : isPardoned ? t("home.status_pardoned") : t("home.status_pending"));
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <span className={`truncate ${isDone ? "text-muted-foreground line-through" : ""}`}>{title}</span>
        <StatusBadge variant={chipVariant} className="shrink-0 ml-3">
          {chipLabel}
        </StatusBadge>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-between gap-2 rounded-md border p-3 text-left ${
        isDone ? (isBeg ? "bg-green-50 border-green-200" : "bg-muted text-muted-foreground") : ""
      } ${isOverdue ? "border-red-200 bg-red-50" : ""} ${
        isPardoned ? "bg-yellow-50 border-yellow-200" : ""
      } ${isRejected ? "bg-red-50 border-red-200 text-muted-foreground" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={pending || !isInteractive}
        aria-label={`${title} — ${isDone ? t("home.status_done") : t("home.status_pending")}`}
        className={`flex min-w-0 flex-1 items-center gap-3 text-left ${
          isInteractive ? "hover:opacity-80" : "cursor-default"
        }`}
      >
        <span>
          {isPenalty ? "🚫" : isDone ? (isBeg ? "🎉" : "✅") : isRejected ? "❌" : isPardoned ? "🫶" : isRequested ? "⏳" : isOverdue ? (<span className="inline-block h-3 w-3 rounded-full bg-red-500" />) : "⬜"}
        </span>
        <span className={`truncate ${isDone ? "line-through" : ""}`}>{title}</span>
        {trailing && (
          <span className="ml-2 shrink-0 text-xs text-muted-foreground">
            {trailing}
          </span>
        )}
      </button>
      <div className="flex shrink-0 items-center gap-2">
        {statusBadge}
        {canPardon && (isOverdue || (!isDone && !isPardoned)) && (
          <button
            type="button"
            onClick={onPardon}
            disabled={pending}
            className="rounded-full border border-yellow-300 bg-white px-3 h-7 text-xs text-yellow-800 hover:bg-yellow-50 disabled:opacity-60"
          >
            {t("tasks.pardon")}
          </button>
        )}
        {canPardon && isPardoned && (
          <button
            type="button"
            onClick={onUnpardon}
            disabled={pending}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-60"
          >
            {t("tasks.pardon_cancel")}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Kid Card sub-component ───
function KidCardVariant({
  title,
  points,
  localStatus,
  isDone,
  isPardoned,
  isOverdue,
  isRejected,
  isRequested,
  isInteractive,
  isBeg,
  pending,
  trailing,
  onToggle,
  onPardon,
  onUnpardon,
  canPardon,
  t,
}: {
  id: string;
  title: string;
  points: number;
  localStatus: string;
  isDone: boolean;
  isPardoned: boolean;
  isOverdue: boolean;
  isRejected: boolean;
  isRequested: boolean;
  isInteractive: boolean;
  isBeg: boolean;
  readOnly: boolean;
  pending: boolean;
  trailing?: string;
  onToggle: () => void;
  onPardon: () => void;
  onUnpardon: () => void;
  canPardon: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const beg = isRequested || (isBeg && !isDone);
  const isPenalty = localStatus === "penalty";

  // Shadow logic from mockup
  let ring = "0 0 0 1.5px rgba(255,107,157,0.35)";
  if (isDone) ring = "none";
  if (isPenalty) ring = "0 0 0 1.5px rgba(239,68,68,0.5)";
  if (isOverdue) ring = "0 0 0 1.5px rgba(239,68,68,0.35)";
  if (beg) ring = "0 0 0 1.5px rgba(156,163,175,0.35)";
  if (isPardoned) ring = "0 0 0 1.5px rgba(245,158,11,0.35)";

  let shadow = `0 20px 40px -16px rgba(255,107,157,0.22), inset 0 1px 0 rgba(255,255,255,0.8), ${ring}`;
  if (isDone) shadow = "0 12px 28px -18px rgba(45,27,61,0.12), inset 0 1px 0 rgba(255,255,255,0.6)";
  if (isOverdue) shadow = `0 16px 32px -14px rgba(239,68,68,0.18), inset 0 1px 0 rgba(255,255,255,0.7), ${ring}`;
  if (beg) shadow = `0 12px 28px -18px rgba(45,27,61,0.1), inset 0 1px 0 rgba(255,255,255,0.6), ${ring}`;
  if (isPardoned) shadow = `0 12px 28px -18px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.6), ${ring}`;

  const titleColor = isDone ? "rgba(45,27,61,0.4)" : "#2D1B3D";

  // Icon slot
  const iconSlot = (() => {
    if (isDone) {
      return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "var(--accent-gradient)",
            boxShadow: "0 8px 16px -6px rgba(255,107,157,0.5), inset 0 1px 0 rgba(255,255,255,0.45)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9.5L7.5 13l7-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      );
    }
    if (isPardoned) {
      return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ background: "var(--gradient-warning)", boxShadow: "none" }}
        >
          🫶
        </span>
      );
    }
    if (beg) {
      return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ background: "linear-gradient(135deg,#F3F4F6,#E5E7EB)", boxShadow: "none" }}
        >
          🙏
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ background: "var(--gradient-error)", boxShadow: "none" }}
        >
          ⏰
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ background: "linear-gradient(135deg,#FEE2E2,#F3F4F6)", boxShadow: "none" }}
        >
          ❌
        </span>
      );
    }
    // pending
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{
          border: "1.5px dashed rgba(255,107,157,0.55)",
          background: "rgba(255,107,157,0.05)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3.5v11M3.5 9h11" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </span>
    );
  })();

  // Points / status text
  const pointsText = (() => {
    if (isPenalty) return `${points} pt`;
    if (isDone) return `+${points} pt`;
    if (beg) return t("tasks.beg_waiting");
    if (isPardoned) return t("tasks.pardon_label");
    if (isRejected) return t("tasks.beg_failed");
    return `+${points} pt`;
  })();

  const pointsColor = isPenalty
    ? "var(--error)"
    : (isDone || (!beg && !isPardoned && !isRejected))
    ? "#FF6B9D"
    : beg ? "rgba(45,27,61,0.5)"
    : isPardoned ? "var(--warning)"
    : "var(--ink-subtle)";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending || !isInteractive}
      className="relative flex w-full items-center gap-4 border-none text-left"
      style={{
        background: "var(--surface)",
        padding: 16,
        borderRadius: 22,
        cursor: isInteractive ? "pointer" : "default",
        boxShadow: shadow,
        opacity: pending ? 0.7 : 1,
        transition: "opacity 200ms",
      }}
    >
      {iconSlot}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[17px] font-semibold"
            style={{
              color: titleColor,
              textDecoration: isDone ? "line-through" : "none",
            }}
          >
            {title}
          </span>
          {isOverdue && (
            <span className="whitespace-nowrap rounded-full text-[11px] font-bold"
              style={{
                color: "var(--error-strong)",
                background: "var(--error-bg)",
                padding: "2px 8px",
              }}
            >
              ⏰ {t("tasks.missed")}
            </span>
          )}
          {trailing && (
            <span className="whitespace-nowrap text-[12px] font-medium text-[rgba(45,27,61,0.45)]">
              {trailing}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[13px] font-bold" style={{ color: pointsColor, fontFeatureSettings: '"tnum" 1' }}>
          {pointsText}
        </div>
      </div>

      {/* Pardon / unpardon actions for parent */}
      {canPardon && (isOverdue || (!isDone && !isPardoned)) && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPardon(); }}
          disabled={pending}
          className="shrink-0 rounded-full border border-yellow-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-yellow-800 hover:bg-yellow-50 disabled:opacity-60"
        >
          {t("tasks.pardon")}
        </button>
      )}
      {canPardon && isPardoned && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUnpardon(); }}
          disabled={pending}
          className="shrink-0 text-[11px] text-gray-500 hover:text-gray-700 disabled:opacity-60"
        >
          {t("tasks.pardon_cancel")}
        </button>
      )}

      {/* Chevron for actionable items */}
      {!isDone && !beg && !isPardoned && !isRejected && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(45,27,61,0.04)" }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M2 2l5 5-5 5" stroke="#2D1B3D" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  );
}
