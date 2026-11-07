import { useEffect, useRef, useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { BOARD_SPACES, TURN_SECONDS, WORKED_EXAMPLE, rollPair, uniqueIdeas, type Roll } from '../../../lib/inspiral';
import { clock, download } from '../../../lib/tool-client';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * Inspiral (Ch10 Connected). Roll two themes, spend three minutes on ideas that link them, then
 * move one space toward the centre for each unique idea. Solo: your score is how many turns it
 * takes to reach the centre. Nothing leaves the browser and nothing is stored.
 */
const TOOL = 'inspiral';
type Phase = 'roll' | 'rolled' | 'timing' | 'scored' | 'won';
type Turn = { themes: string[]; ideas: string[]; gained: number };

export default function Inspiral({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('roll');
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [position, setPosition] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(TURN_SECONDS);
  const [announce, setAnnounce] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const endsAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const roll = () => {
    setRolls(rollPair());
    setIdeas([]);
    setDraft('');
    setPhase('rolled');
    track('tool_generate', { tool: TOOL });
    setAnnounce('Two themes rolled.');
  };

  const startTimer = () => {
    endsAt.current = Date.now() + TURN_SECONDS * 1000;
    setSecondsLeft(TURN_SECONDS);
    setTimedOut(false);
    setPhase('timing');
    setAnnounce('Timer started. Three minutes. Go.');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const score = (list: string[]) => {
    const unique = uniqueIdeas(list);
    const next = Math.min(BOARD_SPACES, position + unique.length);
    setTurns((t) => [...t, { themes: rolls.map((r) => r.theme), ideas: unique, gained: unique.length }]);
    setIdeas(unique);
    setPosition(next);
    setPhase(next >= BOARD_SPACES ? 'won' : 'scored');
    setAnnounce(`${unique.length} unique ${unique.length === 1 ? 'idea' : 'ideas'}. ${next} of ${BOARD_SPACES} spaces.`);
  };

  useEffect(() => {
    if (phase !== 'timing') return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
        setAnnounce('Time.');
        setTimedOut(true);
      } else if (left % 60 === 0) setAnnounce(`${left / 60} minute${left === 60 ? '' : 's'} left.`);
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  // When the clock runs out, score the ideas typed so far.
  useEffect(() => {
    if (!timedOut) return;
    setTimedOut(false);
    score(ideas);
  }, [timedOut]);

  const add = (e: Event) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setIdeas((list) => [...list, text]);
    setDraft('');
    inputRef.current?.focus();
  };

  const reset = () => {
    setPhase('roll');
    setRolls([]);
    setIdeas([]);
    setPosition(0);
    setTurns([]);
  };

  const exportAll = () =>
    download(
      'inspiral-ideas.txt',
      'text/plain',
      turns.map((t, i) => `Turn ${i + 1}: ${t.themes.join(' + ')}\n${t.ideas.map((x, j) => `  ${j + 1}. ${x}`).join('\n') || '  (no ideas)'}`).join('\n\n') + '\n',
    );

  const themes = (
    <ul class="m-0 grid list-none grid-cols-2 gap-3 p-0">
      {rolls.map((r, i) => (
        <li class="sticker grid content-start gap-1 p-3">
          <span class="eyebrow">Theme {i + 1}</span>
          <span class="break-words font-display text-2xl uppercase leading-tight sm:text-3xl">{r.theme}</span>
          <span class="text-sm">
            Dice {r.around} and {r.inward}: {r.around} around, {r.inward} in
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <label class="grid gap-1">
        <span class="eyebrow">
          Your counter: {position} of {BOARD_SPACES} spaces to the centre
        </span>
        <progress class="h-4 w-full" max={BOARD_SPACES} value={position} />
      </label>

      {phase === 'roll' && (
        <button type="button" class="btn w-fit" onClick={roll}>
          {turns.length ? 'Roll for the next two themes' : 'Roll the dice'}
        </button>
      )}

      {phase === 'rolled' && (
        <>
          {themes}
          <p class="m-0">When you start, you have three minutes to think of as many ideas as you can that link the two themes. Sensible or crazy.</p>
          <button type="button" class="btn w-fit" onClick={startTimer}>
            Start the three minutes
          </button>
        </>
      )}

      {phase === 'timing' && (
        <>
          {themes}
          <p class="m-0 font-display text-5xl leading-none" aria-hidden="true">
            {clock(secondsLeft)}
          </p>
          <form class="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={add}>
            <label class="grid gap-1">
              <span class="font-bold">An idea that links the two themes. Press Enter to add it.</span>
              <input ref={inputRef} class="field" type="text" value={draft} onInput={(e) => setDraft((e.target as HTMLInputElement).value)} autocomplete="off" />
            </label>
            <button type="submit" class="btn self-end">
              Add
            </button>
          </form>
          <p class="m-0">
            {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'} so far
          </p>
          {ideas.length > 0 && (
            <ol class="m-0 grid list-decimal gap-1 pl-5">
              {ideas.map((x) => (
                <li>{x}</li>
              ))}
            </ol>
          )}
          <button type="button" class="btn btn-ghost w-fit" onClick={() => score(ideas)}>
            Finish early
          </button>
        </>
      )}

      {(phase === 'scored' || phase === 'won') && (
        <div class="grid gap-3">
          {themes}
          <p class="m-0 font-slab text-2xl font-bold leading-snug">
            {turns[turns.length - 1]?.gained ?? 0} unique {turns[turns.length - 1]?.gained === 1 ? 'idea' : 'ideas'}. You move that many spaces.
          </p>
          {ideas.length > 0 && (
            <ol class="m-0 grid list-decimal gap-1 pl-5">
              {ideas.map((x) => (
                <li>{x}</li>
              ))}
            </ol>
          )}
          <p class="m-0">Exact repeats do not count. Only you can judge whether two ideas are really different, so be honest.</p>
          {phase === 'scored' ? (
            <button type="button" class="btn w-fit" onClick={() => setPhase('roll')}>
              Next turn
            </button>
          ) : (
            <div class="grid gap-3 border-t-4 border-ink pt-4">
              <p class="m-0 font-slab text-3xl font-bold leading-snug">
                You reached the centre in {turns.length} {turns.length === 1 ? 'turn' : 'turns'}.
              </p>
              <div class="no-print flex flex-wrap gap-3">
                <button type="button" class="btn" onClick={exportAll}>
                  Export all your ideas
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

      {turns.length > 0 && phase !== 'won' && (
        <details>
          <summary class="cursor-pointer font-bold">Your turns so far ({turns.length})</summary>
          <ol class="m-0 mt-2 grid list-decimal gap-1 pl-5">
            {turns.map((t) => (
              <li>
                {t.themes.join(' + ')}: {t.gained} {t.gained === 1 ? 'idea' : 'ideas'}
              </li>
            ))}
          </ol>
        </details>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
