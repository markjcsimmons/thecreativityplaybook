import type { WorkedExample } from '../islands/shared/WorkedExample';
import { randomBelow } from './game-utils';

/**
 * Blast Off! (Ch12). The book's board game: choose one of your ideas quickly, then within 30 minutes
 * give it a name and a look, write it up as a short news story, and list who is on the crew.
 */
export const LAUNCH_SECONDS = 30 * 60;
export const pickIdea = (count: number, rand: (n: number) => number = randomBelow) => rand(count);

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Choose one idea, quickly.',
      text: 'Pick from ideas you have already generated, on gut instinct or even at random. The decision has to be made fast, because the countdown has begun. The book says the Kill the Idea game is a good way to home in on one.',
    },
    {
      heading: 'Who am I? Give it a name and a look.',
      text: 'To take an idea from words on a scrap of paper, give it an identity: a name, however gimmicky, and a sketch, however scrappy. The name can communicate what the idea is, as Super Glue does, or hint at its purpose. The book’s other example is Nike, the Greek goddess of strength, speed and victory. Think about who it is aimed at, what it will make them feel, and how it is better or different from the competition. The sketch can be a crude line drawing.',
    },
    {
      heading: 'What is the mission?',
      text: 'Every idea needs a practical application with real goals, a clear plan and criteria for success. Write it up as a short news story with a punchy headline and the key details: what the idea is, what the point of it is, and who it is aimed at.',
    },
    {
      heading: 'Who is on the crew?',
      text: 'It is almost impossible to do it alone. Make a list of the people, inside your organization and outside it, who you could work with to launch the idea. The book adds "(or monkeys)".',
    },
    {
      heading: 'Do it all within 30 minutes.',
      text: 'To win, create a full launch plan in 30 minutes. The book’s next words are "Now let’s go and launch an idea for real!"',
    },
  ],
  slots: [],
  bridge: 'Choose your idea below. The 30 minutes start when you do.',
};
