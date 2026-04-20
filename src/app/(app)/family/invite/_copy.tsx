"use client";
import { useState } from "react";
import { toast } from "sonner";

const ACCENT = "#FF6B9D";

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
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        background: "var(--surface-raised)",
        border: "1.5px dashed var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: ACCENT,
          letterSpacing: "0.08em",
          fontFeatureSettings: '"tnum" 1',
          whiteSpace: "nowrap",
        }}
      >
        {code}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copyLabel}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 40,
          width: 40,
          borderRadius: 10,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 150ms ease",
        }}
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
