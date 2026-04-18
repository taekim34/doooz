import { cn } from "@/lib/utils";

export function StreakBadge({
  days,
  label,
  className,
}: {
  days: number;
  label: string;
  className?: string;
}) {
  if (days <= 0) return null;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-semibold",
        className,
      )}
      style={{
        background: "linear-gradient(90deg, #FFF3E0, #FFE4E9)",
        color: "var(--ink)",
      }}
    >
      <span className="text-base">🔥</span>
      <span>{label.replace("{days}", String(days))}</span>
    </div>
  );
}
