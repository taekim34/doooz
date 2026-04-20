"use client";
import { useState } from "react";
import { toast } from "sonner";

export function CopyButton({
  code,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(copiedLabel);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex items-center justify-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-[color:var(--border)] bg-[color:var(--surface-raised)] p-5">
      <span className="whitespace-nowrap text-2xl font-extrabold tracking-[0.08em] text-[#FF6B9D]" style={{ fontFeatureSettings: '"tnum" 1' }}>
        {code}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copyLabel}
        className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] transition-[background] duration-150"
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke="var(--success)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <rect
              x="4"
              y="4"
              width="9"
              height="9"
              rx="2"
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
            <path
              d="M3 10V4a1 1 0 0 1 1-1h6"
              stroke="var(--ink)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
