/**
 * Deterministic tile gradient based on character/user ID.
 * Shared across family and children pages for consistent tile backgrounds.
 */

const TILE_GRADIENTS = [
  "linear-gradient(135deg, #FFE4E9 0%, #FFC0CB 100%)",
  "linear-gradient(135deg, #E5EFFF 0%, #BFD7FF 100%)",
  "linear-gradient(135deg, #FFF5EC 0%, #FFE0C2 100%)",
  "linear-gradient(135deg, #F0F4FF 0%, #D9E1FF 100%)",
  "linear-gradient(135deg, #FFE4C4 0%, #FFD5B5 100%)",
  "linear-gradient(135deg, #F3E8FF 0%, #E0CBFF 100%)",
];

export function tileGrad(id: string | null, fallback: string): string {
  const seed = id || fallback;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TILE_GRADIENTS[Math.abs(h) % TILE_GRADIENTS.length]!;
}
