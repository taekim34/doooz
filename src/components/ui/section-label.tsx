import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <span
        className="text-[11px] font-extrabold uppercase tracking-[0.18em]"
        style={{ color: "var(--muted)" }}
      >
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: "color-mix(in srgb, var(--ink) 8%, transparent)" }} />
    </div>
  );
}
