import type { WorkedExample } from '../islands/shared/WorkedExample';
import { randomBelow } from './game-utils';

/**
 * Kill the Idea (Ch11). The book's board game: write down up to 19 ideas, a finger drops on one
 * and kills it, and you have three saves to bring a killed idea back. The saves can go on only two
 * different ideas, so the idea you save twice, in the sudden-death coin toss at the end, wins.
 * Pure functions, so the rules can be checked without a browser.
 */
export const MAX_IDEAS = 19;
export const MIN_IDEAS = 3;
export const SAVES = 3;
export const MAX_SAVED_IDEAS = 2;

export type Status = 'alive' | 'saved' | 'killed';
export type Phase = 'drop' | 'decide' | 'toss' | 'final' | 'done';
export type Game = {
  ideas: { text: string; status: Status }[];
  lives: number;
  /** The idea the finger landed on, while the player decides. */
  drawn: number | null;
  /** The idea the coin toss chose to die, in sudden death. */
  doomed: number | null;
  winner: number | null;
  phase: Phase;
};

const indices = (g: Game, status: Status) => g.ideas.flatMap((x, i) => (x.status === status ? [i] : []));
export const unsaved = (g: Game) => indices(g, 'alive');
export const savedIdeas = (g: Game) => indices(g, 'saved');
export const stillAlive = (g: Game) => g.ideas.filter((x) => x.status !== 'killed').length;
export const canSave = (g: Game) => g.lives > 0 && savedIdeas(g).length < MAX_SAVED_IDEAS;

/** Work out what happens next after an idea is killed or saved. */
function settle(g: Game): Game {
  if (stillAlive(g) === 1) {
    const winner = g.ideas.findIndex((x) => x.status !== 'killed');
    return { ...g, drawn: null, winner, phase: 'done' };
  }
  if (unsaved(g).length === 0) return { ...g, drawn: null, phase: 'toss' };
  return { ...g, drawn: null, phase: 'drop' };
}

export function newGame(texts: string[]): Game {
  return settle({ ideas: texts.map((text) => ({ text, status: 'alive' as Status })), lives: SAVES, drawn: null, doomed: null, winner: null, phase: 'drop' });
}

/** The finger drops on one idea that has not been saved. */
export function drop(g: Game, rand: (n: number) => number = randomBelow): Game {
  const pool = unsaved(g);
  return { ...g, drawn: pool[rand(pool.length)]!, phase: 'decide' };
}

/** Kill the idea the finger landed on, or spend a save to keep it safe until sudden death. */
export function decide(g: Game, choice: 'kill' | 'save'): Game {
  if (g.drawn === null) return g;
  if (choice === 'save' && !canSave(g)) return g;
  const ideas = g.ideas.map((x, i) => (i === g.drawn ? { ...x, status: (choice === 'kill' ? 'killed' : 'saved') as Status } : x));
  return settle({ ...g, ideas, lives: choice === 'save' ? g.lives - 1 : g.lives });
}

/** Sudden death: a coin toss chooses which of the two saved ideas must die. */
export function toss(g: Game, rand: (n: number) => number = randomBelow): Game {
  const pool = savedIdeas(g);
  return { ...g, doomed: pool[rand(pool.length)]!, phase: 'final' };
}

/** Use the last save on the doomed idea (it wins with two saves), or let it die. */
export function finish(g: Game, useSave: boolean): Game {
  if (g.doomed === null) return g;
  const keep = useSave && g.lives > 0;
  const other = savedIdeas(g).find((i) => i !== g.doomed)!;
  const winner = keep ? g.doomed : other;
  const ideas = g.ideas.map((x, i) => (i === winner ? x : { ...x, status: 'killed' as Status }));
  return { ...g, ideas, lives: keep ? g.lives - 1 : g.lives, winner, phase: 'done' };
}

/** The book's own example, from the Kill the Idea board game (the problem is getting publicity for a new venture). */
export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Write down your strongest ideas.',
      text: 'The book plays with 19, numbered 1 to 19. Its example problem is getting publicity for a new venture, and three of the 19 are:',
      list: [
        'Get the CEO to appear in public in just his underpants.',
        'Donate time and services to people who need help in the community, and tell the local paper.',
        'Get a celebrity to use one of your products and hope they are photographed doing so.',
      ],
    },
    {
      heading: 'Let the finger kill an idea. Save the ones you cannot lose.',
      text: 'The finger lands on the underpants idea. You decide it is worth saving, so you use one of your three saves and have two left. Next the community idea comes up. You decide it is not worth saving, so it is killed. After a few more deaths, the celebrity idea comes up and you save that too. Two saves are used and one is left.',
    },
    {
      heading: 'Sudden death.',
      text: 'Only the two saved ideas remain. The saves can go on only two different ideas, which is why you must choose them carefully. Toss a coin to see which one dies. If your gut says it is the one idea you cannot live without, use your last save. The idea with two saves wins.',
    },
    {
      heading: 'Why it works.',
      text: 'The book says that being made to choose shows you which idea really matters. You find out by how it feels when the finger lands on it.',
    },
  ],
  slots: [],
  bridge: 'Now try it with your own ideas below.',
};
