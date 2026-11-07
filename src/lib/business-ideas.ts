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
 * word the generator can deal. The mapping and the closing question are ours. Mark reviews this copy.
 */
export const WORKED_EXAMPLE = {
  title: 'A worked example from the book',
  slots: [
    { label: SLOT_LABELS[0]!, value: 'commuters' },
    { label: SLOT_LABELS[1]!, value: 'traffic', hint: problemHint('traffic') },
    { label: SLOT_LABELS[2]!, value: 'card' },
    { label: SLOT_LABELS[3]!, value: 'charity', hint: modelHint('charity') },
  ],
  reaction: [
    'The book tries something like this on a real problem: traffic congestion in Los Angeles, with the random word "donation". The authors thought it was a hard one and almost picked again, then decided that would be cheating and stuck with it. A few minutes later they had a list of ideas, including companies sponsoring free bus passes for commuters.',
    'Put into the four parts above, that idea is a bus pass (a card) for commuters, paid for by sponsors instead of riders, aimed at traffic. Who would pay? The sponsoring companies. Why would they pick it over what they do today? The book leaves that open, and so do we. It is the question to answer when you try your own.',
  ],
  note: 'Not every idea from a prompt is good, and the authors say so. The prompt got them past the first barrier. Now roll your own and write yours.',
};
