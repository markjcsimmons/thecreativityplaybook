import { useEffect, useState } from 'preact/hooks';
import { int, newSeed, rngFromSeed } from '../../lib/prng';

const SPOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

function Die({ value, color }: { value: number; color: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 100 100" role="img" aria-label={`Die showing ${value}`}>
      <rect x="5" y="5" width="90" height="90" rx="18" fill={color} stroke="var(--line)" stroke-width="6" />
      {SPOTS[value]!.map(([x, y]) => (
        <circle cx={x} cy={y} r="8" fill="#111" />
      ))}
    </svg>
  );
}

const rollFor = (seed: string): [number, number] => {
  const rng = rngFromSeed(seed);
  return [int(rng, 1, 6), int(rng, 1, 6)];
};

/**
 * Smoke test for the Preact island pipeline: hydration, a seeded roll that is
 * reproducible from the URL, an aria-live announcement and reduced-motion
 * handling. The real Chapter Dice tool replaces this.
 */
export default function DiceDemo() {
  const [seed, setSeed] = useState('start');
  const [spin, setSpin] = useState(false);

  useEffect(() => {
    const fromUrl = new URL(location.href).searchParams.get('s');
    if (fromUrl) setSeed(fromUrl);
  }, []);

  const [a, b] = rollFor(seed);

  const roll = () => {
    const next = newSeed();
    setSeed(next);
    const url = new URL(location.href);
    url.searchParams.set('s', next);
    history.replaceState(null, '', url);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSpin(true);
      setTimeout(() => setSpin(false), 400);
    }
  };

  return (
    <div class="grid gap-4">
      <div class="flex gap-4" style={{ transform: spin ? 'rotate(8deg) scale(1.08)' : 'none', transition: 'transform 0.2s' }}>
        <Die value={a} color="var(--ch-2)" />
        <Die value={b} color="var(--ch-9)" />
      </div>
      <p class="m-0" role="status" aria-live="polite">
        You rolled {a} and {b}: {a + b}.
      </p>
      <button type="button" class="btn w-fit" onClick={roll}>
        Roll the dice
      </button>
    </div>
  );
}
