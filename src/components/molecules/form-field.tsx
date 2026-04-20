import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <label className={cn("block", className)}>
      <span
        className="mb-1.5 block text-sm font-medium"
        style={{ color: "var(--ink)" }}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        )}
      </span>

      {children}

      {error && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--ink-subtle)" }}>
          {hint}
        </p>
      )}
    </label>
  );
}
