"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type InviteCodeCardProps = {
  code: string;
  className?: string;
};

export function InviteCodeCard({ code, className }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-[14px] px-6 py-5",
        className,
      )}
      style={{
        border: "1.5px dashed color-mix(in srgb, var(--ink-subtle) 40%, transparent)",
        background: "color-mix(in srgb, var(--surface-raised) 60%, transparent)",
      }}
    >
      {/* Code display */}
      <span
        className="select-all font-mono text-[28px] font-extrabold tracking-[0.1em]"
        style={{ color: "var(--accent)" }}
      >
        {code}
      </span>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy invite code"
        className="flex items-center gap-2 rounded-[10px] px-4 py-2 text-[14px] font-semibold transition-all"
        style={{
          background: copied
            ? "color-mix(in srgb, #22C55E 10%, transparent)"
            : "color-mix(in srgb, var(--ink) 5%, transparent)",
          color: copied ? "var(--success)" : "var(--ink)",
          border: `1px solid ${copied ? "color-mix(in srgb, #22C55E 25%, transparent)" : "color-mix(in srgb, var(--ink) 10%, transparent)"}`,
        }}
      >
        {copied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3.5 8.5l3 3 6-7"
                stroke="var(--success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            복사됨!
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect
                x="4"
                y="4"
                width="9"
                height="9"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M3 10V4a1 1 0 0 1 1-1h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}
