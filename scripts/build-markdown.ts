/**
 * Writes a markdown twin of every public page, plus /llms.txt and /llms-full.txt, after `astro build`.
 *
 *   dist/tools/creativity-test/index.html  ->  dist/tools/creativity-test/index.md
 *
 * The markdown is converted from the finished HTML, so it always matches what visitors see, including
 * anything a component renders. Pages marked noindex (the styleguide, the 404 page) are skipped, and
 * draft pages never reach dist/ in the first place. `npm run check -- --dist` fails if a public page has no twin.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import book from '../src/data/book.json';

const root = process.cwd();
const dist = join(root, 'dist');
const SITE = (process.env.SITE_URL ?? 'https://thecreativityplaybook.com').replace(/\/$/, '');

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === '_astro' ? [] : pageFiles(p);
    return name === 'index.html' ? [p] : [];
  });
}

/** Internal page links point at the markdown twin, so an agent that follows them stays in markdown. */
function toMarkdownLink(href: string, pageUrl: string): string {
  if (/^(mailto:|tel:|https?:\/\/(?!thecreativityplaybook\.com))/.test(href)) return href;
  const u = new URL(href, pageUrl);
  if (u.origin !== SITE || !u.pathname.endsWith('/')) return u.href;
  return `${SITE}${u.pathname}index.md${u.hash}`;
}

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-', emDelimiter: '*', hr: '---' });
td.use(gfm);
td.addRule('summary', { filter: 'summary', replacement: () => '' });
// Collapsed sections (puzzle hints and answers) are written out in full, because an agent cannot click.
td.addRule('details', {
  filter: 'details',
  replacement: (content, node) => {
    const summary = (node as unknown as { querySelector(s: string): { textContent: string | null } | null }).querySelector('summary')?.textContent?.trim();
    return `\n\n${summary ? `**${summary}**\n\n` : ''}${content.trim()}\n\n`;
  },
});

const REMOVE = [
  'script', 'style', 'noscript', 'form', 'button', 'input', 'select', 'textarea', 'label', 'progress', 'svg', 'img', 'picture', 'iframe',
  '[hidden]', '[aria-hidden="true"]', '.no-print', '.visually-hidden', '.skip-link',
  'section[aria-labelledby="daily-h"]', // puzzle of the day repeats a puzzle from the list below it
];

type Page = { path: string; url: string; mdUrl: string; title: string; description: string; updated: string; body: string; file: string };

const pages: Page[] = [];
for (const file of pageFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const doc = parse(html);
  if (/<meta[^>]+name="robots"[^>]+noindex/.test(html)) continue;
  const main = doc.querySelector('main#main');
  if (!main) continue;

  const rel = file.slice(dist.length, -'index.html'.length); // "/tools/creativity-test/"
  const url = `${SITE}${rel}`;
  const title = doc.querySelector('title')?.text.trim() ?? rel;
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  const updated = main.querySelector('time')?.getAttribute('datetime') ?? '';

  for (const sel of REMOVE) main.querySelectorAll(sel).forEach((el) => el.remove());
  main.querySelectorAll('nav').forEach((el) => /breadcrumb/i.test(el.getAttribute('aria-label') ?? '') && el.remove());
  main.querySelectorAll('p').forEach((p) => p.querySelector('time') && p.remove()); // "Updated ..." line, now in the front matter
  // Lists the page already numbers in its own text (the worked-example steps, the puzzle list) become bullet lists.
  main.querySelectorAll('ol').forEach((ol) => /list-none/.test(ol.getAttribute('class') ?? '') && ol.tagName !== 'UL' && (ol.tagName = 'ul'));
  // Slot cards ("Thing A" over "microphone") would otherwise run together as "Thing Amicrophone".
  main.querySelectorAll('li').forEach((li) => {
    const label = li.querySelector(':scope > .eyebrow');
    const value = label?.nextElementSibling;
    if (label && value && value.tagName === 'SPAN') li.set_content(`<strong>${label.text.trim()}:</strong> ${value.text.trim()}`);
  });
  main.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', toMarkdownLink(a.getAttribute('href')!, url)));

  // Interactive tools: say so, and keep the starting example the server rendered.
  main.querySelectorAll('section[aria-label]').forEach((s) => {
    const head = s.querySelector('.eyebrow');
    if (head && s.querySelector('.fill') && /overflow-hidden/.test(s.getAttribute('class') ?? '') && s.querySelector('.fill')?.parentNode === s) {
      s.querySelector('.fill')!.replaceWith(parse(`<p><strong>Interactive: ${s.getAttribute('aria-label')}.</strong> This runs in the browser, so this markdown shows its starting example, not the working tool. Open ${url} to use it.</p>`));
    }
  });

  const body = td
    .turndown(main.innerHTML)
    .replace(/[ \t]+$/gm, '')
    .replace(/^(\s*(?:[-*]|\d+\.))[ \t]{2,}/gm, '$1 ')
    .replace(/(\d+)\\\./g, '$1.')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  pages.push({ path: rel, url, mdUrl: `${url}index.md`, title, description, updated, body, file });
}

const q = (s: string) => JSON.stringify(s);
for (const p of pages) {
  const front = ['---', `title: ${q(p.title)}`, `url: ${q(p.url)}`, `description: ${q(p.description)}`, ...(p.updated ? [`updated: ${p.updated}`] : []), '---'].join('\n');
  writeFileSync(p.file.replace(/index\.html$/, 'index.md'), `${front}\n\n${p.body}\n`);
}

// ---- llms.txt: the index agents read first, and llms-full.txt: everything in one file -------------
const home = pages.find((p) => p.path === '/');
const SECTIONS: [string, (p: Page) => boolean][] = [
  ['Start here', (p) => p.path === '/'],
  ['Guides and templates', (p) => /^\/(guides|templates)\//.test(p.path)],
  ['Tools', (p) => p.path.startsWith('/tools/')],
  ['Games', (p) => p.path.startsWith('/games/')],
  ['Lateral thinking', (p) => p.path.startsWith('/lateral-thinking/')],
];
const claimed = new Set<Page>();
const sections = SECTIONS.map(([name, test]) => {
  const list = pages.filter((p) => !claimed.has(p) && test(p)).sort((a, b) => a.path.localeCompare(b.path));
  list.forEach((p) => claimed.add(p));
  return [name, list] as const;
});
const rest = pages.filter((p) => !claimed.has(p)).sort((a, b) => a.path.localeCompare(b.path));
if (rest.length) sections.push(['About and policies', rest] as unknown as (typeof sections)[number]);

const status = book.status === 'live' ? 'is on sale' : `is not on sale yet and is due in ${book.launchYear}`;
const lines = [
  `# ${book.title}`,
  '',
  `> ${home?.description ?? book.subtitle}`,
  '',
  `${book.title}: ${book.subtitle}, by ${book.authors.join(' and ')}. It is the revised edition of *${book.earlierEdition.title}* (${book.earlierEdition.year}) and ${status}. Every page below has a markdown version at the address shown, and puzzle answers are included in full. The tools and games run in the browser, so their markdown has the explanation and the starting example, not the working tool.`,
  '',
];
for (const [name, list] of sections) {
  if (!list.length) continue;
  lines.push(`## ${name}`, '', ...list.map((p) => `- [${p.title}](${p.mdUrl}): ${p.description}`), '');
}
writeFileSync(join(dist, 'llms.txt'), lines.join('\n'));

const ordered = sections.flatMap(([, list]) => list);
writeFileSync(
  join(dist, 'llms-full.txt'),
  `${lines.slice(0, 5).join('\n')}\n\n${ordered.map((p) => `# ${p.title}\n\nSource: ${p.url}\n\n${p.body}`).join('\n\n---\n\n')}\n`,
);

console.log(`markdown: ${pages.length} pages, llms.txt and llms-full.txt written`);
