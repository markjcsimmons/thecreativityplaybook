import words from '../data/idea-words.json';
import { pick, rngFromSeed } from './prng';

/**
 * Product Idea Generator logic (BRIEF §8.3). An everyday object, a verb and a user.
 * The verbs are the book's own (idea-words.json); they work like the SCAMPER prompts
 * but SCAMPER itself is not in the book, so it is not named here.
 */
export const SLOT_LABELS = ['Object', 'Verb', 'User'];
export const SEED_COUNT = 3;

const MASS = new Set(words.mass);
const withArticle = (noun: string) => (MASS.has(noun) ? noun : /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const draw = (seed: string, key: string, pool: readonly string[]): string => pick(rngFromSeed(`${seed}:${key}`), pool);

/** How each verb reads in a sentence; any verb not listed reads "Verb a thing, for users." */
const FORMS: Record<string, (thing: string) => string> = {
  combine: (t) => `Combine ${t} with something else`,
  connect: (t) => `Connect ${t} to something else`,
  swap: (t) => `Swap one part of ${t} for something new`,
  eliminate: (t) => `Eliminate one part of ${t}`,
  adapt: (t) => `Adapt ${t} to a new use`,
};

export function rollProduct(seeds: string[]) {
  const object = draw(seeds[0]!, 'o', words.objects);
  const verb = draw(seeds[1]!, 'v', words.verbs);
  const user = draw(seeds[2]!, 'u', words.audiences);
  const thing = withArticle(object);
  const form = FORMS[verb];
  return {
    slots: [
      { label: SLOT_LABELS[0]!, value: object },
      { label: SLOT_LABELS[1]!, value: verb },
      { label: SLOT_LABELS[2]!, value: user },
    ],
    text: `${form ? form(thing) : `${cap(verb)} ${thing}`}, for ${user}.`,
  };
}

export const QUESTION = 'What would it do? Who would use it first?';
