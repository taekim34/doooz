"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#FF6B9D",
  "#FFA07A",
  "#6366F1",
  "#FFD7A8",
  "#A5B4FC",
  "#34D399",
] as const;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface Particle {
  x: number;
  color: string;
  size: number;
  round: boolean;
  delay: number;
  rotation: number;
}

function generateParticles(count: number): Particle[] {
  const rng = seededRandom(42);
  return Array.from({ length: count }, () => ({
    x: Math.round(rng() * 96 + 2),
    color: PALETTE[Math.floor(rng() * PALETTE.length)]!,
    size: Math.round(rng() * 5 + 6),
    round: rng() > 0.5,
    delay: Math.round(rng() * 400),
    rotation: Math.round(rng() * 120 - 60),
  }));
}

export interface ConfettiProps {
  /** Number of particles */
  count?: number;
  /** Total animation duration in ms */
  duration?: number;
  className?: string;
}

export function Confetti({
  count = 14,
  duration = 1800,
  className,
}: ConfettiProps) {
  const [mounted, setMounted] = React.useState(true);
  const particles = React.useMemo(() => generateParticles(count), [count]);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(false), duration + 200);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <style>{`
        @keyframes confettiFallMol {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(var(--rot, 45deg)); }
        }
        @keyframes confettiSpinMol {
          0%   { transform: rotateX(0) rotateY(0); }
          100% { transform: rotateX(360deg) rotateY(180deg); }
        }
      `}</style>
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: -20,
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? 9999 : 2,
            animationName: "confettiFallMol, confettiSpinMol",
            animationDuration: `${duration}ms, ${duration * 0.8}ms`,
            animationTimingFunction:
              "cubic-bezier(0.3, 0.1, 0.6, 1), linear",
            animationDelay: `${p.delay}ms`,
            animationFillMode: "both",
            "--rot": `${p.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
