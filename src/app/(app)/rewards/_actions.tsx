"use client";
import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";

interface Props {
  rewardId: string;
  cost: number;
  balance: number;
  affordLabel?: string;
  insufficientLabel?: string;
}

export function WantButton({
  rewardId,
  cost,
  balance,
  affordLabel,
  insufficientLabel,
}: Props) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const disabled = balance < cost;

  const afford = !disabled;

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

  const style: CSSProperties = {
    marginTop: 2,
    height: 36,
    width: "100%",
    borderRadius: 9999,
    border: "none",
    cursor: afford && !busy ? "pointer" : "not-allowed",
    fontSize: 12.5,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    color: "var(--on-accent)",
    background: afford
      ? "linear-gradient(135deg, #FF6B9D 0%, #FFA07A 100%)"
      : "var(--ink-disabled)",
    boxShadow: afford ? "0 8px 18px -10px rgba(255,107,157,0.35)" : "none",
    transition: "transform 200ms cubic-bezier(0.16,1,0.3,1)",
    whiteSpace: "nowrap",
    opacity: busy ? 0.7 : afford ? 1 : 0.5,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      title={disabled ? t("rewards.insufficient") : undefined}
      style={style}
    >
      {afford
        ? (affordLabel ?? t("rewards.want"))
        : (insufficientLabel ?? t("rewards.insufficient"))}
    </button>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const res = await fetch(`/api/rewards/requests/${requestId}/cancel`, {
      method: "POST",
    });
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
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        cursor: busy ? "not-allowed" : "pointer",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--ink-muted)",
        letterSpacing: "-0.01em",
        padding: "6px 4px",
        flexShrink: 0,
        textDecoration: "underline",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {t("common.cancel")}
    </button>
  );
}
