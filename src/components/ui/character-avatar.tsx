import * as React from "react";
import { cn } from "@/lib/utils";
import { characterEmoji } from "@/features/characters/emoji-map";
import type { CharacterStage } from "@/lib/level";

export type AvatarSize = "xs" | "sm" | "md" | "hero";

export interface CharacterAvatarProps {
  characterId: string | null;
  stage: CharacterStage;
  size: AvatarSize;
  /** Rotation in degrees. Defaults to -4 at 'hero', 0 elsewhere. */
  rotate?: number;
  className?: string;
}

// Six pastel gradient pairs. Deterministic pick from characterId.
const GRADIENTS = [
  "linear-gradient(135deg, #FFE4E9, #FFF5EC)", // pink→cream
  "linear-gradient(135deg, #E5EFFF, #FFE4E9)", // blue→pink
  "linear-gradient(135deg, #FFF5EC, #FFE4C4)", // cream→peach
  "linear-gradient(135deg, #E5EFFF, #F3E8FF)", // blue→lavender
  "linear-gradient(135deg, #FFE4C4, #FFE4E9)", // peach→pink
  "linear-gradient(135deg, #F3E8FF, #FFE4E9)", // lavender→pink
];

function hashPick(id: string | null): string {
  if (!id) return GRADIENTS[0]!;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]!;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "w-8 h-8 text-lg rounded-[9px]",
  sm: "w-[42px] h-[42px] text-2xl rounded-[12px]",
  md: "w-[56px] h-[56px] text-3xl rounded-[18px]",
  hero: "w-[78px] h-[78px] text-[46px] rounded-[24px]",
};

export function CharacterAvatar({
  characterId,
  stage,
  size,
  rotate,
  className,
}: CharacterAvatarProps) {
  const emoji = characterEmoji(characterId, stage);
  const bg = hashPick(characterId);
  const rot = rotate ?? (size === "hero" ? -4 : 0);
  const transform = rot === 0 ? "" : `rotate(${rot}deg)`;
  return (
    <div
      role="img"
      aria-label={characterId ?? "character"}
      className={cn(
        "inline-flex items-center justify-center transition-spring",
        "shadow-[inset_0_-4px_0_rgba(0,0,0,0.04)]",
        SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundImage: bg, transform }}
    >
      {emoji}
    </div>
  );
}
