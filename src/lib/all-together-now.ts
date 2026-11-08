import type { WorkedExample } from '../islands/shared/WorkedExample';

/**
 * All Together Now (Ch7). The book's board game is played on paper by four or more people: everyone
 * writes ideas on a sheet for two minutes, passes it to the left, and builds on the ideas on the
 * sheet they receive, until each sheet is back with its owner. Then everyone votes with 3, 2 and 1
 * points. This page is the group's facilitator: a timer, the passes and a vote tally.
 */
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;
export const ROUND_SECONDS = 120;
/** Each player awards 3, 2 and 1 points. */
export const POINTS_PER_VOTER = 6;

export type Idea = { text: string; points: number };

export const totalPoints = (ideas: Idea[]) => ideas.reduce((n, i) => n + i.points, 0);
export const expectedPoints = (players: number) => players * POINTS_PER_VOTER;

/** Highest-scoring ideas first; ties keep their order. */
export const ranked = (ideas: Idea[]) => [...ideas].filter((i) => i.text.trim()).sort((a, b) => b.points - a.points);

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Agree on a challenge.',
      text: 'Four or more people agree on a creative problem. The book compares the game to Chinese Whispers, which is called Telephone in the US: you whisper a phrase to the next person, and by the time it gets back to you it bears no resemblance to the start. "The girl with the red hair is wearing a custard-colored dress" turns into "A large meteor has just landed on my caravan." Here the same drift is the point.',
    },
    {
      heading: 'Write ideas for two minutes, then pass to the left.',
      text: 'Everyone writes their ideas on a sheet of paper, leaving room underneath. After two minutes, everyone passes their sheet to the player on their left.',
    },
    {
      heading: 'Build on the ideas in front of you.',
      text: 'On the sheet you receive, write down new ideas triggered by the ones already there. Keep passing every two minutes until each sheet is back with the player who started it, chock full of ideas.',
    },
    {
      heading: 'Read out the sheets and vote.',
      text: 'Everyone takes turns reading out the ideas on their sheet. Then everyone votes. Each player has 6 points to award: 3 for their favorite idea, 2 for their second favorite and 1 for their third.',
    },
    {
      heading: 'The winner.',
      text: 'The player who came up with the idea that received the most votes. The game ends with a hug, and the book says that in this game love is more important than winning.',
    },
  ],
  slots: [],
  bridge: 'Set up your group below. The timer runs the passes, and the tally counts the votes.',
};
