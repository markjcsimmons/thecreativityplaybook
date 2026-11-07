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

/** The one-line prompt for an object, a verb and a user. */
export function promptText(object: string, verb: string, user: string): string {
  const thing = withArticle(object);
  const form = FORMS[verb];
  return `${form ? form(thing) : `${cap(verb)} ${thing}`}, for ${user}.`;
}

export function rollProduct(seeds: string[]) {
  const object = draw(seeds[0]!, 'o', words.objects);
  const verb = draw(seeds[1]!, 'v', words.verbs);
  const user = draw(seeds[2]!, 'u', words.audiences);
  return {
    slots: [
      { label: SLOT_LABELS[0]!, value: object },
      { label: SLOT_LABELS[1]!, value: verb },
      { label: SLOT_LABELS[2]!, value: user },
    ],
    text: promptText(object, verb, user),
  };
}

/**
 * The worked example shown above the tool. It retells the umbrella story from the Scavengers chapter
 * (the steel-ribbed umbrella, its bugs, and the Dutch company SENZ, whose lopsided umbrella swapped
 * the round canopy for an asymmetrical one) and then shows the prompt the generator would give for
 * it. Text only: the SENZ photo stays blocked (src/data/rights.json). The facts in steps 1 to 3 are
 * the book's; the mapping onto object, verb and user (and the choice of "commuters") is ours.
 * Mark reviews this copy.
 */
const EXAMPLE_PARTS = { object: 'umbrella', verb: 'swap', user: 'commuters' };
export const WORKED_EXAMPLE = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Start with an ordinary object.',
      text: 'The Scavengers chapter picks the umbrella. The steel-ribbed kind was invented by Samuel Fox in 1852, and umbrellas of one sort or another go back thousands of years. It is a product nobody thinks about, which makes it a good place to look.',
    },
    {
      heading: 'Ask what is wrong with it.',
      text: 'The chapter calls this a bug list: the things that irritate you about a product. For the umbrella, the book lists that it is prone to blow inside out, to break, and to poke someone in the eye.',
    },
    {
      heading: 'Change one part.',
      text: 'A Dutch company, SENZ, swapped the round shape for a lopsided one that works with the wind instead of against it, and added "eye-savers" to protect people nearby. The book says it went on sale in 2007 and sold 10,000 in the first nine days. The designers also considered stranger ideas, such as magnetic fields, but kept it close enough to a normal umbrella that people would accept it. Their first prototypes came from ripping apart old umbrellas and using a grandmother\u2019s sewing machine.',
    },
    {
      heading: 'Turn it into a prompt.',
      text: 'The generator gives you the same three pieces. The object is the thing, the verb is the kind of change, and the user is the person you picture using it. Here they are for this story, with the prompt they make:',
      cards: true,
      result: promptText(EXAMPLE_PARTS.object, EXAMPLE_PARTS.verb, EXAMPLE_PARTS.user),
    },
    {
      heading: 'Do the rest yourself.',
      text: 'A prompt is not an invention. SENZ did the real work by listing what bugs people and by building prototypes. The generator gives you the push without the bug list, so when you roll, ask what bugs your user about the object, and let the verb suggest what to change.',
    },
  ],
  slots: [
    { label: SLOT_LABELS[0]!, value: EXAMPLE_PARTS.object },
    { label: SLOT_LABELS[1]!, value: EXAMPLE_PARTS.verb },
    { label: SLOT_LABELS[2]!, value: EXAMPLE_PARTS.user },
  ],
  bridge: 'The book gets to an idea from a list of bugs. This tool gets you started from a random object, verb and user. Roll your own below.',
};

export const QUESTION = 'What would it do? Who would use it first?';
