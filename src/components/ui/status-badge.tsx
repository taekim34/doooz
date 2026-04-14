import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-700",
        danger: "bg-red-100 text-red-700",
        warning: "bg-yellow-100 text-yellow-800",
        pending: "bg-orange-100 text-orange-700",
        neutral: "bg-gray-100 text-gray-600",
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
