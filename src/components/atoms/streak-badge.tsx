import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const streakBadgeVariants = cva(
  "inline-flex items-center rounded-full font-bold",
  {
    variants: {
      size: {
        sm: "gap-1 px-2.5 py-1 text-[12px]",
        md: "gap-1.5 px-3.5 py-2 text-[14px]",
        lg: "gap-2 px-4 py-2.5 text-[16px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const emojiSize: Record<string, number> = {
  sm: 12,
  md: 15,
  lg: 18,
};

export interface StreakBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof streakBadgeVariants> {
  days: number;
  label?: string;
}

const StreakBadge = React.forwardRef<HTMLDivElement, StreakBadgeProps>(
  ({ days, label, size, className, ...props }, ref) => {
    if (days <= 0) return null;

    const resolvedSize = size ?? "md";
    const text = label
      ? label.replace("{days}", String(days))
      : String(days);

    return (
      <div
        ref={ref}
        className={cn(streakBadgeVariants({ size }), "text-[color:var(--ink)] tracking-[-0.2px]", className)}
        style={{
          background: "linear-gradient(90deg, #FFF3E0, #FFE4E9)",
          boxShadow:
            "0 8px 20px -10px rgba(255,107,157,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
        data-nums=""
        {...props}
      >
        <span style={{ fontSize: emojiSize[resolvedSize] ?? 15, lineHeight: 1 }}>
          🔥
        </span>
        <span>{text}</span>
      </div>
    );
  },
);

StreakBadge.displayName = "StreakBadge";

export { StreakBadge, streakBadgeVariants };
