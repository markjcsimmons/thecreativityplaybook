import { useRef, useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { uniqueIdeas } from '../../../lib/inspiral';
import { ROUNDS, ROUND_SECONDS, WORKED_EXAMPLE, rollRole, type Roll } from '../../../lib/shoe-swapper';
import { clock, download } from '../../../lib/tool-client';
import WorkedExampleView from '../../shared/WorkedExample';
import { useCountdown } from '../../shared/useCountdown';

/**
 * Shoe Swapper (Ch9). Pick a problem, throw two dice for a pair of shoes (a role), think as that
 * role for five minutes, and repeat for three rounds. Then pick the idea that best solves the
 * problem. Nothing leaves the browser and nothing is stored.
 */
const TOOL = 'shoe-swapper';
type Phase = 'problem' | 'roll' | 'rolled' | 'timing' | 'scored' | 'choose' | 'done';
type Round = { role: string; ideas: string[] };

export default function ShoeSwapper({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('problem');
  const [problem, setProblem] = useState('');
  const [roll, setRoll] = useState<Roll | null>(null);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const finish = () => {
    const unique = uniqueIdeas(ideas);
    setIdeas(unique);
    setRounds((r) => [...r, { role: roll!.role, ideas: unique }]);
    setPhase('scored');
    setAnnounce(`Time. ${unique.length} ${unique.length === 1 ? 'idea' : 'ideas'}.`);
  };
  const timer = useCountdown(ROUND_SECONDS, finish);

  const throwDice = () => {
    setRoll(rollRole(rounds.map((r) => r.role)));
    setIdeas([]);
    setDraft('');
    setPhase('rolled');
    track('tool_generate', { tool: TOOL });
  };

  const begin = () => {
    timer.start();
    setPhase('timing');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const add = (e: Event) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setIdeas((list) => [...list, text]);
    setDraft('');
    inputRef.current?.focus();
  };

  const all = rounds.flatMap((r) => r.ideas.map((text) => ({ text, role: r.role })));
  const summary = () => [`Problem: ${problem.trim()}`, `Best idea: ${winner}`, '', ...rounds.map((r, i) => `Round ${i + 1}, as ${r.role.toLowerCase()}:\n${r.ideas.map((x, j) => `  ${j + 1}. ${x}`).join('\n') || '  (no ideas)'}`)].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const reset = () => {
    setPhase('problem');
    setProblem('');
    setRounds([]);
    setWinner(null);
    setRoll(null);
  };

  const shoes = roll && (
    <div class="sticker grid gap-1 p-4">
      <span class="eyebrow">
        Dice {roll.column} and {roll.row}: you are wearing the shoes of
      </span>
      <span class="break-words font-display text-3xl uppercase leading-tight">{roll.role}</span>
    </div>
  );

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'problem' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">The problem you want to solve</span>
            <textarea class="field" rows={2} value={problem} onInput={(e) => setProblem((e.target as HTMLTextAreaElement).value)} />
          </label>
          <button type="button" class="btn w-fit" disabled={!problem.trim()} onClick={() => setPhase('roll')}>
            Start the game
          </button>
        </div>
      )}

      {phase !== 'problem' && (
        <p class="m-0 font-bold">
          Problem: {problem.trim()} <span class="font-normal">(Round {Math.min(rounds.length + (phase === 'roll' || phase === 'rolled' || phase === 'timing' ? 1 : 0), ROUNDS)} of {ROUNDS})</span>
        </p>
      )}

      {phase === 'roll' && (
        <button type="button" class="btn w-fit" onClick={throwDice}>
          {rounds.length ? 'Swap shoes: throw the dice' : 'Throw the dice'}
        </button>
      )}

      {phase === 'rolled' && (
        <>
          {shoes}
          <p class="m-0">When you start, you have five minutes to come up with ideas for the problem from this person&rsquo;s point of view. Think like them, not like you.</p>
          <button type="button" class="btn w-fit" onClick={begin}>
            Start the five minutes
          </button>
        </>
      )}

      {phase === 'timing' && (
        <>
          {shoes}
          <p class="m-0 font-display text-5xl leading-none" aria-hidden="true">
            {clock(timer.left)}
          </p>
          <form class="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={add}>
            <label class="grid gap-1">
              <span class="font-bold">An idea from their point of view. Press Enter to add it.</span>
              <input ref={inputRef} class="field" type="text" value={draft} onInput={(e) => setDraft((e.target as HTMLInputElement).value)} autocomplete="off" />
            </label>
            <button type="submit" class="btn self-end">
              Add
            </button>
          </form>
          {ideas.length > 0 && (
            <ol class="m-0 grid list-decimal gap-1 pl-5">
              {ideas.map((x) => (
                <li>{x}</li>
              ))}
            </ol>
          )}
          <button
            type="button"
            class="btn btn-ghost w-fit"
            onClick={() => {
              timer.stop();
              finish();
            }}
          >
            Finish early
          </button>
        </>
      )}

      {phase === 'scored' && (
        <div class="grid gap-3">
          {shoes}
          <p class="m-0 font-slab text-2xl font-bold leading-snug">
            {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'} from {roll!.role.toLowerCase()}.
          </p>
          {ideas.length > 0 && (
            <ol class="m-0 grid list-decimal gap-1 pl-5">
              {ideas.map((x) => (
                <li>{x}</li>
              ))}
            </ol>
          )}
          <button type="button" class="btn w-fit" onClick={() => setPhase(rounds.length >= ROUNDS ? 'choose' : 'roll')}>
            {rounds.length >= ROUNDS ? 'Choose the best idea' : 'Next round'}
          </button>
        </div>
      )}

      {(phase === 'choose' || phase === 'done') && (
        <div class="grid gap-3">
          <p class="m-0">{phase === 'choose' ? 'Three rounds done. Which idea best solves the problem?' : ''}</p>
          {all.length === 0 && <p class="m-0">You did not write any ideas. Play again and write at least one.</p>}
          <ul class="m-0 grid list-none gap-2 p-0">
            {all.map((x) => (
              <li class={`border-2 border-ink p-2 ${winner === x.text ? 'bg-ink text-paper' : ''}`}>
                <label class="flex cursor-pointer flex-wrap items-baseline gap-x-3">
                  <input type="radio" name="best" disabled={phase === 'done'} checked={winner === x.text} onChange={() => setWinner(x.text)} />
                  <span class="min-w-0 flex-1 break-words">{x.text}</span>
                  <span class="eyebrow">{x.role}</span>
                </label>
              </li>
            ))}
          </ul>
          {phase === 'choose' && (
            <button type="button" class="btn w-fit" disabled={!winner} onClick={() => setPhase('done')}>
              This is the best idea
            </button>
          )}
        </div>
      )}

      {phase === 'done' && winner && (
        <div class="grid gap-3 border-t-4 border-ink pt-4">
          <p class="eyebrow m-0">The idea that best solves the problem</p>
          <p class="m-0 font-slab text-3xl font-bold leading-snug">{winner}</p>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={copy}>
              Copy everything
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => download('shoe-swapper.txt', 'text/plain', summary() + '\n')}>
              Export text
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
