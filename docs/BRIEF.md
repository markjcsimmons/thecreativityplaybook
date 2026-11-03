# The Business Playground — Website Build Brief

**For:** Claude Code
**Owner:** Mark Simmons (co-author). All content decisions and publishing approvals go through Mark.
**Companion files:** `docs/keyword-map.csv` (every researched keyword → assigned page), `source/` (the book PDF and extracted text)

---

## 0. How to use this brief

1. Read the whole brief before writing any code.
2. Work **one phase at a time** (§15). At the start of each phase, propose a plan, then wait for Mark to approve it.
3. Treat `docs/keyword-map.csv` as the source of truth for which page targets which keyword. Never create a page that isn't in the map, and never change a page's primary keyword, without asking first.
4. When something in this brief conflicts with what you find (a library has changed, a keyword looks wrong, a search result shows different intent), stop and flag it. Don't silently pick an answer.
5. Never publish content. You draft it with `status: review`, and Mark sets `published`.

---

## 1. Project summary

*The Business Playground: Where Creativity and Commerce Collide* is a book by **Dave Stewart** (co-founder of Eurythmics) and **Mark Simmons** (author of *Punk Marketing*), with a foreword by **Sir Richard Branson**. Pearson / New Riders first published it in 2010. The rights have reverted to the authors, who plan to republish it on Amazon KDP as a refreshed new edition.

We are building a website for the book that:

1. **Earns organic search traffic** from people looking for creativity techniques, idea-generation tools, exercises, templates and puzzles. The research found about 43k US searches a month that are realistically winnable.
2. **Turns that traffic into an email list.** That list is the main asset, because it drives launch-week sales and future sales.
3. **Sells the book.** Before launch the site collects waitlist sign-ups. After launch it shows buy buttons linking to Amazon.
4. **Builds credibility for the authors** for press, podcasts, keynotes and corporate bulk orders.

The strategy rests on one idea: **interactive tools and genuinely useful technique pages, each drawing on the book's own stories and exercises.** The site is not a blog of generic creativity articles. AI search summaries and big publishers already own that territory. Our edge is tools people actually use, and content only this book can provide.

### What the book contains (reference)

There are 12 chapters, which can be read in any order. The book suggests rolling dice to choose the next one.

| # | Chapter | Core idea | Website hooks |
|---|---|---|---|
| Intro | Why business needs creativity | Creativity is a competitive edge | creativity in business |
| 1 | How to Play | Unleash natural creative potential; play | creativity test, chapter dice, puzzles |
| 2 | Idea Spaghetti | Lots of ideas increases the chance of great ones | random idea generator, brainstorming template, creative block |
| 3 | Scavengers | Always hunting for things to innovate | business/invention idea generators, invention ideas |
| 4 | The Answer Is in the Question | Better questions → better answers | problem statements, asking better questions, creative problem solving |
| 5 | Left Brain, Meet Mr Right | Getting both "halves" to work together | whole brain thinking (**treat left/right brain as a metaphor; the strict split is a myth**) |
| 6 | Brain Flash | Visualisation for creative solutions | visualization, mind mapping |
| 7 | The Idea Commune | Creating ideas with others | brainstorming games, workshop activities |
| 8 | Far Out | Think BIG; the power of a good story | moonshot thinking, storytelling in business, selling an idea |
| 9 | Shoe Swapper | Seeing problems from other perspectives | perspective taking, perspective cards, six thinking hats, lateral thinking |
| 10 | Connected | Combining unconnected things to make something new | analogical thinking, random word technique, SCAMPER, lateral thinking |
| 11 | Kill the Idea | Choosing which ideas get time and money | idea scorer, reverse brainstorming, convergent thinking |
| 12 | Blast Off! | Environments that launch creativity | innovation culture, workplace creativity |

**People interviewed in the book:** Paul Allen, Mick Jagger, Freddie DeMann, Christian Audigier, Matthew Warchus, Tim Brown (IDEO), Evan Williams (Twitter), Tero Ojanperä (Nokia), Danny Socolof, Ethan Imboden, Jill Dumain (Patagonia), Philip Hess, Kyle MacDonald (the "one red paperclip" trade).

**The book is 16 years old.** Examples such as Nokia, early Twitter and Second Life must be either presented as history ("back in 2009, …") or paired with a current equivalent. Never present 2010 facts as current.

---

## 2. Hard constraints (non-negotiable)

### 2.1 Rights and third-party material
**Cleared for use (confirmed by Mark):**
- Bob Dylan's "Forever Young" lyrics, used as in the book
- The Rolling Stones tongue-and-lips logo, used as in the book

Rules for these two:
- Use each one only in the context the book used it, e.g. the Stones logo as part of the Mick Jagger / branding story.
- Don't use the logo as decoration, in navigation, or in anything that suggests the Stones endorse the site or book.
- Store each asset with a `rights` note in `/src/data/rights.json`, recording who granted it and its scope.
- If you're unsure whether a planned use fits, ask Mark.

Pearson cleared the following for its 2010 edition only, so **never** reproduce or show any of them:
- The excerpt from Harvard Business Review's "The Weird Rules of Creativity"
- The SENZ umbrella photo

Other assets are **on hold until Mark confirms ownership**. Use original placeholders until then:
- The illustrated blob characters (Bird Design)
- The board-game artwork (Sy-Jenq Cheng)
- The author photographs (Kori Bundi)
- The book's interior layout and design (Design Deluxe)

Short quotes from the book's own text and its interviews are fine, with attribution. Keep each excerpt to a few sentences. Don't post whole sections of the book.

### 2.2 Honesty
- **Never invent quotes.** Every quote needs a `source` field: either a book page reference or a verified URL. The build must fail on any quote missing a source (§10.6).
- **Never put words in Dave Stewart's mouth.** First-person "Dave" anecdotes may only come from the book text. New writing is attributed to "The Business Playground" or to Mark. Dave's byline appears only on content he has approved.
- No made-up statistics, studies or case studies. Every statistic needs a linked source.
- Book-list pages must say clearly that we wrote *The Business Playground*. Affiliate links need a visible affiliate disclosure.
- Lateral thinking puzzles must be original, or traditional puzzles retold entirely in our own words. Don't copy from puzzle books or sites.
- The creativity test must say it's for fun and self-reflection and is not a validated psychological assessment.

### 2.3 Quality bar (Google's helpful-content standard)
- Every page needs **Book DNA**: at least one thing only this site can offer. That means a story, example or exercise from the book; a quote from the interviews; or an interactive tool. Record it in frontmatter (`bookSources`).
- No mass-produced pages. Build content in small batches that Mark reviews (§15).
- Banned filler phrases: "in today's fast-paced world", "unlock your potential", "delve", "game-changer", "whether you're a … or a …", "look no further", "in conclusion", "the power of". Write short paragraphs and use concrete examples.

---

## 3. Success metrics

| Metric | 6 months | 12 months |
|---|---|---|
| Organic sessions / month | 1,000+ | 3,000–6,000 |
| Email subscribers | 500 | 2,500+ |
| Keywords ranking in the top 10 (from the map) | 15 | 45+ |
| Tool uses / month | 500 | 3,000+ |
| Outbound clicks to Amazon (after launch) | n/a | tracked; aim for 3–5% of sessions |
| Lighthouse (mobile) on every template | ≥ 95 performance, 100 for SEO and accessibility | same |

---

## 4. Tech stack

Before installing anything, check that the current stable version of each library exists. Pin exact versions.

- **Framework:** Astro (latest stable) with static output. Only the tools ship JavaScript, as islands.
- **Language:** TypeScript in strict mode.
- **Content:** Astro content collections, MDX, and **zod schemas** for every collection.
- **Interactive islands:** Preact, chosen for its small bundle size.
- **Styling:** Tailwind CSS (latest), with design tokens in CSS custom properties.
- **OG images:** generated at build time per page, e.g. with satori via an Astro integration.
- **Site search (optional, Phase 2):** Pagefind.
- **Hosting:** Vercel (changed from Cloudflare Pages by Mark, 2026-11-03), deployed from GitHub, with a preview deployment for every branch. A Vercel Function handles email sign-up so ESP keys stay server-side.
- **Email service (ESP):** to be decided by Mark (§16). Put it behind a small `src/lib/email.ts` adapter so the provider can change. Use double opt-in. Tag every sign-up with its source, e.g. `tool:random-idea-generator`.
- **PDF templates:** write each template as an HTML page and render it to PDF with a Playwright script in `/scripts`. Commit the PDFs to `public/downloads/`.
- **Analytics:** GA4 with Consent Mode, or Plausible (§12, decision in §16). Google Search Console verification goes through DNS.
- **No CMS** in v1. Content is MDX in git.
- **No AI API calls** in v1. Tools are deterministic and client-side. An optional AI feature is scoped in Phase 3.

---

## 5. Repository structure

```
/docs
  BRIEF.md                 ← this file
  keyword-map.csv          ← keyword → page assignment (source of truth)
/source                    ← book PDF + extracted text (gitignored if repo is ever public)
/scripts
  check-content.ts         ← build-time content + SEO checks (§10.6)
  render-pdfs.ts           ← HTML → PDF templates
/src
  /components              ← BookCallout, EmailCapture, BuyButtons, ToolShell, QuoteCard, Breadcrumbs, RelatedLinks, PuzzleCard…
  /islands                 ← Preact tools (one folder per tool)
  /content
    /guides /techniques /exercises /books /quotes /puzzles /templates /tools
  /data                    ← curated JSON for generators, personas, prompts, quotes, puzzles, book metadata
  /layouts                 ← Base, Article, Tool, BookList, Hub, Quote, Puzzle
  /lib                     ← seo.ts (meta + JSON-LD), prng.ts, email.ts, analytics.ts, amazon.ts
  /pages
/public
  /downloads               ← generated PDFs
  /images
```

---

## 6. Page inventory

There are 62 pages in three phases. Volumes are US monthly searches from Semrush; KD is keyword difficulty. The "Cluster vol/mo" column is the total for the primary keyword plus all its secondary keywords. See `docs/keyword-map.csv` for the full list of keywords per page and the 10 keywords we deliberately skip.

### Phase 1

| Page | Type | Primary keyword | KD | Cluster vol/mo | Book source |
|---|---|---|---|---|---|
| `/` | home | the business playground |  | 0 | All |
| `/authors` | about | dave stewart eurythmics | 54 | 1,900 | All |
| `/book` | book | dave stewart book |  | 20 | All |
| `/books/best-books-on-creativity` | book-list | best books on creativity | 21 | 210 | Book CTA |
| `/books/best-business-books-2026` | book-list | best business books 2026 | 18 | 250 | Book CTA |
| `/books/gifts-for-entrepreneurs` | book-list | gifts for entrepreneurs | 15 | 260 | Book CTA |
| `/guides/how-to-be-more-creative` | pillar-guide | how to be more creative | 35 | 1,970 | All |
| `/lateral-thinking` | hub-guide | lateral thinking | 29 | 6,610 | Ch9 Shoe Swapper / Ch10 Connected |
| `/lateral-thinking/puzzles` | puzzle-library | lateral thinking puzzles | 29 | 2,870 | Ch1 How to Play |
| `/quotes/creativity-quotes` | quotes | creativity quotes | 22 | 2,400 | Interviews throughout |
| `/quotes/innovation-quotes` | quotes | innovation quotes | 13 | 590 | Interviews throughout |
| `/templates/brainstorming-template` | template | brainstorming template | 35 | 2,650 | Ch2 Idea Spaghetti |
| `/tools` | hub | brainstorming tools | 52 | 1,590 | All |
| `/tools/business-idea-generator` | tool | business idea generator | 31 | 570 | Ch3 Scavengers |
| `/tools/creativity-test` | tool | creativity test | 38 | 570 | Ch1 How to Play |
| `/tools/invention-idea-generator` | tool | product idea generator | 18 | 140 | Ch3 Scavengers |
| `/tools/random-idea-generator` | tool | random idea generator | 20 | 5,550 | Ch2 Idea Spaghetti / Ch10 Connected |

### Phase 2

| Page | Type | Primary keyword | KD | Cluster vol/mo | Book source |
|---|---|---|---|---|---|
| `/books/books-like-steal-like-an-artist` | book-list | books like steal like an artist | 28 | 830 | Book CTA |
| `/books/innovation-books` | book-list | innovation books | 18 | 240 | Book CTA |
| `/exercises/brainstorming-games` | exercises | brainstorming games | 31 | 1,040 | Ch7 The Idea Commune |
| `/exercises/creative-thinking-exercises` | exercises | creative thinking exercises | 36 | 1,140 | All |
| `/exercises/design-thinking-exercises` | exercises | design thinking exercises | 11 | 490 | Ch9 Shoe Swapper |
| `/exercises/problem-solving-activities-for-adults` | exercises | problem solving activities for adults | 13 | 110 | Ch4 The Answer Is in the Question |
| `/exercises/team-workshop-activities` | exercises | ideation workshop | 20 | 430 | Ch7 The Idea Commune |
| `/guides/ai-brainstorming` | guide | ai brainstorming | 42 | 260 | New edition chapter |
| `/guides/asking-better-questions` | guide | asking better questions | 23 | 340 | Ch4 The Answer Is in the Question |
| `/guides/creative-block` | guide | creative block | 24 | 1,040 | Ch2 Idea Spaghetti |
| `/guides/creative-problem-solving` | guide | creative problem solving | 36 | 1,430 | Ch4 The Answer Is in the Question |
| `/guides/creative-thinking-examples` | guide | creative thinking examples | 28 | 1,090 | All |
| `/guides/creativity-in-business` | guide | creativity in business | 35 | 700 | Introduction |
| `/guides/how-to-sell-an-idea` | guide | how to sell an idea | 21 | 220 | Ch11 Kill the Idea / Ch8 Far Out |
| `/guides/innovation-culture` | guide | innovation culture | 30 | 690 | Ch12 Blast Off! |
| `/guides/invention-ideas` | guide | invention ideas | 29 | 3,620 | Ch3 Scavengers |
| `/guides/moonshot-thinking` | guide | moonshot thinking | 22 | 350 | Ch8 Far Out |
| `/guides/perspective-taking` | guide | perspective taking | 23 | 2,420 | Ch9 Shoe Swapper |
| `/guides/problem-statement-examples` | guide | problem statement examples | 35 | 2,400 | Ch4 The Answer Is in the Question |
| `/guides/storytelling-in-business` | guide | storytelling in business | 25 | 3,350 | Ch8 Far Out |
| `/guides/where-do-ideas-come-from` | guide | where do ideas come from | 32 | 110 | Ch3 Scavengers |
| `/guides/whole-brain-thinking` | guide | whole brain thinking | 9 | 280 | Ch5 Left Brain, Meet Mr Right |
| `/techniques` | hub | ideation techniques | 31 | 2,050 | All |
| `/techniques/analogical-thinking` | technique | analogical thinking | 33 | 300 | Ch10 Connected |
| `/techniques/divergent-vs-convergent-thinking` | technique | divergent vs convergent thinking | 28 | 11,760 | Ch2 Idea Spaghetti / Ch11 Kill the Idea |
| `/techniques/random-word-technique` | technique | random word technique | 5 | 40 | Ch10 Connected |
| `/techniques/reverse-brainstorming` | technique | reverse brainstorming | 25 | 520 | Ch11 Kill the Idea |
| `/techniques/six-thinking-hats` | technique | six thinking hats examples | 22 | 3,060 | Ch9 Shoe Swapper |
| `/tools/idea-scorer` | tool | idea evaluation | 26 | 180 | Ch11 Kill the Idea |
| `/tools/perspective-cards` | tool | role storming | 7 | 40 | Ch9 Shoe Swapper |
| `/tools/random-prompt-generator` | tool | random prompt generator | 30 | 1,320 | Ch2 Idea Spaghetti |
| `/tools/chapter-dice` | tool | (brand) |  | 0 | Ch1 How to Play |

### Phase 3

| Page | Type | Primary keyword | KD | Cluster vol/mo | Book source |
|---|---|---|---|---|---|
| `/guides/biomimicry-examples` | guide | biomimicry examples | 46 | 1,300 | Ch10 Connected |
| `/guides/brand-storytelling` | guide | brand storytelling | 53 | 2,880 | Ch8 Far Out |
| `/guides/design-sprint` | guide | design sprint | 59 | 1,300 | Ch7 The Idea Commune |
| `/guides/design-thinking-process` | guide | design thinking process | 15 | 135,000 | Ch9 Shoe Swapper |
| `/guides/first-principles-thinking` | guide | first principles thinking | 52 | 4,400 | Ch4 The Answer Is in the Question |
| `/guides/intrapreneurship` | guide | intrapreneurship | 48 | 2,400 | Ch12 Blast Off! |
| `/guides/mind-mapping` | guide | mind map examples | 42 | 15,740 | Ch6 Brain Flash |
| `/guides/visualization-techniques` | guide | visualization techniques | 56 | 1,590 | Ch6 Brain Flash |
| `/products/idea-journal` | product | idea journal | 26 | 720 | Companion product |
| `/techniques/five-whys` | technique | five whys | 50 | 5,400 | Ch4 The Answer Is in the Question |
| `/techniques/scamper` | technique | scamper technique | 46 | 740 | Ch10 Connected |
| `/templates/empathy-map` | template | empathy map | 55 | 2,900 | Ch9 Shoe Swapper |
| `/templates/mind-map-template` | template | mind map template | 57 | 2,900 | Ch6 Brain Flash |

**Notes on the inventory**
- `/guides/design-thinking-process` shows 135,000 searches at KD 15 in Semrush, but the trend line is an obvious anomaly. **Don't prioritise it** until Mark confirms the volume in Google Keyword Planner.
- `/authors` targets "dave stewart eurythmics" (KD 54) mainly for entity SEO: Person schema and `sameAs` links. It won't rank for that term early on.
- Tool modes such as startup, app or side-hustle ideas are **query-parameter modes on one page**, not separate pages. Each mode variant sets its canonical URL back to the base page.

---

## 7. Page templates

Each page type has one layout. Every page also gets:
- breadcrumbs
- one H1 containing the primary keyword
- an intro of two sentences or fewer that gives the answer first
- a `BookCallout` component
- `RelatedLinks` (§10.4)
- an email capture block
- an "Updated" date

| Type | Structure | Length guide |
|---|---|---|
| **tool** | Tool sits above the fold → "How to use it" (3 steps) → technique explainer drawn from the book chapter → worked example → FAQs (3–5, written as plain content) → BookCallout → related tools/guides | 500–900 words of supporting copy, **rendered in the HTML** so the page ranks even without JS |
| **hub / hub-guide** | Definition → why it matters → card grid of every spoke page → short sections summarising each → BookCallout | 1,200–2,000 |
| **pillar-guide** | Answer-first intro → numbered method with exercises from the book → stories and interview quotes → tool embeds → checklist | 2,000–3,000 |
| **guide / technique** | Definition → when to use it → step-by-step → 2–3 worked examples (at least one from the book) → common mistakes → related technique/tool | 1,200–2,000 |
| **exercises** | Quick-pick table (name, time, group size, materials) → each exercise as a card with steps → printable PDF version | 1,500–2,500 |
| **puzzle-library** | Short "what is lateral thinking" intro → 30+ puzzles at launch, growing to 100. Each has the setup, progressive hints and an answer hidden behind a reveal, plus "the thinking move" linking to a technique page. Add a daily-puzzle box. | n/a |
| **quotes** | Grouped by theme. Quotes from the book's interviews and authors come first (unique content). Then well-known quotes, each verified. Each quote is a shareable card with an OG image and copy button. | 60–100 quotes |
| **template** | Preview image → what's inside → download buttons (ungated PDF and printable page) → how to run a session with it → link to the matching tool | 600–1,000 |
| **book-list** | Disclosure → our book first, labelled as ours → 10–20 real books with an accurate author, a one-line reason and an affiliate link → buying notes | 1,500–2,500 |
| **book** | Cover, hook, what's inside (chapter grid), foreword excerpt, endorsements (from the book's cover pages, with attribution), authors, buy/waitlist, FAQ, `Book` schema | n/a |
| **authors** | Bios for Dave and Mark, credentials, the "What they say about…" endorsements, links out (`sameAs`) | n/a |

---

## 8. Interactive tools (detailed specs)

### 8.0 Rules for every tool
- Tools are Preact islands inside a `ToolShell` layout. Everything is client-side, with no login.
- **Use a seeded random number generator** (`prng.ts`, e.g. mulberry32). The URL holds the seed and any locked items (`?s=abc123&lock=0`), so every result is shareable and reproducible.
- **Each tool needs a no-JS fallback:** server-rendered example output, so the page has real content without JavaScript.
- Users can lock any slot and re-roll the rest. Results can be copied, exported (text or CSV) and printed.
- Wrap all `localStorage` use in try/catch. It holds favourites and history only, and the tool must work fully without it.
- **Accessibility:** works fully by keyboard, announces new results through `aria-live`, and respects reduced-motion settings.
- **Analytics events** (§12): `tool_generate`, `tool_lock`, `tool_share`, `tool_export`, `tool_save`.
- After 5 or more generations, show a soft prompt: "Save your ideas — we'll email you the list." Never block the tool behind a sign-up.
- Generator vocabularies live in `/src/data/*.json`. You draft them, Mark reviews them, and each list has 300 or more items. Data quality decides whether the tool is fun, so write vivid, concrete items, not abstract nouns.

### 8.1 Random Idea Generator — `/tools/random-idea-generator` (Phase 1)
- **Connect mode** (from the Connected chapter): Thing A × Thing B ("A **library** crossed with a **food truck**"), plus a prompt: "What would this be? Who would pay for it?"
- **Twist mode:** Object + constraint ("a **chair** … that costs nothing to make").
- **Spaghetti mode** (from Idea Spaghetti): a 5-minute timer and a counter aiming for 50 ideas. The tool deals prompts quickly, and the user types ideas into a running list, which can be exported.
- Item categories: everyday objects, places, industries, audiences, technologies, materials, verbs, constraints, eras.

### 8.2 Business Idea Generator — `/tools/business-idea-generator` (Phase 1)
- Formula: **Audience × Problem × Mechanism × Business model**, giving a one-line pitch: "A *subscription service* that helps *new dog owners* stop *chewed furniture* using *AI video coaching*."
- Filters: budget (shoestring / funded), online / offline / hybrid, solo / team.
- Mode presets via URL: `?mode=startup | app | side-hustle`.
- A "Scavenger prompt" panel suggests an everyday frustration to look into, drawing on the Scavengers chapter.
- Each pitch has an "Evaluate this idea" link that sends it to the Idea Scorer.

### 8.3 Invention Idea Generator — `/tools/invention-idea-generator` (Phase 1)
- Formula: **Everyday object × SCAMPER verb × User** ("**Combine** an umbrella with something else, for **cyclists**").
- Each verb links to the SCAMPER page once that page exists.
- Book DNA: the inventions of Dave's stepfather Julien, from the Introduction/Ch1.

### 8.4 Creativity Test — `/tools/creativity-test` (Phase 1, flagship)
- **Part A, Alternative Uses Test:** 3 rounds (e.g. brick, paperclip, shoe), each 2 minutes with a visible timer. The user types as many uses as they can.
  - Fluency is the number of valid answers.
  - Flexibility is the number of distinct categories. Use a curated keyword-to-category dictionary in `/src/data/aut-categories.json`.
  - Originality comes from rarity: answers that aren't on a curated "common answers" list score higher.
  - Elaboration comes from the level of detail in each answer.
- **Part B, Creative Style:** 10 quick self-report questions. They map to one of 6 styles drawn from the chapters, e.g. *Scavenger*, *Connector*, *Shoe Swapper*, *Far-Out Dreamer*, *Idea Chef* (Spaghetti), *Ruthless Editor* (Kill the Idea). Each style recommends a chapter and a tool.
- **Results page:** scores with plain-English meaning, the user's style, and a shareable result card (OG image generated per style, not per user). An optional email gate offers the "full report" PDF. The basic results are always shown free.
- **Privacy:** answers are processed in the browser and are not stored on a server.
- Show the disclaimer from §2.2.

### 8.5 Random Prompt Generator — `/tools/random-prompt-generator` (Phase 2)
- Before building, look at the current top results to confirm what "random prompt" searchers want (writing, art or AI prompts). Report back to Mark first. Expected categories: writing, drawing, business challenges, "AI prompt starters".

### 8.6 Perspective Cards — `/tools/perspective-cards` (Phase 2)
- A deck of about 60 personas and lenses, e.g. "a 7-year-old", "a Formula 1 pit crew", "your harshest competitor", "someone in 2075", "a touring rock band's road crew". Use roles and archetypes only, never real living people.
- The user types a challenge, flips a card and answers "How would they solve it?" Optional 2-minute timer, and a "hats" mode that nods to Six Thinking Hats.

### 8.7 Idea Scorer — `/tools/idea-scorer` (Phase 2)
- The user enters ideas (or imports them from other tools through the URL) and weights the criteria: impact, effort, cost, speed, fun, fit.
- Output: a ranked table and a 2×2 impact/effort chart (SVG). Export as CSV or print.
- Book DNA: the Kill the Idea chapter.

### 8.8 Chapter Dice — `/tools/chapter-dice` (Phase 2)
- Roll two animated dice to pick a chapter and get a 10-minute exercise from it. This recreates the book's "roll the dice to pick a chapter" device and is a brand toy and link magnet. Respect reduced-motion settings.

### 8.9 Phase 3 (optional): "Expand with AI"
- A Vercel Function calls an LLM API to turn a generated idea into a short concept. It needs server-side keys, per-IP rate limiting, a daily budget cap, moderation and a clear label. Build it only if Mark approves.

---

## 9. Content production

### 9.1 Workflow for each page
1. **Brief:** read the page's keyword row(s), note the search intent, and check the current top results if you have web access. Record the format that ranks (list vs guide vs tool) in the frontmatter `serpNotes`.
2. **Source:** find the relevant passages in `/source` and record them in `bookSources` (chapter, page, note).
3. **Draft** to the template in §7 with `status: review`.
4. **Self-check:**
   - `npm run check` passes.
   - The primary keyword is in the title, H1, first 100 words and URL.
   - The Book DNA is present.
   - There is no banned phrasing.
   - Every fact is sourced.
5. **Mark reviews** and sets `status: published` and `reviewedBy`.

Drafts are excluded from production builds, and included only when `PREVIEW=true`.

### 9.2 Frontmatter schema (zod)
```ts
{
  title: string            // ≤ 60 chars, includes primary keyword
  description: string      // 140–155 chars
  primaryKeyword: string   // must exist in keyword-map.csv for this slug
  secondaryKeywords: string[]
  pageType: 'tool'|'hub'|'pillar-guide'|'guide'|'technique'|'exercises'|'puzzle-library'|'quotes'|'template'|'book-list'|'book'|'about'
  phase: 1|2|3
  bookChapter: string
  bookSources: { chapter: string; page?: number; note: string }[]   // min 1 (except book-list/quotes, which use quote sources)
  serpNotes?: string
  status: 'draft'|'review'|'published'
  reviewedBy?: string
  author: 'team'|'mark'|'dave'|'dave-and-mark'  // 'dave*' only if Dave approved
  updated: date
  ogImage?: string
}
```

### 9.3 Voice
- Write like the book: playful, irreverent, rock-and-roll, practical. Use short sentences and include an anecdote or exercise in every section.
- Use "We" for the authors.
- Spelling: **US English** for site copy, because the keyword targets are US. Quotes keep their original British spelling.
- Make it scannable: descriptive H2s, numbered steps, and a quick-pick table where it helps. Avoid walls of bullets.
- Every guide ends with something to *do*: an exercise, a tool or a template.

### 9.4 Quotes and puzzles data
- `/src/data/quotes.json` fields: `{ text, author, role, source: { type: 'book'|'url', ref }, theme[], fromBook: boolean }`.
- `/src/data/puzzles.json` fields: `{ id, title, setup, hints[], answer, thinkingMove, techniqueSlug, difficulty, original: true }`.

---

## 10. Technical SEO

### 10.1 Basics
- Consistent trailing-slash policy.
- Canonical URL on every page. Tool parameter variants canonicalise to the base page.
- XML sitemap that excludes drafts, plus `robots.txt` and a custom 404 page.
- Clean, lowercase, hyphenated URLs exactly as listed in §6.
- `<title>` of 60 characters or fewer, meta description of 155 or fewer, one H1, and a logical heading order.
- Images go through `astro:assets` as AVIF/WebP with width and height set, descriptive alt text, and lazy-loading below the fold.

### 10.2 Structured data (JSON-LD, generated in `seo.ts`)
- `WebSite` and `Organization` site-wide.
- `Book` on `/book`: name, authors, `isbn` (once known), `bookFormat`, `workExample` for each edition, and `offers` once live.
- `Person` for Dave Stewart and Mark Simmons, with `sameAs` links (Wikipedia, official sites).
- `Article` on guides and techniques, with the author `Person`/`Organization` and `dateModified`.
- `WebApplication` on tools: `applicationCategory`, `isAccessibleForFree: true`, `offers` price 0.
- `ItemList` on book lists, puzzle libraries and hubs. `BreadcrumbList` everywhere.
- **Don't** use `HowTo` (deprecated). `FAQPage` markup is fine, but don't expect rich results from it.
- Validate with the Rich Results Test during the acceptance step of each phase.

### 10.3 Performance
- Targets: LCP under 2.0s, CLS under 0.05 and INP under 200ms on mobile.
- No JavaScript on content pages except tiny islands (reveal buttons, email form).
- Self-host fonts with `font-display: swap`, and subset them.

### 10.4 Internal linking
- Every spoke page links to its hub, 2–4 sibling pages, at least one tool, and `/book`.
- Every hub links to all of its spokes.
- Tools link to the technique page they're built on, and the reverse.
- Generate `RelatedLinks` from a hand-maintained `src/data/links.json` graph, not by guessing.
- Use descriptive anchor text that includes the target's primary keyword. Avoid "click here".

### 10.5 Cannibalisation
- Each primary keyword maps to exactly one page. Secondary keywords appear naturally on their assigned page and nowhere else as a heading.

### 10.6 `npm run check` (runs in CI and fails the build on any of these)
- A primary keyword is missing from `keyword-map.csv`, or is used by two pages.
- A page's title or H1 doesn't contain its primary keyword (allow close variants, configurable).
- A quote has no `source`.
- A non-exempt page has empty `bookSources`.
- Any banned phrase appears (§2.3).
- A meta title or description is too long.
- Internal links are broken.
- A page has `author: dave*` without `reviewedBy`.
- A `published` page has no `reviewedBy`.

---

## 11. Conversion

- **Book status flag:** `BOOK_STATUS = 'prelaunch' | 'live'` in `src/data/book.json`.
  - `prelaunch`: CTAs say *"Get Chapter 2 free + launch-day alert"* and lead to email capture.
  - `live`: `BuyButtons` show Kindle and Paperback, with Amazon links localised by country (US/UK/CA/AU via `amazon.ts`), optional Bookshop.org, and Amazon Attribution tags if available.
- **BookCallout component:** "This technique is from **Chapter 9: Shoe Swapper**." Shows the chapter colour, a one-line takeaway, the cover and a CTA. It appears on every content page, ideally after the first major section.
- **Lead magnets:**
  1. Free Chapter 2 PDF, after Mark confirms it contains no licensed material.
  2. The brainstorming template bundle. The individual templates stay ungated so they can rank.
  3. The Creativity Test full report.
- **Email capture placement:**
  - inline after the first major section
  - at the end of every article
  - the soft prompt in tools after 5 or more generations
  - optionally one slide-in after 60% scroll (dismissable, remembered)

  **No entry pop-ups, ever.** Never interrupt a tool.
- **Speaking and bulk orders:** a small "Bring the Business Playground to your team" block on the authors, culture, workshop and creativity-in-business pages, linking to a contact form.

---

## 12. Analytics

GA4 events, or the equivalent custom events in Plausible:

| Event | Params |
|---|---|
| `tool_generate`, `tool_lock`, `tool_share`, `tool_export`, `tool_save` | `tool` |
| `test_complete` | `style`, `fluency_band` |
| `email_signup` | `source` (page or tool), `magnet` |
| `template_download` | `template`, `format` |
| `outbound_buy` | `retailer`, `format`, `country` |
| `puzzle_reveal` | `puzzle_id`, `hint_or_answer` |

Also:
- Use consent mode or a banner for EU/UK visitors if GA4 is chosen.
- Verify Search Console and submit the sitemap at launch.
- Build a simple Looker Studio or Plausible dashboard covering sessions by page type, sign-ups by source, and buy clicks.

---

## 13. Design direction

Take the direction from the book's own look, but make an original version of it for the web:
- **Colour:** each chapter has a saturated flat colour (book references include sunshine yellow, cyan, tangerine, hot pink and lime). Use that colour as the chapter's accent on its pages. Use black text on yellow for contrast. Check WCAG AA for every pair.
- **Type:**
  - Headlines in a bold condensed uppercase display face (the book uses a heavy condensed grotesque).
  - Subheads in a chunky slab or typewriter face (the book's chapter strap lines use one).
  - Body in a clean, highly readable sans.
  - Choose from Google Fonts and self-host.
- **Motifs:** oversized quotation marks, dice, game-board paths, playful blob characters. Draw **original** blob SVGs until the rights to the book's characters are confirmed (§2.1).
- **Tone:** a playground, not a corporate SaaS site. The tools should feel like toys: snappy micro-interactions, big buttons, satisfying "deal" animations (respecting reduced motion).
- Mobile-first, a 16px side gutter, and no horizontal scroll.
- Before building pages, deliver a one-page style tile (`/styleguide`) for Mark to approve.

---

## 14. Accessibility and legal pages
- Meet WCAG 2.2 AA. Every interactive control must have a label.
- Required pages: Privacy policy, Cookie policy (if GA4), Affiliate disclosure, Terms, Contact.
- Don't collect anything beyond an email address and first name (optional).

---

## 15. Phases and acceptance criteria

### Phase 0: Foundations
Repo, stack, design tokens and `/styleguide`, layouts, core components, `seo.ts` with JSON-LD, `check-content.ts`, analytics wrapper, email adapter with a stub, Vercel preview deploy.
**Done when:** Mark approves the styleguide, CI runs `check` + build + Lighthouse CI, and the preview URL works.

### Phase 1: Launch set (16 pages + `/tools` hub)
Order of work:
1. `/books/gifts-for-entrepreneurs` and `/books/best-business-books-2026`. **These are time-sensitive. Ship them before Thanksgiving / Black Friday (26–27 Nov 2026) if at all possible.**
2. `/book`, `/authors`, `/`.
3. Random Idea Generator → Business Idea Generator → Creativity Test → Invention Idea Generator, plus `/tools`.
4. `/lateral-thinking` and `/lateral-thinking/puzzles` (30+ puzzles).
5. Both quotes pages, the brainstorming template, `/books/best-books-on-creativity`, and the `/guides/how-to-be-more-creative` pillar.

Build in batches of 3–5 pages, and wait for Mark's review between batches.
**Done when:**
- All pages are published and reviewed.
- `check` passes.
- Lighthouse thresholds are met.
- Schema is valid.
- The sitemap is submitted.
- Email sign-up works end to end with double opt-in.
- Analytics events are verified in DebugView or the equivalent.

### Phase 2: Expansion (32 pages)
Techniques hub and spokes, exercises, guides, the remaining tools, the AI brainstorming guide (tied to the new edition), and the other book lists. Same batch-and-review rhythm. Add Pagefind search.

### Phase 3: Authority (13 pages + extras)
- Higher-difficulty terms: mind mapping, first principles, five whys, empathy map, SCAMPER, design sprint, brand storytelling.
- The idea journal product page (a companion KDP journal).
- The optional "Expand with AI" feature.
- Link-building assets, such as an embeddable puzzle widget and a "Creativity Test results by profession" data post, once real aggregate data exists and only if users consent.
- Time this phase with the new edition's launch.

---

## 16. Open decisions (ask Mark; don't assume)
1. Domain name.
2. Dave Stewart's sign-off on the site, its voice, and the use of his name, photos and byline.
3. Which ESP (e.g. Kit, MailerLite, Beehiiv), and the lead-magnet offer.
4. GA4 or Plausible.
5. Rights to the illustrated characters, board-game art and author photos.
6. New edition title, subtitle, ISBNs, price and launch date (these feed `book.json` and `Book` schema).
7. The Amazon Associates account and tag (for book lists), and access to Amazon Attribution.
8. Whether to verify the "design thinking process" volume before Phase 3.

---

## 17. Suggested `CLAUDE.md` for the repo

```md
# The Business Playground site
- Read docs/BRIEF.md before any task. keyword-map.csv is the source of truth for page ↔ keyword.
- Never publish: new/edited content is status: review. Mark sets published.
- Never invent quotes, stats, or Dave Stewart anecdotes. Quotes need a source. Dave's first-person stories only from /source.
- Dylan lyrics + Rolling Stones logo are cleared — use only in the book's original context, never as decoration or implied endorsement (see BRIEF §2.1).
- Never use: Being There / HBR excerpts, SENZ image, or the book's original characters/art (until cleared).
- Work in batches of 3–5 pages; stop for review.
- Run `npm run check && npm run build` before saying a task is done.
- US English for site copy. Banned phrases list is in scripts/check-content.ts.
```
