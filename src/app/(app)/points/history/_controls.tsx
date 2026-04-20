"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Route } from "next";
import { useT } from "@/lib/i18n/useT";

export type FilterKind = "all" | "task" | "reward" | "adjust";

export type KidOption = { id: string; display_name: string };

const FILTERS: { v: FilterKind; key: string }[] = [
  { v: "all", key: "points.filter_all" },
  { v: "task", key: "points.filter_task" },
  { v: "reward", key: "points.filter_reward" },
  { v: "adjust", key: "points.filter_adjust" },
];

export function HistoryControls({
  role,
  kids,
  selectedChildId,
  currentFilter,
}: {
  role: "parent" | "child";
  kids: KidOption[];
  selectedChildId: string;
  currentFilter: FilterKind;
}) {
  const t = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const [kidOpen, setKidOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedKid = kids.find((k) => k.id === selectedChildId);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setKidOpen(false);
    }
    if (kidOpen) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
    return;
  }, [kidOpen]);

  const buildHref = useCallback(
    (nextFilter: FilterKind, nextChild: string | null): Route => {
      const p = new URLSearchParams(sp?.toString());
      p.delete("before");
      if (nextFilter && nextFilter !== "all") p.set("filter", nextFilter);
      else p.delete("filter");
      if (nextChild) p.set("child", nextChild);
      else p.delete("child");
      const q = p.toString();
      return (q ? `/points/history?${q}` : "/points/history") as Route;
    },
    [sp],
  );

  function chooseKid(id: string | null) {
    setKidOpen(false);
    router.push(buildHref(currentFilter, id));
  }

  const labelFor: Record<FilterKind, string> = {
    all: t("points.filter_all"),
    task: t("points.filter_task"),
    reward: t("points.filter_reward"),
    adjust: t("points.filter_adjust"),
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-2.5">
      {/* Filter pills */}
      <div className="flex gap-1.5 flex-nowrap overflow-x-auto">

        {FILTERS.map((f) => {
          const on = currentFilter === f.v;
          return (
            <Link
              key={f.v}
              href={buildHref(f.v, selectedChildId || null)}
              style={{
                height: 32,
                padding: "0 12px",
                borderRadius: 9999,
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: on ? "var(--on-accent)" : "var(--ink-muted)",
                background: on ? "var(--ink)" : "var(--surface-sunken)",
                border: "none",
                transition: "background 160ms, color 160ms",
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              {labelFor[f.v]}
            </Link>
          );
        })}
      </div>

      {/* Kid dropdown — parents only */}
      {role === "parent" && kids.length > 0 && (
        <div
          ref={menuRef}
          className="relative shrink-0"
        >
          <button
            type="button"
            onClick={() => setKidOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={kidOpen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 12px",
              borderRadius: 9999,
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span>
              {selectedKid ? selectedKid.display_name : t("points.all")}
            </span>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              style={{
                transition: "transform 200ms",
                transform: kidOpen ? "rotate(180deg)" : "none",
              }}
            >
              <path
                d="M1 1l4 4 4-4"
                stroke="var(--ink)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {kidOpen && (
            <div
              role="listbox"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                minWidth: 160,
                padding: 4,
                zIndex: 5,
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                boxShadow: "0 14px 30px -10px rgba(10,10,10,0.18)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={() => chooseKid(null)}
                role="option"
                aria-selected={!selectedChildId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: !selectedChildId ? "var(--surface-raised)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: !selectedChildId ? 700 : 500,
                  color: "var(--ink)",
                  textAlign: "left",
                }}
              >
                <span style={{ flex: 1 }}>{t("points.all")}</span>
                {!selectedChildId && <CheckIcon />}
              </button>
              {kids.map((k) => {
                const on = selectedChildId === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => chooseKid(k.id)}
                    role="option"
                    aria-selected={on}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: on ? "var(--surface-raised)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: on ? 700 : 500,
                      color: "var(--ink)",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ flex: 1 }}>{k.display_name}</span>
                    {on && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6.5L5 9l4.5-5.5"
        stroke="var(--ink)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
