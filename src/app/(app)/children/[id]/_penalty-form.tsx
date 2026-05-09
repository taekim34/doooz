"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/useT";

export function PenaltyForm({ childId }: { childId: string }) {
  const router = useRouter();
  const t = useT();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function submit() {
    const pts = Number(amount);
    if (!reason.trim() || !pts || pts < 1) return;
    setLoading(true);
    const res = await fetch("/api/points/penalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: childId, reason: reason.trim(), amount: pts }),
    });
    setLoading(false);
    if (res.ok) {
      setReason("");
      setAmount("");
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        {t("children.give_penalty")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3">
      <Input
        placeholder={t("children.penalty_reason_placeholder")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={200}
      />
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder={t("children.penalty_points_placeholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          max={10000}
          className="w-28"
        />
        <Button
          size="sm"
          variant="destructive"
          disabled={loading || !reason.trim() || !Number(amount)}
          onClick={submit}
        >
          {loading ? "..." : t("children.penalty_submit")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
