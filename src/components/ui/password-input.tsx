"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function PasswordInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={cn(
          "h-12 w-full rounded-md px-4 pr-12 text-base outline-none transition-colors",
          "focus:border-[color:var(--ink)] focus:bg-white",
          className,
        )}
        style={{
          background: "var(--card)",
          border: "1px solid var(--border, #F0F0F0)",
          color: "var(--ink)",
        }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-sm"
        style={{ color: "var(--muted)" }}
        tabIndex={-1}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
