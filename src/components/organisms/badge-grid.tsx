import { cn } from "@/lib/utils";

export interface BadgeItem {
  id: string;
  emoji: string;
  name: string;
  earned: boolean;
  earnedAt?: string;
}

export interface BadgeGridProps {
  badges: BadgeItem[];
  columns?: 3 | 4;
  className?: string;
}

export function BadgeGrid({
  badges,
  columns = 3,
  className,
}: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div
        className={cn("py-4 text-center", className)}
        style={{ fontSize: 13, color: "var(--ink-subtle)" }}
      >
        No badges yet
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 8,
      }}
    >
      {badges.map((b) =>
        b.earned ? (
          <div
            key={b.id}
            style={{
              padding: "12px 6px 10px",
              borderRadius: 14,
              background: "var(--surface-raised)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden style={{ fontSize: 32, lineHeight: 1 }}>
              {b.emoji}
            </span>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {b.name}
            </div>
          </div>
        ) : (
          <div
            key={b.id}
            style={{
              padding: "12px 6px 10px",
              borderRadius: 14,
              background: "var(--surface-sunken)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              opacity: 0.6,
            }}
          >
            <span
              aria-hidden
              style={{
                fontSize: 24,
                lineHeight: 1,
                fontWeight: 800,
                color: "#B5B5BE",
              }}
            >
              🔒
            </span>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "var(--ink-subtle)",
                letterSpacing: "-0.01em",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }}
            >
              {b.name}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
