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
  const isInteractive = !readOnly && !isPardoned && !isOverdue && !isRejected && !isBeg && !isRequested;

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
          {t("tasks.pardon")}
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
        isPardoned ? "bg-yellow-50" : ""
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
          {isDone ? (isBeg ? "🎉" : "✅") : isRejected ? "❌" : isPardoned ? "🫶" : isRequested ? "⏳" : isOverdue ? "⚠️" : "⬜"}
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
            className="rounded-md border border-yellow-300 bg-white px-2 py-1 text-xs text-yellow-800 hover:bg-yellow-50 disabled:opacity-60"
          >
            {t("tasks.pardon")}
          </button>
        )}
        {canPardon && isPardoned && (
          <button
            type="button"
            onClick={onUnpardon}
            disabled={pending}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            {t("tasks.pardon_cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
