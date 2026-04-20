"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface FilterChipOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterChipGroupProps {
  options: FilterChipOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function FilterChipGroup({
  options,
  value,
  onValueChange,
  className,
}: FilterChipGroupProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        // Prevent deselection — always keep one active
        if (v) onValueChange(v);
      }}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              isActive
                ? "border-transparent text-white"
                : "border-gray-200 bg-gray-100 text-gray-600",
            )}
            style={
              isActive
                ? { backgroundColor: "var(--accent)" }
                : undefined
            }
          >
            {opt.label}
            {opt.count != null && (
              <span
                className={cn(
                  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-semibold",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-gray-200 text-gray-500",
                )}
              >
                {opt.count}
              </span>
            )}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
