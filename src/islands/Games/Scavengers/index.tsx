import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { POINTS, QUESTIONS, START, TREASURE_POINT, TREASURE_REF, WORKED_EXAMPLE, correctEnd, move, stepsText, type Option } from '../../../lib/scavengers';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * The Scavenger Game (Ch3). Twelve questions about familiar things; each answer moves a marker
 * round a dial of ten points, and the end point decides which X you dig at. Nothing leaves the
 * browser and nothing is stored.
 */
const TOOL = 'scavengers';
const SIZE = 260;
const C = SIZE / 2;
const R = 100;

/** Point 1 is at the bottom and the numbers run clockwise, as on the book's board. */
const spot = (p: number) => {
  const a = ((90 + (p - 1) * (360 / POINTS)) * Math.PI) / 180;
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
};

export default function Scavengers({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [answers, setAnswers] = useState<Option[]>([]);
  const [announce, setAnnounce] = useState('');

  const positions = answers.reduce<number[]>((acc, o) => [...acc, move(acc[acc.length - 1]!, o)], [START]);
  const position = positions[positions.length - 1]!;
  const done = answers.length === QUESTIONS.length;
  const q = QUESTIONS[answers.length];
  const won = done && position === TREASURE_POINT;

  const choose = (o: Option) => {
    if (answers.length === 0) track('tool_generate', { tool: TOOL });
    setAnswers([...answers, o]);
    setAnnounce(`Moved ${stepsText(o)}.`);
  };

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <div class="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} class="mx-auto w-full max-w-[260px]" role="img" aria-label={`A dial with ten points. Your marker is on point ${position}.`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="currentColor" stroke-width="2" />
          {Array.from({ length: POINTS }, (_, i) => i + 1).map((p) => {
            const s = spot(p);
            const here = p === position;
            return (
              <g>
                <circle cx={s.x} cy={s.y} r={here ? 17 : 13} fill={here ? 'var(--ink)' : 'var(--paper)'} stroke="currentColor" stroke-width="2" />
                <text x={s.x} y={s.y + 5} text-anchor="middle" font-size="14" font-weight="700" fill={here ? 'var(--paper)' : 'currentColor'}>
                  {p}
                </text>
              </g>
            );
          })}
          <text x={C} y={C - 4} text-anchor="middle" font-size="12" fill="currentColor">
            Clockwise runs
          </text>
          <text x={C} y={C + 12} text-anchor="middle" font-size="12" fill="currentColor">
            1, 2, 3 ...
          </text>
        </svg>
        <div class="grid gap-1">
          <p class="m-0 font-display text-3xl uppercase leading-none">Point {position}</p>
          <p class="m-0">
            {done ? 'All twelve questions answered.' : `Question ${answers.length + 1} of ${QUESTIONS.length}`}
          </p>
          {answers.length > 0 && (
            <p class="m-0 text-sm">
              Last move: {stepsText(answers[answers.length - 1]!)}, from point {positions[positions.length - 2]} to point {position}.
            </p>
          )}
        </div>
      </div>

      {!done && q && (
        <div class="grid gap-3">
          <p class="m-0 font-slab text-xl font-bold leading-snug">
            {q.n}. {q.text}
          </p>
          {q.image && <img src={q.image} alt={q.imageAlt} width="850" height="410" class="h-auto w-full max-w-md bg-white" loading="lazy" />}
          <div class="flex flex-wrap gap-3">
            {q.options.map((o) => (
              <button type="button" class="btn btn-ghost" onClick={() => choose(o)}>
                {o.label} <span class="text-sm font-normal">({stepsText(o)})</span>
              </button>
            ))}
          </div>
          <p class="m-0 text-sm">Not sure? Go and look. That is the point of the game.</p>
        </div>
      )}

      {done && (
        <div class="grid gap-4 border-t-4 border-ink pt-4">
          <p class="m-0 font-slab text-3xl font-bold leading-snug">
            {won ? `You found the treasure. It is at grid reference ${TREASURE_REF}.` : `You ended on point ${position}, and there is no treasure there.`}
          </p>
          {!won && (
            <p class="m-0">
              The right answers end on point {correctEnd()}, which leads to the X at grid reference {TREASURE_REF}. Here is where yours differ from the book.
            </p>
          )}
          <ol class="m-0 grid list-none gap-1 p-0">
            {QUESTIONS.map((x, i) => {
              const right = answers[i]!.label === x.correct;
              return (
                <li class="flex flex-wrap gap-x-2">
                  <span class="font-bold">
                    {x.n}. {right ? 'Right' : 'Wrong'}.
                  </span>
                  <span>{right ? x.why : `You said ${answers[i]!.label}. ${x.why}`}</span>
                </li>
              );
            })}
          </ol>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={() => setAnswers([])}>
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
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
