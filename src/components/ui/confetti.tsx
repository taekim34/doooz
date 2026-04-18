"use client";
import { useMemo } from "react";

const COLORS = ["#FF6B9D", "#FFA07A", "#6366F1", "#FFD7A8", "#A5B4FC"];

export function Confetti({ count = 14 }: { count?: number }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const color = COLORS[i % COLORS.length]!;
      const left = `${5 + (i / count) * 90}%`;
      const rot = Math.round(Math.random() * 360);
      const delay = `${600 + i * 80}ms`;
      const isCircle = i % 3 === 0;
      return { color, left, rot, delay, isCircle, key: i };
    });
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="absolute top-0 animate-confettiFall motion-reduce:hidden"
          style={{
            left: p.left,
            "--rot": `${p.rot}deg`,
            animationDelay: p.delay,
            width: p.isCircle ? 8 : 6,
            height: p.isCircle ? 8 : 14,
            borderRadius: p.isCircle ? "50%" : "2px",
            background: p.color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
