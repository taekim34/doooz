"use client";

import { useAnimatedCounter } from "@/components/ui/animated-counter";

export function AnimatedBalance({
  value,
  duration = 800,
  delay = 0,
}: {
  value: number;
  duration?: number;
  delay?: number;
}) {
  const display = useAnimatedCounter(value, duration, delay);
  return <>{display.toLocaleString()}</>;
}
