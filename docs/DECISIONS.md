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
