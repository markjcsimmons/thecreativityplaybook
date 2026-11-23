# The Creativity Playbook: Chapter 1 (designed ebook PDF, internal draft)

Built 2026-11-22 from the V2 comp. Internal review only. Not for publication. Running heads read THE CREATIVITY PLAYBOOK on left pages and the chapter name on right pages.

## Files
- `The-Creativity-Playbook-Chapter-1.pdf`: the designed ebook PDF with the 30 round-1 edits and the 9 round-2 edits applied. 25 pages (copyright and credits, 23 chapter pages including the new Try-it, AI, Premortem and Notes pages), 6.75 x 8.25 in like the V2 comp. Live text, fonts embedded, tagged for accessibility, alt text on images, bookmarks for each section, page numbers that match the book's (credits page is "i"). Open it with the PDF's bookmarks panel on.
- `chapter1-design-sample-preview.png`: all 25 pages on one sheet.
- `chapter1-sample.epub`: Chapter 1 as a styled reflowable EPUB (about 0.8 MB). Well-formed XML. Not run through epubcheck and not tested on a real device.
- `manuscript/front-matter.md`: copyright page, credits and Preface with 2027 dates, and a list of every date changed.
- `manuscript/chapter-01.md`: clean Chapter 1 text. **Bold** = text the design sets as a pull quote.
- `build/`: scripts. To rebuild: `python3 content_edit.py`, `python3 build_epub.py` (then zip the `epub` folder with `mimetype` first), `python3 pages_v2.py`, `node render.cjs`, then `finish_pdf.py` from the `design-sample` folder (needs the pypdf package). `content.py` holds the edited text (see `editing/chapter-01/chapter-01-applied.md`; round 2 is in `editing/chapter-01/chapter-01-round2-brief.md`), `pages_v2.py` (with `pages.py` and `pages_more.py` for the unchanged pages) builds the PDF layout, `build_epub.py` builds the manuscript and EPUB. `build/chrome/` holds the vector backgrounds taken from the V2 comp.
- `assets/`: originals used. `opener-unsharpened.jpg` is the opener before sharpening.

## Decisions applied (2026-11-22)
- "told Business Playground" is now "told us".
- Jagger "recent interview" is now "exclusive interview" (the authors' own interview). Pasche "recent interview" is now "interview" (it came from a published source, Creative Review).
- Edition line is "New Edition, 2027". Dates are in `manuscript/front-matter.md`.
- Layout cleared. Helen E. Buckley credited.

## How the PDF was made
Backgrounds, labels and characters are vector art lifted from the V2 comp pages with all text removed. The text is HTML placed over them, then rendered with Chrome. Edits to the text flow through, but each page's text boxes are fixed, so longer text needs the frame sizes adjusted by hand.

## Approximations
- Fonts are macOS system fonts: Helvetica Neue, Helvetica Neue Condensed Black, American Typewriter Bold and Arial Narrow. The 2010 book used Swiss 721, so line breaks differ slightly from the V2 comp.
- The board page (p.16) is the V2 art as is, text included.
- Big pale quote marks on sidebar pages were not carried over.
- "The Little Boy" title letters are recolored by hand.

## Photo sharpness
The chapter-opener photos in the 2010 files (3054 x 4000) are soft: they contain far less fine detail than their pixel size suggests, so they were probably enlarged from smaller originals. I applied light sharpening to the Chapter 1 opener. For a sharp result, especially in print, ask Kori Bundi or the designer for the original camera files.

## Print version (planned, not started)
Mark wants a print edition: Claude builds it and a designer tweaks it. Trim size and other sizing are not confirmed, so do not start. Until then the digital build keeps these in mind:
- Keep the text in one source (`content.py`) and art as vector, so a new trim size means re-fitting frames, not redrawing.
- Use full-resolution originals for images (300 ppi or better at print size).
- Keep copy edits in the manuscript, not in the design files.

## Flags
1. **Helen E. Buckley, "The Little Boy".** Credited on the story and on the copyright and credits page. A credit line is not permission. No copyright line for the rights holder has been added.
2. **Stones logo.** Cleared for the book; whether that covers ebooks is brief section 16, item 12.
3. **Fonts.** Check licensing before any distribution that embeds them.
4. **Dated in Chapter 1** (no edits made): "recent TED conference"; Evan Williams as "CEO of Twitter"; the Google footnote; "Second Life"; Mayor Villaraigosa; "PDA day" and "smart phone"; the 2008 and 2005 sources; the left/right hemisphere passages (FTD, "bully") against the brief's note that the split is a metaphor.
5. **Spelling.** The text is British (realised, colour, organisation). Decide US or UK for the Amazon US edition.
6. **Repetition.** Warchus now reads "told us about his experience at school ... he told us."

## Round 2 (applied 2026-11-22)
Nine more Chapter 1 edits (C1-37 to C1-45): an AI paragraph and a Human First exercise on a new page, a Hendrix fix, a rewrite of the dementia passage, the late-bloomers claim, two wording fixes in Dave's SLY-FI sidebar, "smartphone" in the board rules, and a Moon and Sixpence trim. The PDF has a yellow **review note for Dave** on the headphones page (p.17 of the book), which is a placeholder and must be replaced or removed before any distribution. The same placeholder is in the manuscript and EPUB as a bracketed "[DAVE: ...]" line.
