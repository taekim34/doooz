"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fabVariants = cva(
  "fixed bottom-24 right-4 z-30 inline-flex items-center justify-center rounded-full shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:bottom-8 md:right-8",
  {
    variants: {
      variant: {
        primary: "text-white",
        secondary:
          "border border-[var(--border)] bg-white text-[color:var(--ink)] hover:bg-[var(--surface-raised)]",
      },
      size: {
        default: "h-14 w-14",
        pill: "h-12 gap-2 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface FABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  icon?: React.ReactNode;
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ className, variant, size, icon, children, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          fabVariants({ variant, size }),
          variant !== "secondary" && "bg-[var(--accent-color,#6366F1)]",
          className,
        )}
        style={style}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  },
);

FAB.displayName = "FAB";

export { FAB, fabVariants };
