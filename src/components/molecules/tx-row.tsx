import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { txMeta } from "@/lib/tx-meta";

export { txMeta } from "@/lib/tx-meta";

/* ------------------------------------------------------------------ */
/*  CVA variants                                                       */
/* ------------------------------------------------------------------ */

const txRowVariants = cva("flex items-center gap-3 py-3", {
  variants: {
    bordered: {
      true: "border-b border-[var(--divider)]",
      false: "",
    },
  },
  defaultVariants: {
    bordered: true,
  },
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface TxRowProps extends VariantProps<typeof txRowVariants> {
  /** Transaction kind (e.g. "task_reward", "redemption") */
  kind: string;
  title: string;
  date: string;
  /** Positive = earned, negative = spent */
  amount: number;
  className?: string;
}

const TxRow = React.forwardRef<HTMLDivElement, TxRowProps>(
  ({ kind, title, date, amount, bordered, className }, ref) => {
    const meta = txMeta(kind);
    const isPositive = amount >= 0;

    return (
      <div ref={ref} className={cn(txRowVariants({ bordered }), className)}>
        {/* Icon circle */}
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px]"
          style={{ background: meta.bg }}
        >
          {meta.icon}
        </span>

        {/* Title + date */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[color:var(--ink)]">
            {title}
          </p>
          <p className="text-xs text-[color:var(--ink-subtle)]">
            {date}
          </p>
        </div>

        {/* Amount */}
        <span
          className={cn(
            "shrink-0 text-sm font-bold tabular-nums",
            isPositive
              ? "text-[color:var(--color-emerald-500,#10B981)]"
              : "text-[color:var(--color-red-500,#EF4444)]",
          )}
        >
          {isPositive ? "+" : ""}
          {amount}
        </span>
      </div>
    );
  },
);

TxRow.displayName = "TxRow";

export { TxRow, txRowVariants };
