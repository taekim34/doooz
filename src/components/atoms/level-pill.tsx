import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const levelPillVariants = cva(
  "inline-flex items-center font-bold leading-none rounded-pill",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--accent)]/10 text-[color:var(--accent)]",
        accent:
          "bg-[image:var(--accent-gradient)] text-[color:var(--on-accent)]",
        outline:
          "border border-[color:var(--accent)] text-[color:var(--accent)] bg-transparent",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-[12px]",
        lg: "px-3 py-1 text-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface LevelPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof levelPillVariants> {
  level: number;
}

const LevelPill = React.forwardRef<HTMLSpanElement, LevelPillProps>(
  ({ level, variant, size, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-nums=""
        className={cn(levelPillVariants({ variant, size }), className)}
        {...props}
      >
        Lv.{level}
      </span>
    );
  },
);

LevelPill.displayName = "LevelPill";

export { LevelPill, levelPillVariants };
