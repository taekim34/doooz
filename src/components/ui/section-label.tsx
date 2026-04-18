import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-3", className)}>
      <span
        className="text-[12px] font-bold uppercase tracking-[0.15em]"
        style={{ color: "var(--muted)" }}
      >
        {children}
      </span>
    </div>
  );
}
