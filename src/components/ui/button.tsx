import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--primary-color)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--primary-color)] text-white hover:scale-[1.02] motion-reduce:hover:scale-100 shadow-sm [&:where([data-mode='kid']_*,[data-mode='kid'])]:shadow-cta",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-[1.02] motion-reduce:hover:scale-100",
        outline:
          "border border-[color:var(--muted)]/30 bg-transparent text-[color:var(--ink)] hover:bg-[color:var(--card)]",
        secondary:
          "bg-[color:var(--card)] text-[color:var(--ink)] hover:bg-[color:var(--card)]/80 border border-[color:var(--muted)]/20",
        ghost:
          "text-[color:var(--ink)] hover:bg-[color:var(--card)]",
        link: "text-[color:var(--primary-color)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-base rounded-pill",
        sm: "h-9 px-4 text-sm rounded-md",
        lg: "h-12 px-7 text-lg rounded-pill",
        icon: "h-11 w-11 rounded-pill",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
