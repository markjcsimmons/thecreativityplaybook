import { useEffect, useState } from 'preact/hooks';
import { int, newSeed, rngFromSeed } from '../../lib/prng';
import Die from '../shared/Die';

const rollFor = (seed: string): [number, number] => {
  const rng = rngFromSeed(seed);
  return [int(rng, 1, 6), int(rng, 1, 6)];
};

/**
 * Smoke test for the Preact island pipeline: hydration, a seeded roll that is
 * reproducible from the URL, an aria-live announcement and reduced-motion
 * handling. The Chapter Dice tool is the real use of the same pieces.
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
