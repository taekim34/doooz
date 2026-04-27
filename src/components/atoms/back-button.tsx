"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const backButtonVariants = cva(
  "inline-flex w-9 h-9 items-center justify-center rounded-full transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[color:var(--ink-subtle)] hover:bg-[var(--border-subtle)]",
        glass:
          "bg-[color:var(--surface)]/70 backdrop-blur-sm border border-[color:var(--border-subtle)] text-[color:var(--ink-subtle)] hover:bg-[color:var(--surface)]/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const ChevronLeft = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export interface BackButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof backButtonVariants> {
  href?: string;
}

const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ className, variant, href, ...props }, ref) => {
    const router = useRouter();

    const classes = cn(backButtonVariants({ variant }), className);

    if (href) {
      return (
        <Link href={href as never} className={classes} aria-label="Go back">
          <ChevronLeft />
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        onClick={() => router.back()}
        aria-label="Go back"
        {...props}
      >
        <ChevronLeft />
      </button>
    );
  },
);

BackButton.displayName = "BackButton";

export { BackButton, backButtonVariants };
