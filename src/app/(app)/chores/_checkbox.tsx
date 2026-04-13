"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";

type ChoreCheckboxProps = {
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
  /** This chore was created via the beg feature. */
  isBeg?: boolean;
};

export function ChoreCheckbox({
  id,
  title,
  points,
  status,
  canPardon = false,
  readOnly = false,
  trailing,
  isBeg = false,
}: ChoreCheckboxProps) {
  const router = useRouter();
  const t = useT();
  const [localStatus, setLocalStatus] = useState(status);
  const [pending, startTransition] = useTransition();

  const isDone = localStatus === "completed";
  const isPardoned = localStatus === "pardoned";
  const isOverdue = localStatus === "overdue";
  const isRejected = localStatus === "rejected";
  const isInteractive = !readOnly && !isPardoned && !isOverdue && !isRejected && !isBeg;

  async function onToggle() {
    if (pending || !isInteractive) return;
    const prev = localStatus;
    const nextDone = !isDone;
    setLocalStatus(nextDone ? "completed" : "pending"); // optimistic
    startTransition(async () => {
      try {
        if (nextDone) {
          const res = await fetch(`/api/chores/${id}/complete`, { method: "POST" });
          if (!res.ok) {
            setLocalStatus(prev);
            const j = await res.json().catch(() => ({}));
            toast.error(j.error || t("chores.error_complete_failed"));
            return;
          }
          const j = (await res.json()) as {
            balance: number;
            leveledUp?: boolean;
            newBadges?: string[];
            idempotent?: boolean;
          };
          if (!j.idempotent) {
            toast.success(t("chores.complete_success", { points: String(points), balance: String(j.balance) }));
            if (j.leveledUp) toast.success(t("chores.level_up"));
            for (const b of j.newBadges ?? []) toast.success(t("chores.new_badge", { badge: b }));
          }
        } else {
          const res = await fetch(`/api/chores/${id}/uncomplete`, { method: "POST" });
          if (!res.ok) {
            setLocalStatus(prev);
            const j = await res.json().catch(() => ({}));
            toast.error(j.error || t("chores.error_uncomplete_failed"));
            return;
          }
          const j = (await res.json()) as { balance: number };
          toast.success(t("chores.uncomplete_success", { points: String(points), balance: String(j.balance) }));
        }
        router.refresh();
      } catch (e) {
        setLocalStatus(prev);
        toast.error((e as Error).message || t("chores.error_network"));
      }
    });
  }

  async function onPardon() {
    if (pending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/chores/${id}/pardon`, { method: "POST" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("chores.error_pardon_failed"));
          return;
        }
        setLocalStatus("pardoned");
        toast.success(t("chores.pardon_success"));
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message || t("chores.error_network"));
      }
    });
  }

  async function onUnpardon() {
    if (pending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/chores/${id}/unpardon`, { method: "POST" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("chores.error_unpardon_failed"));
          return;
        }
        setLocalStatus("pending");
        toast.success(t("chores.unpardon_success"));
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message || t("chores.error_network"));
      }
    });
  }

  const statusBadge = (() => {
    if (isBeg && isDone) {
      return (
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          {t("chores.beg_success")} +{points}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
          {t("chores.beg_failed")}
        </span>
      );
    }
    if (isPardoned) {
      return (
        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
          {t("chores.pardon")}
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
          {t("chores.missed")}
        </span>
      );
    }
    return <span className="text-sm font-semibold">+{points}</span>;
  })();

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
        className={`flex min-w-0 flex-1 items-center gap-3 text-left ${
          isInteractive ? "hover:opacity-80" : "cursor-default"
        }`}
      >
        <span>
          {isDone ? (isBeg ? "🎉" : "✅") : isRejected ? "❌" : isPardoned ? "🫶" : isOverdue ? "⚠️" : "⬜"}
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
            {t("chores.pardon")}
          </button>
        )}
        {canPardon && isPardoned && (
          <button
            type="button"
            onClick={onUnpardon}
            disabled={pending}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            {t("chores.pardon_cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
