import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function GlowBlob({
  className,
  color = "var(--accent-color)",
  style,
}: {
  className?: string;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full opacity-40 blur-3xl",
        className,
      )}
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        ...style,
      }}
    />
  );
}
