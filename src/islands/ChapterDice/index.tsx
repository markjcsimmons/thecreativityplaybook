import { useEffect, useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { EXERCISES, EXERCISE_MINUTES, RULE, WORKED_EXAMPLE, chapterFor, chapterInfo } from '../../lib/chapter-dice';
import { int, newSeed, rngFromSeed } from '../../lib/prng';
import Countdown from '../shared/Countdown';
import Die from '../shared/Die';
import WorkedExampleView from '../shared/WorkedExample';

/**
 * Chapter Dice. Roll two dice to pick a chapter, then do a 10-minute exercise from it. The roll
 * is seeded and kept in the URL (`?s=abc123`), so a roll can be shared. Players with real dice can
 * enter them instead. Nothing leaves the browser and nothing is stored.
 */
const TOOL = 'chapter-dice';

const rollFor = (seed: string): [number, number] => {
  const rng = rngFromSeed(seed);
  return [int(rng, 1, 6), int(rng, 1, 6)];
};

export default function ChapterDice({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [rollNo, setRollNo] = useState(0);
  const [spin, setSpin] = useState(false);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    const fromUrl = new URL(location.href).searchParams.get('s');
    if (fromUrl) setDice(rollFor(fromUrl));
  }, []);

  const show = (pair: [number, number]) => {
    setDice(pair);
    setRollNo((n) => n + 1);
    const n = chapterFor(pair[0], pair[1]);
    setAnnounce(`You rolled ${pair[0]} and ${pair[1]}: Chapter ${n}, ${chapterInfo(n).title}.`);
  };

  const roll = () => {
    const seed = newSeed();
    const url = new URL(location.href);
    url.searchParams.set('s', seed);
    history.replaceState(null, '', url);
    show(rollFor(seed));
    track('tool_generate', { tool: TOOL });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSpin(true);
      setTimeout(() => setSpin(false), 400);
    }
  };

  /** Real dice: the player says what they rolled. The URL seed no longer applies, so it is dropped. */
  const enter = (which: 0 | 1, value: number) => {
    const pair: [number, number] = [...(dice ?? [1, 1])] as [number, number];
    pair[which] = value;
    const url = new URL(location.href);
    url.searchParams.delete('s');
    history.replaceState(null, '', url);
    show(pair);
  };

  const chapter = dice ? chapterFor(dice[0], dice[1]) : null;
  const info = chapter ? chapterInfo(chapter) : null;
  const exercise = chapter ? EXERCISES[chapter]! : null;

  return (
    <div class="grid grid-cols-1 gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <div class="grid gap-4">
        <div class="flex gap-4" style={{ transform: spin ? 'rotate(8deg) scale(1.08)' : 'none', transition: 'transform 0.2s' }}>
          <Die value={dice ? dice[0] : null} color="var(--ch-2)" />
          <Die value={dice ? dice[1] : null} color="var(--ch-9)" />
        </div>
        <div class="no-print flex flex-wrap items-end gap-3">
          <button type="button" class="btn" onClick={roll}>
            {dice ? 'Roll again' : 'Roll the dice'}
          </button>
        </div>
        <details class="no-print">
          <summary class="cursor-pointer font-bold">Using real dice? Tell me what you rolled</summary>
          <div class="mt-3 flex flex-wrap gap-4">
            <label class="grid gap-1">
              <span>First die</span>
              <select class="field" value={dice ? dice[0] : ''} onChange={(e) => enter(0, Number((e.target as HTMLSelectElement).value))}>
                {!dice && <option value="">Choose</option>}
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <option value={v}>{v}</option>
                ))}
              </select>
            </label>
            <label class="grid gap-1">
              <span>Second die</span>
              <select class="field" value={dice ? dice[1] : ''} onChange={(e) => enter(1, Number((e.target as HTMLSelectElement).value))}>
                {!dice && <option value="">Choose</option>}
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <option value={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
        </details>
        <p class="m-0 text-sm">{RULE}</p>
      </div>

      {dice && info && exercise && (
        <section class="grid gap-4 border-t-4 border-ink pt-4" aria-label="Your chapter and exercise">
          <p class="m-0 font-bold">{`You rolled ${dice[0]} and ${dice[1]}.`}</p>
          <h3 class="m-0 font-slab text-3xl font-bold">{`Chapter ${info.number}: ${info.title}`}</h3>
          <p class="m-0">{info.takeaway}</p>
          <div class="sticker grid gap-3 p-4">
            <span class="eyebrow">{`Your ${EXERCISE_MINUTES}-minute exercise: ${exercise.name}`}</span>
            <p class="m-0 text-sm">{`Who: ${exercise.people}. Our shortened version of the chapter's game.`}</p>
            <ol class="m-0 grid list-decimal gap-2 pl-5">
              {exercise.steps.map((s) => (
                <li>{`${s.minutes} ${s.minutes === 1 ? 'minute' : 'minutes'}. ${s.text}`}</li>
              ))}
            </ol>
            <p class="m-0 text-sm">{exercise.fromBook}</p>
          </div>
          <div class="no-print grid gap-3">
            <Countdown key={rollNo} seconds={EXERCISE_MINUTES * 60} label={`Start the ${EXERCISE_MINUTES}-minute timer`} />
            <p class="m-0 flex flex-wrap gap-x-5 gap-y-1">
              <a href={`/chapters/${info.slug}/`}>{`Read about Chapter ${info.number}`}</a>
              {exercise.tool && <a href={exercise.tool.href}>{exercise.tool.label}</a>}
              <a href={info.game}>{`Play the chapter's game on screen`}</a>
            </p>
          </div>
          {waitlistOpen && (
            <p class="no-print m-0 border-l-8 border-ink pl-4">
              Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
            </p>
          )}
        </section>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
