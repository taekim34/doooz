"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function ResetPasswordButton({ userId, memberName }: { userId: string; memberName: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  function handleReset() {
    if (password.length < 4) {
      toast.error("비밀번호는 4자 이상이어야 합니다");
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
          toast.error(j.error || "실패했습니다");
          return;
        }
        toast.success(`${memberName}의 비밀번호가 초기화되었습니다`);
        setOpen(false);
        setPassword("");
      } catch {
        toast.error("네트워크 오류");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium"
        style={{ color: "#6366F1" }}
      >
        비밀번호 초기화
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-[10px] p-3" style={{ background: "#FAFAFA", border: "1px solid #F0F0F0" }}>
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
        {memberName}의 새 비밀번호
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="새 비밀번호 (4자 이상)"
          className="h-10 flex-1 rounded-lg px-3 text-sm outline-none"
          style={{ background: "#fff", border: "1px solid #E5E5E5" }}
        />
        <button
          type="button"
          onClick={handleReset}
          disabled={pending}
          className="h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#0A0A0A" }}
        >
          {pending ? "..." : "변경"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => { setOpen(false); setPassword(""); }}
        className="text-xs" style={{ color: "#9CA3AF" }}
      >
        취소
      </button>
    </div>
  );
}
