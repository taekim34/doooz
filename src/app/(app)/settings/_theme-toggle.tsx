"use client";

import { useTransition } from "react";

type ToggleProps<T extends string> = {
  name: string;
  current: T;
  options: { value: T; label: string }[];
  action: (formData: FormData) => Promise<void>;
};

export function ThemeToggle<T extends string>({ name, current, options, action }: ToggleProps<T>) {
  const [, startTransition] = useTransition();

  function handleClick(value: T) {
    if (value === current) return;

    const root = document.documentElement.closest("[data-role]") ?? document.querySelector("[data-role]");
    if (root instanceof HTMLElement) {
      if (name === "tone") root.dataset.theme = value;
      if (name === "mode") root.dataset.mode = value;
    }

    const fd = new FormData();
    fd.set(name, value);
    startTransition(() => action(fd));
  }

  return (
    <div className="inline-flex gap-0.5 rounded-full bg-[color:var(--border)] p-[3px]">
      {options.map((o) => {
        const on = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => handleClick(o.value)}
            className={`cursor-pointer rounded-full border-none px-5 py-2 text-[13px] tracking-[-0.01em] transition-all ${on ? "font-bold bg-[color:var(--surface)] text-[color:var(--ink)]" : "font-medium bg-transparent text-[color:var(--ink-subtle)]"}`}
            style={{ boxShadow: on ? "var(--shadow-sm)" : "none" }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
