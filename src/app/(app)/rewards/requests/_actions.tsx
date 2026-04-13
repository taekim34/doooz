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
    <Button size="sm" disabled={busy} onClick={onClick}>
      {t("rewards.approve_button")}
    </Button>
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
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("rewards.reject_button")}
      </Button>
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
