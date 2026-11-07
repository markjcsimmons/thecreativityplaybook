import type { WorkedExample } from '../islands/shared/WorkedExample';
import { randomBelow, rollDie } from './game-utils';

/**
 * What's Your Problem? (Ch4 The Answer Is in the Question). The book's board game: write a
 * business problem as "How can we ...?", then work down the board. At each step a die picks a
 * kind of question (how, why, which, when, who, what) to ask about the problem. At the last step
 * you rewrite the problem using what you found.
 */
export const QUESTION_WORDS = ['HOW', 'WHY', 'WHICH', 'WHEN', 'WHO', 'WHAT'] as const;
/** The board has eight question spaces between the starting problem and the rewrite. */
export const STEPS = 8;

export const questionWord = (die: number) => QUESTION_WORDS[die - 1]!;
export const rollQuestion = (rand: (n: number) => number = randomBelow) => rollDie(rand);

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Write the problem as "How can we ...?"',
      text: 'The book’s example is a band with this problem: "How can we sell more music?"',
    },
    {
      heading: 'Roll a die and ask that kind of question.',
      text: 'The die gives you a question word: 1 is HOW, 2 is WHY, 3 is WHICH, 4 is WHEN, 5 is WHO and 6 is WHAT. Say the band rolls a 6. That is a WHAT question: "What are the barriers to selling more music?" Their answers: fewer people are buying music, the economy is bad, not enough people know about them, or their music is not good.',
    },
    {
      heading: 'Keep rolling and keep answering.',
      text: 'A 2 gives a WHY question: "Why are people spending less on music?" Because they can get it for free online. A 4 gives a WHEN question: "When do people spend money on music?" When they buy special editions with extra content, or when they see live gigs. A 1 is a HOW question, and the band uses it to rephrase the problem: "How do we make what we sell better than the versions people get for free?" A 5 gives a WHO question: "Who pays for extra content when they can get the music free elsewhere?" Die-hard fans, they decide.',
    },
    {
      heading: 'At the last step, rewrite the problem.',
      text: 'Using what they found, the band rewrites it as: "How can we make our music releases special enough that die-hard fans will pay good money to buy them?" The book says that is a more tangible problem to crack than the one they started with.',
    },
    {
      heading: 'Notice that other rewrites were possible.',
      text: 'Different answers would have led somewhere else. The book gives one example: not trying to sell music at all, and using the recordings to promote live gigs instead, which opens up a different set of solutions. The point is that the first way you state a problem is not the only way.',
    },
  ],
  slots: [],
  bridge: 'Now try it on a problem of your own below.',
};
