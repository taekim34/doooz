/**
 * Map character id → public PNG asset.
 * Returns null when the id is unknown so callers fall back to emoji.
 */

export const CHARACTER_IDS = [
  // Free starter animals
  "bear", "cat", "fox", "hamster", "lion", "owl", "panda", "penguin", "rabbit", "tiger",
  // Cute monsters (unlock L8)
  "mono", "jellu", "pinku", "honey", "leaf", "frost",
  // Mythical (unlock L16)
  "dragon", "unicorn", "gumiho", "griffin", "pegasus", "phoenix",
] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];

const ID_SET = new Set<string>(CHARACTER_IDS);

export function characterImageSrc(id: string | null | undefined): string | null {
  if (!id) return null;
  return ID_SET.has(id) ? `/characters/${id}.png` : null;
}

export function hasCharacterImage(id: string | null | undefined): boolean {
  return characterImageSrc(id) !== null;
}
