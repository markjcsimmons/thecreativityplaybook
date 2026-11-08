import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { MAX_PLAYERS, MIN_PLAYERS, ROUND_SECONDS, WORKED_EXAMPLE, expectedPoints, ranked, totalPoints, type Idea } from '../../../lib/all-together-now';
import { clock } from '../../../lib/tool-client';
import WorkedExampleView from '../../shared/WorkedExample';
import { useCountdown } from '../../shared/useCountdown';

/**
 * All Together Now (Ch7). The book's game is played on paper by four or more people. This is the
 * group's facilitator: a two-minute timer for each pass, a reminder to pass to the left, and a tally
 * for the votes (each player gives 3, 2 and 1 points). Nothing leaves the browser and nothing is
 * stored.
 */
const TOOL = 'all-together-now';
type Phase = 'setup' | 'rounds' | 'reading' | 'voting';

export default function AllTogetherNow({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [challenge, setChallenge] = useState('');
  const [players, setPlayers] = useState(MIN_PLAYERS);
  const [round, setRound] = useState(1);
  const [ended, setEnded] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([{ text: '', points: 0 }]);
  const [announce, setAnnounce] = useState('');
  const timer = useCountdown(ROUND_SECONDS, () => {
    setEnded(true);
    setAnnounce('Time. Pass your sheet to the left.');
  });

  const start = () => {
    setPhase('rounds');
    setRound(1);
    setEnded(false);
    timer.start();
    track('tool_generate', { tool: TOOL });
  };

  const nextPass = () => {
    if (round >= players) return setPhase('reading');
    setRound(round + 1);
    setEnded(false);
    timer.start();
  };

  const setIdea = (i: number, patch: Partial<Idea>) => setIdeas((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const total = totalPoints(ideas);
  const expected = expectedPoints(players);
  const order = ranked(ideas);
  const top = order[0];
  const tie = top && order.filter((x) => x.points === top.points).length > 1;

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'setup' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">The creative challenge to crack</span>
            <input class="field" type="text" value={challenge} onInput={(e) => setChallenge((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <label class="grid gap-1">
            <span class="font-bold">
              Players ({MIN_PLAYERS} to {MAX_PLAYERS}). Everyone needs a sheet of paper and a pen.
            </span>
            <input
              class="field w-24"
              type="number"
              min={MIN_PLAYERS}
              max={MAX_PLAYERS}
              value={players}
              onInput={(e) => setPlayers(Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Number((e.target as HTMLInputElement).value) || MIN_PLAYERS)))}
            />
          </label>
          <button type="button" class="btn w-fit" disabled={!challenge.trim()} onClick={start}>
            Start the first two minutes
          </button>
        </div>
      )}

      {phase === 'rounds' && (
        <div class="grid gap-3">
          <p class="m-0 font-bold">Challenge: {challenge.trim()}</p>
          <p class="m-0 font-display text-3xl uppercase leading-none">
            Pass {round} of {players}
          </p>
          <p class="m-0">
            {round === 1 ? 'Write down ideas on your own sheet, leaving room underneath.' : 'Read the sheet in front of you and write new ideas triggered by the ones already there.'}
          </p>
          <p class="m-0 font-display text-5xl leading-none" aria-hidden="true">
            {ended ? '0:00' : clock(timer.left)}
          </p>
          {ended && <p class="m-0 font-slab text-2xl font-bold">Time. Pass your sheet to the player on your left.</p>}
          <div class="flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={nextPass}>
              {round >= players ? 'The sheets are back with their owners' : 'Sheets passed: start the next two minutes'}
            </button>
          </div>
        </div>
      )}

      {phase === 'reading' && (
        <div class="grid gap-3">
          <p class="m-0 font-slab text-2xl font-bold leading-snug">Every sheet is back where it started, chock full of ideas.</p>
          <p class="m-0">Take turns reading out what is on your sheet. Then everyone votes: each player has 6 points to give, 3 for their favorite idea, 2 for their second favorite and 1 for their third.</p>
          <button type="button" class="btn w-fit" onClick={() => setPhase('voting')}>
            Tally the votes
          </button>
        </div>
      )}

      {phase === 'voting' && (
        <div class="grid gap-4">
          <p class="m-0">Add the ideas that got votes, and the total points each one received. With {players} players, the points add up to {expected}.</p>
          <ul class="m-0 grid list-none gap-2 p-0">
            {ideas.map((x, i) => (
              <li class="grid gap-2 sm:grid-cols-[1fr_6rem]">
                <label class="grid gap-1">
                  <span class="font-bold">Idea {i + 1}</span>
                  <input class="field" type="text" value={x.text} onInput={(e) => setIdea(i, { text: (e.target as HTMLInputElement).value })} autocomplete="off" />
                </label>
                <label class="grid gap-1">
                  <span class="font-bold">Points</span>
                  <input class="field" type="number" min={0} value={x.points} onInput={(e) => setIdea(i, { points: Math.max(0, Number((e.target as HTMLInputElement).value) || 0) })} />
                </label>
              </li>
            ))}
          </ul>
          <button type="button" class="btn btn-ghost w-fit" onClick={() => setIdeas([...ideas, { text: '', points: 0 }])}>
            Add another idea
          </button>
          <p class="m-0" aria-live="polite">
            Points counted: {total} of {expected}
            {total === expected ? '. That matches.' : total > expected ? '. That is too many.' : '. Some points are missing.'}
          </p>

          {top && top.points > 0 && (
            <div class="grid gap-3 border-t-4 border-ink pt-4">
              <p class="eyebrow m-0">{tie ? 'A tie at the top' : 'The winning idea'}</p>
              <ol class="m-0 grid list-none gap-2 p-0">
                {order.map((x, i) => (
                  <li class={`flex flex-wrap items-baseline gap-3 border-2 border-ink p-2 ${x.points === top.points ? 'bg-ink text-paper' : ''}`}>
                    <span class="font-display text-xl">{i + 1}</span>
                    <span class="min-w-0 flex-1 break-words">{x.text}</span>
                    <span class="eyebrow">{x.points} points</span>
                  </li>
                ))}
              </ol>
              <p class="m-0 font-bold">The player who came up with it wins. Then everyone gets a hug, because the book says in this game love is more important than winning.</p>
              <div class="no-print flex flex-wrap gap-3">
                <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
                  Print
                </button>
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => {
                    setPhase('setup');
                    setIdeas([{ text: '', points: 0 }]);
                  }}
                >
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
