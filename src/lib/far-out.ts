import type { WorkedExample } from '../islands/shared/WorkedExample';
import data from '../data/games/far-out.json';

/**
 * Far Out (Ch8). The book's board game: think of things to do with a paperclip and see how far
 * round the board you get. An idea that is on the book's list of common suggestions moves you one
 * space; an idea that is not on it moves you two.
 */
export const COMMON = data.common;
export const ON_LIST = 1;
export const OFF_LIST = 2;

export const spaces = (ideas: { onList: boolean }[]) => ideas.reduce((n, i) => n + (i.onList ? ON_LIST : OFF_LIST), 0);

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Start from a far-out idea.',
      text: 'The chapter’s game starts from a man who began with a single red paperclip and, after a series of trades, ended up with a three-bedroom house. It was a far-out idea, and not something you would normally come up with as a use for a paperclip. The game is about thinking up other interesting uses.',
    },
    {
      heading: 'Write down uses for a paperclip.',
      text: 'There is no timer in the book. You are making the longest chain of paperclips you can, one idea at a time.',
    },
    {
      heading: 'Check your ideas against the list at the back of the book.',
      text: 'The list holds ideas people commonly come up with, such as a key-ring, an emergency toothpick or a bookmark. For every idea that is on the list, move one space along the board. For every idea that is not, move two.',
    },
    {
      heading: 'See how far you get.',
      text: 'You play against yourself, so the book says everyone is a winner. The scoring rewards far-out ideas, because the ones everybody thinks of move you only one space.',
    },
  ],
  slots: [],
  bridge: 'Write your own ideas below. The list stays hidden until you are done.',
};
