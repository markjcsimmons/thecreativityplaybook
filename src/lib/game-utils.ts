/** Small helpers shared by the chapter games (src/islands/Games). */

/** A random whole number below `n` from the browser's crypto source. */
export function randomBelow(n: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % n;
}

/** One six-sided die, 1 to 6. */
export const rollDie = (rand: (n: number) => number = randomBelow): number => rand(6) + 1;

/** One idea per line; blank lines dropped. */
export const splitLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Exact repeats (ignoring case and spacing) do not count as separate ideas. */
export const normalizeIdea = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Adds picked lines to the text in a one-idea-per-line box, skipping repeats and stopping at `max`. */
export function mergeLines(existing: string, add: string[], max: number): string {
  const lines = splitLines(existing);
  for (const x of add) {
    if (lines.length >= max) break;
    if (!lines.some((l) => l.toLowerCase() === x.toLowerCase())) lines.push(x);
  }
  return lines.join('\n');
}
