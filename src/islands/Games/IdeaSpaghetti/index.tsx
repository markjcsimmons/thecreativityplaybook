import { useRef, useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { uniqueIdeas } from '../../../lib/inspiral';
import { ROUNDS, ROUND_SECONDS, WORKED_EXAMPLE, dealRound, pointsFor, signed } from '../../../lib/idea-spaghetti';
import { clock, download } from '../../../lib/tool-client';
import WorkedExampleView from '../../shared/WorkedExample';
import { useCountdown } from '../../shared/useCountdown';

/**
 * Idea Spaghetti (Ch2). Four five-minute rounds. Each round deals a topic and a target; a point
 * for every idea over the target and a point lost for every idea under it. Nothing leaves the
 * browser and nothing is stored.
 */
const TOOL = 'idea-spaghetti';
type Phase = 'deal' | 'ready' | 'timing' | 'scored' | 'done';
type Result = { topic: string; target: number; ideas: string[]; points: number };

export default function IdeaSpaghetti({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('deal');
  const [topic, setTopic] = useState('');
  const [own, setOwn] = useState('');
  const [target, setTarget] = useState(0);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [announce, setAnnounce] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const finish = () => {
    const unique = uniqueIdeas(ideas);
    const topicUsed = own.trim() || topic;
    const points = pointsFor(unique.length, target);
    const all = [...results, { topic: topicUsed, target, ideas: unique, points }];
    setResults(all);
    setIdeas(unique);
    setPhase(all.length >= ROUNDS ? 'done' : 'scored');
    setAnnounce(`Time. ${unique.length} ideas against a target of ${target}: ${signed(points)} points.`);
  };
  const clockTimer = useCountdown(ROUND_SECONDS, finish);

  const deal = () => {
    const dealt = dealRound(results.map((r) => r.topic), results.length ? results[results.length - 1]!.target : null);
    setTopic(dealt.topic);
    setTarget(dealt.target);
    setOwn('');
    setIdeas([]);
    setDraft('');
    setPhase('ready');
    setAnnounce(`Topic: ${dealt.topic}. Target: ${dealt.target} ideas.`);
    track('tool_generate', { tool: TOOL });
  };

  const begin = () => {
    clockTimer.start();
    setPhase('timing');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const stopEarly = () => {
    clockTimer.stop();
    finish();
  };

  const add = (e: Event) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setIdeas((list) => [...list, text]);
    setDraft('');
    inputRef.current?.focus();
  };

  const total = results.reduce((n, r) => n + r.points, 0);
  const last = results[results.length - 1];
  const reset = () => {
    setResults([]);
    setPhase('deal');
  };
  const exportText = () =>
    download(
      'idea-spaghetti.txt',
      'text/plain',
      results.map((r, i) => `Round ${i + 1}: ${r.topic} (target ${r.target}, ${r.ideas.length} ideas, ${signed(r.points)})\n${r.ideas.map((x, j) => `  ${j + 1}. ${x}`).join('\n') || '  (no ideas)'}`).join('\n\n') + `\n\nTotal: ${signed(total)}\n`,
    );

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <p class="m-0 font-bold">
        Round {Math.min(results.length + (phase === 'deal' || phase === 'ready' || phase === 'timing' ? 1 : 0), ROUNDS)} of {ROUNDS}. Total so far: {signed(total)}
      </p>

      {phase === 'deal' && (
        <button type="button" class="btn w-fit" onClick={deal}>
          {results.length ? 'Pick the next fork' : 'Pick a fork'}
        </button>
      )}

      {(phase === 'ready' || phase === 'timing') && (
        <div class="sticker grid gap-2 p-4">
          <span class="eyebrow">Topic for ideas</span>
          <span class="font-slab text-2xl font-bold leading-snug">{own.trim() || topic}</span>
          <span class="font-display text-4xl uppercase leading-none">Target: {target} ideas</span>
        </div>
      )}

      {phase === 'ready' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">Rather use a problem of your own? Type it here (optional)</span>
            <input class="field" type="text" value={own} onInput={(e) => setOwn((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <button type="button" class="btn w-fit" onClick={begin}>
            Start the five minutes
          </button>
        </div>
      )}

      {phase === 'timing' && (
        <>
          <p class="m-0 font-display text-5xl leading-none" aria-hidden="true">
            {clock(clockTimer.left)}
          </p>
          <form class="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={add}>
            <label class="grid gap-1">
              <span class="font-bold">Type an idea and press Enter</span>
              <input ref={inputRef} class="field" type="text" value={draft} onInput={(e) => setDraft((e.target as HTMLInputElement).value)} autocomplete="off" />
            </label>
            <button type="submit" class="btn self-end">
              Add
            </button>
          </form>
          <label class="grid gap-1">
            <span class="eyebrow">
              {ideas.length} of {target} ideas
            </span>
            <progress class="h-4 w-full" max={target} value={Math.min(ideas.length, target)} />
          </label>
          {ideas.length > 0 && (
            <ol class="m-0 grid list-decimal gap-1 pl-5">
              {ideas.map((x) => (
                <li>{x}</li>
              ))}
            </ol>
          )}
          <button type="button" class="btn btn-ghost w-fit" onClick={stopEarly}>
            Stop early
          </button>
        </>
      )}

      {(phase === 'scored' || phase === 'done') && last && (
        <div class="grid gap-3">
          <p class="m-0 font-slab text-2xl font-bold leading-snug">
            {last.ideas.length} ideas against a target of {last.target}: {signed(last.points)} {Math.abs(last.points) === 1 ? 'point' : 'points'}.
          </p>
          {phase === 'scored' ? (
            <button type="button" class="btn w-fit" onClick={() => setPhase('deal')}>
              Next round
            </button>
          ) : (
            <div class="grid gap-3 border-t-4 border-ink pt-4">
              <p class="m-0 font-slab text-3xl font-bold leading-snug">Final score: {signed(total)}</p>
              <ol class="m-0 grid list-decimal gap-1 pl-5">
                {results.map((r) => (
                  <li>
                    {r.topic}: {r.ideas.length} of {r.target}, {signed(r.points)}
                  </li>
                ))}
              </ol>
              <div class="no-print flex flex-wrap gap-3">
                <button type="button" class="btn" onClick={exportText}>
                  Export your ideas
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
        </div>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
