import { SectionLabel } from "@/components/atoms";
import { cn } from "@/lib/utils";

export interface SectionProps {
  /** Section title displayed as an uppercase label */
  title: string;
  /** Optional count shown as a small pill badge */
  count?: number;
  /** Optional hint text shown after the title */
  hint?: string;
  /** Optional action slot (e.g. a "View all" button) */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable page section with a header row and content area.
 *
 * Header: SectionLabel + optional count badge + hint + action button.
 * 12px gap between header and content.
 */
export function Section({
  title,
  count,
  hint,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <div className={cn("mt-6", className)}>
      {/* Header row */}
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <SectionLabel as="h3">{title}</SectionLabel>

          {count != null && (
            <span
              className={cn(
                "inline-flex h-[18px] min-w-[18px] items-center justify-center",
                "rounded-full bg-[var(--border-subtle)] px-1.5",
                "text-[10px] font-bold tabular-nums text-[color:var(--ink-muted)]",
              )}
            >
              {count}
            </span>
          )}

          {hint && (
            <span
              className={cn(
                "text-[11.5px] font-semibold tracking-tight tabular-nums",
                "text-[color:var(--muted,#9CA3AF)] whitespace-nowrap",
              )}
            >
              {hint}
            </span>
          )}
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
