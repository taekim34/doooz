import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] p-4",
        className,
      )}
      style={{
        background: "var(--card)",
        boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
      }}
    >
      <div
        className="text-[11px] font-semibold"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-[22px] font-extrabold"
        style={{
          color: "var(--ink)",
          letterSpacing: "-0.02em",
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value}
      </div>
    </div>
  );
}
