"use client";

import { useEffect, useState, useCallback } from "react";
import { Confetti } from "@/components/molecules";
import { CharacterAvatar } from "@/components/molecules/character-avatar";
import { LevelPill } from "@/components/atoms";
import { useAnimatedCounter } from "@/components/ui/animated-counter";

export interface CelebrationOverlayProps {
  open: boolean;
  onClose: () => void;
  points: number;
  taskTitle: string;
  levelUp?: { from: number; to: number };
  characterId?: string;
  /** Auto-dismiss delay in ms. Default 1800. */
  duration?: number;
}

export function CelebrationOverlay({
  open,
  onClose,
  points,
  taskTitle,
  levelUp,
  characterId,
  duration = 1800,
}: CelebrationOverlayProps) {
  const [leaving, setLeaving] = useState(false);
  const displayPoints = useAnimatedCounter(open ? points : 0, 800, 400);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      onClose();
    }, 400);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [open, dismiss, duration]);

  if (!open) return null;

  return (
    <div
      className="dz-co-root fixed inset-0 z-[60] flex items-center justify-center p-6 text-[color:var(--ink)]"
      data-leaving={leaving || undefined}
      onClick={dismiss}
      role="dialog"
      aria-live="polite"
      aria-label="Task complete celebration"
      style={{
        background: "rgba(45, 27, 61, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        fontFamily:
          'Pretendard, "Pretendard Variable", -apple-system, system-ui, sans-serif',
      }}
    >
      <Confetti duration={duration} />

      <div
        className="dz-co-card relative w-full max-w-[340px] overflow-hidden rounded-3xl bg-[var(--surface)] px-7 pb-[22px] pt-7"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 40px 80px -30px rgba(45,27,61,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            left: "50%",
            transform: "translateX(-50%)",
            width: 280,
            height: 220,
            borderRadius: 9999,
            filter: "blur(6px)",
            background:
              "radial-gradient(closest-side, #FFE4E9 0%, #FFF5EC 45%, #E5EFFF 80%, transparent 100%)",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />

        {/* Character or celebration emoji */}
        <div className="relative flex justify-center pt-1">
          <div
            className="dz-co-avatar"
            style={{ transformOrigin: "center bottom" }}
          >
            {characterId ? (
              <CharacterAvatar characterId={characterId} size="xl" />
            ) : (
              <span
                className="text-[64px] leading-none"
                role="img"
                aria-label="celebration"
              >
                ✨
              </span>
            )}
          </div>
        </div>

        {/* Task title */}
        <div className="relative mt-3 truncate text-center text-[22px] font-semibold text-[color:var(--ink)]">
          {taskTitle}
        </div>

        {/* Animated points */}
        <div className="relative mt-3.5 text-center text-[48px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">
          <span
            style={{
              background: "linear-gradient(90deg,#FF6B9D,#FFA07A 60%,#FFD7A8)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            +{displayPoints} pt
          </span>
        </div>

        {/* Level-up banner */}
        {levelUp && (
          <div
            className="dz-co-levelup mt-[18px] flex h-8 items-center justify-center gap-1.5 rounded-full px-3.5"
            style={{
              background: "linear-gradient(90deg,#FF6B9D,#FFA07A,#FFD7A8)",
              boxShadow:
                "0 8px 20px -6px rgba(255,107,157,0.5), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            <span className="whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.12em] text-[color:var(--on-accent)]">
              LEVEL UP
            </span>
            <span className="inline-flex items-center gap-1">
              <LevelPill level={levelUp.from} size="sm" variant="outline" className="border-[color:var(--on-accent)]/60 text-[color:var(--on-accent)]" />
              <span className="text-[13px] font-bold text-[color:var(--on-accent)]">→</span>
              <LevelPill level={levelUp.to} size="sm" variant="outline" className="border-[color:var(--on-accent)]/60 text-[color:var(--on-accent)]" />
            </span>
          </div>
        )}

        {/* Dismiss button */}
        <div className="mt-[22px] flex justify-center">
          <button
            onClick={dismiss}
            type="button"
            className="flex h-12 cursor-pointer items-center gap-2 rounded-full border-none bg-[color:var(--ink)] pl-[22px] pr-1.5 text-[15px] font-bold tracking-[-0.01em] text-[color:var(--on-accent)] font-[inherit]"
            style={{
              boxShadow:
                "0 14px 28px -10px rgba(26,15,38,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span className="whitespace-nowrap">OK</span>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--accent-gradient)",
                boxShadow: "var(--shadow-inset-white)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.5 8h9m0 0L8.5 4m4 4l-4 4"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {/* Hint */}
        <div className="mt-2.5 text-center text-xs font-medium text-[color:var(--ink-subtle)]">
          tap to close
        </div>
      </div>

      {/* Scoped CSS animations */}
      <style>{`
        .dz-co-root {
          animation: dzCoBackdropIn 200ms ease forwards;
        }
        .dz-co-root[data-leaving] {
          animation: dzCoBackdropOut 400ms ease forwards;
        }
        @keyframes dzCoBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dzCoBackdropOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        .dz-co-card {
          opacity: 0;
          transform: scale(0.8);
          animation: dzCoCardIn 400ms var(--ease-spring) 100ms forwards;
        }
        .dz-co-root[data-leaving] .dz-co-card {
          animation: dzCoCardOut 300ms cubic-bezier(0.4,0,1,1) forwards;
        }
        @keyframes dzCoCardIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dzCoCardOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.95); }
        }

        .dz-co-avatar {
          animation: dzCoBounce 1.4s ease-in-out 300ms infinite;
        }
        @keyframes dzCoBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }

        .dz-co-levelup {
          opacity: 0;
          transform: translateY(14px);
          animation: dzCoBanner 300ms var(--ease-spring) 900ms forwards;
        }
        @keyframes dzCoBanner {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .dz-co-root,
          .dz-co-card,
          .dz-co-avatar,
          .dz-co-levelup {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
