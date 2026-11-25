import type { WorkedExample } from '../islands/shared/WorkedExample';
import { normalizeIdea, randomBelow, splitLines } from './game-utils';

/**
 * Reverse Brainstorm. Write a goal, list ways to make it fail or get worse, then turn each one
 * round into a fix. The method is not in the book (the nearest thing is Chapter 11's Kill the
 * Idea game, which attacks an idea and not a goal), so the page and the tool say so. The prompts
 * are ours. Pure functions, so the logic can be checked without a browser.
 */
export const MAX_BAD = 30;
export const ROUND_SECONDS = 180;

/** Prompts for when the list of bad ideas dries up. Ours, not the book's. */
export const NUDGES: readonly string[] = [
  'What would make it take much longer?',
  'What would make it cost far more?',
  'What would confuse the people it is for?',
  'What would make people give up halfway?',
  'What would make it impossible to start?',
  'What would make the people involved stop talking to each other?',
  'What would make it hard to find?',
  'What could we leave out that matters most?',
  'What would make it break the first time someone uses it?',
  'What would make people dread it?',
  'What would we do if we wanted the result to be embarrassing?',
  'What is the one thing nobody must be allowed to check?',
];

/** One idea per line, repeats (ignoring case and spacing) dropped, capped at the maximum. */
export function parseBad(text: string, max = MAX_BAD): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of splitLines(text)) {
    const key = normalizeIdea(line);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * A prompt that has not been shown yet. When every prompt has been shown the list starts again
 * (and `reset` says so), without repeating the one just shown.
 */
export function nextNudge(used: number[], rand: (n: number) => number = randomBelow): { index: number; used: number[]; reset: boolean } {
  const fresh = NUDGES.map((_, i) => i).filter((i) => !used.includes(i));
  if (fresh.length === 0) {
    const last = used[used.length - 1];
    const pool = NUDGES.map((_, i) => i).filter((i) => i !== last);
    const index = pool[rand(pool.length)]!;
    return { index, used: [index], reset: true };
  }
  const index = fresh[rand(fresh.length)]!;
  return { index, used: [...used, index], reset: false };
}

export type Pair = { bad: string; fix: string };

/**
 * Pairs each bad idea with the fix written for it. Fixes are keyed by the bad idea's normalized
 * text, so editing the list does not push a fix onto the wrong row. Ideas with no fix yet are kept
 * (with an empty fix) so the table shows what is still to do.
 */
export function buildPairs(bad: string[], fixes: Record<string, string>): Pair[] {
  return bad.map((b) => ({ bad: b, fix: (fixes[normalizeIdea(b)] ?? '').trim() }));
}

/** The fixes that have been written, in order. These are the ideas to keep. */
export const fixesOf = (pairs: Pair[]): string[] => pairs.filter((p) => p.fix).map((p) => p.fix);

export function toText(goal: string, pairs: Pair[]): string {
  const lines: string[] = [];
  if (goal.trim()) lines.push(`Goal: ${goal.trim()}`, '');
  lines.push('Ways to make it worse, and the fix for each:');
  pairs.forEach((p, i) => lines.push(`${i + 1}. ${p.bad}\n   Fix: ${p.fix || '(not written yet)'}`));
  return lines.join('\n') + '\n';
}

/** The book's Los Angeles traffic problem, worked backwards. The bad ideas and the fixes are ours. */
export const EXAMPLE = {
  goal: 'How can people in Los Angeles spend less time stuck in traffic?',
  pairs: [
    { bad: 'Make sure everyone has to arrive at the same time.', fix: 'Let people start work at different times, or spend a day a week working without traveling.' },
    { bad: 'Make sure every car carries one person.', fix: 'Fill the cars: more car pooling, or shared minibuses in the car pool lane.' },
    { bad: 'Hide where the jams are until drivers are in them.', fix: 'Show drivers where the jams are before they set off, so they can choose another way or time.' },
    { bad: 'Make the journey as dull as possible.', fix: 'Make the journey worth something: a radio station or podcasts for people stuck in traffic.' },
  ] as Pair[],
};

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example',
  steps: [
    {
      heading: 'Write the goal.',
      text: 'The book’s running example is traffic congestion in Los Angeles: “How can people in Los Angeles spend less time stuck in traffic?”',
    },
    {
      heading: 'Ask the opposite question.',
      text: 'What is the surest way to make people spend more time stuck? List every way you can think of, and make them silly and extreme. These four are ours:',
      list: EXAMPLE.pairs.map((p) => p.bad),
    },
    {
      heading: 'Turn each one round into a fix.',
      text: 'Read each bad idea and ask what would stop it, or what the opposite would be. The fixes are ours, to show the idea. The second echoes the book’s Chapter 7 car pool minibuses, and the first echoes its idea of employers giving staff a day away from travel.',
      list: EXAMPLE.pairs.map((p) => p.fix),
    },
    {
      heading: 'Keep what you like.',
      text: 'The fixes are ideas like any others. Save them, then sort them with the book’s three piles or the Idea Scorer.',
    },
  ],
  slots: [],
  bridge: 'Now try it with your own goal.',
};
