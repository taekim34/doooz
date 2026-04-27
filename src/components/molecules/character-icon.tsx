import * as React from "react";
import Image from "next/image";
import { characterEmoji } from "@/features/characters/emoji-map";
import { characterImageSrc } from "@/features/characters/image-map";
import type { CharacterStage } from "@/lib/level";

/**
 * Renders a character at an exact pixel size.
 *
 * - Stage 1 (baby, L1-L6): falls back to emoji until baby art ships.
 * - Stage 2+: PNG via next/image with object-fit: contain so the
 *   transparent illustrations sit naturally inside circular masks
 *   without cropping.
 *
 * Use directly inline (replaces raw `characterEmoji(...)` spans) or
 * compose inside CharacterAvatar for the framed/levelled variant.
 */
export interface CharacterIconProps {
  id: string | null | undefined;
  stage: CharacterStage;
  /** Rendered box size in pixels. Image fills the box; emoji uses ~90% as font-size. */
  pixelSize: number;
  className?: string;
  /** Defaults to the character id; override for accessibility-aware labels. */
  ariaLabel?: string;
}

export function CharacterIcon({
  id,
  stage,
  pixelSize,
  className,
  ariaLabel,
}: CharacterIconProps) {
  const src = stage === 1 ? null : characterImageSrc(id);

  if (!src) {
    return (
      <span
        aria-label={ariaLabel ?? id ?? undefined}
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: pixelSize,
          height: pixelSize,
          fontSize: Math.round(pixelSize * 0.9),
          lineHeight: 1,
        }}
      >
        {characterEmoji(id, stage)}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={ariaLabel ?? id ?? "character"}
      width={pixelSize}
      height={pixelSize}
      className={className}
      style={{ objectFit: "contain", width: pixelSize, height: pixelSize }}
      unoptimized
    />
  );
}
