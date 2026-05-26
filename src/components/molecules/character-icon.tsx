"use client";
import * as React from "react";
import Image from "next/image";
import { characterEmoji } from "@/features/characters/emoji-map";
import { characterImageSrc } from "@/features/characters/image-map";
import type { CharacterStage } from "@/lib/level";

// Idle animation pool — each entry is a CSS class + duration in ms.
// Picked randomly with random pause between bursts so multiple characters
// on the same screen feel autonomous, not synchronized.
const IDLE_BURSTS: ReadonlyArray<{ klass: string; ms: number }> = [
  { klass: "ch-jump",       ms: 700 },
  { klass: "ch-sway",       ms: 1200 },
  { klass: "ch-shake",      ms: 600 },
  { klass: "ch-pulse",      ms: 900 },
  { klass: "ch-spin",       ms: 900 },
  { klass: "ch-trot-left",  ms: 1200 },
  { klass: "ch-trot-right", ms: 1200 },
];

function pickBurst() {
  return IDLE_BURSTS[Math.floor(Math.random() * IDLE_BURSTS.length)]!;
}

/**
 * Random idle bursts + pointer-driven on-demand burst.
 *
 * - Idle loop: every 4–10s pick a random burst.
 * - Hover (mouse) / touchdown — immediately play a one-shot burst and freeze
 *   the idle loop until pointerleave / click / touchup.
 */
function useIdleAnimation(enabled: boolean) {
  const [burst, setBurst] = React.useState<string>("");
  const interactingRef = React.useRef(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
  };

  const loop = React.useCallback(() => {
    if (!enabled || interactingRef.current) return;
    const pause = 4000 + Math.random() * 6000;
    timerRef.current = setTimeout(() => {
      if (!enabled || interactingRef.current) return;
      const pick = pickBurst();
      setBurst(pick.klass);
      timerRef.current = setTimeout(() => {
        if (interactingRef.current) return;
        setBurst("");
        loop();
      }, pick.ms);
    }, pause);
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled) return;
    timerRef.current = setTimeout(loop, Math.random() * 2500);
    return () => {
      clearTimer();
    };
  }, [enabled, loop]);

  const onEnter = React.useCallback(() => {
    if (!enabled) return;
    interactingRef.current = true;
    clearTimer();
    // Force-restart by clearing then setting next tick (so a repeated hover
    // on the same burst class still re-triggers the animation).
    setBurst("");
    timerRef.current = setTimeout(() => setBurst(pickBurst().klass), 0);
  }, [enabled]);

  const onLeave = React.useCallback(() => {
    if (!enabled) return;
    interactingRef.current = false;
    clearTimer();
    setBurst("");
    loop();
  }, [enabled, loop]);

  return { burst, onEnter, onLeave };
}

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
 * Animation props (both default ON — opt out with explicit `false`/`undefined`):
 *   tappable=true   — spring-back squish on :active.
 *   idle="breathe"  — random idle bursts (jump/sway/shake/pulse/spin) every
 *                     few seconds. Pure CSS animation classes are toggled by
 *                     a per-instance JS timer so multiple characters feel
 *                     independent.
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
  tappable = true,
  idle = "breathe",
}: CharacterIconProps) {
  const src = characterImageSrc(id);
  const { burst, onEnter, onLeave } = useIdleAnimation(idle === "breathe");
  const animClass = [
    tappable ? "ch-tap" : "",
    burst,
  ]
    .filter(Boolean)
    .join(" ");
  const interactionHandlers = idle === "breathe"
    ? {
        onPointerEnter: onEnter,
        onPointerLeave: onLeave,
        onClick: onLeave,
      }
    : {};

  if (!src) {
    return (
      <span
        aria-label={ariaLabel ?? id ?? undefined}
        className={[className, animClass].filter(Boolean).join(" ")}
        {...interactionHandlers}
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
      {...interactionHandlers}
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
