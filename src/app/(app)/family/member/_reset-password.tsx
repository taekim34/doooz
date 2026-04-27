"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/useT";

export function ResetPasswordButton({ userId, memberName }: { userId: string; memberName: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function handleReset() {
    if (password.length < 4) {
      toast.error(t("settings.member_password_min"));
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, newPassword: password }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error(j.error || t("common.failed"));
          return;
        }
        toast.success(t("settings.member_password_reset_ok").replace("{name}", memberName));
        setOpen(false);
        setPassword("");
      } catch {
        toast.error(t("common.network_error"));
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[color:var(--accent)]"
      >
        {t("settings.member_password_reset_button")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-[color:var(--border-subtle)] bg-[color:var(--surface-raised)] p-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ink-subtle)]">
        {t("settings.member_password_reset_label").replace("{name}", memberName)}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("settings.member_password_placeholder")}
          className="h-10 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleReset}
          disabled={pending}
          className="h-10 shrink-0 rounded-lg bg-[color:var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "..." : t("common.change")}
        </button>
      </div>
      <button
        type="button"
        onClick={() => { setOpen(false); setPassword(""); }}
        className="text-xs text-[color:var(--ink-subtle)]"
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}
