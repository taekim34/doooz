import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CharacterIcon } from "@/components/molecules/character-icon";
import { getStage } from "@/lib/level";
import { LevelPill } from "@/components/atoms";

/* ------------------------------------------------------------------ */
/*  Gradient palette — deterministic pick from characterId hash        */
/* ------------------------------------------------------------------ */

const GRADIENTS = [
  "linear-gradient(135deg, #FFE4E9, #FFF5EC)", // pink→cream
  "linear-gradient(135deg, #E5EFFF, #FFE4E9)", // blue→pink
  "linear-gradient(135deg, #FFF5EC, #FFE4C4)", // cream→peach
  "linear-gradient(135deg, #E5EFFF, #F3E8FF)", // blue→lavender
  "linear-gradient(135deg, #FFE4C4, #FFE4E9)", // peach→pink
  "linear-gradient(135deg, #F3E8FF, #FFE4E9)", // lavender→pink
] as const;

function hashPick(id: string | null): string {
  if (!id) return GRADIENTS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]!;
}

/* ------------------------------------------------------------------ */
/*  CVA variants                                                       */
/* ------------------------------------------------------------------ */
//
//  Sizes scaled up vs the legacy emoji-only avatar — illustrated PNGs
//  need more breathing room than a single glyph to read clearly.
//

const characterAvatarVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-full shadow-[inset_0_-4px_0_rgba(0,0,0,0.04)]",
  {
    variants: {
      // Sizes scaled 1.5× over the post-PNG-rollout baseline so the
      // illustrated portraits read clearly even in dense lists.
      size: {
        sm: "h-[60px] w-[60px]",
        md: "h-[72px] w-[72px]",
        lg: "h-[108px] w-[108px]",
        xl: "h-[168px] w-[168px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const SIZE_PX: Record<NonNullable<CharacterAvatarProps["size"]>, number> = {
  sm: 60,
  md: 72,
  lg: 108,
  xl: 168,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface CharacterAvatarProps
  extends VariantProps<typeof characterAvatarVariants> {
  characterId: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLevel?: boolean;
  level?: number;
  className?: string;
  /** Spring-back squish on :active. */
  tappable?: boolean;
  /** Pass-through to inner CharacterIcon (e.g. "breathe" for hero use). */
  idle?: "breathe";
}

const STAGE_BADGE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "🐣",
  2: "",
  3: "✨",
  4: "⚔️",
  5: "👑",
};

const CharacterAvatar = React.forwardRef<HTMLDivElement, CharacterAvatarProps>(
  ({ characterId, size = "md", showLevel, level, className, tappable, idle }, ref) => {
    const stage = getStage(level ?? 1);
    const bg = hashPick(characterId);
    const px = SIZE_PX[size];
    // Badge is rendered outside the circular clip so it isn't cropped by
    // overflow-hidden — CharacterIcon hides its own internal badge here.
    const badge = STAGE_BADGE[stage];

    return (
      <div ref={ref} className={cn("relative inline-flex", className)}>
        <div
          role="img"
          aria-label={characterId}
          className={cn(characterAvatarVariants({ size }))}
          style={{ backgroundImage: bg }}
        >
          <CharacterIcon
            id={characterId}
            stage={stage}
            pixelSize={Math.round(px * 0.86)}
            hideBadge
            tappable={tappable}
            idle={idle}
          />
        </div>

        {badge && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1 -right-1"
            style={{
              fontSize: Math.round(px * 0.34),
              lineHeight: 1,
              filter: "drop-shadow(0 1px 2px rgba(10,10,10,0.22))",
            }}
          >
            {badge}
          </span>
        )}

        {showLevel && level != null && (
          <LevelPill
            level={level}
            size="sm"
            variant="accent"
            className="absolute -bottom-1 -right-1"
          />
        )}
      </div>
    );
  },
);

CharacterAvatar.displayName = "CharacterAvatar";

export { CharacterAvatar, characterAvatarVariants };
