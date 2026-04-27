"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/useT";

export function BegActions({ id }: { id: string }) {
  const router = useRouter();
  const t = useT();
  const [points, setPoints] = useState("");
  const [approving, startApprove] = useTransition();
  const [rejecting, startReject] = useTransition();

  function approve() {
    const pts = Number(points);
    if (!pts || pts < 1) return;
    startApprove(async () => {
      try {
        const res = await fetch(`/api/tasks/beg/${id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: pts }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("tasks.error_approve_failed"));
          return;
        }
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message || t("tasks.error_network"));
      }
    });
  }

  function reject() {
    startReject(async () => {
      try {
        const res = await fetch(`/api/tasks/beg/${id}/reject`, { method: "POST" });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("tasks.error_reject_failed"));
          return;
        }
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message || t("tasks.error_network"));
      }
    });
  }

  const busy = approving || rejecting;

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <Input
          type="number"
          min={1}
          max={10000}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          placeholder={t("tasks.points_label")}
          className="w-24 pr-7 text-sm"
          disabled={busy}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">pt</span>
      </div>
      <Button
        size="sm"
        onClick={approve}
        disabled={busy || !points}
        aria-busy={approving}
      >
        {t("common.approve")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={reject}
        disabled={busy}
        aria-busy={rejecting}
      >
        {t("common.reject")}
      </Button>
    </div>
  );
}
