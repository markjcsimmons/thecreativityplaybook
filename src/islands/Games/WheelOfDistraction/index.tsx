import { useEffect, useRef, useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { randomBelow } from '../../../lib/game-utils';
import { DISTRACTIONS, WORKED_EXAMPLE } from '../../../lib/wheel-of-distraction';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * Wheel of Distraction (Ch5). The player frames a problem, the wheel picks a distraction at
 * random, and later they write down what popped into their head. Nothing leaves the browser
 * and nothing is stored.
 */
const TOOL = 'wheel-of-distraction';
type Phase = 'frame' | 'spinning' | 'landed' | 'back';

export default function WheelOfDistraction({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [problem, setProblem] = useState('');
  const [phase, setPhase] = useState<Phase>('frame');
  const [highlight, setHighlight] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [announce, setAnnounce] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const spin = () => {
    const target = randomBelow(DISTRACTIONS.length);
    setChosen(target);
    track('tool_generate', { tool: TOOL });
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const land = () => {
      setHighlight(target);
      setPhase('landed');
      setAnnounce(`The wheel landed on: ${DISTRACTIONS[target]!.title}.`);
    };
    if (reduce) return land();
    setPhase('spinning');
    // Chase the highlight round the list, slowing down, and stop on the chosen one.
    const laps = 2 * DISTRACTIONS.length + target;
    let step = 0;
    const tick = () => {
      setHighlight(step % DISTRACTIONS.length);
      if (step >= laps) return land();
      step += 1;
      timer.current = setTimeout(tick, 40 + Math.pow(step / laps, 3) * 360);
    };
    tick();
  };

  const copy = async () => {
    const d = DISTRACTIONS[chosen!]!;
    const body = [`Problem: ${problem.trim()}`, `Distraction: ${d.title}`, thoughts.trim() && `What popped into my head: ${thoughts.trim()}`].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(body);
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const reset = () => {
    setPhase('frame');
    setChosen(null);
    setHighlight(null);
    setThoughts('');
  };

  const d = chosen === null ? null : DISTRACTIONS[chosen]!;

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'frame' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">What creative problem are you stuck on? Spend a few minutes on it first, then write it here.</span>
            <textarea class="field" rows={3} value={problem} onInput={(e) => setProblem((e.target as HTMLTextAreaElement).value)} />
          </label>
          <button type="button" class="btn w-fit" disabled={!problem.trim()} onClick={spin}>
            Spin the wheel
          </button>
        </div>
      )}

      {phase !== 'frame' && (
        <>
          <p class="m-0 font-bold">Problem: {problem.trim()}</p>
          <ol class="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2" aria-label="The wheel">
            {DISTRACTIONS.map((x, i) => (
              <li class={`border-2 border-ink p-2 ${highlight === i ? 'bg-ink text-paper' : ''}`}>{x.title}</li>
            ))}
          </ol>
        </>
      )}

      {phase === 'landed' && d && (
        <div class="grid gap-3">
          <p class="eyebrow m-0">Your distraction</p>
          <p class="m-0 font-slab text-3xl font-bold leading-snug">{d.title}</p>
          <p class="m-0">{d.aside}</p>
          <p class="m-0">Go and do it, properly, and leave the problem alone. Even if you do not come up with a good idea, you will have had a good time, and the idea will pop up later.</p>
          <div class="flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={() => setPhase('back')}>
              I am back
            </button>
            <button type="button" class="btn btn-ghost" onClick={spin}>
              Spin again
            </button>
          </div>
        </div>
      )}

      {phase === 'back' && d && (
        <div class="grid gap-3">
          <p class="m-0">
            You did: <strong>{d.title}</strong>
          </p>
          <label class="grid gap-1">
            <span class="font-bold">What popped into your head, however small or silly?</span>
            <textarea class="field" rows={4} value={thoughts} onInput={(e) => setThoughts((e.target as HTMLTextAreaElement).value)} />
          </label>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={copy}>
              Copy
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" class="btn btn-ghost" onClick={reset}>
              Play again
            </button>
          </div>
          {waitlistOpen && (
            <p class="no-print m-0 border-l-8 border-ink pl-4">
              Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
            </p>
          )}
        </div>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
