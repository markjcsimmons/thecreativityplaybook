import type { WorkedExample } from '../islands/shared/WorkedExample';
import data from '../data/games/brain-flash.json';
import { randomBelow, rollDie } from './game-utils';

/**
 * Brain Flash (Ch6). The book's board game: decide on a problem, throw two dice to pick a picture
 * on the board, and let it spark an idea, usually by describing the problem as a simile. Five rounds
 * (or as many as agreed). The best idea in each round earns a point; solo, you keep your best idea
 * from each round.
 */
export type Cell = { column: number; row: number; name: string; image: string };
export const CELLS = data.cells as Cell[];
export const ROUNDS = 5;

export type Roll = Cell;

/** Throw two dice (column, then row); throw again if the space is missing or already used this game. */
export function rollPicture(taken: Cell[] = [], rand: (n: number) => number = randomBelow): Cell {
  for (;;) {
    const column = rollDie(rand);
    const row = rollDie(rand);
    const cell = CELLS.find((c) => c.column === column && c.row === row);
    if (cell && !taken.includes(cell)) return cell;
  }
}

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Decide on a problem.',
      text: 'The book’s example is "How do we improve customer service?"',
    },
    {
      heading: 'Throw two dice to pick a picture.',
      text: 'The first die counts along the bottom of the board and the second counts up the side. The book’s example throws a 5 and a 3, which is the square five along and three up:',
      cards: true,
    },
    {
      heading: 'Let the picture spark a comparison.',
      text: 'The skittles suggest acrobats, so the problem becomes a simile: "Customer service is like juggling skittles because it means being quick and agile." That leads to ideas for helping staff respond very quickly, such as giving them incentives based on speed of response.',
    },
    {
      heading: 'Try a different simile.',
      text: 'The same picture could have led somewhere else: "Great customer service is like being an acrobat because it depends on having amazing coordination between departments." That would lead to ideas for improving coordination instead.',
    },
    {
      heading: 'Pick the best idea.',
      text: 'In the book’s version, the player with the best idea in each round gets a point, and the winner is the one with the most points after five rounds.',
    },
  ],
  slots: [{ label: 'Dice 5 and 3', value: 'juggling skittles', image: { src: '/games/brain-flash/5-3.png', alt: 'A picture of juggling skittles.' } }],
  bridge: 'Now try it on a problem of your own below.',
};
