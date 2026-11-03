import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsvObjects } from './csv';

export type KeywordRow = {
  path: string;
  pageType: string;
  phase: number;
  primaryKeyword: string;
  primaryVolume: number | null;
  primaryKd: number | null;
  /** Secondary keywords with the " (volume)" suffix stripped. */
  secondaryKeywords: string[];
  bookSource: string;
  status: string;
  notes: string;
};

const MAP_FILE = join(process.cwd(), 'docs', 'keyword-map.csv');

/** docs/keyword-map.csv is the source of truth for page <-> keyword (BRIEF §0.3). */
export function loadKeywordMap(file = MAP_FILE): KeywordRow[] {
  return parseCsvObjects(readFileSync(file, 'utf8')).map((r) => ({
    path: r.path!,
    pageType: r.page_type!,
    phase: Number(r.phase),
    primaryKeyword: r.primary_keyword!,
    primaryVolume: r.primary_volume ? Number(r.primary_volume) : null,
    primaryKd: r.primary_kd ? Number(r.primary_kd) : null,
    secondaryKeywords: (r.proposed_secondary_keywords ?? '')
      .split('|')
      .map((s) => s.replace(/\s*\(\d+\)\s*$/, '').trim())
      .filter(Boolean),
    bookSource: r.book_source ?? '',
    status: r.status ?? '',
    notes: r.notes ?? '',
  }));
}

/** Path with a leading and trailing slash, e.g. "/guides/creative-block/". */
export function normalizePath(p: string): string {
  const trimmed = p.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}
