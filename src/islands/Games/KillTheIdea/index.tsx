import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { splitLines } from '../../../lib/game-utils';
import {
  MAX_IDEAS,
  MIN_IDEAS,
  SAVES,
  WORKED_EXAMPLE,
  canSave,
  decide,
  drop,
  finish,
  newGame,
  savedIdeas,
  stillAlive,
  toss,
  type Game,
} from '../../../lib/kill-the-idea';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * Kill the Idea (Ch11). The player writes their strongest ideas, a random finger kills one at a
 * time, and three saves can bring killed ideas back (on only two different ideas). Nothing leaves
 * the browser and nothing is stored.
 */
const TOOL = 'kill-the-idea';

export default function KillTheIdea({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [problem, setProblem] = useState('');
  const [text, setText] = useState('');
  const [game, setGame] = useState<Game | null>(null);
  const [why, setWhy] = useState('');
  const [announce, setAnnounce] = useState('');

  const lines = splitLines(text);
  const tooMany = lines.length > MAX_IDEAS;
  const ready = lines.length >= MIN_IDEAS && !tooMany;

  const start = () => {
    if (!ready) return;
    setGame(newGame(lines));
    setWhy('');
    track('tool_generate', { tool: TOOL });
    setAnnounce('Game started.');
  };

  const play = (next: Game, message: string) => {
    setGame(next);
    setAnnounce(message);
  };

  const copyResult = async (g: Game) => {
    const winner = g.ideas[g.winner!]!.text;
    const body = [problem.trim() && `Problem: ${problem.trim()}`, `The idea worth fighting for: ${winner}`, why.trim() && `Why it matters: ${why.trim()}`].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(body);
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {!game && (
        <div class="grid gap-4">
          <label class="grid gap-1">
            <span class="font-bold">The problem you are solving (optional)</span>
            <input class="field" type="text" value={problem} onInput={(e) => setProblem((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <label class="grid gap-1">
            <span class="font-bold">
              Your strongest ideas, one per line ({MIN_IDEAS} to {MAX_IDEAS}; the book uses {MAX_IDEAS})
            </span>
            <textarea class="field" rows={8} value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} />
          </label>
          <p class="m-0" aria-live="polite">
            {lines.length} {lines.length === 1 ? 'idea' : 'ideas'}
            {tooMany ? `. That is too many: keep the strongest ${MAX_IDEAS}.` : lines.length < MIN_IDEAS ? `. Add at least ${MIN_IDEAS}.` : '.'}
          </p>
          <button type="button" class="btn w-fit" disabled={!ready} onClick={start}>
            Start the game
          </button>
        </div>
      )}

      {game && (
        <div class="grid gap-4">
          {problem.trim() && <p class="m-0 font-bold">Problem: {problem.trim()}</p>}
          <div class="flex flex-wrap items-center gap-x-6 gap-y-1">
            <p class="m-0 font-bold">
              Saves left: {game.lives} of {SAVES}
              <span aria-hidden="true"> {'●'.repeat(game.lives)}{'○'.repeat(SAVES - game.lives)}</span>
            </p>
            <p class="m-0">
              {stillAlive(game)} {stillAlive(game) === 1 ? 'idea' : 'ideas'} still alive
            </p>
          </div>

          <ol class="m-0 grid list-none gap-2 p-0">
            {game.ideas.map((idea, i) => (
              <li class={`flex flex-wrap items-baseline gap-x-3 border-2 border-ink p-2 ${game.drawn === i || game.doomed === i ? 'bg-ink text-paper' : ''}`}>
                <span class="font-display text-xl">{i + 1}</span>
                <span class={`min-w-0 flex-1 break-words ${idea.status === 'killed' ? 'line-through opacity-60' : ''}`}>{idea.text}</span>
                <span class="eyebrow">{idea.status === 'killed' ? 'Killed' : idea.status === 'saved' ? 'Saved' : 'Alive'}</span>
              </li>
            ))}
          </ol>

          {game.phase === 'drop' && (
            <div class="grid gap-2">
              <p class="m-0">Close your eyes and drop a finger on the board.</p>
              <button type="button" class="btn w-fit" onClick={() => {
                const next = drop(game);
                play(next, `The finger landed on idea ${next.drawn! + 1}.`);
              }}>
                Drop the finger
              </button>
            </div>
          )}

          {game.phase === 'decide' && game.drawn !== null && (
            <div class="grid gap-3">
              <p class="m-0 font-slab text-2xl font-bold leading-snug">
                The finger landed on idea {game.drawn + 1}: {game.ideas[game.drawn]!.text}
              </p>
              <p class="m-0">
                {canSave(game)
                  ? 'Is it worth a save? A saved idea is safe until the final toss.'
                  : savedIdeas(game).length >= 2
                    ? 'Your saves are on two ideas, and the last one waits for the final toss. This one has to go.'
                    : 'You have no saves left. This one has to go.'}
              </p>
              <div class="flex flex-wrap gap-3">
                <button type="button" class="btn" onClick={() => play(decide(game, 'kill'), `Idea ${game.drawn! + 1} killed.`)}>
                  Kill it
                </button>
                <button type="button" class="btn btn-ghost" disabled={!canSave(game)} onClick={() => play(decide(game, 'save'), `Idea ${game.drawn! + 1} saved.`)}>
                  Use a save
                </button>
              </div>
            </div>
          )}

          {game.phase === 'toss' && (
            <div class="grid gap-2">
              <p class="m-0 font-bold">Sudden death. Only your two saved ideas are left.</p>
              <button type="button" class="btn w-fit" onClick={() => {
                const next = toss(game);
                play(next, `The coin chose idea ${next.doomed! + 1} to die.`);
              }}>
                Toss the coin
              </button>
            </div>
          )}

          {game.phase === 'final' && game.doomed !== null && (
            <div class="grid gap-3">
              <p class="m-0 font-slab text-2xl font-bold leading-snug">
                The coin says idea {game.doomed + 1} must die: {game.ideas[game.doomed]!.text}
              </p>
              <p class="m-0">If your gut says this is the one idea you cannot live without, use your last save. Otherwise let it go.</p>
              <div class="flex flex-wrap gap-3">
                <button type="button" class="btn" disabled={game.lives < 1} onClick={() => play(finish(game, true), 'Saved. It wins.')}>
                  Use the last save
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => play(finish(game, false), 'Killed.')}>
                  Let it die
                </button>
              </div>
            </div>
          )}

          {game.phase === 'done' && game.winner !== null && (
            <div class="grid gap-3 border-t-4 border-ink pt-4">
              <p class="eyebrow m-0">The idea worth fighting for</p>
              <p class="m-0 font-slab text-3xl font-bold leading-snug">{game.ideas[game.winner]!.text}</p>
              <label class="grid gap-1">
                <span class="font-bold">Why does this one matter to you?</span>
                <textarea class="field" rows={3} value={why} onInput={(e) => setWhy((e.target as HTMLTextAreaElement).value)} />
              </label>
              <div class="no-print flex flex-wrap gap-3">
                <button type="button" class="btn" onClick={() => copyResult(game)}>
                  Copy result
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
                  Print
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => setGame(null)}>
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
          {game.phase !== 'done' && (
            <button type="button" class="btn btn-ghost no-print w-fit" onClick={() => setGame(null)}>
              Start over
            </button>
          )}
        </div>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
