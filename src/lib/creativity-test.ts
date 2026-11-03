import aut from '../data/aut-categories.json';
import stylesData from '../data/creativity-styles.json';

/**
 * Creativity Test logic (BRIEF §8.4). Pure functions so they can be tested without a browser.
 * Part A scores an Alternative Uses task; Part B picks a Creative Style. Both are for fun
 * and self-reflection. The scoring is a simple, transparent rule, not a validated measure.
 */
export const ROUND_SECONDS = 120;
export const ROUNDS = aut.rounds;
export const STYLES = stylesData.styles;
export const QUESTIONS = stylesData.questions;

export type RoundData = (typeof aut.rounds)[number];
export type RoundScore = {
  /** Distinct valid answers. */
  fluency: number;
  /** Distinct categories the answers fall into (answers the dictionary does not know count as one more). */
  flexibility: number;
  categories: string[];
  /** Share of answers (0 to 100) that match none of the common answers. */
  originality: number;
  /** Average words per answer, one decimal place. */
  elaboration: number;
};

const words = (s: string) => s.toLowerCase().match(/[a-z']+/g) ?? [];
const hits = (answer: string, keyword: string) => {
  const a = answer.toLowerCase();
  return keyword.includes(' ') ? a.includes(keyword) : words(a).some((w) => w.startsWith(keyword));
};

/** Trim, collapse spaces, drop anything with fewer than three letters, and drop repeats (ignoring case). */
export function validAnswers(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of raw) {
    const text = r.replace(/\s+/g, ' ').trim();
    const key = text.toLowerCase();
    if ((text.match(/[a-z]/gi) ?? []).length < 3 || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

export const categoryOf = (answer: string, round: RoundData): string => round.categories.find((c) => c.keywords.some((k) => hits(answer, k)))?.id ?? 'other';
export const isCommon = (answer: string, round: RoundData): boolean => round.common.some((c) => hits(answer, c));

export function scoreRound(raw: string[], round: RoundData): RoundScore {
  const answers = validAnswers(raw);
  const categories = [...new Set(answers.map((a) => categoryOf(a, round)))];
  const fresh = answers.filter((a) => !isCommon(a, round)).length;
  const totalWords = answers.reduce((n, a) => n + words(a).length, 0);
  return {
    fluency: answers.length,
    flexibility: categories.length,
    categories,
    originality: answers.length ? Math.round((fresh / answers.length) * 100) : 0,
    elaboration: answers.length ? Math.round((totalWords / answers.length) * 10) / 10 : 0,
  };
}

export function scoreAll(rounds: string[][]) {
  const perRound = rounds.map((r, i) => scoreRound(r, ROUNDS[i]!));
  const total = perRound.reduce((n, r) => n + r.fluency, 0);
  const answered = perRound.filter((r) => r.fluency > 0);
  const mean = (pick: (r: RoundScore) => number) => (answered.length ? Math.round((answered.reduce((n, r) => n + pick(r), 0) / answered.length) * 10) / 10 : 0);
  return { perRound, fluency: total, flexibility: mean((r) => r.flexibility), originality: Math.round(mean((r) => r.originality)), elaboration: mean((r) => r.elaboration) };
}

/** One point per chosen option. Ties go to the style listed first, and the runner-up is reported. */
export function scoreStyle(choices: number[]) {
  const scores = Object.fromEntries(STYLES.map((s) => [s.id, 0])) as Record<string, number>;
  choices.forEach((optionIndex, q) => {
    const option = QUESTIONS[q]?.options[optionIndex];
    if (option) scores[option.style] = (scores[option.style] ?? 0) + 1;
  });
  const ranked = [...STYLES].sort((a, b) => scores[b.id]! - scores[a.id]!);
  const top = ranked[0]!;
  const second = ranked[1]!;
  return { scores, top, second: scores[second.id]! > 0 ? second : undefined };
}
