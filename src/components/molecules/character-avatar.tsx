import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { characterEmoji } from "@/features/characters/emoji-map";
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

const characterAvatarVariants = cva(
  "relative inline-flex items-center justify-center overflow-hidden rounded-full shadow-[inset_0_-4px_0_rgba(0,0,0,0.04)]",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-base",
        md: "h-10 w-10 text-xl",
        lg: "h-14 w-14 text-3xl",
        xl: "h-20 w-20 text-[42px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

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
}

const CharacterAvatar = React.forwardRef<HTMLDivElement, CharacterAvatarProps>(
  ({ characterId, size = "md", showLevel, level, className }, ref) => {
    const stage = getStage(level ?? 1);
    const emoji = characterEmoji(characterId, stage);
    const bg = hashPick(characterId);

    return (
      <div ref={ref} className={cn("relative inline-flex", className)}>
        <div
          role="img"
          aria-label={characterId}
          className={cn(characterAvatarVariants({ size }))}
          style={{ backgroundImage: bg }}
        >
          {emoji}
        </div>

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
