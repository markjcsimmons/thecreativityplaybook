import type { WorkedExample } from '../islands/shared/WorkedExample';
import { normalizeIdea } from './game-utils';

/**
 * Idea Scorer. A way to line up ideas against a few plain criteria once the book's idea-making
 * is done. It is not from the book: Chapter 11's own method is the Kill the Idea game and the
 * three piles (feasible now, potential, too weird). The scorer ranks the player's own judgments
 * and nothing more. Pure functions, so the maths can be checked without a browser.
 */
export const MIN_IDEAS = 2;
export const MAX_IDEAS = 30;

export type CriterionId = 'impact' | 'effort' | 'cost' | 'speed' | 'fun' | 'fit';
export type Criterion = {
  id: CriterionId;
  label: string;
  question: string;
  /** What a 1 means. */
  low: string;
  /** What a 5 means. */
  high: string;
  /** Effort and cost are scored as "how much", so a high number counts against the idea. */
  lowerIsBetter: boolean;
  weight: number;
};

export const CRITERIA: Criterion[] = [
  { id: 'impact', label: 'Impact', question: 'How much difference would it make to the people it is for?', low: 'Hardly noticed', high: 'A big difference', lowerIsBetter: false, weight: 3 },
  { id: 'effort', label: 'Effort', question: 'How much work is a first version?', low: 'A few hours', high: 'A team for months', lowerIsBetter: true, weight: 2 },
  { id: 'cost', label: 'Cost', question: 'How much money does a first version need?', low: 'Almost nothing', high: 'A large budget', lowerIsBetter: true, weight: 1 },
  { id: 'speed', label: 'Speed', question: 'How soon could you try a first version?', low: 'More than a year', high: 'This week', lowerIsBetter: false, weight: 1 },
  { id: 'fun', label: 'Fun', question: 'How much do you want to work on it?', low: 'A chore', high: 'Cannot wait', lowerIsBetter: false, weight: 1 },
  { id: 'fit', label: 'Fit', question: 'How well does it fit what you or your team are trying to do?', low: 'Barely', high: 'Right at the center', lowerIsBetter: false, weight: 2 },
];

export const WEIGHT_LABELS = ['Ignore', 'Low', 'Medium', 'High'] as const;
export type Weights = Record<CriterionId, number>;
export type Scores = Partial<Record<CriterionId, number>>;

export const defaultWeights = (): Weights => Object.fromEntries(CRITERIA.map((c) => [c.id, c.weight])) as Weights;

/** A 1 to 5 score where a higher number always means a better idea. */
export function orient(id: CriterionId, value: number): number {
  const c = CRITERIA.find((x) => x.id === id)!;
  return c.lowerIsBetter ? 6 - value : value;
}

const valid = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;

export type Total = { total: number | null; scored: number };

/**
 * The weighted average of the scores that have been given, as a whole number from 0 to 100. A
 * criterion with no score yet, or with weight 0, is left out. With nothing to go on the total is
 * null, never a made-up zero.
 */
export function scoreIdea(scores: Scores, weights: Weights): Total {
  let sum = 0;
  let weightSum = 0;
  let scored = 0;
  for (const c of CRITERIA) {
    const v = scores[c.id];
    const w = weights[c.id] ?? 0;
    if (!valid(v)) continue;
    scored++;
    if (w <= 0) continue;
    sum += w * ((orient(c.id, v) - 1) / 4);
    weightSum += w;
  }
  return { total: weightSum > 0 ? Math.round((sum / weightSum) * 100) : null, scored };
}

export type Quadrant = 'Quick win' | 'Big bet' | 'Fill-in' | 'Time sink' | 'In between';

/**
 * Where an idea sits on the impact and effort chart. A 3 is the middle, so an idea that scores 3
 * on either axis is "In between" rather than being pushed into a corner.
 */
export function quadrant(scores: Scores): Quadrant | null {
  const { impact, effort } = scores;
  if (!valid(impact) || !valid(effort)) return null;
  if (impact === 3 || effort === 3) return 'In between';
  const high = impact > 3;
  const low = effort < 3;
  if (high && low) return 'Quick win';
  if (high) return 'Big bet';
  if (low) return 'Fill-in';
  return 'Time sink';
}

export type Ranked = { index: number; text: string; scores: Scores; total: number | null; scored: number; rank: number | null; quadrant: Quadrant | null };

/**
 * Highest total first. Ideas with the same total share a rank and keep the order they were
 * entered in. Ideas with nothing scored come last and have no rank.
 */
export function rankIdeas(ideas: { text: string; scores: Scores }[], weights: Weights): Ranked[] {
  const rows = ideas.map((x, index): Ranked => {
    const t = scoreIdea(x.scores, weights);
    return { index, text: x.text, scores: x.scores, total: t.total, scored: t.scored, rank: null, quadrant: quadrant(x.scores) };
  });
  const withTotal = rows.filter((r) => r.total !== null).sort((a, b) => b.total! - a.total! || a.index - b.index);
  let rank = 0;
  let last: number | null = null;
  withTotal.forEach((r, i) => {
    if (r.total !== last) {
      rank = i + 1;
      last = r.total;
    }
    r.rank = rank;
  });
  return [...withTotal, ...rows.filter((r) => r.total === null)];
}

/** One idea per line, repeats dropped, capped at the maximum. */
export function parseIdeas(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    const key = normalizeIdea(t);
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** A spreadsheet reads a cell that starts with = + - or @ as a formula, so those get a leading apostrophe. */
export const safeCell = (s: string): string => {
  const t = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${t.replaceAll('"', '""')}"`;
};

export function toCsv(rows: Ranked[]): string {
  const head = ['rank', 'idea', 'total_out_of_100', ...CRITERIA.map((c) => c.id), 'quadrant'];
  const body = rows.map((r) => [r.rank ?? '', safeCell(r.text), r.total ?? '', ...CRITERIA.map((c) => r.scores[c.id] ?? ''), r.quadrant ?? ''].join(','));
  return [head.join(','), ...body].join('\n') + '\n';
}

export function toText(rows: Ranked[], weights: Weights, problem: string): string {
  const lines: string[] = [];
  if (problem.trim()) lines.push(`Problem: ${problem.trim()}`);
  lines.push(`Weights: ${CRITERIA.map((c) => `${c.label} ${WEIGHT_LABELS[weights[c.id]]!.toLowerCase()}`).join(', ')}`, '');
  for (const r of rows) {
    const detail = CRITERIA.filter((c) => r.scores[c.id]).map((c) => `${c.label.toLowerCase()} ${r.scores[c.id]}`).join(', ');
    lines.push(`${r.rank ?? '-'}. ${r.text}${r.total !== null ? ` (${r.total}/100${r.quadrant ? `, ${r.quadrant.toLowerCase()}` : ''})` : ' (not scored)'}${detail ? `\n   ${detail}` : ''}`);
  }
  return lines.join('\n') + '\n';
}

/**
 * Where the dots go on the chart. Impact runs up and effort runs across, both from 1 to 5. Dots
 * that land on the same square are spread in a small ring so none hides another.
 */
export function chartPoints(rows: Ranked[]): { index: number; x: number; y: number }[] {
  const plotted = rows.filter((r) => valid(r.scores.impact) && valid(r.scores.effort));
  const groups = new Map<string, Ranked[]>();
  for (const r of plotted) {
    const key = `${r.scores.effort}-${r.scores.impact}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const out: { index: number; x: number; y: number }[] = [];
  for (const group of groups.values()) {
    group.forEach((r, i) => {
      const n = group.length;
      const radius = n === 1 ? 0 : 0.28;
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      out.push({ index: r.index, x: r.scores.effort! + radius * Math.cos(angle), y: r.scores.impact! + radius * Math.sin(angle) });
    });
  }
  return out;
}

/** The book's Los Angeles traffic ideas, scored with example numbers so the method is clear. The scores are ours. */
export const EXAMPLE = {
  problem: 'How can people in Los Angeles spend less time stuck in traffic?',
  ideas: [
    { text: 'Luxury minibuses with wi-fi and coffee that use the car pool lane', scores: { impact: 4, effort: 4, cost: 4, speed: 2, fun: 4, fit: 4 } as Scores },
    { text: 'Employers give staff one day a week on work that does not need travel', scores: { impact: 3, effort: 2, cost: 1, speed: 4, fun: 3, fit: 3 } as Scores },
    { text: 'A radio station and short podcasts for people stuck in traffic', scores: { impact: 2, effort: 2, cost: 2, speed: 4, fun: 4, fit: 2 } as Scores },
  ],
};

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example',
  steps: [
    {
      heading: 'List the ideas you are choosing between.',
      text: 'The example uses three ideas from the book’s Los Angeles traffic examples: the car pool minibuses from the building-with-blocks section, an employer day away from travel from the random word example, and a radio station for people stuck in traffic.',
    },
    {
      heading: 'Score each one from 1 to 5 on each criterion.',
      text: 'The scores here are ours, to show how it works. For effort and cost a high number means more work or more money, and the scorer counts that against the idea.',
      list: EXAMPLE.ideas.map((x) => `${x.text}: impact ${x.scores.impact}, effort ${x.scores.effort}, cost ${x.scores.cost}, speed ${x.scores.speed}, fun ${x.scores.fun}, fit ${x.scores.fit}`),
    },
    {
      heading: 'Read the ranking, then argue with it.',
      text: 'With the default weights the employer idea ranks first. If you give impact all the weight and ignore the rest, the minibuses rank first, so the ranking changes with what you care about. The numbers rank your judgments and do not measure whether an idea will work.',
    },
  ],
  slots: [],
  bridge: 'Now add your own ideas below.',
};
