import type { WorkedExample } from '../islands/shared/WorkedExample';
import chapters from '../data/chapters.json';
import { randomBelow } from './game-utils';

/**
 * Chapter Dice. The book's closing page says "Try rolling a pair of dice to tell you which chapter
 * to read next." A pair of dice has 36 combinations and the book has 12 chapters, so each chapter
 * gets exactly three of them and every chapter is equally likely. The rule is easy to play by
 * hand: an odd first die gives the chapter in the second die (1 to 6), and an even first die gives
 * the second die plus six (7 to 12). The 10-minute exercises are ours, shortened from each
 * chapter's board game; the page says so. Pure functions, so the roll can be checked without a browser.
 */
export const EXERCISE_MINUTES = 10;

export type ChapterInfo = { id: string; number: number; title: string; slug: string; game: string; takeaway: string };
export type Step = { minutes: number; text: string };
export type Exercise = {
  /** The chapter's game, in the words the site uses for it. */
  name: string;
  /** Who it needs. */
  people: string;
  steps: Step[];
  /** What the book's own version asks for, so the page can say how this one differs. */
  fromBook: string;
  /** A tool for this exercise when it is not the chapter's own game. */
  tool?: { href: string; label: string };
};

export const CHAPTERS: ChapterInfo[] = (chapters as ChapterInfo[]).filter((c) => c.number >= 1 && c.number <= 12);

/** Chapter number (1 to 12) for a pair of dice. Each chapter comes up on three of the 36 pairs. */
export function chapterFor(a: number, b: number): number {
  return a % 2 === 1 ? b : b + 6;
}

export const chapterInfo = (n: number): ChapterInfo => CHAPTERS.find((c) => c.number === n)!;

/** Two dice, 1 to 6 each. */
export function rollPair(rand: (n: number) => number = randomBelow): [number, number] {
  return [rand(6) + 1, rand(6) + 1];
}

/** The 10-minute exercises. Ours: each is a shortened version of the chapter's game. */
export const EXERCISES: Record<number, Exercise> = {
  1: {
    name: 'Pitching Ideas (Climb the Corporate Pyramid)',
    people: 'One or more',
    fromBook: 'The book’s game is a climb of 30 squares, where each special square asks you to pitch, draw or answer a committee.',
    steps: [
      { minutes: 2, text: 'Write a new product idea on a card: a crazy name and one line on what it does.' },
      { minutes: 2, text: 'Pitch it out loud in 30 seconds, to someone or to the wall. Then pitch it again in 10.' },
      { minutes: 2, text: 'Draw it, however scrappy.' },
      { minutes: 3, text: 'Write the hardest question a committee could ask about it, and answer it.' },
      { minutes: 1, text: 'Say which of the three (pitch, drawing, answer) was hardest, and why.' },
    ],
  },
  2: {
    name: 'Idea Spaghetti',
    people: 'One to four',
    fromBook: 'The book plays four rounds of five minutes, each with its own topic and target.',
    steps: [
      { minutes: 5, text: 'Round one. The topic is "uses for a brick". Write every idea you can, one per line, and do not judge any of them. Count them.' },
      { minutes: 5, text: 'Round two, on a problem of your own. Set a target one higher than your count from round one, and try to beat it.' },
    ],
  },
  3: {
    name: 'Attribute Listing',
    people: 'One or more',
    tool: { href: '/tools/attribute-listing/', label: 'Try the Attribute Listing Tool' },
    fromBook: 'The chapter’s example breaks a restaurant into the type of food, the price, the style and the way the food is delivered.',
    steps: [
      { minutes: 1, text: 'Name a thing: a product, a service or a meeting.' },
      { minutes: 2, text: 'Pick three to five attributes that can change independently of each other.' },
      { minutes: 4, text: 'Under each, list the ordinary options and the odd ones.' },
      { minutes: 3, text: 'Change one attribute at a time, and circle the combination you would most like to try.' },
    ],
  },
  4: {
    name: 'What’s Your Problem?',
    people: 'One or more',
    fromBook: 'The book’s game has eight steps and ends with a rewritten problem.',
    steps: [
      { minutes: 1, text: 'Write your problem as "How can we ...?"' },
      { minutes: 6, text: 'Roll a die four times, a minute and a half each. 1 is how, 2 is why, 3 is which, 4 is when, 5 is who and 6 is what. Ask that kind of question about the problem and write your answer.' },
      { minutes: 3, text: 'Rewrite the problem using what you found. Keep it simple and clear.' },
    ],
  },
  5: {
    name: 'The Wheel of Distraction',
    people: 'One',
    fromBook: 'The chapter says that after you have worked hard on a problem, a rest from it lets your mind wander and make less obvious connections.',
    steps: [
      { minutes: 3, text: 'Work on a problem you are stuck on, then write down where you have got to.' },
      { minutes: 5, text: 'Do something absorbing and unrelated, and do it properly: a crossword, cooking, a walk, tidying a drawer. Leave the problem alone.' },
      { minutes: 2, text: 'Come back and write down whatever pops into your head, however small or silly.' },
    ],
  },
  6: {
    name: 'Brain Flash',
    people: 'One or more',
    fromBook: 'The book’s board holds pictures, and two dice pick the square. Here you can use the game’s pictures, or any picture to hand.',
    steps: [
      { minutes: 1, text: 'Decide on a problem, such as "How do we improve customer service?"' },
      { minutes: 3, text: 'Round one. Pick a picture, complete the sentence "It is like ... because ...", then write the ideas the comparison gives you.' },
      { minutes: 3, text: 'Round two, with a new picture.' },
      { minutes: 3, text: 'Round three, with a new picture. Circle your best idea from the three rounds.' },
    ],
  },
  7: {
    name: 'All Together Now (brainwriting)',
    people: 'Four or more',
    fromBook: 'The book passes sheets left every two minutes until each one is back with its owner, so it takes longer with more than four people.',
    steps: [
      { minutes: 2, text: 'Agree on a challenge. Everyone writes ideas on their own sheet for two minutes.' },
      { minutes: 6, text: 'Pass the sheets left every two minutes, three times. Write new ideas triggered by the ones already on the sheet you receive.' },
      { minutes: 2, text: 'Read the sheets out. Each person gives 3 points to their favorite idea, 2 to their second and 1 to their third.' },
    ],
  },
  8: {
    name: 'The paperclip game (Far Out)',
    people: 'One',
    fromBook: 'The book’s game has you list uses for a paperclip, then score yourself against 25 common ideas.',
    steps: [
      { minutes: 5, text: 'List as many uses for a paperclip as you can, one per line.' },
      { minutes: 3, text: 'Cross out the uses that most people would think of. Circle the strangest one left.' },
      { minutes: 2, text: 'Exaggerate the circled use into a short story: who uses it, where, and what happens next.' },
    ],
  },
  9: {
    name: 'Shoe Swapper',
    people: 'One or more',
    fromBook: 'The book plays three rounds of five minutes each. The Perspective Cards tool is a bigger deck of roles to draw from.',
    steps: [
      { minutes: 1, text: 'Pick a problem you want ideas for.' },
      { minutes: 3, text: 'Round one. Throw the dice for whose shoes you are wearing, and write every idea that person would have.' },
      { minutes: 3, text: 'Round two, in new shoes.' },
      { minutes: 3, text: 'Round three, in new shoes. Circle your best idea, whichever pair it came from.' },
    ],
  },
  10: {
    name: 'Inspiral',
    people: 'One or more',
    fromBook: 'The book’s game is a race of three-minute turns along a spiral of 36 spaces.',
    steps: [
      { minutes: 3, text: 'Turn one. Roll the dice for two themes, such as "health" and "space". Write as many ideas as you can that link them.' },
      { minutes: 3, text: 'Turn two, with two new themes.' },
      { minutes: 3, text: 'Turn three, with two new themes.' },
      { minutes: 1, text: 'Count the unique ideas from each turn, and add them up. Beat that score next time.' },
    ],
  },
  11: {
    name: 'Kill the Idea',
    people: 'One or more',
    fromBook: 'The book plays with up to 19 ideas, three saves and a sudden-death round with a coin toss.',
    steps: [
      { minutes: 2, text: 'Write five to eight of your strongest ideas, one per line.' },
      { minutes: 7, text: 'Pick one at random. It is about to be killed: kill it, or spend one of your three saves. Once two ideas are saved, the third save waits for the last round. At the end, a coin toss decides which of your two saved ideas dies, unless your gut says to use the last save.' },
      { minutes: 1, text: 'Write down which idea survived and what you would do first.' },
    ],
  },
  12: {
    name: 'Blast Off!',
    people: 'One or more',
    fromBook: 'The book’s game takes 30 minutes and ends with a launch plan. This is a third of it.',
    steps: [
      { minutes: 1, text: 'Choose one idea quickly, on gut instinct or at random.' },
      { minutes: 3, text: 'Give it a name and a look. Sketch it.' },
      { minutes: 3, text: 'Write it up as a short news story with a punchy headline: what it is, what the point is and who it is for.' },
      { minutes: 3, text: 'List the people, inside and outside your organization, who could help you launch it.' },
    ],
  },
};

export const totalMinutes = (n: number): number => EXERCISES[n]!.steps.reduce((sum, s) => sum + s.minutes, 0);

/** The roll rule in words, for the page and the tool. */
export const RULE = 'An odd first die gives the chapter shown on the second die. An even first die gives the second die plus six.';

/** One roll worked through, for the example above the tool. */
export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example',
  steps: [
    { heading: 'Roll two dice.', text: 'Say you roll a 4 and a 2.' },
    {
      heading: 'Read the chapter off the dice.',
      text: 'The first die is even, so you add six to the second: 2 + 6 = 8. That is Chapter 8, Far Out.',
    },
    {
      heading: 'Do the exercise.',
      text: 'Chapter 8 gives the paperclip game: list uses for a paperclip for five minutes, cross out the obvious ones, and turn the strangest into a short story. It takes ten minutes.',
    },
  ],
  slots: [],
  bridge: 'Now roll your own.',
};
