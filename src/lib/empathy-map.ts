import type { WorkedExample } from '../islands/shared/WorkedExample';
import { CARDS, type Card } from './perspective-cards';
import { randomBelow, splitLines } from './game-utils';

/**
 * Empathy Map. Pick a role, then write what that person says, thinks, does and feels about a
 * problem or an idea, and what they would lose and gain. The four boxes are the usual empathy map.
 * The pains and gains prompts use the questions the book asks in Chapter 12 about each stakeholder:
 * what is in it for them, what would they see as a negative, does it conflict with something they
 * are trying to do, does it make their life harder. The role is a type, never a named person. Pure
 * functions, so the logic can be checked without a browser.
 */
export type BoxId = 'says' | 'thinks' | 'does' | 'feels' | 'pains' | 'gains';
export type Box = { id: BoxId; label: string; prompt: string; book: boolean };

export const BOXES: Box[] = [
  { id: 'says', label: 'Says', prompt: 'What would they say out loud about this? Write it the way they would say it.', book: false },
  { id: 'thinks', label: 'Thinks', prompt: 'What would they be thinking but not saying?', book: false },
  { id: 'does', label: 'Does', prompt: 'What would you see them doing? Write what they do, not what they say they do.', book: false },
  { id: 'feels', label: 'Feels', prompt: 'How would they feel: worried, relieved, bored, proud, left out?', book: false },
  {
    id: 'pains',
    label: 'Pains',
    prompt: 'What would they see as a negative? Does it clash with something else they are trying to do? Does it make their life harder?',
    book: true,
  },
  { id: 'gains', label: 'Gains', prompt: 'What is in it for them? Why would they help, or at least not stand in the way?', book: true },
];

export type Entries = Record<BoxId, string>;
export const emptyEntries = (): Entries => ({ says: '', thinks: '', does: '', feels: '', pains: '', gains: '' });

/** Roles to start from: the Perspective Cards' people with a stake and the fresh eyes. Types, not people. */
export const ROLE_GROUPS: { id: 'stake' | 'fresh'; label: string }[] = [
  { id: 'stake', label: 'People with a stake' },
  { id: 'fresh', label: 'Fresh eyes' },
];
export const rolesIn = (group: 'stake' | 'fresh'): Card[] => CARDS.filter((c) => c.group === group);
export const ALL_ROLES: Card[] = ROLE_GROUPS.flatMap((g) => rolesIn(g.id));

export const randomRole = (rand: (n: number) => number = randomBelow, not?: string): Card => {
  const pool = ALL_ROLES.filter((c) => c.id !== not);
  return pool[rand(pool.length)]!;
};

/** Lines written in one box, empties dropped. */
export const linesOf = (text: string): string[] => splitLines(text);

/** How many boxes have something written in them. */
export const filledCount = (e: Entries): number => BOXES.filter((b) => linesOf(e[b.id]).length > 0).length;

export function toText(role: string, problem: string, e: Entries, ideas: string[]): string {
  const out: string[] = [];
  if (problem.trim()) out.push(`Problem or idea: ${problem.trim()}`);
  if (role.trim()) out.push(`Empathy map for: ${role.trim()}`);
  if (out.length) out.push('');
  for (const b of BOXES) {
    const lines = linesOf(e[b.id]);
    out.push(`${b.label}:`);
    out.push(...(lines.length ? lines.map((l) => `  - ${l}`) : ['  (nothing written yet)']));
    out.push('');
  }
  if (ideas.length) {
    out.push('Ideas this gives me:');
    out.push(...ideas.map((l, i) => `  ${i + 1}. ${l}`));
    out.push('');
  }
  return out.join('\n');
}

/** The book's Los Angeles traffic problem, from a commuter's side. Every entry is ours. */
export const EXAMPLE = {
  problem: 'How can people in Los Angeles spend less time stuck in traffic?',
  role: 'A regular commuter',
  entries: {
    says: '"I leave at six so that I do not sit in it."',
    thinks: 'If I could choose when I start, I would never be in the worst of it.',
    does: 'Checks the traffic on the phone before leaving, then drives the same way anyway.',
    feels: 'Tense in the car and resigned about it.',
    pains: 'Anything that changes my hours may clash with the school run.',
    gains: 'Time back from the journey.',
  } as Entries,
  ideas: ['Let people choose their start time.', 'Show where the jams are before people set off.'],
};

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example',
  steps: [
    {
      heading: 'Write the problem and choose whose map it is.',
      text: `The book’s running example is traffic in Los Angeles: “${EXAMPLE.problem}” The role is one of the Perspective Cards from the book’s Chapter 4: ${EXAMPLE.role.toLowerCase()}.`,
    },
    {
      heading: 'Fill the four boxes.',
      text: 'Say, think, do and feel. These are ours, to show the idea:',
      list: [`Says: ${EXAMPLE.entries.says}`, `Thinks: ${EXAMPLE.entries.thinks}`, `Does: ${EXAMPLE.entries.does}`, `Feels: ${EXAMPLE.entries.feels}`],
    },
    {
      heading: 'Add pains and gains.',
      text: 'These use the questions the book asks about each stakeholder in Chapter 12: what is in it for them, and what would they see as a negative?',
      list: [`Pains: ${EXAMPLE.entries.pains}`, `Gains: ${EXAMPLE.entries.gains}`],
    },
    {
      heading: 'Write the ideas the map gives you.',
      text: 'Look for the tensions and the gaps. Each is a way in, and they are ideas like any others:',
      list: EXAMPLE.ideas,
    },
  ],
  slots: [],
  bridge: 'Now fill in your own.',
};
