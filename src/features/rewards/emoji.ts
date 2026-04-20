/**
 * Deterministic emoji picker based on reward title.
 * Shared across rewards pages for consistent, playful visuals.
 */

const REWARD_EMOJIS = [
  "🎮", "🍦", "📱", "🎁", "🍪", "🎬", "🧸", "🎨", "⚽", "🚲", "🎵", "🍕", "🌮", "🍭", "📚",
];

export function emojiForTitle(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return REWARD_EMOJIS[h % REWARD_EMOJIS.length] ?? "🎁";
}
