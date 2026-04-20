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

  const chipBase = "flex items-center gap-1.5 h-8 px-3.5 rounded-full cursor-pointer text-[13px] font-bold tracking-[-0.01em] border-none transition-colors whitespace-nowrap shrink-0";
  const chipStyle = (on: boolean): CSSProperties => ({
    color: on ? "var(--on-accent)" : "var(--ink-muted)",
    background: on ? "var(--ink)" : "var(--surface-sunken)",
  });

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">

      {/* Child filter chips (parent only) */}
      {isParent && childList.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => push({ child: null })}
            className={chipBase}
            style={chipStyle(!currentChildId)}
          >
            {t("tasks.filter_all")}
          </button>
          {childList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => push({ child: c.id })}
              className={chipBase}
              style={chipStyle(currentChildId === c.id)}
            >
              {c.display_name}
            </button>
          ))}
        </>
      )}

      {/* Calendar date picker — native input with mockup pill styling */}
      <label
        className="inline-flex items-center h-8 px-3 rounded-full bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] cursor-pointer shrink-0"
      >
        <input
          type="date"
          value={currentDate}
          onChange={(e) => push({ date: e.target.value })}
          className="border-none outline-none bg-transparent text-[12px] font-semibold text-[color:var(--ink)] cursor-pointer p-0"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        />
      </label>
    </div>
  );
}
