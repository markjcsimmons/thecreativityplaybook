import { z } from 'astro/zod';

/**
 * BRIEF §9.2 plus three additions the page inventory needs:
 * 'hub-guide', 'home', 'product' and 'legal' page types, and an explicit `path`
 * (the canonical URL, which must match docs/keyword-map.csv).
 */
export const PAGE_TYPES = [
  'tool',
  'hub',
  'hub-guide',
  'pillar-guide',
  'guide',
  'technique',
  'exercises',
  'puzzle-library',
  'quotes',
  'template',
  'book-list',
  'book',
  'about',
  'home',
  'product',
  'legal',
] as const;

/** Page types whose Book DNA comes from quote sources or the book CTA, not chapters. */
export const BOOK_SOURCES_EXEMPT = ['book-list', 'quotes', 'legal'] as const;

export const AUTHORS = ['team', 'mark', 'dave', 'dave-and-mark'] as const;

export const pageSchema = z
  .object({
    path: z.string().regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*\/)?$/, 'lowercase, hyphenated, leading and trailing slash'),
    title: z.string().min(1).max(60),
    description: z.string().min(140).max(155),
    /** H1 text. Defaults to `title`. Must still contain the primary keyword. */
    h1: z.string().min(1).optional(),
    /** Answer-first intro, two sentences or fewer (BRIEF §7). Defaults to `description`. */
    intro: z.string().min(1).optional(),
    primaryKeyword: z.string().min(1),
    secondaryKeywords: z.array(z.string()).default([]),
    pageType: z.enum(PAGE_TYPES),
    phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    bookChapter: z.string().min(1),
    bookSources: z
      .array(z.object({ chapter: z.string().min(1), page: z.number().int().positive().optional(), note: z.string().min(1) }))
      .default([]),
    serpNotes: z.string().optional(),
    status: z.enum(['draft', 'review', 'published']),
    reviewedBy: z.string().optional(),
    author: z.enum(AUTHORS),
    updated: z.coerce.date(),
    ogImage: z.string().optional(),
    /** Name of the Preact island in src/islands/ for tool pages. */
    island: z.string().optional(),
  })
  .superRefine((p, ctx) => {
    if (!(BOOK_SOURCES_EXEMPT as readonly string[]).includes(p.pageType) && p.bookSources.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['bookSources'], message: 'needs at least one bookSources entry (Book DNA, BRIEF §2.3)' });
    }
    if (p.status === 'published' && !p.reviewedBy) {
      ctx.addIssue({ code: 'custom', path: ['reviewedBy'], message: 'published pages need reviewedBy' });
    }
    if (p.author.startsWith('dave') && !p.reviewedBy) {
      ctx.addIssue({ code: 'custom', path: ['reviewedBy'], message: "author 'dave*' needs reviewedBy (Dave's approval, BRIEF §2.2)" });
    }
  });

export type PageData = z.infer<typeof pageSchema>;

/** src/data/quotes.json entries (BRIEF §9.4). Every quote needs a source. */
export const quoteSchema = z.object({
  text: z.string().min(1),
  author: z.string().min(1),
  role: z.string().optional(),
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('book'), ref: z.string().min(1) }),
    z.object({ type: z.literal('url'), ref: z.url() }),
  ]),
  theme: z.array(z.string()).min(1),
  fromBook: z.boolean(),
});
export type Quote = z.infer<typeof quoteSchema>;

/** src/data/puzzles.json entries (BRIEF §9.4). Puzzles must be original. */
export const puzzleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  setup: z.string().min(1),
  hints: z.array(z.string().min(1)).min(1),
  answer: z.string().min(1),
  thinkingMove: z.string().min(1),
  techniqueSlug: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  original: z.literal(true),
});
export type Puzzle = z.infer<typeof puzzleSchema>;

/** src/data/links.json: the hand-maintained internal link graph (BRIEF §10.4). */
export const linksSchema = z.record(
  z.string(),
  z.object({
    hub: z.string().optional(),
    siblings: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    technique: z.array(z.string()).default([]),
  }),
);
export type LinkGraph = z.infer<typeof linksSchema>;

/**
 * src/data/idea-words.json: prompt words for the idea generators. Every word comes
 * from the book's text (Mark's direction, 2026-11-02). scripts/check-content.ts also
 * confirms each word still appears in source/ when that folder exists.
 */
const wordList = z.array(z.string().min(1)).min(1);
export const ideaWordsSchema = z.object({
  _readme: z.string(),
  objects: wordList,
  places: wordList,
  technologies: wordList,
  industries: wordList,
  audiences: wordList,
  materials: wordList,
  verbs: wordList,
  eras: wordList,
  constraints: z.array(z.object({ text: z.string().min(1), word: z.string().min(1) })).min(1),
  mass: wordList,
});
export type IdeaWords = z.infer<typeof ideaWordsSchema>;

/**
 * src/data/business-words.json: words for the Business Idea Generator. Same rule as
 * idea-words.json (every word comes from the book). The tags only drive the filters.
 */
export const businessWordsSchema = z.object({
  _readme: z.string(),
  problems: wordList,
  models: z
    .array(z.object({ text: z.string().min(1), budget: z.enum(['any', 'shoestring', 'funded']), team: z.enum(['any', 'solo', 'team']) }))
    .min(1),
  mechanisms: z.array(z.object({ text: z.string().min(1), channel: z.enum(['online', 'offline', 'both']) })).min(1),
  mass: wordList,
  /** One short line per problem and per model, shown under the word on the card. */
  hints: z.object({ problems: z.record(z.string(), z.string().min(1)), models: z.record(z.string(), z.string().min(1)) }),
});
export type BusinessWords = z.infer<typeof businessWordsSchema>;

/** src/data/aut-categories.json and creativity-styles.json: scoring data for the Creativity Test (BRIEF §8.4). */
export const autDataSchema = z.object({
  _readme: z.string(),
  rounds: z
    .array(
      z.object({
        id: z.string().min(1),
        object: z.string().min(1),
        categories: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), keywords: z.array(z.string().min(3)).min(1) })).min(2),
        common: z.array(z.string().min(3)).min(1),
      }),
    )
    .length(3),
});
export const creativityStylesSchema = z
  .object({
    _readme: z.string(),
    styles: z
      .array(z.object({ id: z.string().min(1), name: z.string().min(1), chapterId: z.string().min(1), summary: z.string().min(1), next: z.object({ path: z.string().min(1), label: z.string().min(1) }) }))
      .length(6),
    questions: z.array(z.object({ prompt: z.string().min(1), options: z.array(z.object({ text: z.string().min(1), style: z.string().min(1) })).length(3) })).length(10),
  })
  .superRefine((d, ctx) => {
    const ids = new Set(d.styles.map((s) => s.id));
    d.questions.forEach((q, i) =>
      q.options.forEach((o, j) => {
        if (!ids.has(o.style)) ctx.addIssue({ code: 'custom', path: ['questions', i, 'options', j, 'style'], message: `unknown style "${o.style}"` });
      }),
    );
  });
