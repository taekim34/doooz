"use client";
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";

export function OnboardingAccordion({
  joinLabel,
  joinSub,
  createLabel,
  createSub,
}: {
  joinLabel: string;
  joinSub: string;
  createLabel: string;
  createSub: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mx-auto flex items-center gap-1 text-sm font-medium"
        style={{ color: "#9CA3AF" }}
      >
        {open ? "처음이신가요? ▴" : "처음이신가요? ▾"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2 animate-rise">
          {/* 초대코드로 참여하기 — coral primary (아이 진입점) */}
          <Link
            href={"/join" as Route}
            className="flex w-full items-center gap-3 rounded-[14px] px-4 transition-spring hover:translate-y-[-1px]"
            style={{
              height: 56,
              background: "#FF6B7A",
              boxShadow: "0 4px 12px -4px rgba(255,107,122,0.4)",
            }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              🔗
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-white">{joinLabel}</div>
              <div className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{joinSub}</div>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0">
              <path d="M1 1l5 5-5 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          {/* 새 가족 만들기 — white secondary (부모용) */}
          <Link
            href={"/signup" as Route}
            className="flex w-full items-center gap-3 rounded-[14px] px-4 transition-spring hover:translate-y-[-1px]"
            style={{
              height: 56,
              background: "#FFFFFF",
              border: "1px solid #E5E5E5",
            }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
              style={{ background: "#F5F5F5" }}
            >
              👨‍👩‍👧‍👦
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold" style={{ color: "#0A0A0A" }}>{createLabel}</div>
              <div className="text-[12px] font-medium" style={{ color: "#9CA3AF" }}>{createSub}</div>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="shrink-0">
              <path d="M1 1l5 5-5 5" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
