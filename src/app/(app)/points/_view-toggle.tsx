"use client";

import { useEffect, useState } from "react";

export type ViewMode = "kid" | "parent";

const STORAGE_KEY = "doooz.points.view";

/**
 * Parent-only segmented toggle between kid-view and parent-view.
 * Persists selection in localStorage so it survives navigation.
 * The toggle does not re-fetch data — it swaps which pre-rendered
 * section (kid vs parent) is visible and also toggles the page
 * background gradient on the parent root via a data attribute.
 */
export function PointsViewToggle({
  defaultMode = "parent",
  kidLabel,
  parentLabel,
}: {
  defaultMode?: ViewMode;
  kidLabel: string;
  parentLabel: string;
}) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted mode once mounted.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "kid" || saved === "parent") {
        setMode(saved);
      }
    } catch {
      // ignore (e.g. storage disabled)
    }
    setHydrated(true);
  }, []);

  // Sync mode to the DOM so server-rendered sections react to it.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.getElementById("points-root");
    if (root) root.setAttribute("data-view", mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode, hydrated]);

  const tabs: { v: ViewMode; label: string }[] = [
    { v: "kid", label: kidLabel },
    { v: "parent", label: parentLabel },
  ];

  return (
    <div
      role="tablist"
      className="relative grid grid-cols-2 p-[3px] rounded-full w-[180px] h-[34px]"
      style={{
        background:
          mode === "kid" ? "rgba(255,255,255,0.65)" : "#F5F5F5",
        boxShadow:
          mode === "kid" ? "inset 0 0 0 1px rgba(255,255,255,0.6)" : "none",
        backdropFilter: "blur(6px)",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 3,
          bottom: 3,
          left: mode === "kid" ? 3 : "calc(50% + 0px)",
          width: "calc(50% - 3px)",
          background: "var(--ink)",
          borderRadius: 9999,
          transition: "left 240ms var(--ease-spring)",
        }}
      />
      {tabs.map((tb) => {
        const on = mode === tb.v;
        return (
          <button
            key={tb.v}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setMode(tb.v)}
            style={{
              position: "relative",
              zIndex: 1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12.5,
              letterSpacing: "-0.01em",
              fontWeight: on ? 700 : 600,
              color: on ? "var(--on-accent)" : "var(--ink-muted)",
              transition: "color 160ms",
            }}
          >
            {tb.label}
          </button>
        );
      })}
    </div>
  );
}
