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
      className="dz-co-root"
      data-leaving={leaving || undefined}
      onClick={dismiss}
      role="dialog"
      aria-live="polite"
      aria-label="Task complete celebration"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(45, 27, 61, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        fontFamily:
          'Pretendard, "Pretendard Variable", -apple-system, system-ui, sans-serif',
        color: "var(--ink)",
      }}
    >
      <Confetti duration={duration} />

      <div
        className="dz-co-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 340,
          background: "var(--surface)",
          borderRadius: 24,
          padding: "28px 28px 22px",
          boxShadow:
            "0 40px 80px -30px rgba(45,27,61,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
          overflow: "hidden",
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
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            paddingTop: 4,
          }}
        >
          <div
            className="dz-co-avatar"
            style={{ transformOrigin: "center bottom" }}
          >
            {characterId ? (
              <CharacterAvatar characterId={characterId} size="xl" />
            ) : (
              <span
                style={{ fontSize: 64, lineHeight: 1 }}
                role="img"
                aria-label="celebration"
              >
                ✨
              </span>
            )}
          </div>
        </div>

        {/* Task title */}
        <div
          style={{
            position: "relative",
            marginTop: 12,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {taskTitle}
        </div>

        {/* Animated points */}
        <div
          style={{
            position: "relative",
            marginTop: 14,
            textAlign: "center",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            fontFeatureSettings: '"tnum" 1',
          }}
        >
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
            className="dz-co-levelup"
            style={{
              marginTop: 18,
              height: 32,
              borderRadius: 9999,
              background: "linear-gradient(90deg,#FF6B9D,#FFA07A,#FFD7A8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow:
                "0 8px 20px -6px rgba(255,107,157,0.5), inset 0 1px 0 rgba(255,255,255,0.5)",
              padding: "0 14px",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              LEVEL UP
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <LevelPill level={levelUp.from} size="sm" variant="outline" className="border-white/60 text-white" />
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>→</span>
              <LevelPill level={levelUp.to} size="sm" variant="outline" className="border-white/60 text-white" />
            </span>
          </div>
        )}

        {/* Dismiss button */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={dismiss}
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 48,
              paddingLeft: 22,
              paddingRight: 6,
              borderRadius: 9999,
              border: "none",
              cursor: "pointer",
              color: "#fff",
              background: "#1A0F26",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              fontFamily: "inherit",
              boxShadow:
                "0 14px 28px -10px rgba(26,15,38,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>OK</span>
            <span
              style={{
                display: "flex",
                height: 36,
                width: 36,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                background: "linear-gradient(135deg,#FF6B9D,#FFA07A)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
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
        <div
          style={{
            marginTop: 10,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-subtle)",
          }}
        >
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
          animation: dzCoCardIn 400ms cubic-bezier(0.16,1,0.3,1) 100ms forwards;
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
          animation: dzCoBanner 300ms cubic-bezier(0.16,1,0.3,1) 900ms forwards;
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
