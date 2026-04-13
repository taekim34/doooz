"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/useT";

interface Props {
  rewardId: string;
  cost: number;
  balance: number;
}

export function WantButton({ rewardId, cost, balance }: Props) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const disabled = balance < cost;

  async function onClick() {
    setBusy(true);
    const res = await fetch("/api/rewards/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reward_id: rewardId }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      if (String(j.error || "").includes("INSUFFICIENT_BALANCE")) {
        toast.error(t("rewards.insufficient"));
      } else {
        toast.error(j.error || t("rewards.request_fail"));
      }
      return;
    }
    toast.success(t("rewards.request_success"));
    router.refresh();
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled || busy}
      title={disabled ? t("rewards.insufficient") : undefined}
    >
      {t("rewards.want")}
    </Button>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const res = await fetch(`/api/rewards/requests/${requestId}/cancel`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || t("rewards.cancel_fail"));
      return;
    }
    toast.success(t("rewards.cancel_success"));
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={onClick}>
      {t("common.cancel")}
    </Button>
  );
}
