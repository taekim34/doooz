"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, type CSSProperties } from "react";
import { useT } from "@/lib/i18n/useT";

type Child = { id: string; display_name: string };

export function HistoryControls({
  childList,
  currentChildId,
  currentDate,
  isParent,
}: {
  childList: Child[];
  currentChildId: string | null;
  currentDate: string;
  isParent: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const push = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(overrides)) {
        if (v === null) params.delete(k);
        else params.set(k, v);
      }
      router.push(`/tasks/history?${params.toString()}`);
    },
    [router, searchParams],
  );

  const chipStyle = (on: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 32,
    padding: "0 14px",
    borderRadius: 9999,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: on ? "var(--on-accent)" : "var(--ink-muted)",
    background: on ? "var(--ink)" : "var(--surface-sunken)",
    border: "none",
    transition: "background 160ms, color 160ms",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  return (
    <div
      style={{
        marginTop: 12,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* Child filter chips (parent only) */}
      {isParent && childList.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => push({ child: null })}
            style={chipStyle(!currentChildId)}
          >
            {t("tasks.filter_all")}
          </button>
          {childList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => push({ child: c.id })}
              style={chipStyle(currentChildId === c.id)}
            >
              {c.display_name}
            </button>
          ))}
        </>
      )}

      {/* Calendar date picker — native input with mockup pill styling */}
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 32,
          padding: "0 12px",
          borderRadius: 9999,
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <input
          type="date"
          value={currentDate}
          onChange={(e) => push({ date: e.target.value })}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink)",
            cursor: "pointer",
            padding: 0,
            fontFeatureSettings: '"tnum" 1',
          }}
        />
      </label>
    </div>
  );
}
