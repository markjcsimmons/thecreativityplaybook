import type { WorkedExample } from '../islands/shared/WorkedExample';
import data from '../data/games/shoe-swapper.json';
import { randomBelow, rollDie } from './game-utils';

/**
 * Shoe Swapper (Ch9). The book's board game: pick a problem, throw two dice to see whose shoes you
 * wear, and come up with ideas from that person's point of view for five minutes. Three rounds,
 * then pick the idea that best solves the problem. The book's board names people; here every
 * space is a role (see the note in the data file).
 */
export const ROLES = data.roles;
export const ROUNDS = 3;
export const ROUND_SECONDS = 300;

export type Roll = { column: number; row: number; role: string };

/** The first die gives the column and the second the row. */
export const roleAt = (column: number, row: number): string => ROLES[row - 1]![column - 1]!;

export function rollRole(taken: string[] = [], rand: (n: number) => number = randomBelow): Roll {
  for (;;) {
    const column = rollDie(rand);
    const row = rollDie(rand);
    const role = roleAt(column, row);
    if (!taken.includes(role)) return { column, row, role };
  }
}

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Pick a problem.',
      text: 'The book’s example is how to bring more customers into a restaurant.',
    },
    {
      heading: 'Throw two dice to see whose shoes you wear.',
      text: 'The board has 36 pairs of shoes. In the book the first throw is a 6 and a 2, which lands on a celebrity’s boots. (The book’s board names a particular celebrity. Here every pair of shoes is a role instead.)',
      cards: true,
    },
    {
      heading: 'Think as that person for five minutes.',
      text: 'The book’s example, in a celebrity’s shoes: a great way to drive business might be to give the customers celebrity gift bags. That could spark another idea about making customers feel very special, like a celebrity. There could be a gift bag with unusual toys, a fake paparazzi photographer at the entrance, and framed autographed photos of celebrity customers on the wall.',
    },
    {
      heading: 'Swap shoes twice more, then pick the winner.',
      text: 'Throw the dice again for a new pair of shoes and another five minutes. The book plays three rounds, and the winner is the idea that best solves the problem.',
    },
  ],
  slots: [{ label: 'Whose shoes', value: roleAt(6, 2) }],
  bridge: 'Now put on your own three pairs of shoes below.',
};
