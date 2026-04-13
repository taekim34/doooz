/**
 * Injectable clock. Tests can override via setClock().
 * All production code MUST use this instead of `Date.now()` / `new Date()`.
 * Enforced by eslint rule.
 */

export interface Clock {
  now(): number;
}

// eslint-disable-next-line no-restricted-syntax
const systemClock: Clock = { now: () => Date.now() };

let current: Clock = systemClock;

export function setClock(clock: Clock): void {
  current = clock;
}

export function resetClock(): void {
  current = systemClock;
}

export function now(): number {
  return current.now();
}

export function nowDate(): Date {
  return new Date(current.now());
}
