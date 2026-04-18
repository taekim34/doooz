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
        "inline-flex items-center gap-1.5 rounded-full",
        className,
      )}
      style={{
        padding: "8px 14px",
        background: "linear-gradient(90deg, #FFF3E0, #FFE4E9)",
        boxShadow: "0 8px 20px -10px rgba(255,107,157,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
        color: "#2D1B3D",
      }}
    >
      <span style={{ fontSize: 15 }}>🔥</span>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{label.replace("{days}", String(days))}</span>
    </div>
  );
}
