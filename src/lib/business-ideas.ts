import biz from '../data/business-words.json';
import words from '../data/idea-words.json';
import { pick, rngFromSeed } from './prng';

/**
 * Business Idea Generator logic (BRIEF §8.2). Pure functions, so the server renders
 * the same example the island shows. Four slots (audience, problem, mechanism,
 * business model) each have their own seed, plus one more seed for the Scavenger prompt.
 */
export type Budget = 'any' | 'shoestring' | 'funded';
export type Channel = 'any' | 'online' | 'offline' | 'hybrid';
export type Team = 'any' | 'solo' | 'team';
export type Filters = { budget: Budget; channel: Channel; team: Team };
export type Preset = 'any' | 'startup' | 'app' | 'side-hustle';

export const PRESETS: { value: Preset; label: string; set: Filters }[] = [
  { value: 'any', label: 'Any', set: { budget: 'any', channel: 'any', team: 'any' } },
  { value: 'startup', label: 'Startup', set: { budget: 'funded', channel: 'any', team: 'team' } },
  { value: 'app', label: 'App', set: { budget: 'any', channel: 'online', team: 'any' } },
  { value: 'side-hustle', label: 'Side hustle', set: { budget: 'shoestring', channel: 'any', team: 'solo' } },
];

export const SLOT_LABELS = ['Audience', 'Problem', 'Mechanism', 'Business model'];
export const SEED_COUNT = 5; // four slots and the Scavenger prompt

const MASS = new Set([...words.mass, ...biz.mass]);
const withArticle = (noun: string) => (MASS.has(noun) ? noun : /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const draw = (seed: string, key: string, pool: readonly string[]): string => pick(rngFromSeed(`${seed}:${key}`), pool);

export function modelsFor(f: Filters): string[] {
  return biz.models.filter((m) => (f.budget === 'any' || m.budget === 'any' || m.budget === f.budget) && (f.team === 'any' || m.team === 'any' || m.team === f.team)).map((m) => m.text);
}

export function mechanismsFor(f: Filters): string[] {
  return biz.mechanisms
    .filter((m) => f.channel === 'any' || (f.channel === 'hybrid' ? m.channel === 'both' : m.channel === 'both' || m.channel === f.channel))
    .map((m) => m.text);
}

const FRAMES = [
  (place: string) => `Spend ten minutes at ${place} and write down every small frustration you notice. Pick the one that shows up most.`,
  (place: string) => `Next time you are at ${place}, ask three people what annoys them most. Listen for the thing they have stopped noticing.`,
  (place: string) => `Look for something people at ${place} work around, patch up or put up with. That workaround is an idea waiting.`,
];

export function scavengerPrompt(seed: string): string {
  const frame = pick(rngFromSeed(`${seed}:f`), FRAMES);
  const place = draw(seed, 'p', words.places);
  return frame(withArticle(place));
}

export type Pitch = { slots: { label: string; value: string; hint?: string }[]; text: string; prompt: string };

/** The short line under a problem or a model, so a bare word like "studio" says what it means here. */
export const problemHint = (problem: string): string | undefined => (biz.hints.problems as Record<string, string>)[problem];
export const modelHint = (model: string): string | undefined => (biz.hints.models as Record<string, string>)[model];

export function rollPitch(seeds: string[], f: Filters): Pitch {
  const audience = draw(seeds[0]!, 'a', words.audiences);
  const problem = draw(seeds[1]!, 'p', biz.problems);
  const mechanism = draw(seeds[2]!, 'm', mechanismsFor(f));
  const model = draw(seeds[3]!, 'b', modelsFor(f));
  return {
    slots: [
      { label: SLOT_LABELS[0]!, value: audience },
      { label: SLOT_LABELS[1]!, value: problem, hint: problemHint(problem) },
      { label: SLOT_LABELS[2]!, value: mechanism },
      { label: SLOT_LABELS[3]!, value: model, hint: modelHint(model) },
    ],
    text: `${cap(withArticle(model))} that helps ${audience} with ${problem} using ${withArticle(mechanism)}.`,
    prompt: scavengerPrompt(seeds[4]!),
  };
}

/**
 * The worked example shown above the tool. It retells an exercise from the Connected chapter
 * (traffic congestion in Los Angeles, forced to connect with the random word "donation") and maps
 * the authors' bus-pass idea onto the four parts. Chosen on purpose, not rolled; every part is a
 * word the generator can deal. The five ideas in step 3 paraphrase the book's list; the mapping in step 4 and the closing question are ours. Mark reviews this copy.
 */
export const WORKED_EXAMPLE = {
  title: 'A worked example from the book',
  steps: [
    {
      heading: 'Start with a problem.',
      text: 'The authors chose traffic congestion in Los Angeles. They picked it because it is hard and many people have tried to fix it.',
    },
    {
      heading: 'Get a nudge from something unrelated.',
      text: 'They flicked through a dictionary and put a finger on a page. The word was "donation". It has nothing to do with traffic, and that is the point: a random word pushes you to look at the problem from a direction you would not choose.',
    },
    {
      heading: 'Force a connection.',
      text: 'Their first reaction was that "donation" was a hard one and they should pick again. Then they decided that would be cheating, so they made themselves come up with traffic ideas that relate to donating. A couple of minutes later they had these:',
      list: [
        'Drivers could be made to donate to charity every time they drive.',
        'People could be asked to donate their cars to charity and use other means of transport.',
        'There could be a donation drive to build a better form of transport.',
        'Companies could be encouraged to sponsor free bus passes for commuters.',
        'Employers could be asked to donate one day a week of employees\u2019 time to work that does not require them to travel.',
      ],
    },
    {
      heading: 'Sort one idea into four parts.',
      text: 'This is what the generator below does. Take the bus pass idea. Commuters are who it is for. Traffic is the problem. A card is the thing they hold. Charity is how it gets paid for: sponsors give the money, so riders do not pay. The word "donation" ended up as the fourth part.',
      cards: true,
    },
    {
      heading: 'Leave the hard question open.',
      text: 'Why would a company sponsor this instead of spending the money on something else? The book does not answer that, and a real idea would need an answer. The authors also say that none of these ideas is amazing. The random word got them past the first barrier of having no obvious connection, and that is all it is for.',
    },
  ],
  slots: [
    { label: SLOT_LABELS[0]!, value: 'commuters' },
    { label: SLOT_LABELS[1]!, value: 'traffic', hint: problemHint('traffic') },
    { label: SLOT_LABELS[2]!, value: 'card' },
    { label: SLOT_LABELS[3]!, value: 'charity', hint: modelHint('charity') },
  ],
  bridge:
    'The generator does the same thing in a different way. The book gives you one random word. The tool gives you four random parts, so you start with something instead of a blank page and have to ask the same question: what could these have to do with each other? Roll your own below, then write your pitch.',
};
