import type { WorkedExample } from '../islands/shared/WorkedExample';
import data from '../data/games/wheel-of-distraction.json';

/**
 * Wheel of Distraction (Ch5 Left Brain, Meet Mr Right). The book's board game: frame the problem,
 * then spin a pencil on the wheel and do the distraction it points to. The study behind it is the
 * one the chapter describes.
 */
export const DISTRACTIONS = data.distractions as { title: string; aside: string }[];

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Frame the creative problem.',
      text: 'The chapter describes a study at a Dutch university. Each undergraduate got a creative problem, such as inventing names for new pastas, naming Dutch places that start with the letter A, or finding uses for a brick.',
    },
    {
      heading: 'Do something absorbing that has nothing to do with it.',
      text: 'One group got three minutes to think about the problem. One group answered straight away. A third group spent the three minutes on a boring task instead: tracking a circle on a computer screen and pressing the space bar whenever it changed color.',
    },
    {
      heading: 'See what came out.',
      text: 'The chapter says the group that was distracted gave more original answers than the others. Their pasta names were less like the examples they were shown, and they named more small Dutch villages and fewer big cities. The researchers’ explanation, as the book tells it, is that the boring task kept conscious thought busy, which freed up unconscious thought to do the creative work.',
    },
    {
      heading: 'Pick your own distraction.',
      text: 'The board game turns that into a spin. Frame your problem, spin the wheel, and go and do whatever it lands on. Even if you do not come up with a good idea, you will have had a good time, and the idea will pop up later.',
    },
  ],
  slots: [],
  bridge: 'Write down your problem below, then spin.',
};
