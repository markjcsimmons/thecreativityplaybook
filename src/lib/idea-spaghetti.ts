import type { WorkedExample } from '../islands/shared/WorkedExample';
import data from '../data/games/idea-spaghetti.json';
import { randomBelow } from './game-utils';

/**
 * Idea Spaghetti (Ch2). The book's board game: each round you are dealt a topic and a target number
 * of ideas for five minutes. You score a point for every idea over the target and lose a point for
 * every idea short of it. Four rounds; the highest total wins.
 */
export const TARGETS = data.targets;
export const TOPICS = data.topics;
export const ROUNDS = 4;
export const ROUND_SECONDS = 300;

export const pointsFor = (ideas: number, target: number) => ideas - target;
export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** A topic that has not been used yet and a target different from the last one. */
export function dealRound(usedTopics: string[], lastTarget: number | null, rand: (n: number) => number = randomBelow) {
  const topics = TOPICS.filter((t) => !usedTopics.includes(t));
  const topic = topics[rand(topics.length)]!;
  const targets = TARGETS.filter((t) => t !== lastTarget);
  return { topic, target: targets[rand(targets.length)]! };
}

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Get a topic and a target.',
      text: 'On the book’s board, you pick a fork and follow a spaghetti strand to an ingredient. The number on the ingredient is how many ideas you need in five minutes. The topics in the book include "new names for pasta", "uses for a brick" and "ways to generate power". You can also use a problem of your own.',
    },
    {
      heading: 'Come up with as many ideas as you can in five minutes.',
      text: 'The aim is not a good solution to a problem. The book calls the game a brain-train: it trains your brain to generate lots of ideas, or spaghetti.',
    },
    {
      heading: 'Score the round.',
      text: 'You earn a point for every idea over the target and lose a point for every idea under it. The book’s example: if the ingredient says 12 ideas and you come up with 15, you score 3 points. If you come up with only 10, you lose 2 points.',
    },
    {
      heading: 'Play four rounds.',
      text: 'Each round has a different topic and a different target. After four rounds the highest total wins. The book says the more ideas you think up, the more likely it is that you will have a good one.',
    },
  ],
  slots: [],
  bridge: 'Now play your own four rounds below.',
};
