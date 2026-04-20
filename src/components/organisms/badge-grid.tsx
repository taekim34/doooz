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
        className={cn("py-4 text-center text-[13px] text-[color:var(--ink-subtle)]", className)}
      >
        No badges yet
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-2", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {badges.map((b) =>
        b.earned ? (
          <div
            key={b.id}
            className="flex flex-col items-center gap-1.5 rounded-[14px] bg-[var(--surface-raised)] px-1.5 pb-2.5 pt-3"
          >
            <span aria-hidden className="text-[32px] leading-none">
              {b.emoji}
            </span>
            <div className="w-full truncate text-center text-[11px] font-medium tracking-[-0.01em] text-[color:var(--ink)]">
              {b.name}
            </div>
          </div>
        ) : (
          <div
            key={b.id}
            className="flex flex-col items-center gap-1.5 rounded-[14px] bg-[var(--surface-sunken)] px-1.5 pb-2.5 pt-3 opacity-60"
          >
            <span
              aria-hidden
              className="text-[24px] font-extrabold leading-none text-[#B5B5BE]"
            >
              🔒
            </span>
            <div className="w-full truncate text-center text-[10px] font-medium tracking-[-0.01em] text-[color:var(--ink-subtle)]">
              {b.name}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
