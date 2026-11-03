import { getCollection, type CollectionEntry } from 'astro:content';
import linksData from '../data/links.json';
import { linksSchema, type LinkGraph } from './schemas';
import { loadKeywordMap, normalizePath, type KeywordRow } from './keyword-map';

export type AnyPage = CollectionEntry<'pages'>;

const COLLECTIONS = ['pages', 'guides', 'techniques', 'exercises', 'books', 'quotes', 'puzzles', 'templates', 'tools'] as const;

/**
 * Drafts are excluded from production builds and included only when
 * PREVIEW=true (BRIEF §9.1). Only `published` pages ship.
 */
export const isPreviewBuild = () => process.env.PREVIEW === 'true';

let pagesPromise: Promise<AnyPage[]> | undefined;
export function getAllPages(): Promise<AnyPage[]> {
  // Memoized: every layout asks for the page list, and one build only needs one read.
  pagesPromise ??= (async () => {
    const lists = await Promise.all(COLLECTIONS.map((c) => getCollection(c)));
    const all = lists.flat() as AnyPage[];
    return isPreviewBuild() ? all : all.filter((p) => p.data.status === 'published');
  })();
  return pagesPromise;
}

let keywordMap: Map<string, KeywordRow> | undefined;
export function keywordRows(): Map<string, KeywordRow> {
  keywordMap ??= new Map(loadKeywordMap().map((r) => [normalizePath(r.path), r]));
  return keywordMap;
}

export function linkGraph(): LinkGraph {
  const entries = Object.entries(linksData).filter(([k]) => !k.startsWith('_'));
  return linksSchema.parse(Object.fromEntries(entries));
}

/**
 * "Ch9 Shoe Swapper / Ch10 Connected" -> "ch9"; "Introduction" -> "intro".
 * Pages whose source is "All" or "Book CTA" have no single chapter and get the
 * generic callout.
 */
export function chapterIdFor(bookChapter: string): string | undefined {
  const m = /ch(?:apter)?\s*(\d{1,2})/i.exec(bookChapter);
  if (m) return `ch${Number(m[1])}`;
  if (/intro/i.test(bookChapter)) return 'intro';
  return undefined;
}

/**
 * Breadcrumb trail built from the URL path. Only ancestors that are real pages in
 * this build become crumbs, so a breadcrumb can never link to a 404.
 */
export function crumbsFor(path: string, titles: Map<string, string>): { name: string; path: string }[] {
  const crumbs: { name: string; path: string }[] = [];
  if (titles.has('/')) crumbs.push({ name: 'Home', path: '/' });
  const parts = path.split('/').filter(Boolean);
  let acc = '';
  for (const part of parts) {
    acc += `/${part}`;
    const p = normalizePath(acc);
    const name = titles.get(p);
    if (name) crumbs.push({ name, path: p });
  }
  return crumbs;
}
