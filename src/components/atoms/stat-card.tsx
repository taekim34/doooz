import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statCardVariants = cva(
  "rounded-[14px] p-4 text-center",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-raised)]",
        accent: "bg-[image:var(--accent-gradient)] text-white",
        muted: "border border-dashed border-[color:var(--ink-subtle)]/30 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  value: string | number;
  label: string;
  icon?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ value, label, icon, variant, className, ...props }, ref) => {
    const isAccent = variant === "accent";

    return (
      <div
        ref={ref}
        className={cn(statCardVariants({ variant }), className)}
        style={{
          boxShadow:
            variant === "default"
              ? "var(--shadow-card-parent)"
              : undefined,
        }}
        {...props}
      >
        {icon && (
          <div className="mb-1 text-[18px] leading-none">{icon}</div>
        )}
        <div
          className={cn(
            "text-[22px] font-extrabold leading-tight tracking-[-0.02em] tabular-nums",
            isAccent ? "text-inherit" : "text-[color:var(--ink)]",
          )}
        >
          {value}
        </div>
        <div
          className={cn(
            "mt-0.5 text-[11px] font-semibold",
            isAccent ? "text-white/80" : "text-[color:var(--ink-subtle)]",
          )}
        >
          {label}
        </div>
      </div>
    );
  },
);

StatCard.displayName = "StatCard";

export { StatCard, statCardVariants };
