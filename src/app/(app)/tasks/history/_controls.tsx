"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Calendar date picker */}
      <input
        type="date"
        value={currentDate}
        onChange={(e) => push({ date: e.target.value })}
        className="rounded-md border px-3 py-2 text-sm"
      />

      {/* Child tabs (parent only) */}
      {isParent && childList.length > 0 && (
        <div className="flex gap-1 rounded-md border p-1">
          <button
            type="button"
            onClick={() => push({ child: null })}
            className={`rounded px-3 py-1 text-sm ${
              !currentChildId ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {t("tasks.filter_all")}
          </button>
          {childList.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => push({ child: c.id })}
              className={`rounded px-3 py-1 text-sm ${
                currentChildId === c.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {c.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
