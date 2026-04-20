import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const eyebrowLabelVariants = cva(
  "text-[12px] font-bold uppercase tracking-[0.15em] leading-none",
  {
    variants: {
      mode: {
        kid: "text-[color:var(--ink)]",
        parent: "text-[color:var(--accent)]",
        auto: [
          "text-[color:var(--ink)]",
          "[&:where([data-role='parent']_*,[data-role='parent'])]:text-[color:var(--accent)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      mode: "auto",
    },
  },
);

export interface EyebrowLabelProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof eyebrowLabelVariants> {
  as?: "span" | "div" | "p";
}

const EyebrowLabel = React.forwardRef<HTMLElement, EyebrowLabelProps>(
  ({ as: Tag = "span", className, mode, children, ...props }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<never>}
        className={cn(eyebrowLabelVariants({ mode }), className)}
        {...props}
      >
        {children}
      </Tag>
    );
  },
);

EyebrowLabel.displayName = "EyebrowLabel";

export { EyebrowLabel, eyebrowLabelVariants };
