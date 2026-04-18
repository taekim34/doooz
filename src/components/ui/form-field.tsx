import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

export function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export function StyledInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-[10px] px-4 text-[17px] font-medium outline-none transition-colors",
        "focus:border-[color:var(--ink)] focus:bg-white",
        className,
      )}
      style={{
        background: "#FAFAFA",
        border: "1px solid #F0F0F0",
        color: "var(--ink)",
        boxSizing: "border-box",
      }}
      {...props}
    />
  );
}
