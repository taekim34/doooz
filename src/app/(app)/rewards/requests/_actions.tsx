"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n/useT";

export function ApproveButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const res = await fetch(`/api/rewards/requests/${requestId}/approve`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      if (String(j.error || "").includes("INSUFFICIENT_BALANCE")) {
        toast.error(t("rewards.child_insufficient"));
      } else {
        toast.error(j.error || t("rewards.approve_fail"));
      }
      return;
    }
    toast.success(t("rewards.approve_success"));
    router.refresh();
  }

  return (
    <button
      type="button"
      aria-label={t("rewards.approve_button")}
      disabled={busy}
      onClick={onClick}
      className="flex items-center justify-center h-8 w-8 rounded-full bg-[color:var(--success)] border-none cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        boxShadow: "0 6px 14px -8px rgba(34,197,94,0.5)",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path
          d="M3.5 8.5l3 3 6-7"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function RejectButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const res = await fetch(`/api/rewards/requests/${requestId}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || t("rewards.reject_fail"));
      return;
    }
    toast.success(t("rewards.reject_success"));
    setOpen(false);
    setNote("");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("rewards.reject_button")}
        onClick={() => setOpen(true)}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-[color:var(--surface-sunken)] border-none cursor-pointer shrink-0"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="var(--ink-muted)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rewards.reject_dialog_title")}</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder={t("rewards.reject_placeholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={busy} onClick={submit}>
              {t("rewards.reject_confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
