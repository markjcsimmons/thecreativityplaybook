import type { WorkedExample } from '../islands/shared/WorkedExample';
import deck from '../data/perspective-cards.json';
import { randomBelow } from './game-utils';

/**
 * Perspective Cards. A deck of roles, ways of thinking and sets of conditions for looking at a
 * problem as someone else would. It builds on Chapter 9 (looking through other people's eyes, the
 * "inexpert witnesses" and the gang of five children) and Chapter 4 (the Different Strokes
 * exercise). The deck is roles and archetypes only, never a named person. Pure functions, so the
 * dealing can be checked without a browser.
 */
export type GroupId = 'fresh' | 'stake' | 'style' | 'lens';
export type Card = { id: string; group: GroupId; name: string; ask: string; book?: string };
export type Group = { id: GroupId; label: string; about: string };

export const GROUPS = deck.groups as Group[];
export const CARDS = deck.cards as Card[];
export const ALL_GROUPS: GroupId[] = GROUPS.map((g) => g.id);
export const ROUND_SECONDS = 120;
export const TEAM_SIZE = 4;

export const cardsIn = (groups: GroupId[]): Card[] => CARDS.filter((c) => groups.includes(c.group));
export const groupLabel = (id: GroupId): string => GROUPS.find((g) => g.id === id)?.label ?? id;

/** A shuffled list of card ids (Fisher-Yates). */
export function shuffle<T>(items: T[], rand: (n: number) => number = randomBelow): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export type Dealt = { cards: Card[]; pile: string[]; reshuffled: boolean };

/**
 * Deals `count` cards from the groups chosen. The pile is a shuffled list of card ids, so no card
 * comes up twice until the whole deck has been seen. When the pile runs out it is shuffled again
 * (without the cards already in hand), and `reshuffled` says so. Ids in the pile that are not in
 * the chosen groups (the player changed the groups) are skipped.
 */
export function deal(pile: string[], count: number, groups: GroupId[], rand: (n: number) => number = randomBelow): Dealt {
  const pool = cardsIn(groups);
  const allowed = new Set(pool.map((c) => c.id));
  let rest = pile.filter((id) => allowed.has(id));
  const taken: Card[] = [];
  let reshuffled = false;
  const take = () => {
    const id = rest.shift();
    const card = id ? pool.find((c) => c.id === id) : undefined;
    if (card) taken.push(card);
  };
  while (taken.length < Math.min(count, pool.length)) {
    if (rest.length === 0) {
      rest = shuffle(
        pool.filter((c) => !taken.some((t) => t.id === c.id)).map((c) => c.id),
        rand,
      );
      reshuffled = true;
    }
    take();
  }
  return { cards: taken, pile: rest, reshuffled };
}

/**
 * Deals a hand for a team, one card from a different group each where the chosen groups allow it,
 * so four people do not all get "different conditions". It reads the pile in order, so the pick
 * is as random as the shuffle. Falls back to any cards when there are fewer groups than people.
 */
export function dealSpread(pile: string[], count: number, groups: GroupId[], rand: (n: number) => number = randomBelow): Dealt {
  const pool = cardsIn(groups);
  const allowed = new Set(pool.map((c) => c.id));
  const rest = pile.filter((id) => allowed.has(id));
  const want = Math.min(count, pool.length);
  const byId = new Map(pool.map((c) => [c.id, c]));
  const reshuffled = rest.length < want;
  // Near the end of a pass the pile may hold only one group, so it is topped up from the cards already seen.
  const spreadable = new Set(rest.map((id) => byId.get(id)!.group)).size >= Math.min(want, groups.length);
  const order = reshuffled || !spreadable ? [...rest, ...shuffle(pool.filter((c) => !rest.includes(c.id)).map((c) => c.id), rand)] : rest;
  const picked: Card[] = [];
  const usedGroups = new Set<GroupId>();
  for (const id of order) {
    const c = byId.get(id)!;
    if (picked.length < want && !usedGroups.has(c.group)) {
      picked.push(c);
      usedGroups.add(c.group);
    }
  }
  for (const id of order) {
    const c = byId.get(id)!;
    if (picked.length < want && !picked.includes(c)) picked.push(c);
  }
  return { cards: picked, pile: order.filter((id) => !picked.some((c) => c.id === id)), reshuffled };
}

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example',
  steps: [
    {
      heading: 'Write your problem as a question.',
      text: 'The book’s running example is traffic congestion in Los Angeles: “How can people in Los Angeles spend less time stuck in traffic?”',
    },
    {
      heading: 'Flip a card, and think as that person.',
      text: 'The book’s Different Strokes exercise has a mayor, a police chief, an environmentalist and a commuter look at the same problem. They all agree it is bad, but each cares for a different reason: the mayor about time and business lost, the police chief about accidents and the drain on police resources, the environmentalist about exhaust fumes, and the commuter about time and stress.',
      list: ['A mayor: ideas that get office workers off the roads for part of the day.', 'A police chief: ideas that cut accidents.', 'An environmentalist: ideas that cut the number of cars.', 'A commuter: ideas that make the journey shorter or less stressful.'],
    },
    {
      heading: 'Write ideas for each card, then compare.',
      text: 'The reason a card cares decides which solution is best for it. The ideas above are ours, to show the idea. In the book, the point is that the viewpoint shapes which ingredients matter in a solution. When you have ideas, ask which would suit each person and which they would reject.',
    },
  ],
  slots: [],
  bridge: 'Now flip a card for your own problem.',
};

export const cardNames = (cards: Card[]): string => cards.map((c) => c.name).join(', ');
