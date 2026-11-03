/**
 * Seeded random numbers for the tools (BRIEF §8.0). The URL holds the seed
 * (`?s=abc123`), so every result is shareable and reproducible.
 */

/** mulberry32: small, fast, good enough for picking cards. Returns a float in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash so any string seed ("abc123") becomes a 32-bit number. */
export function seedFromString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function rngFromSeed(seed: string): () => number {
  return mulberry32(seedFromString(seed));
}

/** A short URL-safe seed for a fresh roll. */
export function newSeed(length = 6): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export const pick = <T>(rng: () => number, items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;

export function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Integer in [min, max], both inclusive. */
export const int = (rng: () => number, min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));
