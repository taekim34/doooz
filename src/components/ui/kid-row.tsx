import { cn } from "@/lib/utils";
import { CharacterAvatar } from "@/components/ui/character-avatar";
import { ProgressTrack } from "@/components/ui/progress-track";
import Link from "next/link";
import type { Route } from "next";

type KidRowProps = {
  href: string;
  characterId: string | null;
  stage: number;
  name: string;
  level: number;
  done: number;
  total: number;
  className?: string;
};

export function KidRow({
  href,
  characterId,
  stage,
  name,
  level,
  done,
  total,
  className,
}: KidRowProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Link
      href={href as Route}
      className={cn(
        "flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[color:var(--card)]",
        className,
      )}
    >
      <CharacterAvatar characterId={characterId} stage={stage} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {name}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Lv.{level}
          </span>
        </div>
        {total > 0 && (
          <ProgressTrack value={pct} className="mt-1.5 h-1" />
        )}
      </div>
      <div className="text-right shrink-0">
        <span className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          {done}/{total}
        </span>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" style={{ color: "var(--muted)" }}>
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
