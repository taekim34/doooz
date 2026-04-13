"use client";
import { useState } from "react";
import { LEVEL_THRESHOLDS, getLevelTitle } from "@/lib/level";
import { useT } from "@/lib/i18n/useT";

export function LevelTable({ currentLevel }: { currentLevel: number }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-primary underline"
      >
        {open ? t("characters.level_close") : t("characters.level_view")}
      </button>
      {open && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded border text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-2 py-1 text-left">{t("characters.level_col")}</th>
                <th className="px-2 py-1 text-left">{t("characters.title_col")}</th>
                <th className="px-2 py-1 text-right">{t("characters.points_col")}</th>
              </tr>
            </thead>
            <tbody>
              {LEVEL_THRESHOLDS.map((threshold, i) => {
                const level = i + 1;
                const isCurrent = level === currentLevel;
                return (
                  <tr
                    key={level}
                    className={isCurrent ? "bg-primary/10 font-semibold" : ""}
                  >
                    <td className="px-2 py-1">Lv.{level}</td>
                    <td className="px-2 py-1">{getLevelTitle(level, t)}</td>
                    <td className="px-2 py-1 text-right">{threshold.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
