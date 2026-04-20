"use client";
import { useState } from "react";
import { LEVEL_THRESHOLDS, getLevelTitle } from "@/lib/level";
import { useT } from "@/lib/i18n/useT";

const ACCENT = "#FF6B9D";

export function LevelTable({ currentLevel }: { currentLevel: number }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          background: "transparent",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--ink-muted)",
          letterSpacing: "-0.01em",
        }}
      >
        <span>
          {open ? t("characters.level_close") : t("characters.level_view")}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        >
          <path
            d="M3 6l5 5 5-5"
            stroke="var(--ink-muted)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          style={{
            marginTop: 0,
            padding: "6px 4px 4px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.8)",
            overflow: "hidden",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {LEVEL_THRESHOLDS.map((threshold, i) => {
            const level = i + 1;
            const isCurrent = level === currentLevel;
            return (
              <div
                key={level}
                style={{
                  display: "grid",
                  gridTemplateColumns: "54px 1fr auto",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderBottom:
                    i === LEVEL_THRESHOLDS.length - 1
                      ? "none"
                      : "1px solid rgba(10,10,10,0.04)",
                  background: isCurrent ? "rgba(255,107,157,0.08)" : "transparent",
                  borderRadius: isCurrent ? 8 : 0,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--ink)",
                    fontFeatureSettings: '"tnum" 1',
                    letterSpacing: "-0.01em",
                  }}
                >
                  Lv.{level}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {getLevelTitle(level, t)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: ACCENT,
                    fontFeatureSettings: '"tnum" 1',
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {threshold.toLocaleString()} pt
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
