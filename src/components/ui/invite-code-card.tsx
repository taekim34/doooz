"use client";
import { useState, useCallback } from "react";

export function InviteCodeCard({
  code,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [code]);

  return (
    <div
      className="flex items-center justify-between rounded-lg p-4"
      style={{
        background: "var(--card)",
        border: "1.5px dashed var(--border, #E5E7EB)",
      }}
    >
      <span
        className="text-2xl font-extrabold tracking-widest"
        style={{ color: "var(--accent-color)" }}
      >
        {code}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-md p-2 text-sm transition-colors hover:bg-[color:var(--card)]"
        style={{ color: "var(--muted)" }}
      >
        {copied ? "✓" : "📋"} {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
