import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import chapters from '../data/chapters.json';
import { chapterIdFor } from './content';
import { SITE_NAME } from './seo';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const root = process.cwd();
const fontFile = (pkg: string, file: string) => readFileSync(join(root, 'node_modules', pkg, 'files', file));
// satori reads ttf, otf and woff, not woff2.
let fontCache: ReturnType<typeof loadFonts> | undefined;
const fonts = () => (fontCache ??= loadFonts());
const loadFonts = () => [
  { name: 'Anton', data: fontFile('@fontsource/anton', 'anton-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Zilla Slab', data: fontFile('@fontsource/zilla-slab', 'zilla-slab-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
];

/** Chapter colors come straight from global.css so the cards can't drift from the site. */
const css = readFileSync(join(root, 'src/styles/global.css'), 'utf8');
const hexFor = (cssVar: string): string => {
  const name = /var\((--[\w-]+)\)/.exec(cssVar)?.[1] ?? cssVar;
  return new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1] ?? '#fff426';
};

/** One Bird Design character per chapter (the authors own them: src/data/rights.json). Working pairings, easy to change. */
const CHARACTER_FOR: Record<string, string> = {
  intro: 'pink-thumbs-1',
  ch1: 'green-punk',
  ch2: 'orange-spotted',
  ch3: 'sky-blue-big',
  ch4: 'blue-robot',
  ch5: 'magenta-spiky',
  ch6: 'green-flower',
  ch7: 'orange-flame',
  ch8: 'pink-sunburst',
  ch9: 'green-robot',
  ch10: 'pink-pointy',
  ch11: 'green-teardrop',
  ch12: 'blue-flame',
  ch13: 'orange-mushroom',
};

const artCache = new Map<string, { src: string; w: number; h: number }>();
function characterUri(id: string): { src: string; w: number; h: number } {
  const hit = artCache.get(id);
  if (hit) return hit;
  const svg = readFileSync(join(root, 'public/art/characters', `${id}.svg`), 'utf8');
  const vb = /viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/.exec(svg);
  const art = { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, w: Number(vb?.[1] ?? 200), h: Number(vb?.[2] ?? 200) };
  artCache.set(id, art);
  return art;
}

function labelFor(path: string): string | undefined {
  if (path.startsWith('/tools/') || path === '/tools/') return 'Tool';
  if (path.startsWith('/games/') || path === '/games/') return 'Game';
  if (path.startsWith('/chapters/')) return 'Chapter';
  if (path.startsWith('/guides/')) return 'Guide';
  if (path.startsWith('/exercises/')) return 'Exercises';
  if (path.startsWith('/lateral-thinking/')) return 'Lateral thinking';
  return undefined;
}

/** Title font size by length, so long H1s still fit the left column. */
const TITLE_WIDTH = 680;
function titleSize(title: string): number {
  const n = title.length;
  const byLength = n <= 14 ? 150 : n <= 24 ? 124 : n <= 36 ? 100 : n <= 52 ? 80 : 64;
  // Anton capitals run about 0.47em wide with the letter spacing; the longest word must fit one line.
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  return Math.min(byLength, Math.floor(TITLE_WIDTH / (0.47 * longest)));
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, ...(children !== undefined ? { children } : {}), ...extra },
});

export async function renderOg(page: { path: string; title: string; h1?: string; bookChapter: string }): Promise<Buffer> {
  const chapterId = chapterIdFor(page.bookChapter) ?? 'intro';
  const chapter = chapters.find((c) => c.id === chapterId);
  const bg = hexFor(chapter?.color ?? 'var(--ch-intro)');
  const title = page.h1 ?? page.title;
  const label = labelFor(page.path);
  const art = characterUri(CHARACTER_FOR[chapterId] ?? 'orange-mushroom');
  // Fit the character into a 330 x 440 box on the right.
  const scale = Math.min(330 / art.w, 440 / art.h);
  const ink = '#111111';

  const tree = h(
    'div',
    { display: 'flex', width: OG_WIDTH, height: OG_HEIGHT, background: bg, color: ink, position: 'relative', fontFamily: 'Zilla Slab' },
    [
      // Exact inner height with a margin, not padding: satori adds padding on top of height.
      h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: TITLE_WIDTH, height: OG_HEIGHT - 128, margin: '64px 0 0 72px' }, [
        h(
          'div',
          { display: 'flex', fontSize: 32, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', height: 44 },
          label ?? ' ',
        ),
        h(
          'div',
          { display: 'flex', fontFamily: 'Anton', fontSize: titleSize(title), lineHeight: 1.02, textTransform: 'uppercase', letterSpacing: 1 },
          title,
        ),
        // The home card's title is already the site name.
        h('div', { display: 'flex', fontSize: 36, fontWeight: 700 }, title === SITE_NAME ? ' ' : SITE_NAME),
      ]),
      h('img', { position: 'absolute', right: 72, bottom: 64 }, undefined, {
        src: art.src,
        width: Math.round(art.w * scale),
        height: Math.round(art.h * scale),
      }),
    ],
  );

  const svg = await satori(tree as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts: fonts() });
  // Satori already turned the text into paths. Skipping system fonts avoids a slow scan on every card.
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH }, font: { loadSystemFonts: false } }).render().asPng();
}
