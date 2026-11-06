# The Creativity Playbook

Website for *The Creativity Playbook* by Dave Stewart and Mark Simmons (the revised edition of *The Business Playground*, launching 2027). Build brief: [docs/BRIEF.md](docs/BRIEF.md).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:4321 |
| `PREVIEW=true npm run build` | Build including `draft` and `review` pages (marked noindex) |
| `npm run build` | Production build: `published` pages only |
| `npm run check` | Content and SEO checks (BRIEF §10.6). `-- --dist` also checks built HTML for broken links |
| `npm run typecheck` | `astro check` |
| `npm run lhci` | Lighthouse CI (mobile) against `dist/` |

Requires Node 22.23.4 or later.

## Where things live

- `docs/keyword-map.csv`: page to keyword map. Currently **proposed**: primary keywords and volumes come from the Semrush exports in `docs/research/`, secondary assignments are proposals. `docs/keyword-unassigned.csv` lists keywords that match no page.
- `src/content/<collection>/`: MDX pages. `path` in frontmatter is the URL and must match the map. Schema: `src/lib/schemas.ts`.
- `src/data/`: `book.json` (prelaunch/live switch), `chapters.json`, `links.json` (internal link graph), `people.json`, `rights.json`. `quotes.json` and `puzzles.json` arrive with their pages.
- `src/layouts/`, `src/components/`: Base, Article, Tool, BookList and the shared components. `/styleguide/` shows them (noindex).
- `src/islands/`: Preact tools. `DiceDemo` is a smoke test, replaced by Chapter Dice later.
- `api/subscribe.ts`: Vercel Function for email sign-up. `src/lib/email.ts` is a stub until an ESP is chosen.
- `source/`: book PDFs and extracted text. Gitignored.

## Phase 0 status

Styleguide approved 2026-11-02.

Done and verified locally: scaffold, pinned stack, content schemas, keyword map draft, tokens, fonts, `/styleguide`, layouts, components, `seo.ts`, analytics wrapper, email adapter stub, `check-content`, CI workflow, Lighthouse (styleguide: LCP 1.7 s, CLS 0.005).

Waiting on Mark:
- Domain, ESP, analytics (Vercel Web Analytics is wired; enable it in the Vercel dashboard), Amazon Associates tag, Dave's sign-off.
- Confirm or edit `docs/keyword-map.csv` (the home page keyword is a proposed change from the brief).
- Import the GitHub repo into Vercel (see docs/DECISIONS.md for the settings and env vars).
- Privacy, cookie, affiliate, terms and contact pages (BRIEF §14) still need writing and review.

## Phase 1 status

Batch 1 (published 2026-11-03): `/tools/random-idea-generator/` and `/tools/`. The home page and `/privacy/` are published too.

Batch 2 (published 2026-11-05): `/tools/business-idea-generator/`, `/tools/invention-idea-generator/` and `/tools/creativity-test/`.

Batch 3 (published 2026-11-05): `/lateral-thinking/` and `/lateral-thinking/puzzles/`.

Batch 4 (`status: review`, visible only with `PREVIEW=true`): `/guides/how-to-be-more-creative/`.

To add a tool island: put it in `src/islands/<Name>/`, import it in `src/components/ToolIsland.astro`, and set `island: <Name>` in the page frontmatter. A generator with locked slots can reuse `src/islands/shared/SlotTool.tsx` (see `BusinessGenerator`).

## Version notes

Stack versions are newer than the brief assumed: Astro 7, Preact 11, Tailwind 4, zod 4. TypeScript is pinned to 6.0.3 because `@astrojs/check` does not support TypeScript 7 yet.
