import type { WorkedExample } from '../islands/shared/WorkedExample';

/**
 * How to Play (Ch1). The book's board game: write a product idea on a card (a crazy name and a
 * one-line description), then climb a pyramid to the CEO by throwing a die. Some squares give a
 * helpful push and some are obstacles. The book's board is an irregular pyramid of bubbles with
 * lightning bolts for the pushes; this version lays the same squares along a path of 30. The squares
 * and what they do are the book's. Where they sit on the path, and where a push or a slide lands, are
 * this site's own choice (marked in the data) because the board does not give square numbers.
 */
export const FINAL = 30;

export type Kind = 'elevator' | 'pda' | 'seminar' | 'competition' | 'committee' | 'notHere' | 'research' | 'nobody' | 'offsite';
export type Square = { kind: Kind; title: string; helpful: boolean; to?: number; text: string };

export const SQUARES: Record<number, Square> = {
  3: {
    kind: 'elevator',
    title: 'Elevator pitch',
    helpful: true,
    to: 21,
    text: 'You have 30 seconds to pitch your idea to the CEO’s right-hand person. To take the shortcut up the board, follow the rules: say your product’s name exactly five times, say "return on investment" twice, and compliment the right-hand person on their appearance.',
  },
  5: { kind: 'notHere', title: 'Not created here', helpful: false, to: 2, text: 'There is an unfortunate tendency to pooh-pooh ideas created by others. Land on this space and you drop down the board.' },
  7: { kind: 'offsite', title: 'Offsite meetings all day', helpful: false, text: 'Miss a turn.' },
  9: {
    kind: 'pda',
    title: 'Dead PDA day',
    helpful: true,
    to: 19,
    text: 'A glitch in the corporate software has temporarily disabled everyone’s smart phone, so people can get on with some work without being interrupted. It is a free ride up the board. You just need to draw a quick picture of your product in under 30 seconds.',
  },
  12: {
    kind: 'competition',
    title: 'Competition just did something clever',
    helpful: true,
    to: 18,
    text: 'The biggest competitor has launched a new product and the CEO is hunting for ideas to match them move for move. You do not need to do anything. Just move up the board.',
  },
  14: {
    kind: 'committee',
    title: 'Death by committee',
    helpful: false,
    to: 8,
    text: 'You have two minutes to answer the committee’s criticisms of your idea. Each committee member criticizes it, starting with "It’ll never work because ...". You must respond to each criticism with "I’m so glad you brought that up" and keep smiling. If you do not answer, you slide down the board.',
  },
  17: {
    kind: 'research',
    title: 'Research it to death',
    helpful: false,
    to: 10,
    text: 'Research has its place, but delegating decision making to market research is a surefire way to give an idea a slow, painful death. Slide back down the board.',
  },
  20: {
    kind: 'seminar',
    title: 'Boss went to an innovation seminar',
    helpful: true,
    to: 27,
    text: 'The boss has just heard about the importance of experimenting and taking risks with new ideas. To benefit, describe what the TV commercial for your product will look like, and which celebrity will be the spokesperson for it.',
  },
  24: {
    kind: 'nobody',
    title: '"If it’s such a good idea, how come nobody’s thought of it before?"',
    helpful: false,
    to: 16,
    text: 'The only way to escape certain relegation on this square is to throw a six with the die. Otherwise you drop down.',
  },
};

export const squareAt = (pos: number): Square | undefined => SQUARES[pos];

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Write your idea on a card.',
      text: 'Give a new product a crazy name and a one-line description of what it does. The book’s example is "Chewagloo", a blob of mint-flavored glue that you activate by chewing.',
    },
    {
      heading: 'Climb the pyramid by throwing a die.',
      text: 'The goal is to get to the CEO at the top. Like in snakes and ladders, some squares fight you and some give you a shove. Be the first to the top and you are the king of the castle.',
    },
    {
      heading: 'Land on a helpful push.',
      text: 'On "Elevator pitch" you have 30 seconds to pitch your idea, and the shortcut is yours if you say its name five times, say "return on investment" twice and compliment your listener. On "Dead PDA day" you ride free up the board, as long as you draw a quick picture of your product in under 30 seconds.',
    },
    {
      heading: 'Or land on an obstacle.',
      text: 'On "Death by committee" the committee says "It’ll never work because ..." and you must answer each criticism with "I’m so glad you brought that up", smiling all the while. On "Not created here" and "Research it to death" you simply slide back down.',
    },
  ],
  slots: [],
  bridge: 'Now write your own card below and climb.',
};
