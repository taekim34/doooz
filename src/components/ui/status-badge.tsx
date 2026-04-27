import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        success: "bg-[color:var(--success-bg)] text-[color:var(--success)]",
        danger: "bg-[color:var(--error-bg)] text-[color:var(--error)]",
        warning: "bg-[color:var(--warning-bg)] text-[color:var(--warning)]",
        pending: "bg-[color:var(--warning-bg)] text-[color:var(--warning)]",
        neutral: "bg-[color:var(--surface-sunken)] text-[color:var(--ink-muted)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({
  className,
  variant,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { statusBadgeVariants };
