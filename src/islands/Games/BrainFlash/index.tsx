import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { ROUNDS, WORKED_EXAMPLE, rollPicture, type Cell } from '../../../lib/brain-flash';
import { splitLines } from '../../../lib/game-utils';
import { download } from '../../../lib/tool-client';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * Brain Flash (Ch6). Decide on a problem, throw two dice to pick a picture, and let it spark a
 * comparison and some ideas. Five rounds, and the player keeps the best idea from each. Nothing
 * leaves the browser and nothing is stored.
 */
const TOOL = 'brain-flash';
type Phase = 'problem' | 'roll' | 'think' | 'done';
type Round = { picture: Cell; simile: string; ideas: string[]; best: string };

export default function BrainFlash({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('problem');
  const [problem, setProblem] = useState('');
  const [picture, setPicture] = useState<Cell | null>(null);
  const [simile, setSimile] = useState('');
  const [ideasText, setIdeasText] = useState('');
  const [best, setBest] = useState('');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [announce, setAnnounce] = useState('');

  const ideas = splitLines(ideasText);

  const roll = () => {
    const p = rollPicture(rounds.map((r) => r.picture));
    setPicture(p);
    setSimile('');
    setIdeasText('');
    setBest('');
    setPhase('think');
    track('tool_generate', { tool: TOOL });
    setAnnounce(`You threw ${p.column} and ${p.row}: ${p.name}.`);
  };

  const finishRound = () => {
    const all = [...rounds, { picture: picture!, simile: simile.trim(), ideas, best }];
    setRounds(all);
    setPhase(all.length >= ROUNDS ? 'done' : 'roll');
  };

  const summary = () =>
    [`Problem: ${problem.trim()}`, '', ...rounds.map((r, i) => `Round ${i + 1}: ${r.picture.name}\n  Simile: ${r.simile || '(none)'}\n  Ideas: ${r.ideas.join('; ') || '(none)'}\n  Best: ${r.best || '(none)'}`)].join('\n');

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
    setPicture(null);
  };

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'problem' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">The problem you want to solve</span>
            <input class="field" type="text" value={problem} onInput={(e) => setProblem((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <button type="button" class="btn w-fit" disabled={!problem.trim()} onClick={() => setPhase('roll')}>
            Start the game
          </button>
        </div>
      )}

      {phase !== 'problem' && (
        <p class="m-0 font-bold">
          Problem: {problem.trim()} <span class="font-normal">(Round {Math.min(rounds.length + (phase === 'done' ? 0 : 1), ROUNDS)} of {ROUNDS})</span>
        </p>
      )}

      {phase === 'roll' && (
        <button type="button" class="btn w-fit" onClick={roll}>
          Throw the dice
        </button>
      )}

      {phase === 'think' && picture && (
        <div class="grid gap-3">
          <div class="sticker flex items-center gap-4 p-3">
            <img src={picture.image} alt={`A picture of ${picture.name}.`} width="90" height="90" class="h-auto w-24" />
            <div class="grid gap-1">
              <span class="eyebrow">
                Dice {picture.column} and {picture.row}
              </span>
              <span class="font-display text-3xl uppercase leading-tight">{picture.name}</span>
            </div>
          </div>
          <label class="grid gap-1">
            <span class="font-bold">Describe your problem as a simile using the picture: "It is like {picture.name} because ..."</span>
            <textarea class="field" rows={2} value={simile} onInput={(e) => setSimile((e.target as HTMLTextAreaElement).value)} />
          </label>
          <label class="grid gap-1">
            <span class="font-bold">Ideas the simile sparks, one per line</span>
            <textarea class="field" rows={4} value={ideasText} onInput={(e) => setIdeasText((e.target as HTMLTextAreaElement).value)} />
          </label>
          {ideas.length > 0 && (
            <fieldset class="m-0 grid gap-1 border-0 p-0">
              <legend class="font-bold">Which is the best idea this round?</legend>
              {ideas.map((x) => (
                <label class="flex items-baseline gap-2">
                  <input type="radio" name="best" checked={best === x} onChange={() => setBest(x)} />
                  <span>{x}</span>
                </label>
              ))}
            </fieldset>
          )}
          <button type="button" class="btn w-fit" disabled={ideas.length === 0 || !best} onClick={finishRound}>
            {rounds.length + 1 >= ROUNDS ? 'Finish the game' : 'Next round'}
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div class="grid gap-3 border-t-4 border-ink pt-4">
          <p class="m-0 font-slab text-3xl font-bold leading-snug">Your best idea from each round</p>
          <ol class="m-0 grid list-none gap-2 p-0">
            {rounds.map((r) => (
              <li class="flex items-center gap-3 border-2 border-ink p-2">
                <img src={r.picture.image} alt={`A picture of ${r.picture.name}.`} width="48" height="48" class="h-12 w-12" />
                <span class="min-w-0 flex-1 break-words">{r.best}</span>
              </li>
            ))}
          </ol>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={copy}>
              Copy everything
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => download('brain-flash.txt', 'text/plain', summary() + '\n')}>
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
