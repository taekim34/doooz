import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const glowBlobVariants = cva(
  "pointer-events-none absolute rounded-full opacity-60 blur-[40px]",
  {
    variants: {
      size: {
        sm: "h-[200px] w-[200px]",
        md: "h-[320px] w-[320px]",
        lg: "h-[420px] w-[420px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface GlowBlobProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glowBlobVariants> {
  color?: string;
}

const GlowBlob = React.forwardRef<HTMLDivElement, GlowBlobProps>(
  ({ className, size, color = "#FFB4C6", style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(glowBlobVariants({ size }), className)}
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          ...style,
        }}
        {...props}
      />
    );
  },
);

GlowBlob.displayName = "GlowBlob";

export { GlowBlob, glowBlobVariants };
