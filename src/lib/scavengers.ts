import type { WorkedExample } from '../islands/shared/WorkedExample';
import data from '../data/games/scavengers.json';

/**
 * The Scavenger Game (Ch3 Scavengers). Twelve questions about familiar things; each answer moves a
 * marker clockwise or anticlockwise round a dial of ten points. Where you end up decides which X you
 * dig at. Questions, moves and answers are the book's.
 */
export type Dir = 'cw' | 'ccw';
export type Option = { label: string; steps: number; dir: Dir };
export type Question = { n: number; text: string; options: Option[]; correct: string; why: string; image?: string; imageAlt?: string };

export const QUESTIONS = data.questions as Question[];
export const START = data.start;
export const POINTS = data.points;
export const TREASURE_POINT = data.treasurePoint;
export const TREASURE_REF = data.treasureRef;

/** Move round the dial; points are numbered 1 to 10 clockwise. */
export function move(position: number, opt: Option): number {
  const delta = opt.dir === 'cw' ? opt.steps : -opt.steps;
  return ((((position - 1 + delta) % POINTS) + POINTS) % POINTS) + 1;
}

export const stepsText = (opt: Option) => `${opt.steps} ${opt.steps === 1 ? 'space' : 'spaces'} ${opt.dir === 'cw' ? 'clockwise' : 'anticlockwise'}`;

/** Where the right answers to all twelve questions end up. */
export function correctEnd(): number {
  return QUESTIONS.reduce((pos, q) => move(pos, q.options.find((o) => o.label === q.correct)!), START);
}

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Start at point 1.',
      text: 'The board is a dial with ten points. You answer twelve questions about everyday things, and each answer moves your marker round the dial.',
    },
    {
      heading: 'Answer the first question.',
      text: 'It asks how many times the letter F appears in a sentence. The answer is 6, and in the book 6 means 2 spaces anticlockwise. Counting back from 1 you go to 10, then 9, so you are on point 9.',
    },
    {
      heading: 'Answer the second.',
      text: 'It asks whether the green light is at the top or the bottom of a traffic light. The answer is the bottom, which means 4 spaces anticlockwise: from 9 back to 5. You are on point 5.',
    },
    {
      heading: 'After twelve questions, dig.',
      text: 'You end on one of the ten points, and each point leads to a different X on the treasure map. Only one X has the treasure, and a single wrong answer sends you somewhere else. The game tests how well you have looked at the things you see every day.',
    },
  ],
  slots: [],
  bridge: 'Now play it yourself below. Where you end up is up to your answers, and you can look things up in the real world.',
};
