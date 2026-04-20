import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "py-8",
        compact: "py-4",
        card: "rounded-2xl bg-white py-8 px-6 shadow-sm border border-[var(--border-subtle)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, variant, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant }), className)}
        {...props}
      >
        {icon && (
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
        )}
        <p
          className="mt-2 text-sm font-medium"
          style={{ color: "var(--ink, #0A0A0A)" }}
        >
          {title}
        </p>
        {description && (
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--muted, #9CA3AF)" }}
          >
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

export { EmptyState, emptyStateVariants };
