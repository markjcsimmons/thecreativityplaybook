import words from '../data/idea-words.json';
import { pick, rngFromSeed } from './prng';

/**
 * Random Idea Generator logic (BRIEF §8.1). Pure functions, so the server can
 * render the same example the island shows and tests can run without a browser.
 *
 * Every slot has its own short seed. The URL carries the slot seeds (`s=abc.def`)
 * and the locked slot numbers (`lock=0`), so a result is reproducible and a lock
 * simply keeps that slot's seed when the others re-roll.
 */
export type Mode = 'connect' | 'twist' | 'spaghetti';
export const MODES: Mode[] = ['connect', 'twist', 'spaghetti'];

const MASS = new Set(words.mass);

/** "a library", "an umbrella", "coffee" (mass nouns take no article). */
export function withArticle(noun: string): string {
  if (MASS.has(noun) || noun.startsWith('the ')) return noun;
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}

const industry = (x: string) => `the ${x} industry`;

/** Connect mode draws from anything you can hold, visit, switch on or run a business in. */
const THINGS: string[] = [
  ...new Set([...words.objects, ...words.places, ...words.technologies, ...words.industries.map(industry)]),
];

/** Twist mode's second slot mixes every other word list into one constraint. */
const CONSTRAINTS: string[] = [
  ...words.constraints.map((c) => `that ${c.text}`),
  ...words.materials.map((m) => `that is made of ${m}`),
  ...words.audiences.map((a) => `that is made for ${a}`),
  ...words.eras.map((e) => `that belongs in ${e}`),
];

export type Slot = { label: string; value: string; phrase: string };

const draw = (seed: string, key: string, pool: readonly string[], not?: string): string => {
  const rng = rngFromSeed(`${seed}:${key}`);
  const options = not ? pool.filter((p) => p !== not) : pool;
  return pick(rng, options);
};

export function rollSlots(mode: Exclude<Mode, 'spaghetti'>, seeds: string[]): Slot[] {
  if (mode === 'connect') {
    const a = draw(seeds[0]!, 'a', THINGS);
    const b = draw(seeds[1]!, 'b', THINGS, a);
    return [
      { label: 'Thing A', value: a, phrase: withArticle(a) },
      { label: 'Thing B', value: b, phrase: withArticle(b) },
    ];
  }
  const object = draw(seeds[0]!, 'o', words.objects);
  const constraint = draw(seeds[1]!, 'c', CONSTRAINTS);
  return [
    { label: 'Object', value: object, phrase: withArticle(object) },
    { label: 'Constraint', value: constraint, phrase: constraint },
  ];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function sentence(mode: Exclude<Mode, 'spaghetti'>, slots: Slot[]): string {
  const [a, b] = slots as [Slot, Slot];
  return mode === 'connect' ? `${cap(a.phrase)} crossed with ${b.phrase}.` : `${cap(a.phrase)} ${b.phrase}.`;
}

export const QUESTION: Record<Exclude<Mode, 'spaghetti'>, string> = {
  connect: 'What would this be? Who would pay for it?',
  twist: 'What would it look like? Who would want it?',
};

/** Spaghetti mode deals one quick prompt at a time: a verb and a thing to apply it to. */
const TWO_THING_VERBS: Record<string, string> = { combine: 'with', connect: 'to', swap: 'for' };

export function dealPrompt(seed: string): string {
  const verb = draw(seed, 'v', words.verbs);
  const a = draw(seed, 'x', THINGS);
  const joiner = TWO_THING_VERBS[verb];
  if (joiner) return `${cap(verb)} ${withArticle(a)} ${joiner} ${withArticle(draw(seed, 'y', THINGS, a))}.`;
  return `${cap(verb)} ${withArticle(a)}.`;
}

export const SPAGHETTI_SECONDS = 300;
export const SPAGHETTI_TARGET = 50;

/**
 * The worked example shown above the Random Idea Generator. It retells the "Behavioral Cut-Ups"
 * recipe the Connected chapter mentions (public speaking crossed with public transport gives a
 * speech on a bus) and then shows how Connect mode deals the same kind of pair. The book's example
 * is in steps 1 and 2; standing in a microphone for public speaking and a bus for public transport
 * so the generator could deal them is ours. Mark reviews this copy.
 */
const EXAMPLE_PAIR = ['microphone', 'bus'] as const;
export const WORKED_EXAMPLE = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Pick two things that have nothing to do with each other.',
      text: 'The Connected chapter points to a recipe called Behavioral Cut-Ups, from a manual called Recipes for Disaster. You take two unrelated behaviors that are both socially acceptable, such as public speaking and public transport.',
    },
    {
      heading: 'Put them together and see what you get.',
      text: 'Public speaking crossed with public transport gives you a speech on a bus. Neither part is new, but the combination is, and a combination that new makes you ask questions you would not have asked about either one alone.',
    },
    {
      heading: 'Why it works.',
      text: 'The chapter describes creativity as the art of putting unconnected things together to make something completely new. Its advice is to add a degree of chance, because a random pairing gets there before your inner critic says it will not work.',
    },
    {
      heading: 'See what the generator does.',
      text: 'Connect mode deals you a pair like this. Here a microphone stands in for public speaking and a bus for public transport:',
      cards: true,
      result: sentence('connect', EXAMPLE_PAIR.map((value, i) => ({ label: `Thing ${'AB'[i]}`, value, phrase: withArticle(value) }))),
    },
    {
      heading: 'Then do the thinking.',
      text: 'The tool deals the pair and nothing else. The book does not say whether anyone would pay for a speech on a bus, and the question under the result is the one to answer: what would this be, and who would pay for it? Twist and Spaghetti, the other two modes, are explained further down.',
    },
  ],
  slots: EXAMPLE_PAIR.map((value, i) => ({ label: `Thing ${'AB'[i]}`, value })),
  bridge: 'Press Roll to deal your own pair, then work out what it could be.',
};
