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
        "rounded-md p-4",
        className,
      )}
      style={{
        background: "var(--card)",
        boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
      }}
    >
      <div className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold" style={{ color: "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}
