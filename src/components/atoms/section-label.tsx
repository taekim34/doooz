import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionLabelProps {
  children: React.ReactNode;
  as?: "span" | "h2" | "h3" | "h4";
  className?: string;
}

const SectionLabel = React.forwardRef<HTMLElement, SectionLabelProps>(
  ({ children, as: Tag = "h3", className }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<never>}
        className={cn(
          "text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--ink-subtle)]",
          className,
        )}
      >
        {children}
      </Tag>
    );
  },
);

SectionLabel.displayName = "SectionLabel";

export { SectionLabel };
