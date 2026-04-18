import * as React from "react";
import { cn } from "@/lib/utils";

export interface EyebrowLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "div";
}

export function EyebrowLabel({ as: Tag = "span", className, children, ...props }: EyebrowLabelProps) {
  return (
    <Tag
      className={cn(
        "text-[12px] font-bold uppercase tracking-[0.15em] leading-none",
        "text-[color:var(--primary-color)]",
        "[&:where([data-mode='parent']_*,[data-mode='parent'])]:text-[color:var(--muted)]",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
