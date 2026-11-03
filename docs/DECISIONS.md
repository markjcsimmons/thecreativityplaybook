# Decisions log

Choices made with Mark that differ from, or add to, docs/BRIEF.md. Newest last.

## 2026-11-02

- **Name.** The site is **The Creativity Playbook**. *The Business Playground* (2010) is only the earlier edition's title. The brief's home-page keyword `the business playground` is replaced (proposed) by `creativity playbook`.
- **Book status.** The revised edition, *The Creativity Playbook: A Practical Guide to Ideas and Innovation*, launches in 2027 and is not on Amazon. The site runs in `prelaunch` mode. Used copies of the 2010 edition exist on Amazon; the site does not link to them.
- **New content.** The new edition adds an AI chapter (not written yet). `/guides/ai-brainstorming` waits for it. Chapter 13 has a placeholder color.
- **Deadline.** The Thanksgiving 2026 deadline for the two book-list pages is no longer a hard date.
- **Keyword data.** Semrush exports are in docs/research/. The keyword map is proposed until Mark confirms it.
- **Rights.** The authors own the Bird Design blob characters, the Sy-Jenq Cheng board-game artwork and all photos Mark referred to. They do not own the 2010 interior layout and design; the same colors and fonts may be used. The HBR "Weird Rules" excerpt and the SENZ umbrella photo stay blocked. Source files for the owned artwork are still needed. See src/data/rights.json.
- **Hosting folder.** The repo lives at ~/Desktop/creativity-playbook, because npm scripts break in paths containing a colon.

## 2026-11-02 (later)

- **Artwork received.** Mark supplied the Bird Design character sheets (PDF) and 13 game boards (`.ai`, vector). Originals are kept, gitignored, in `source/artwork/`.
- **Characters.** The 13 characters, two pink thumbs-up variants and the lightning bolt were split into SVGs in `public/art/characters/` (`scripts/split-characters.py`). Ids in `src/data/characters.json` are descriptive working labels, not official names. The stand-in blob component was removed.
- **Art palette adopted (2026-11-02, Mark said yes).** Chapters 1 (and intro), 2, 3, 4, 8 and 9 use the artwork's exact `#fff426`, `#f25937`, `#a6d93d`, `#00adef`, `#f1471d`, `#66cef5`. Chapters 5 and 11 use the artwork's magenta `#ec008c` and red `#ed114e` lightened by 5% and 9% (`#ed0d92`, `#ef265e`) because the exact values give only 4.45:1 and 4.31:1 with near-black text, below the 4.5:1 AA bar. The artwork's `#ec0b62` is within a hair of `#ed114e`, so it has no chapter of its own. Chapters 6, 7, 10, 12 and 13 (purple, mint, orchid, amber, teal) have no counterpart in the artwork and keep their original colors. Lowest ink contrast is now 4.56:1 (chapter 5).
- **Shoe Swapper board.** It labels real, named people (some living). The web version uses roles and archetypes only, so the labels need replacing.
- **Fonts in the art.** The boards use American Typewriter (licensed). Text on the site is rebuilt in our own fonts.
- **Styleguide approved (2026-11-02, Mark).** Phase 0 is closed. Next is Phase 1 Batch 1, pending Mark's go-ahead on its plan.
- **Home keyword confirmed (2026-11-02, Mark).** `creativity playbook` is the primary keyword for `/`. The rest of the map is still `proposed`.
- **Generator words come from the book (2026-11-02, Mark).** `src/data/idea-words.json` holds only words found in the 2010 text or the V2 comp, so the lists are about 240 items in total, not the brief's 300 per list. `npm run check` flags any word it cannot find in `source/`. Add more only with Mark's say-so.
- **Phase 1 Batch 1 scope.** Built: `/tools/random-idea-generator/` (Connect, Twist, Spaghetti) and the `/tools/` hub, both `status: review`. Left out on purpose: Chapter Dice (the keyword map puts it in Phase 2) and the legal pages (they need Mark's decisions on the email service, analytics, contact address and jurisdiction).
- **Soft prompt wording.** After 5 rolls the tool says "Enjoying this? Get the launch-day alert for the book." The brief's wording promised to email the user's list, which nothing does yet.
- **Spaghetti target.** The 50-idea target is ours. The book says to set a high benchmark but gives no number.
- **Domain (2026-11-02, Mark).** The site URL will be `https://thecreativityplaybook.com`. It is the default `SITE_URL` in `astro.config.mjs` and the sitemap line in `public/robots.txt`. Mark said not to use `hello@creativityplaybook.com` (from the old site) as the contact address; the contact address is still undecided.
- **Old site reviewed (2026-11-02).** github.com/markjcsimmons/creativityplaybook is an Eleventy site from June 2025. Kept: its Introduction text (adds the A.I. passages, not in the V2 comp), Dave's bio (needs Dave's approval) and the hero line, all copied into the gitignored `source/new-edition/`, plus three original art files in `source/artwork/old-site/`. Left behind: the site itself, its palette and its placeholder pages. The old repo is public and its Vercel deployment serves `assets/raw/` (print PDFs of the 2010 book, the V2 comp, InDesign files, Helvetica Neue fonts); Mark was told to make it private and take the deployment down.
- **Quotes (2026-11-02).** `src/data/quotes.json` has five quotes from the new Introduction, each checked word for word against the text. The old site's version of the "cranking the amp" line was shortened and is not used. The source is a June 2025 draft, so recheck against the final text before publishing.

