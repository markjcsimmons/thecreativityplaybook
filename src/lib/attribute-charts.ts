import data from '../data/attribute-charts.json';

/**
 * Attribute Listing tool logic (Scavengers chapter). Pure functions, so the server renders
 * the same chart the island shows. A chart is a thing, its attributes and the options for each.
 */
export type Attribute = { name: string; start: number; options: string[] };
export type Chart = { id: string; name: string; source: 'book' | 'new' | 'custom'; attributes: Attribute[] };

export const CHARTS = data.charts as Chart[];
export const QUESTION = 'Does this combination make something worth trying, or a recipe for disaster? What would you change next?';
export const CUSTOM_ID = 'custom';
export const MAX_ATTRIBUTES = 6;
export const MAX_OPTIONS = 12;

export const startPicks = (chart: Chart): number[] => chart.attributes.map((a) => a.start);

/** Picks from a shared link (`p=1.2.0.3`): one index per attribute, each inside its option list. */
export function parsePicks(chart: Chart, raw: string | null): number[] | null {
  if (!raw) return null;
  const parts = raw.split('.').map((x) => (/^\d{1,2}$/.test(x) ? Number(x) : -1));
  if (parts.length !== chart.attributes.length) return null;
  return parts.every((n, i) => n >= 0 && n < chart.attributes[i]!.options.length) ? parts : null;
}

/** A random whole number below `n` from the browser's crypto source. */
export function randomBelow(n: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % n;
}

/** A different option from the current one (the same one when there is only one option). */
export function otherOption(attr: Attribute, current: number, rand: (n: number) => number = randomBelow): number {
  if (attr.options.length < 2) return current;
  const next = rand(attr.options.length - 1);
  return next >= current ? next + 1 : next;
}

export const combo = (chart: Chart, picks: number[]): string[] => chart.attributes.map((a, i) => a.options[picks[i]!] ?? '');

/** One saved line: the thing, its picked options, and the user's own words when they wrote some. */
export const savedLine = (chart: Chart, picks: number[], note: string): string =>
  `${chart.name}: ${combo(chart, picks).join(', ')}${note ? `. ${note}` : ''}`;

export type CustomDraft = { thing: string; attributes: { name: string; options: string }[] };
export const EMPTY_DRAFT: CustomDraft = {
  thing: '',
  attributes: [
    { name: '', options: '' },
    { name: '', options: '' },
    { name: '', options: '' },
  ],
};

/** Options typed one per line or separated by commas; blanks and repeats are dropped. */
export const splitOptions = (text: string): string[] => {
  const seen = new Set<string>();
  return text
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter((s) => (s && !seen.has(s.toLowerCase()) ? (seen.add(s.toLowerCase()), true) : false))
    .slice(0, MAX_OPTIONS);
};

/** The user's own chart, or an explanation of what is missing. Needs a thing, 2+ attributes and 2+ options each. */
export function buildCustom(draft: CustomDraft): { chart: Chart } | { error: string } {
  const thing = draft.thing.trim();
  if (!thing) return { error: 'Name the thing you are breaking up, such as "bicycle" or "birthday party".' };
  const attributes = draft.attributes
    .map((a) => ({ name: a.name.trim(), options: splitOptions(a.options) }))
    .filter((a) => a.name || a.options.length)
    .slice(0, MAX_ATTRIBUTES);
  if (attributes.length < 2) return { error: 'Add at least two attributes.' };
  for (const a of attributes) {
    if (!a.name) return { error: 'Give every attribute a name.' };
    if (a.options.length < 2) return { error: `"${a.name}" needs at least two options.` };
  }
  return { chart: { id: CUSTOM_ID, name: thing, source: 'custom', attributes: attributes.map((a) => ({ ...a, start: 0 })) } };
}
