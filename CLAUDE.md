# The Creativity Playbook site

- Read docs/BRIEF.md before any task. docs/keyword-map.csv is the source of truth for page <-> keyword.
- The site is named **The Creativity Playbook**. *The Business Playground* (2010) is only the earlier edition's title. The book launches in 2027 and is not on Amazon yet, so `src/data/book.json` stays `prelaunch` (waitlist CTAs only, no buy links, no `Book` offers).
- Never publish: new or edited content is `status: review`. Mark sets `published` and `reviewedBy`.
- Never invent quotes, stats or Dave Stewart anecdotes. Quotes need a source. Dave's first-person stories only from `source/` (gitignored: the 2010 PDF and the 2025 V2 comp).
- Cite chapters, not page numbers, in `bookSources` (the new edition's layout is not final).
- Dylan lyrics and the Rolling Stones logo are cleared, used only in the book's original context (BRIEF §2.1, `src/data/rights.json`). The authors own the Bird Design blob characters, the Sy-Jenq Cheng board-game artwork and the author photos (confirmed by Mark, 2026-11-02), so they may be used once the source files are supplied. Never use the HBR "Weird Rules" excerpt or the SENZ image, and never copy the 2010 interior layout (not owned). The same colors and fonts are fine.
- Perspective-style content uses roles and archetypes only, never living people.
- Work in batches of 3-5 pages and stop for review.
- Before saying a task is done: `npm run check && npm run typecheck && npm run build && npm run check -- --dist`.
- US English for site copy. Banned phrases live in `src/lib/banned-phrases.ts`.
- YAML frontmatter: quote any value that contains a colon.
- Do not put this repo in a folder whose path contains a colon: npm cannot find local binaries there.
