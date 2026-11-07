import type { WorkedExample } from '../islands/shared/WorkedExample';
import board from '../data/games/inspiral.json';
import { normalizeIdea, randomBelow, rollDie } from './game-utils';

/**
 * Inspiral (Ch10 Connected). The book's board game: two dice pick two themes from a spiral of 36,
 * you have three minutes to think of ideas that link them, and you move your counter one space
 * toward the centre for each unique idea. Reach the centre to win.
 */
export const RINGS = board.rings;
export const BOARD_SPACES = RINGS.flat().length;
export const TURN_SECONDS = 180;

export type Roll = { around: number; inward: number; theme: string };

/** The first die counts around the ring (clockwise from the start); the second counts in towards the centre. */
export const themeAt = (around: number, inward: number): string => RINGS[inward - 1]![around - 1]!;

export function rollTheme(rand: (n: number) => number = randomBelow): Roll {
  const around = rollDie(rand);
  const inward = rollDie(rand);
  return { around, inward, theme: themeAt(around, inward) };
}

/** Two rolls that land on two different themes. */
export function rollPair(rand: (n: number) => number = randomBelow): [Roll, Roll] {
  const a = rollTheme(rand);
  let b = rollTheme(rand);
  while (b.theme === a.theme) b = rollTheme(rand);
  return [a, b];
}

/** Unique ideas only: exact repeats do not count. */
export function uniqueIdeas(ideas: string[]): string[] {
  const seen = new Set<string>();
  return ideas.filter((x) => (seen.has(normalizeIdea(x)) ? false : (seen.add(normalizeIdea(x)), true)));
}

/** The book's own example: sweets and animals. */
export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Roll for two themes.',
      text: 'You roll two dice to find the first theme, then roll again to find the second. The dice give the place on the board. A 4 and a 3, for example, means 4 around the spiral and 3 in toward the centre. The book’s example lands on these two:',
      cards: true,
    },
    {
      heading: 'Link them in three minutes.',
      text: 'Come up with as many ideas as you can that connect the two themes, sensible or crazy. The book’s example for sweets (candy) and animals gives:',
      list: [
        'Sweets shaped like animals.',
        'Sweets to give to animals as treats.',
        'Sweets made from chicken, to give to children as a way to sneak protein into their diets.',
      ],
    },
    {
      heading: 'Count the unique ideas and move.',
      text: 'Count the ideas that are different from one another. Three unique ideas means three spaces toward the centre of the spiral. The first player to reach the centre wins. The book adds that the chicken one is just an example.',
    },
    {
      heading: 'Why it works.',
      text: 'The book says that making connections between seemingly unrelated things is at the heart of creativity, and this game forces you to make them.',
    },
  ],
  slots: [
    { label: 'Theme 1', value: 'candy' },
    { label: 'Theme 2', value: 'animals' },
  ],
  bridge: 'Now roll your own two themes below.',
};
