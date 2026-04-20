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
              ? "0 1px 2px rgba(10,10,10,0.04)"
              : undefined,
        }}
        {...props}
      >
        {icon && (
          <div className="mb-1 text-[18px] leading-none">{icon}</div>
        )}
        <div
          className="text-[22px] font-extrabold leading-tight"
          style={{
            color: isAccent ? "inherit" : "var(--ink)",
            letterSpacing: "-0.02em",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {value}
        </div>
        <div
          className="mt-0.5 text-[11px] font-semibold"
          style={{
            color: isAccent ? "rgba(255,255,255,0.8)" : "var(--ink-subtle)",
          }}
        >
          {label}
        </div>
      </div>
    );
  },
);

StatCard.displayName = "StatCard";

export { StatCard, statCardVariants };
