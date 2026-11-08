import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { randomBelow, rollDie } from '../../../lib/game-utils';
import { FINAL, WORKED_EXAMPLE, squareAt, type Square } from '../../../lib/how-to-play';
import Countdown from '../../shared/Countdown';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * How to Play (Ch1). Write an idea card, then climb a path of 30 squares to the CEO by throwing a
 * die. Special squares ask the player to do something (pitch, draw, answer a committee) and the
 * player says whether they managed it. Nothing leaves the browser and nothing is stored.
 */
const TOOL = 'how-to-play';
type Phase = 'card' | 'roll' | 'square' | 'won';

export default function HowToPlay({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('card');
  const [name, setName] = useState('');
  const [line, setLine] = useState('');
  const [pos, setPos] = useState(0);
  const [turns, setTurns] = useState(0);
  const [skip, setSkip] = useState(false);
  const [die, setDie] = useState<number | null>(null);
  const [square, setSquare] = useState<Square | null>(null);
  const [checks, setChecks] = useState([false, false, false]);
  const [fieldA, setFieldA] = useState('');
  const [fieldB, setFieldB] = useState('');
  const [sixRoll, setSixRoll] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [announce, setAnnounce] = useState('');

  const note = (text: string) => {
    setLog((l) => [text, ...l].slice(0, 8));
    setAnnounce(text);
  };

  const clearTask = () => {
    setChecks([false, false, false]);
    setFieldA('');
    setFieldB('');
    setSixRoll(null);
    setSquare(null);
  };

  const begin = () => {
    setPhase('roll');
    setPos(0);
    setTurns(0);
    setLog([]);
    track('tool_generate', { tool: TOOL });
  };

  const throwDie = () => {
    const n = turns + 1;
    setTurns(n);
    if (skip) {
      setSkip(false);
      setDie(null);
      return note(`Turn ${n}: you miss this turn.`);
    }
    const d = rollDie(randomBelow);
    setDie(d);
    const next = Math.min(FINAL, pos + d);
    setPos(next);
    if (next >= FINAL) {
      setPhase('won');
      return note(`Turn ${n}: you threw a ${d} and reached the CEO.`);
    }
    const sq = squareAt(next);
    if (!sq) return note(`Turn ${n}: you threw a ${d} and moved to square ${next}.`);
    note(`Turn ${n}: you threw a ${d} and landed on "${sq.title}".`);
    setSquare(sq);
    setPhase('square');
  };

  const resolve = (outcome: 'up' | 'down' | 'stay', message: string) => {
    if (square?.kind === 'offsite') setSkip(true);
    const target = outcome === 'stay' ? pos : square?.to ?? pos;
    setPos(outcome === 'stay' || !square ? pos : target);
    note(`${message}${outcome === 'stay' ? '' : ` Square ${target}.`}`);
    clearTask();
    setPhase('roll');
  };

  const tryForSix = () => {
    const d = rollDie(randomBelow);
    setSixRoll(d);
    setAnnounce(`You threw a ${d}.`);
  };

  const reset = () => {
    setPhase('card');
    setPos(0);
    setTurns(0);
    setSkip(false);
    setDie(null);
    clearTask();
    setLog([]);
  };

  const sq = square;
  const progressPct = Math.round((pos / FINAL) * 100);

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'card' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">A crazy name for your product</span>
            <input class="field" type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <label class="grid gap-1">
            <span class="font-bold">What it does, in one line</span>
            <input class="field" type="text" value={line} onInput={(e) => setLine((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <button type="button" class="btn w-fit" disabled={!name.trim() || !line.trim()} onClick={begin}>
            Start climbing
          </button>
        </div>
      )}

      {phase !== 'card' && (
        <>
          <div class="sticker grid gap-1 p-3">
            <span class="eyebrow">Your idea</span>
            <span class="font-slab text-xl font-bold leading-snug">
              {name.trim()}: {line.trim()}
            </span>
          </div>
          <label class="grid gap-1">
            <span class="eyebrow">
              Square {pos} of {FINAL}. Turns: {turns}
            </span>
            <progress class="h-4 w-full" max={FINAL} value={pos} aria-valuetext={`${progressPct} percent of the way to the CEO`} />
          </label>
        </>
      )}

      {phase === 'roll' && (
        <div class="grid gap-2">
          {skip && <p class="m-0 font-bold">You landed on an offsite meeting. Your next throw is missed.</p>}
          <button type="button" class="btn w-fit" onClick={throwDie}>
            {skip ? 'Miss this turn' : 'Throw the die'}
          </button>
          {die !== null && <p class="m-0">Last throw: {die}</p>}
        </div>
      )}

      {phase === 'square' && sq && (
        <div class="sticker grid gap-3 p-4">
          <span class="eyebrow">{sq.helpful ? 'A helpful push' : 'An obstacle'}</span>
          <p class="m-0 font-slab text-2xl font-bold leading-snug">{sq.title}</p>
          <p class="m-0">{sq.text}</p>

          {sq.kind === 'elevator' && (
            <>
              <Countdown seconds={30} label="Start the 30 seconds" />
              <fieldset class="m-0 grid gap-1 border-0 p-0">
                <legend class="font-bold">Did you manage all three?</legend>
                {['Said your product’s name exactly five times', 'Said "return on investment" twice', 'Complimented your listener on their appearance'].map((t, i) => (
                  <label class="flex items-baseline gap-2">
                    <input type="checkbox" checked={checks[i]} onChange={() => setChecks(checks.map((c, j) => (j === i ? !c : c)))} />
                    <span>{t}</span>
                  </label>
                ))}
              </fieldset>
              <div class="flex flex-wrap gap-3">
                <button type="button" class="btn" disabled={!checks.every(Boolean)} onClick={() => resolve('up', 'The pitch worked and you take the shortcut.')}>
                  Take the shortcut
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => resolve('stay', 'The pitch missed a rule, so no shortcut.')}>
                  No shortcut
                </button>
              </div>
            </>
          )}

          {sq.kind === 'pda' && (
            <>
              <Countdown seconds={30} label="Start the 30 seconds" />
              <div class="flex flex-wrap gap-3">
                <button type="button" class="btn" onClick={() => resolve('up', 'You drew your product in time and ride up for free.')}>
                  I drew it
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => resolve('stay', 'You ran out of time, so you stay put.')}>
                  I ran out of time
                </button>
              </div>
            </>
          )}

          {sq.kind === 'seminar' && (
            <>
              <label class="grid gap-1">
                <span class="font-bold">What will the TV commercial look like?</span>
                <textarea class="field" rows={2} value={fieldA} onInput={(e) => setFieldA((e.target as HTMLTextAreaElement).value)} />
              </label>
              <label class="grid gap-1">
                <span class="font-bold">Which celebrity will be the spokesperson? (An imaginary one is fine.)</span>
                <input class="field" type="text" value={fieldB} onInput={(e) => setFieldB((e.target as HTMLInputElement).value)} autocomplete="off" />
              </label>
              <div class="flex flex-wrap gap-3">
                <button type="button" class="btn" disabled={!fieldA.trim() || !fieldB.trim()} onClick={() => resolve('up', 'The boss loved it and you ride up.')}>
                  Ride the boss’s enthusiasm
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => resolve('stay', 'You could not think of one, so you stay put.')}>
                  I cannot think of one
                </button>
              </div>
            </>
          )}

          {sq.kind === 'competition' && (
            <button type="button" class="btn w-fit" onClick={() => resolve('up', 'A free move up.')}>
              Move up the board
            </button>
          )}

          {sq.kind === 'committee' && (
            <>
              <Countdown seconds={120} label="Start the two minutes" />
              <label class="grid gap-1">
                <span class="font-bold">The committee says: "It’ll never work because ..."</span>
                <input class="field" type="text" value={fieldA} onInput={(e) => setFieldA((e.target as HTMLInputElement).value)} autocomplete="off" />
              </label>
              <label class="grid gap-1">
                <span class="font-bold">You answer: "I’m so glad you brought that up ..."</span>
                <textarea class="field" rows={2} value={fieldB} onInput={(e) => setFieldB((e.target as HTMLTextAreaElement).value)} />
              </label>
              <div class="flex flex-wrap gap-3">
                <button type="button" class="btn" disabled={!fieldA.trim() || !fieldB.trim()} onClick={() => resolve('stay', 'You answered the committee, smiling, and stay put.')}>
                  I answered, smiling
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => resolve('down', 'You had no answer, so you slide down.')}>
                  I had no answer
                </button>
              </div>
            </>
          )}

          {(sq.kind === 'notHere' || sq.kind === 'research') && (
            <button type="button" class="btn w-fit" onClick={() => resolve('down', 'You slide down the board.')}>
              Slide down
            </button>
          )}

          {sq.kind === 'nobody' && (
            <>
              {sixRoll === null ? (
                <button type="button" class="btn w-fit" onClick={tryForSix}>
                  Throw the die
                </button>
              ) : sixRoll === 6 ? (
                <>
                  <p class="m-0 font-bold">A six! You escape.</p>
                  <button type="button" class="btn w-fit" onClick={() => resolve('stay', 'You threw a six and escape.')}>
                    Carry on
                  </button>
                </>
              ) : (
                <>
                  <p class="m-0 font-bold">You threw a {sixRoll}. Not a six.</p>
                  <button type="button" class="btn w-fit" onClick={() => resolve('down', 'No six, so you drop down.')}>
                    Drop down
                  </button>
                </>
              )}
            </>
          )}

          {sq.kind === 'offsite' && (
            <button type="button" class="btn w-fit" onClick={() => resolve('stay', 'An offsite meeting. You will miss your next turn.')}>
              Oh well
            </button>
          )}
        </div>
      )}

      {phase === 'won' && (
        <div class="grid gap-3 border-t-4 border-ink pt-4">
          <p class="m-0 font-slab text-3xl font-bold leading-snug">
            You reached the CEO in {turns} {turns === 1 ? 'turn' : 'turns'}. You are the king of the castle.
          </p>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={reset}>
              Play again
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
              Print
            </button>
          </div>
          {waitlistOpen && (
            <p class="no-print m-0 border-l-8 border-ink pl-4">
              Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
            </p>
          )}
        </div>
      )}

      {log.length > 0 && (
        <details>
          <summary class="cursor-pointer font-bold">What has happened so far</summary>
          <ol class="m-0 mt-2 grid list-none gap-1 p-0">
            {log.map((l) => (
              <li>{l}</li>
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
