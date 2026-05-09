"use client";

import * as React from "react";

/**
 * Shared list-in-a-card visual pattern. Matches the recent-transactions list on
 * `/points` — soft surface card, hairline dividers between rows, no inner row
 * shadows. Use for compact read-only lists on dashboards.
 */
export function ListCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        padding: "4px 14px",
        background: "var(--surface)",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow:
          "0 10px 28px -18px rgba(10,10,10,0.14), 0 1px 2px rgba(10,10,10,0.03)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  last,
  muted,
  strikethrough,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  last?: boolean;
  muted?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid var(--divider)",
        opacity: muted ? 0.55 : 1,
      }}
    >
      {leading && <div style={{ flexShrink: 0 }}>{leading}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textDecoration: strikethrough ? "line-through" : undefined,
            textDecorationThickness: "1.5px",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              marginTop: 2,
              fontSize: 12,
              fontWeight: 400,
              color: "var(--ink-subtle)",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </div>
  );
}
