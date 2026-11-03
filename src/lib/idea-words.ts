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
