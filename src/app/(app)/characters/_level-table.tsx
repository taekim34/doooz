"use client";
import { useState } from "react";
import {
  TITLE_THRESHOLDS,
  TITLE_COUNT,
  calculateLevel,
  getLevelTitle,
  getTitleTier,
} from "@/lib/level";
import { useT } from "@/lib/i18n/useT";

export function LevelTable({ currentLifetime }: { currentLifetime: number }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  const currentTier = getTitleTier(currentLifetime);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between rounded-xl border-none bg-transparent px-3.5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-[color:var(--ink-muted)]"
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
          className="mt-0 max-h-[360px] overflow-hidden overflow-y-auto rounded-[14px] border border-[rgba(255,255,255,0.8)] px-1 pt-1.5 pb-1"
          style={{ background: "rgba(255,255,255,0.7)" }}
        >
          {TITLE_THRESHOLDS.map((threshold, i) => {
            const tier = i + 1;
            const tierLevel = calculateLevel(threshold);
            const isCurrent = tier === currentTier;
            return (
              <div
                key={tier}
                className="grid items-center gap-2"
                style={{
                  gridTemplateColumns: "60px 1fr auto",
                  padding: "10px 12px",
                  borderBottom:
                    i === TITLE_COUNT - 1
                      ? "none"
                      : "1px solid rgba(10,10,10,0.04)",
                  background: isCurrent ? "rgba(255,107,157,0.08)" : "transparent",
                  borderRadius: isCurrent ? 8 : 0,
                }}
              >
                <span
                  className="text-xs font-extrabold tracking-[-0.01em] text-[color:var(--ink)]"
                  style={{ fontFeatureSettings: '"tnum" 1' }}
                >
                  Lv.{tierLevel}
                </span>
                <span className="text-[13px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
                  {getLevelTitle(tier, t)}
                </span>
                <span
                  className="whitespace-nowrap text-xs font-bold tracking-[-0.01em] text-[#FF6B9D]"
                  style={{ fontFeatureSettings: '"tnum" 1' }}
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
