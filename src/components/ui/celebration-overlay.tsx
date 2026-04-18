"use client";
import { useEffect, useState, useCallback } from "react";
import { CharacterAvatar } from "@/components/ui/character-avatar";
import { Confetti } from "@/components/ui/confetti";
import { useAnimatedCounter } from "@/components/ui/animated-counter";
import type { CharacterStage } from "@/lib/level";

type CelebrationProps = {
  characterId: string | null;
  stage: number;
  taskTitle: string;
  points: number;
  leveledUp?: boolean;
  newLevel?: number;
  onDismiss: () => void;
};

export function CelebrationOverlay({
  characterId,
  stage,
  taskTitle,
  points,
  leveledUp = false,
  newLevel,
  onDismiss,
}: CelebrationProps) {
  const [leaving, setLeaving] = useState(false);
  const displayPoints = useAnimatedCounter(points, 800, 400);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 3000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${
        leaving ? "animate-cardOut" : "animate-[fadeIn_200ms_ease_both]"
      }`}
      style={{
        background: "rgba(45,27,61,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={dismiss}
      role="dialog"
      aria-label="Task complete celebration"
    >
      <Confetti />

      <div
        className={`relative max-w-sm w-full rounded-2xl p-7 ${
          leaving ? "animate-cardOut" : "animate-cardIn"
        } motion-reduce:animate-none`}
        style={{
          background: "white",
          boxShadow: "0 40px 80px -30px rgba(45,27,61,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-50"
          style={{
            background: "radial-gradient(circle at 50% 30%, var(--accent-color) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Bouncing avatar */}
          <div className="animate-bounce motion-reduce:animate-none">
            <CharacterAvatar characterId={characterId} stage={stage as CharacterStage} size="hero" />
          </div>

          {/* Heading */}
          <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--ink, #2D1B3D)" }}>
            🎉 임무 완료!
          </h2>

          {/* Task title */}
          <p className="mt-1 text-sm" style={{ color: "var(--muted, #6b7280)" }}>
            {taskTitle}
          </p>

          {/* Points */}
          <div className="mt-4 text-5xl font-extrabold gradient-text">
            +{displayPoints}
          </div>

          {/* Level up banner */}
          {leveledUp && newLevel && (
            <div
              className="mt-3 animate-rise rounded-pill px-4 py-1.5 text-sm font-bold text-white"
              style={{
                animationDelay: "900ms",
                background: "var(--accent-gradient)",
                boxShadow: "0 8px 20px -6px rgba(255,107,157,0.5), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              LEVEL UP · Lv {newLevel} ✨
            </div>
          )}

          {/* Hint */}
          <p className="mt-5 text-xs" style={{ color: "var(--muted, #9ca3af)" }}>
            탭하면 닫혀요
          </p>
        </div>
      </div>
    </div>
  );
}
