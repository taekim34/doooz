import * as React from "react";
import Image from "next/image";
import { characterEmoji } from "@/features/characters/emoji-map";
import { characterImageSrc } from "@/features/characters/image-map";
import type { CharacterStage } from "@/lib/level";

/**
 * Stage badges overlaid on the base PNG to convey evolution at a glance:
 *   1 병아리 → 🐣  (baby — small chick clings to the character)
 *   2 루키   → none
 *   3 용사   → ✨  (sparkle aura)
 *   4 영웅   → ⚔️
 *   5 전설   → 👑
 *
 * Once dedicated baby/hero/legend art ships these can be retired stage by stage.
 */
const STAGE_BADGE: Record<CharacterStage, string> = {
  1: "🐣",
  2: "",
  3: "✨",
  4: "⚔️",
  5: "👑",
};

/**
 * Renders a character at an exact pixel size.
 *
 * Always shows the base PNG (when available) so character identity persists
 * across every level. Stage 1 / 3 / 4 / 5 add a small emoji badge in the
 * lower-right corner — that's the temporary stand-in for stage-specific art.
 *
 * Unknown character IDs fall back to the legacy emoji string from emoji-map,
 * which already concatenates the stage suffix — so behaviour stays consistent.
 *
 * Animation props:
 *   tappable — adds spring-back squish on :active. Default false (set true
 *              for clickable characters; non-interactive avatars stay still).
 *   idle="breathe" — slow pulsing scale. Use sparingly; one or two on screen
 *              feels alive, dozens feels chaotic.
 */
export interface CharacterIconProps {
  id: string | null | undefined;
  stage: CharacterStage;
  /** Rendered box size in pixels. */
  pixelSize: number;
  className?: string;
  /** Defaults to the character id; override for accessibility-aware labels. */
  ariaLabel?: string;
  /** Hide the stage badge (e.g. neutral picker / gallery thumbnails). */
  hideBadge?: boolean;
  /** Add :active scale spring-back. Use for clickable characters. */
  tappable?: boolean;
  /** Idle motion — "breathe" for a slow pulse, undefined for static. */
  idle?: "breathe";
}

export function CharacterIcon({
  id,
  stage,
  pixelSize,
  className,
  ariaLabel,
  hideBadge,
  tappable,
  idle,
}: CharacterIconProps) {
  const src = characterImageSrc(id);
  const animClass = [
    tappable ? "ch-tap" : "",
    idle === "breathe" ? "ch-breathe" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!src) {
    return (
      <span
        aria-label={ariaLabel ?? id ?? undefined}
        className={[className, animClass].filter(Boolean).join(" ")}
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

  const badge = hideBadge ? "" : STAGE_BADGE[stage];

  return (
    <span
      aria-label={ariaLabel ?? id ?? "character"}
      className={[className, animClass].filter(Boolean).join(" ")}
      style={{
        position: "relative",
        display: "inline-block",
        width: pixelSize,
        height: pixelSize,
        lineHeight: 0,
      }}
    >
      <Image
        src={src}
        alt={ariaLabel ?? id ?? "character"}
        width={pixelSize}
        height={pixelSize}
        style={{ objectFit: "contain", width: pixelSize, height: pixelSize }}
        unoptimized
      />
      {badge && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: -Math.round(pixelSize * 0.04),
            bottom: -Math.round(pixelSize * 0.04),
            fontSize: Math.round(pixelSize * 0.34),
            lineHeight: 1,
            filter: "drop-shadow(0 1px 2px rgba(10,10,10,0.22))",
            pointerEvents: "none",
          }}
        >
          {badge}
        </span>
      )}
    </span>
  );
}
