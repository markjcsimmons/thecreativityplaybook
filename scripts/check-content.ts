/**
 * Build-time content and SEO checks (BRIEF §10.6). Fails the build on any error.
 *
 *   npm run check            checks source files (run before the build)
 *   npm run check -- --dist  also checks the built HTML in dist/ for broken internal links
 *
 * Checked: keyword map integrity, every page's frontmatter (title/description
 * length, bookSources, reviewedBy rules), primary keyword in title and H1,
 * banned phrases, quote sources, puzzle shape, and the internal link graph.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { BANNED_PHRASES } from '../src/lib/banned-phrases';
import { loadKeywordMap, normalizePath } from '../src/lib/keyword-map';
import { autDataSchema, businessWordsSchema, creativityStylesSchema, ideaWordsSchema, linksSchema, pageSchema, puzzleSchema, quoteSchema, type PageData } from '../src/lib/schemas';
import { z } from 'astro/zod';

const root = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

const config = JSON.parse(readFileSync(join(root, 'scripts/check-config.json'), 'utf8')) as {
  variants: Record<string, string[]>;
  warnTerms: string[];
};

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p, exts);
    return exts.some((e) => p.endsWith(e)) ? [p] : [];
  });
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const stem = (t: string) => (t.length > 3 ? t.replace(/(ies)$/, 'y').replace(/s$/, '') : t);
/** True when every word of `needle` (lightly stemmed) appears in `hay`, in order. */
function containsPhrase(hay: string, needle: string): boolean {
  const h = norm(hay).split(' ').map(stem);
  const n = norm(needle).split(' ').map(stem);
  for (let i = 0; i + n.length <= h.length; i++) if (n.every((w, j) => h[i + j] === w)) return true;
  return false;
}

// ---- 1. Keyword map -------------------------------------------------------
const map = loadKeywordMap();
const byPath = new Map(map.map((r) => [normalizePath(r.path), r]));
const seenPrimary = new Map<string, string>();
for (const r of map) {
  if (r.primaryKeyword.startsWith('(')) continue; // brand pages such as /tools/chapter-dice/
  const k = r.primaryKeyword.toLowerCase();
  const prev = seenPrimary.get(k);
  if (prev) err('docs/keyword-map.csv', `primary keyword "${r.primaryKeyword}" is used by both ${prev} and ${r.path}`);
  seenPrimary.set(k, r.path);
}
const secondaryOwner = new Map<string, string>();
for (const r of map)
  for (const s of r.secondaryKeywords) {
    const owner = secondaryOwner.get(s.toLowerCase());
    if (owner && owner !== r.path) warn('docs/keyword-map.csv', `secondary keyword "${s}" appears on ${owner} and ${r.path}`);
    secondaryOwner.set(s.toLowerCase(), r.path);
    if (seenPrimary.has(s.toLowerCase()) && seenPrimary.get(s.toLowerCase()) !== r.path)
      err('docs/keyword-map.csv', `"${s}" is the primary keyword of ${seenPrimary.get(s.toLowerCase())} but a secondary on ${r.path}`);
  }

// ---- 2. Pages ---------------------------------------------------------------
const files = walk(join(root, 'src/content'), ['.md', '.mdx']);
const pagePaths = new Map<string, string>();
for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) {
    err(rel, 'missing frontmatter');
    continue;
  }
  const [, fm, body] = m as unknown as [string, string, string];
  let raw: unknown;
  try {
    raw = parseYaml(fm);
  } catch (e) {
    err(rel, `frontmatter is not valid YAML (quote any value that contains a colon): ${(e as Error).message.split('\n')[0]}`);
    continue;
  }
  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) for (const issue of parsed.error.issues) err(rel, `${issue.path.join('.') || '(root)'}: ${issue.message}`);
  // Keep checking a page whose schema failed so authors see every problem in one pass.
  const page = (parsed.success ? parsed.data : (raw ?? {})) as Partial<PageData>;
  const path = typeof page.path === 'string' ? normalizePath(page.path) : undefined;

  if (path) {
    const dupe = pagePaths.get(path);
    if (dupe) err(rel, `path ${path} is also used by ${dupe}`);
    pagePaths.set(path, rel);

    const row = byPath.get(path);
    if (!row) {
      err(rel, `${path} is not in docs/keyword-map.csv (never create a page that isn't in the map)`);
    } else if (row.primaryKeyword.toLowerCase() !== (page.primaryKeyword ?? '').toLowerCase()) {
      err(rel, `primaryKeyword "${page.primaryKeyword}" does not match the map ("${row.primaryKeyword}")`);
    }
  }

  const keyword = page.primaryKeyword ?? byPath.get(path ?? '')?.primaryKeyword;
  if (keyword && !keyword.startsWith('(') && page.title) {
    const accepted = [keyword, ...(config.variants[keyword.toLowerCase()] ?? [])];
    const h1 = page.h1 ?? page.title;
    if (!accepted.some((a) => containsPhrase(page.title!, a))) err(rel, `title "${page.title}" does not contain "${keyword}"`);
    if (!accepted.some((a) => containsPhrase(h1, a))) err(rel, `H1 "${h1}" does not contain "${keyword}"`);
  }

  // Banned phrases and risky terms, in frontmatter text and body.
  const prose = [page.title, page.description, page.h1, page.intro, body].filter(Boolean).join('\n');
  for (const b of BANNED_PHRASES) if (b.pattern.test(prose)) err(rel, `banned phrase: ${b.label}`);
  if (page.status === 'published' && /\[\[[^\]]*\]\]/.test(prose)) err(rel, 'published page still has a [[placeholder]]');
  for (const t of config.warnTerms) if (prose.includes(t)) warn(rel, `mentions "${t}" (not cleared for reuse, see src/data/rights.json)`);

  if (typeof page.intro === 'string' && (page.intro.match(/[.!?](\s|$)/g) ?? []).length > 2) err(rel, 'intro is longer than two sentences');
}

// ---- 3. Data files ------------------------------------------------------------
function checkData<T extends z.ZodType>(file: string, schema: T) {
  const p = join(root, 'src/data', file);
  if (!existsSync(p)) return;
  const result = z.array(schema).safeParse(JSON.parse(readFileSync(p, 'utf8')));
  if (!result.success) for (const i of result.error.issues) err(`src/data/${file}`, `[${i.path.join('.')}] ${i.message}`);
}
checkData('quotes.json', quoteSchema); // every quote needs a source
checkData('puzzles.json', puzzleSchema);
{
  // Puzzles: unique ids, and an answer that the setup does not already give away.
  const p = join(root, 'src/data/puzzles.json');
  if (existsSync(p)) {
    const list = JSON.parse(readFileSync(p, 'utf8')) as { id: string; setup: string; answer: string; hints: string[] }[];
    const seen = new Set<string>();
    for (const x of list) {
      if (seen.has(x.id)) err('src/data/puzzles.json', `duplicate puzzle id "${x.id}"`);
      seen.add(x.id);
      const words = x.answer.toLowerCase().split(/\s+/).slice(0, 6).join(' ');
      if (x.setup.toLowerCase().includes(words)) err('src/data/puzzles.json', `${x.id}: the setup repeats the start of the answer`);
      for (const h of x.hints) if (h.toLowerCase().includes(words)) err('src/data/puzzles.json', `${x.id}: a hint repeats the start of the answer`);
    }
  }
}

// Scoring data for the Creativity Test (written by us, so shape checks only).
for (const [file, schema] of [['aut-categories.json', autDataSchema], ['creativity-styles.json', creativityStylesSchema]] as const) {
  const p = join(root, 'src/data', file);
  if (!existsSync(p)) continue;
  const parsed = schema.safeParse(JSON.parse(readFileSync(p, 'utf8')));
  if (!parsed.success) for (const i of parsed.error.issues) err(`src/data/${file}`, `[${i.path.join('.')}] ${i.message}`);
}

// Business Idea Generator vocabulary: shape, duplicates, and (when source/ exists) provenance.
{
  const file = 'src/data/business-words.json';
  const p = join(root, file);
  if (existsSync(p)) {
    const parsed = businessWordsSchema.safeParse(JSON.parse(readFileSync(p, 'utf8')));
    if (!parsed.success) for (const i of parsed.error.issues) err(file, `[${i.path.join('.')}] ${i.message}`);
    else {
      const w = parsed.data;
      const lists: [string, string[]][] = [['problems', w.problems], ['audiences', w.audiences], ['models', w.models.map((m) => m.text)], ['mechanisms', w.mechanisms.map((m) => m.text)]];
      for (const [name, list] of lists) {
        const dupes = list.filter((x, i) => list.indexOf(x) !== i);
        if (dupes.length) err(file, `${name} has duplicates: ${[...new Set(dupes)].join(', ')}`);
      }
      // Every problem and model needs its one-line hint, and no hint may be left over.
      for (const [name, list] of [['problems', w.problems], ['models', w.models.map((m) => m.text)]] as const) {
        const hints = Object.keys(w.hints[name]);
        const missing = list.filter((x) => !hints.includes(x));
        const extra = hints.filter((x) => !list.includes(x));
        if (missing.length) err(file, `hints.${name} is missing: ${missing.join(', ')}`);
        if (extra.length) err(file, `hints.${name} has entries with no matching word: ${extra.join(', ')}`);
      }
      const sources = ['business-playground-2010.txt', 'creativity-playbook-v2-comp-2025.txt'].map((f) => join(root, 'source', f)).filter(existsSync);
      if (sources.length) {
        const book = sources.map((f) => readFileSync(f, 'utf8')).join(' ').toLowerCase().replace(/\s+/g, ' ');
        const inBook = (word: string) => {
          const base = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${base}(s|es|ed|ing)?\\b`).test(book) || (base.endsWith('y') && new RegExp(`\\b${base.slice(0, -1)}ies\\b`).test(book));
        };
        for (const [name, list] of lists) for (const x of list) if (!inBook(x)) warn(file, `${name}: "${x}" was not found in the book text`);
      }
    }
  }
}

// Idea generator vocabulary: shape, duplicates, and (when source/ exists) provenance.
{
  const file = 'src/data/idea-words.json';
  const p = join(root, file);
  if (existsSync(p)) {
    const parsed = ideaWordsSchema.safeParse(JSON.parse(readFileSync(p, 'utf8')));
    if (!parsed.success) for (const i of parsed.error.issues) err(file, `[${i.path.join('.')}] ${i.message}`);
    else {
      const w = parsed.data;
      const lists: [string, string[]][] = [
        ['objects', w.objects], ['places', w.places], ['technologies', w.technologies], ['industries', w.industries],
        ['audiences', w.audiences], ['materials', w.materials], ['verbs', w.verbs], ['eras', w.eras],
      ];
      for (const [name, list] of lists) {
        const dupes = list.filter((x, i) => list.indexOf(x) !== i);
        if (dupes.length) err(file, `${name} has duplicates: ${[...new Set(dupes)].join(', ')}`);
      }
      const sources = ['business-playground-2010.txt', 'creativity-playbook-v2-comp-2025.txt']
        .map((f) => join(root, 'source', f))
        .filter(existsSync);
      if (sources.length) {
        const book = sources.map((f) => readFileSync(f, 'utf8')).join(' ').toLowerCase().replace(/\s+/g, ' ');
        const inBook = (word: string) => {
          const base = word.replace(/^the /, '').toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${base}(s|es|ed|ing)?\\b`).test(book) || (base.endsWith('y') && new RegExp(`\\b${base.slice(0, -1)}ies\\b`).test(book));
        };
        for (const [name, list] of lists) for (const x of list) if (!inBook(x)) warn(file, `${name}: "${x}" was not found in the book text`);
        for (const c of w.constraints) if (!inBook(c.word)) warn(file, `constraints: "${c.word}" was not found in the book text`);
      }
    }
  }
}

const linksRaw = JSON.parse(readFileSync(join(root, 'src/data/links.json'), 'utf8')) as Record<string, unknown>;
const graph = linksSchema.safeParse(Object.fromEntries(Object.entries(linksRaw).filter(([k]) => !k.startsWith('_'))));
if (!graph.success) for (const i of graph.error.issues) err('src/data/links.json', `[${i.path.join('.')}] ${i.message}`);
else
  for (const [from, node] of Object.entries(graph.data)) {
    const targets = [from, ...(node.hub ? [node.hub] : []), ...node.siblings, ...node.tools, ...node.technique];
    for (const t of targets) if (!byPath.has(normalizePath(t))) err('src/data/links.json', `${t} (linked from ${from}) is not in the keyword map`);
  }

// ---- 4. Built HTML: broken internal links ---------------------------------------
let homeMissing = false;
if (process.argv.includes('--dist')) {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) err('dist', 'not found; run the build first');
  else {
    const exists = (urlPath: string) => {
      const clean = decodeURIComponent(urlPath.split('#')[0]!.split('?')[0]!);
      const p = join(dist, clean);
      return existsSync(p) && (!statSync(p).isDirectory() || existsSync(join(p, 'index.html')));
    };
    // Every public page needs a markdown twin for AI agents, and llms.txt must list it (scripts/build-markdown.ts).
    const llms = existsSync(join(dist, 'llms.txt')) ? readFileSync(join(dist, 'llms.txt'), 'utf8') : '';
    if (!llms) err('dist/llms.txt', 'missing; run the build (it runs scripts/build-markdown.ts)');
    if (!existsSync(join(dist, 'llms-full.txt'))) err('dist/llms-full.txt', 'missing; run the build');
    for (const file of walk(dist, ['.html'])) {
      const html = readFileSync(file, 'utf8');
      if (file.endsWith('index.html') && !/<meta[^>]+name="robots"[^>]+noindex/.test(html)) {
        const md = file.replace(/index\.html$/, 'index.md');
        const label = relative(root, md);
        if (!existsSync(md)) err(label, 'public page has no markdown version');
        else {
          const text = readFileSync(md, 'utf8');
          if (!text.startsWith('---\n') || text.length < 200) err(label, 'markdown version is empty or has no front matter');
          if (!llms.includes(`${relative(dist, md).replace(/\\/g, '/')}`)) err('dist/llms.txt', `does not list ${relative(dist, md)}`);
        }
        if (!html.includes('rel="alternate" type="text/markdown"')) err(relative(root, file), 'missing the text/markdown alternate link');
      }
      for (const m of html.matchAll(/<a\s[^>]*href="(\/[^"#?][^"]*|\/)"/g)) {
        const href = m[1]!;
        if (href.startsWith('//')) continue;
        if (exists(href)) continue;
        // Every page links home from the header. Until the home page is written, warn once instead of failing.
        if (href === '/' && !pagePaths.has('/')) homeMissing = true;
        else err(relative(root, file), `broken internal link ${href}`);
      }
    }
  }
}

if (homeMissing) warn('dist', 'pages link to "/" but the home page has no content file yet');

// ---- Report -------------------------------------------------------------------------
for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
console.log(
  `\ncheck: ${map.length} pages in keyword map, ${files.length} content files, ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
