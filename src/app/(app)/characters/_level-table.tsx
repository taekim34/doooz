"use client";
import { useState } from "react";
import { STAGE_INFO, calculateLevel, getStage, getStageTitle } from "@/lib/level";
import { useT } from "@/lib/i18n/useT";

export function LevelTable({ currentLifetime }: { currentLifetime: number }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const currentLevel = calculateLevel(currentLifetime);
  const currentStage = getStage(currentLevel);

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
          className="mt-0 overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.8)] px-1 pt-1.5 pb-1"
          style={{ background: "rgba(255,255,255,0.7)" }}
        >
          {STAGE_INFO.map((s, i) => {
            const isCurrent = s.stage === currentStage;
            const range = s.maxLevel === null
              ? `Lv.${s.minLevel}+`
              : `Lv.${s.minLevel}–${s.maxLevel}`;
            return (
              <div
                key={s.stage}
                className="grid items-center gap-2"
                style={{
                  gridTemplateColumns: "32px 1fr auto",
                  padding: "12px 14px",
                  borderBottom:
                    i === STAGE_INFO.length - 1
                      ? "none"
                      : "1px solid rgba(10,10,10,0.04)",
                  background: isCurrent ? "rgba(255,107,157,0.08)" : "transparent",
                  borderRadius: isCurrent ? 8 : 0,
                }}
              >
                <span aria-hidden className="text-[20px] leading-none">
                  {s.icon}
                </span>
                <span className="text-[14px] font-bold tracking-[-0.01em] text-[color:var(--ink)]">
                  {getStageTitle(s.stage, t)}
                </span>
                <span
                  className="whitespace-nowrap text-xs font-bold tracking-[-0.01em] text-[#FF6B9D]"
                  style={{ fontFeatureSettings: '"tnum" 1' }}
                >
                  {range}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
