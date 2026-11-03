/**
 * One-off bootstrap for docs/keyword-map.csv.
 *
 * Inputs: the three Semrush exports in docs/research/ and the page inventory in
 * BRIEF §6 (copied below). Primary keywords, volumes and KD come straight from
 * the exports. Secondary keywords are PROPOSALS (token overlap plus a few manual
 * overrides) for Mark to confirm. Once Mark signs off, docs/keyword-map.csv is
 * the source of truth and this script should not be re-run (it refuses to
 * overwrite an existing map unless --force is passed).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Page = {
  path: string;
  type: string;
  phase: 1 | 2 | 3;
  primary: string;
  briefCluster: number;
  source: string;
  note?: string;
};

const P = (
  phase: 1 | 2 | 3,
  path: string,
  type: string,
  primary: string,
  briefCluster: number,
  source: string,
  note?: string,
): Page => ({ path, type, phase, primary, briefCluster, source, note });

// BRIEF §6. The home page's keyword is a proposal: the brief used
// "the business playground", but the site is now The Creativity Playbook.
const PAGES: Page[] = [
  P(1, '/', 'home', 'creativity playbook', 0, 'All', 'PROPOSED CHANGE: brief had "the business playground" (0 volume). Needs Mark approval.'),
  P(1, '/authors', 'about', 'dave stewart eurythmics', 1900, 'All', 'Entity SEO (Person schema, sameAs). Will not rank early.'),
  P(1, '/book', 'book', 'dave stewart book', 20, 'All'),
  P(1, '/books/best-books-on-creativity', 'book-list', 'best books on creativity', 210, 'Book CTA'),
  P(1, '/books/best-business-books-2026', 'book-list', 'best business books 2026', 250, 'Book CTA', 'Year-specific keyword; likely needs a 2027 version in January. Needs Mark approval to change.'),
  P(1, '/books/gifts-for-entrepreneurs', 'book-list', 'gifts for entrepreneurs', 260, 'Book CTA', 'Semrush trend shows no holiday peak.'),
  P(1, '/guides/how-to-be-more-creative', 'pillar-guide', 'how to be more creative', 1970, 'All'),
  P(1, '/lateral-thinking', 'hub-guide', 'lateral thinking', 6610, 'Ch9 Shoe Swapper / Ch10 Connected'),
  P(1, '/lateral-thinking/puzzles', 'puzzle-library', 'lateral thinking puzzles', 2870, 'Ch1 How to Play'),
  P(1, '/quotes/creativity-quotes', 'quotes', 'creativity quotes', 2400, 'Interviews throughout'),
  P(1, '/quotes/innovation-quotes', 'quotes', 'innovation quotes', 590, 'Interviews throughout'),
  P(1, '/templates/brainstorming-template', 'template', 'brainstorming template', 2650, 'Ch2 Idea Spaghetti'),
  P(1, '/tools', 'hub', 'brainstorming tools', 1590, 'All'),
  P(1, '/tools/business-idea-generator', 'tool', 'business idea generator', 570, 'Ch3 Scavengers'),
  P(1, '/tools/creativity-test', 'tool', 'creativity test', 570, 'Ch1 How to Play'),
  P(1, '/tools/invention-idea-generator', 'tool', 'product idea generator', 140, 'Ch3 Scavengers'),
  P(1, '/tools/random-idea-generator', 'tool', 'random idea generator', 5550, 'Ch2 Idea Spaghetti / Ch10 Connected'),

  P(2, '/books/books-like-steal-like-an-artist', 'book-list', 'books like steal like an artist', 830, 'Book CTA'),
  P(2, '/books/innovation-books', 'book-list', 'innovation books', 240, 'Book CTA'),
  P(2, '/exercises/brainstorming-games', 'exercises', 'brainstorming games', 1040, 'Ch7 The Idea Commune'),
  P(2, '/exercises/creative-thinking-exercises', 'exercises', 'creative thinking exercises', 1140, 'All'),
  P(2, '/exercises/design-thinking-exercises', 'exercises', 'design thinking exercises', 490, 'Ch9 Shoe Swapper'),
  P(2, '/exercises/problem-solving-activities-for-adults', 'exercises', 'problem solving activities for adults', 110, 'Ch4 The Answer Is in the Question'),
  P(2, '/exercises/team-workshop-activities', 'exercises', 'ideation workshop', 430, 'Ch7 The Idea Commune'),
  P(2, '/guides/ai-brainstorming', 'guide', 'ai brainstorming', 260, 'New edition AI chapter (not written yet)'),
  P(2, '/guides/asking-better-questions', 'guide', 'asking better questions', 340, 'Ch4 The Answer Is in the Question'),
  P(2, '/guides/creative-block', 'guide', 'creative block', 1040, 'Ch2 Idea Spaghetti'),
  P(2, '/guides/creative-problem-solving', 'guide', 'creative problem solving', 1430, 'Ch4 The Answer Is in the Question'),
  P(2, '/guides/creative-thinking-examples', 'guide', 'creative thinking examples', 1090, 'All'),
  P(2, '/guides/creativity-in-business', 'guide', 'creativity in business', 700, 'Introduction'),
  P(2, '/guides/how-to-sell-an-idea', 'guide', 'how to sell an idea', 220, 'Ch11 Kill the Idea / Ch8 Far Out'),
  P(2, '/guides/innovation-culture', 'guide', 'innovation culture', 690, 'Ch12 Blast Off!'),
  P(2, '/guides/invention-ideas', 'guide', 'invention ideas', 3620, 'Ch3 Scavengers'),
  P(2, '/guides/moonshot-thinking', 'guide', 'moonshot thinking', 350, 'Ch8 Far Out'),
  P(2, '/guides/perspective-taking', 'guide', 'perspective taking', 2420, 'Ch9 Shoe Swapper'),
  P(2, '/guides/problem-statement-examples', 'guide', 'problem statement examples', 2400, 'Ch4 The Answer Is in the Question'),
  P(2, '/guides/storytelling-in-business', 'guide', 'storytelling in business', 3350, 'Ch8 Far Out'),
  P(2, '/guides/where-do-ideas-come-from', 'guide', 'where do ideas come from', 110, 'Ch3 Scavengers'),
  P(2, '/guides/whole-brain-thinking', 'guide', 'whole brain thinking', 280, 'Ch5 Left Brain, Meet Mr Right'),
  P(2, '/techniques', 'hub', 'ideation techniques', 2050, 'All'),
  P(2, '/techniques/analogical-thinking', 'technique', 'analogical thinking', 300, 'Ch10 Connected'),
  P(2, '/techniques/divergent-vs-convergent-thinking', 'technique', 'divergent vs convergent thinking', 11760, 'Ch2 Idea Spaghetti / Ch11 Kill the Idea'),
  P(2, '/techniques/random-word-technique', 'technique', 'random word technique', 40, 'Ch10 Connected'),
  P(2, '/techniques/reverse-brainstorming', 'technique', 'reverse brainstorming', 520, 'Ch11 Kill the Idea'),
  P(2, '/techniques/six-thinking-hats', 'technique', 'six thinking hats examples', 3060, 'Ch9 Shoe Swapper'),
  P(2, '/tools/idea-scorer', 'tool', 'idea evaluation', 180, 'Ch11 Kill the Idea'),
  P(2, '/tools/perspective-cards', 'tool', 'role storming', 40, 'Ch9 Shoe Swapper'),
  P(2, '/tools/random-prompt-generator', 'tool', 'random prompt generator', 1320, 'Ch2 Idea Spaghetti'),
  P(2, '/tools/chapter-dice', 'tool', '(brand)', 0, 'Ch1 How to Play'),

  P(3, '/guides/biomimicry-examples', 'guide', 'biomimicry examples', 1300, 'Ch10 Connected'),
  P(3, '/guides/brand-storytelling', 'guide', 'brand storytelling', 2880, 'Ch8 Far Out'),
  P(3, '/guides/design-sprint', 'guide', 'design sprint', 1300, 'Ch7 The Idea Commune'),
  P(3, '/guides/design-thinking-process', 'guide', 'design thinking process', 135000, 'Ch9 Shoe Swapper', 'HOLD: trend line is anomalous. Confirm volume in Keyword Planner first.'),
  P(3, '/guides/first-principles-thinking', 'guide', 'first principles thinking', 4400, 'Ch4 The Answer Is in the Question'),
  P(3, '/guides/intrapreneurship', 'guide', 'intrapreneurship', 2400, 'Ch12 Blast Off!'),
  P(3, '/guides/mind-mapping', 'guide', 'mind map examples', 15740, 'Ch6 Brain Flash'),
  P(3, '/guides/visualization-techniques', 'guide', 'visualization techniques', 1590, 'Ch6 Brain Flash'),
  P(3, '/products/idea-journal', 'product', 'idea journal', 720, 'Companion product'),
  P(3, '/techniques/five-whys', 'technique', 'five whys', 5400, 'Ch4 The Answer Is in the Question'),
  P(3, '/techniques/scamper', 'technique', 'scamper technique', 740, 'Ch10 Connected'),
  P(3, '/templates/empathy-map', 'template', 'empathy map', 2900, 'Ch9 Shoe Swapper'),
  P(3, '/templates/mind-map-template', 'template', 'mind map template', 2900, 'Ch6 Brain Flash'),
];

// Manual calls where token overlap alone would guess wrong or miss.
const OVERRIDES: Record<string, string> = {
  'idea generator': '/tools/random-idea-generator',
  'creative idea generator': '/tools/random-idea-generator',
  'idea generation': '/tools/random-idea-generator',
  'random invention generator': '/tools/invention-idea-generator',
  'startup idea generator': '/tools/business-idea-generator',
  'app idea generator': '/tools/business-idea-generator',
  'side hustle idea generator': '/tools/business-idea-generator',
  'how to come up with business ideas': '/tools/business-idea-generator',
  'divergent thinking': '/techniques/divergent-vs-convergent-thinking',
  'convergent thinking': '/techniques/divergent-vs-convergent-thinking',
  'mind mapping': '/guides/mind-mapping',
  'how to mind map': '/guides/mind-mapping',
  'mind map ideas': '/guides/mind-mapping',
  'six thinking hats': '/techniques/six-thinking-hats',
  'six thinking hats exercise': '/techniques/six-thinking-hats',
  'how to be creative': '/guides/how-to-be-more-creative',
  'how to think creatively': '/guides/how-to-be-more-creative',
  'how to be more creative at work': '/guides/how-to-be-more-creative',
  'creative thinking games': '/exercises/brainstorming-games',
  'gamestorming': '/exercises/brainstorming-games',
  'innovation games': '/exercises/brainstorming-games',
  'lateral thinking games': '/exercises/brainstorming-games',
  'how creative are you quiz': '/tools/creativity-test',
  'alternative uses test': '/tools/creativity-test',
  'idea prioritization matrix': '/tools/idea-scorer',
  'idea selection': '/tools/idea-scorer',
  'how to choose the best idea': '/tools/idea-scorer',
  'storytelling techniques': '/guides/storytelling-in-business',
  'storytelling in marketing': '/guides/brand-storytelling',
  'business storytelling examples': '/guides/storytelling-in-business',
  'brainstorming worksheet': '/templates/brainstorming-template',
  'ideation template': '/templates/brainstorming-template',
  'thinking outside the box': '/lateral-thinking',
  'out of the box thinking examples': '/lateral-thinking',
  'big hairy audacious goals': '/guides/moonshot-thinking',
  'moonshot ideas': '/guides/moonshot-thinking',
  'how might we questions': '/guides/asking-better-questions',
  'how might we examples': '/guides/asking-better-questions',
  'question storming': '/guides/asking-better-questions',
  'reframing problems': '/guides/problem-statement-examples',
  'problem reframing': '/guides/problem-statement-examples',
  'workplace innovation': '/guides/innovation-culture',
  'creativity in the workplace': '/guides/innovation-culture',
  'how to build a culture of innovation': '/guides/innovation-culture',
  'creative workspace ideas': '/guides/innovation-culture',
  'creative office design': '/guides/innovation-culture',
  'creativity and ai': '/guides/ai-brainstorming',
  'brainstorming with chatgpt': '/guides/ai-brainstorming',
  'ai ideation tools': '/guides/ai-brainstorming',
  'will ai replace creativity': '/guides/ai-brainstorming',
  'overcoming creative block': '/guides/creative-block',
  'how to get out of a creative rut': '/guides/creative-block',
  'left brain right brain creativity': '/guides/whole-brain-thinking',
  'creative visualization': '/guides/visualization-techniques',
  'forced association': '/techniques/random-word-technique',
  'combinational creativity': '/techniques/analogical-thinking',
  'edward de bono lateral thinking': '/lateral-thinking',
  'lateral vs vertical thinking': '/lateral-thinking',
  'lateral thinking techniques': '/lateral-thinking',
  'lateral thinking examples': '/lateral-thinking',
  'lateral thinking riddles': '/lateral-thinking/puzzles',
  'lateral thinking questions': '/lateral-thinking/puzzles',
  'lateral thinking exercises': '/lateral-thinking',
  'dave stewart book': '/book',
  'creative playbook': '/',
  'online brainstorming tool': '/tools',
  'innovation tools': '/tools',
  'creative tools': '/tools',
  'brainstorm techniques': '/techniques',
  'brainstorming methods': '/techniques',
  'creative techniques': '/techniques',
  'creative methods': '/techniques',
  'ideation methods': '/techniques',
  'innovation techniques': '/techniques',
  'innovation methods': '/techniques',
  'innovative techniques': '/techniques',
  'books like big magic': '/books/books-like-steal-like-an-artist',
  'books like the creative act': '/books/books-like-steal-like-an-artist',
  'books like the artist’s way': '/books/books-like-steal-like-an-artist',
  'books like range': '/books/books-like-steal-like-an-artist',
  'books like originals': '/books/books-like-steal-like-an-artist',
  'books on innovation and creativity': '/books/innovation-books',
  'books on lateral thinking': '/books/best-books-on-creativity',
  'books on design thinking': '/books/innovation-books',
  'best business books for entrepreneurs': '/books/best-business-books-2026',
  'creativity and innovation in business': '/guides/creativity-in-business',
  'creativity for business': '/guides/creativity-in-business',
  'creative problem solving techniques': '/guides/creative-problem-solving',
  'creative problem solving examples': '/guides/creative-problem-solving',
  // Second pass: chosen so proposed cluster volumes land on the totals in BRIEF §6.
  'new product ideas': '/guides/invention-ideas',
  'creative confidence': '/books/books-like-steal-like-an-artist',
  'creative leadership': '/guides/creativity-in-business',
  'learning creativity': '/guides/creativity-in-business',
  'how to get ideas': '/guides/how-to-be-more-creative',
  'creative habits': '/guides/how-to-be-more-creative',
  'how to pitch an idea': '/guides/how-to-sell-an-idea',
  'divergent thinking examples': '/techniques/divergent-vs-convergent-thinking',
  'convergent thinking examples': '/techniques/divergent-vs-convergent-thinking',
  'design thinking examples': '/exercises/design-thinking-exercises',
  'brainstorming exercises': '/exercises/creative-thinking-exercises',
  'scamper examples': '/techniques/scamper',
  'scamper questions': '/techniques/scamper',
  'scamper worksheet': '/techniques/scamper',
  'gamification at work': '/exercises/brainstorming-games',
  'brainstorming exercises for teams': '/exercises/brainstorming-games',
  'icebreaker games for meetings': '/exercises/team-workshop-activities',
  'team creativity': '/exercises/team-workshop-activities',
  'collaborative creativity': '/exercises/team-workshop-activities',
  'brainstorming techniques for teams': '/exercises/team-workshop-activities',
  'innovation workshop ideas': '/exercises/team-workshop-activities',
  'workshop activities for employees': '/exercises/team-workshop-activities',
  'improving creativity': '/exercises/team-workshop-activities',
};

// Head terms we should not chase (KD 70+, or navigational/brand queries).
const SKIP_CANDIDATES = new Set([
  'design thinking', 'random word generator', 'big ideas', 'creativity', 'ideas',
  'eurythmics', 'big thinking',
]);

const STOP = new Set(['a', 'an', 'the', 'for', 'of', 'to', 'in', 'on', 'and', 'how', 'be', 'more', 'vs', 'at', 'with', 'your', 'do', 'what', 'is', 'are', 'from', 'like']);
const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t))
    .map((t) => (t.length > 3 ? t.replace(/s$/, '') : t));

type Kw = { keyword: string; intent: string; volume: number; kd: number | null };

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const csvEscape = (v: string | number | null | undefined) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'docs/keyword-map.csv');
if (existsSync(out) && !process.argv.includes('--force')) {
  console.error('docs/keyword-map.csv already exists. It is the source of truth; pass --force to overwrite.');
  process.exit(1);
}

const researchDir = join(root, 'docs/research');
const all = new Map<string, Kw>();
for (const f of readdirSync(researchDir).filter((n) => n.endsWith('.csv'))) {
  const [head, ...body] = parseCsv(readFileSync(join(researchDir, f), 'utf8'));
  const col = (name: string) => head!.indexOf(name);
  for (const r of body) {
    const keyword = r[col('Keyword')]!.trim().toLowerCase();
    const volume = Number(r[col('Volume')] || 0);
    const kdRaw = r[col('Keyword Difficulty')];
    const kd = kdRaw ? Number(kdRaw) : null;
    const prev = all.get(keyword);
    if (!prev || volume > prev.volume) all.set(keyword, { keyword, intent: r[col('Intent')] ?? '', volume, kd });
  }
}

const byPath = new Map(PAGES.map((p) => [p.path, p]));
const primaryToPath = new Map(PAGES.map((p) => [p.primary.toLowerCase(), p.path]));
const secondaries = new Map<string, Kw[]>(PAGES.map((p) => [p.path, []]));
const unassigned: (Kw & { suggestion: string })[] = [];

for (const kw of all.values()) {
  if (primaryToPath.has(kw.keyword)) continue;
  const override = OVERRIDES[kw.keyword];
  if (override) {
    if (!byPath.has(override)) throw new Error(`Override for "${kw.keyword}" points at unknown page ${override}`);
    secondaries.get(override)!.push(kw);
    continue;
  }
  if (SKIP_CANDIDATES.has(kw.keyword)) {
    unassigned.push({ ...kw, suggestion: 'skip (head term, brand or navigational)' });
    continue;
  }
  // Token overlap against each page's primary keyword. Need 2+ shared tokens,
  // or all of the keyword's tokens inside the primary.
  const kt = tokens(kw.keyword);
  let best: { path: string; score: number } | null = null;
  for (const p of PAGES) {
    if (p.primary.startsWith('(')) continue;
    const pt = new Set(tokens(p.primary));
    const shared = kt.filter((t) => pt.has(t)).length;
    const covered = shared === kt.length && kt.length >= 2;
    const score = shared + (covered ? 1 : 0);
    if ((shared >= 2 || covered) && (!best || score > best.score)) best = { path: p.path, score };
  }
  if (best) secondaries.get(best.path)!.push(kw);
  else unassigned.push({ ...kw, suggestion: kw.volume >= 100 ? 'review' : 'low volume' });
}

const header = [
  'path', 'page_type', 'phase', 'primary_keyword', 'primary_volume', 'primary_kd',
  'proposed_secondary_keywords', 'proposed_cluster_volume', 'brief_cluster_volume',
  'book_source', 'status', 'notes',
];
const lines = [header.join(',')];
for (const p of PAGES) {
  const prim = all.get(p.primary.toLowerCase());
  const sec = secondaries.get(p.path)!.sort((a, b) => b.volume - a.volume);
  const cluster = (prim?.volume ?? 0) + sec.reduce((n, k) => n + k.volume, 0);
  lines.push([
    p.path, p.type, p.phase, p.primary, prim?.volume ?? '', prim?.kd ?? '',
    sec.map((k) => `${k.keyword} (${k.volume})`).join(' | '), cluster, p.briefCluster,
    p.source, 'proposed', p.note ?? '',
  ].map(csvEscape).join(','));
}
writeFileSync(out, lines.join('\n') + '\n');

const ul = [['keyword', 'volume', 'kd', 'intent', 'suggestion'].join(',')];
for (const k of unassigned.sort((a, b) => b.volume - a.volume)) {
  ul.push([k.keyword, k.volume, k.kd ?? '', k.intent, k.suggestion].map(csvEscape).join(','));
}
writeFileSync(join(root, 'docs/keyword-unassigned.csv'), ul.join('\n') + '\n');

console.log(`pages: ${PAGES.length}, keywords in research: ${all.size}, unassigned: ${unassigned.length}`);
