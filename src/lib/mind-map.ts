import type { WorkedExample } from '../islands/shared/WorkedExample';

/**
 * Mind Map. The player types a center and an outline (one branch per line, indented lines are
 * sub-branches) and the tool draws a mind map: the center in the middle, branches fanning out to
 * the left and the right. The layout is a tidy tree with columns by level, so no two labels can
 * overlap, and the SVG is built here as a string, so the page shows the same picture the player
 * downloads. The book shows mind maps in Chapters 3 and 6 but does not teach a method; the outline,
 * the layout and the six-questions starter are ours. Pure functions, so the logic can be checked
 * without a browser.
 */
export const MAX_LEVELS = 3;
export const MAX_NODES = 100;
export const MAX_TEXT = 80;

export type OutlineNode = { text: string; children: OutlineNode[] };
export type Parsed = { nodes: OutlineNode[]; count: number; truncated: boolean };

const clean = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);

/**
 * Turns an outline into a tree. A line's depth is its indent in two-space steps (a tab counts as
 * two spaces), after any bullet mark (-, *, a bullet). A line cannot be more than one step deeper
 * than the line above it, and nothing goes deeper than three levels.
 */
export function parseOutline(text: string): Parsed {
  const roots: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  let count = 0;
  let truncated = false;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const indent = raw.match(/^[ \t]*/)![0].replaceAll('\t', '  ').length;
    const body = clean(raw.trim().replace(/^[-*•]\s+/, ''));
    if (!body) continue;
    if (count >= MAX_NODES) {
      truncated = true;
      break;
    }
    const level = Math.min(Math.floor(indent / 2), MAX_LEVELS - 1, stack.length);
    const node: OutlineNode = { text: body, children: [] };
    (level === 0 ? roots : stack[level - 1]!.children).push(node);
    stack.length = level;
    stack.push(node);
    count += 1;
  }
  return { nodes: roots, count, truncated };
}

/** Every line that ends a branch, with the path of words that leads to it. Used for the notebook. */
export function leaves(center: string, nodes: OutlineNode[]): { text: string; path: string }[] {
  const out: { text: string; path: string }[] = [];
  const walk = (n: OutlineNode, trail: string[]) => {
    if (n.children.length === 0) out.push({ text: n.text, path: [...trail].join(' > ') });
    else for (const c of n.children) walk(c, [...trail, n.text]);
  };
  const root = center.trim();
  for (const n of nodes) walk(n, root ? [root] : []);
  return out;
}

/** The map as indented text, for copying and saving. */
export function toOutlineText(center: string, nodes: OutlineNode[]): string {
  const out: string[] = [center.trim() || 'Mind map'];
  const walk = (n: OutlineNode, depth: number) => {
    out.push(`${'  '.repeat(depth)}- ${n.text}`);
    for (const c of n.children) walk(c, depth + 1);
  };
  for (const n of nodes) walk(n, 0);
  return out.join('\n') + '\n';
}

/** Adds branch names to an outline, skipping any already there as a top-level line. */
export function addBranches(outline: string, names: string[]): string {
  const have = new Set(parseOutline(outline).nodes.map((n) => n.text.toLowerCase()));
  const add = names.filter((n) => !have.has(n.toLowerCase()));
  const base = outline.replace(/\s+$/, '');
  return [base, ...add].filter((s) => s.length > 0).join('\n');
}

/* ---------- Layout ---------- */

export type LaidNode = {
  id: string;
  parent: string | null;
  text: string;
  lines: string[];
  level: number;
  branch: number;
  side: 'left' | 'right' | 'center';
  x: number;
  y: number;
  w: number;
  h: number;
};
export type LaidLink = { from: string; to: string; level: number; branch: number; d: string };
export type Layout = { nodes: LaidNode[]; links: LaidLink[]; minX: number; minY: number; width: number; height: number };

const LINE_H = 18;
const PAD_X = 12;
const PAD_Y = 8;
const GAP_X = 40;
const GAP_Y = 10;
const MAX_CHARS = [16, 16, 20, 22];
const charW = (level: number) => (level <= 1 ? 8.2 : 7.4);

/** Greedy word wrap. A word longer than the limit is cut into pieces. */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (let word of text.split(' ')) {
    while (word.length > max) {
      if (cur) {
        lines.push(cur);
        cur = '';
      }
      lines.push(word.slice(0, max));
      word = word.slice(max);
    }
    if (!word) continue;
    if (!cur) cur = word;
    else if (cur.length + 1 + word.length <= max) cur += ` ${word}`;
    else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

const leafCount = (n: OutlineNode): number => (n.children.length === 0 ? 1 : n.children.reduce((s, c) => s + leafCount(c), 0));

/** How many branches go on the right so that the two sides have about the same number of leaves. */
export function splitIndex(nodes: OutlineNode[]): number {
  if (nodes.length <= 1) return nodes.length;
  const weights = nodes.map(leafCount);
  const total = weights.reduce((a, b) => a + b, 0);
  let best = 1;
  let bestDiff = Infinity;
  let run = 0;
  for (let k = 1; k <= nodes.length - 1; k++) {
    run += weights[k - 1]!;
    const diff = Math.abs(total - 2 * run);
    if (diff < bestDiff) {
      best = k;
      bestDiff = diff;
    }
  }
  return best;
}

type Draft = { node: LaidNode; kids: Draft[] };

export function layoutMap(center: string, nodes: OutlineNode[]): Layout {
  const centerLines = wrap(clean(center) || 'Your topic', MAX_CHARS[0]!);
  const size = (lines: string[], level: number) => ({
    w: Math.round(Math.max(...lines.map((l) => l.length)) * charW(level) + PAD_X * 2),
    h: lines.length * LINE_H + PAD_Y * 2,
  });
  const cs = size(centerLines, 0);
  const root: LaidNode = { id: 'c', parent: null, text: clean(center) || 'Your topic', lines: centerLines, level: 0, branch: -1, side: 'center', x: 0, y: 0, ...cs };
  const all: LaidNode[] = [root];
  const links: LaidLink[] = [];

  const build = (n: OutlineNode, id: string, parent: string, level: number, branch: number, side: 'left' | 'right'): Draft => {
    const lines = wrap(n.text, MAX_CHARS[level]!);
    const laid: LaidNode = { id, parent, text: n.text, lines, level, branch, side, x: 0, y: 0, ...size(lines, level) };
    all.push(laid);
    return { node: laid, kids: n.children.map((c, i) => build(c, `${id}.${i}`, id, level + 1, branch, side)) };
  };

  const k = splitIndex(nodes);
  const sides: { side: 'left' | 'right'; drafts: Draft[] }[] = [
    { side: 'right', drafts: nodes.slice(0, k).map((n, i) => build(n, `b${i}`, 'c', 1, i, 'right')) },
    { side: 'left', drafts: nodes.slice(k).map((n, i) => build(n, `b${k + i}`, 'c', 1, k + i, 'left')) },
  ];

  const slot = (d: Draft): number => Math.max(d.node.h + GAP_Y, d.kids.reduce((s, c) => s + slot(c), 0));

  for (const { side, drafts } of sides) {
    if (drafts.length === 0) continue;
    const sign = side === 'right' ? 1 : -1;
    // Column widths by level, then the left edge of each column, measured from the center.
    const colW: number[] = [];
    const collect = (d: Draft) => {
      colW[d.node.level] = Math.max(colW[d.node.level] ?? 0, d.node.w);
      d.kids.forEach(collect);
    };
    drafts.forEach(collect);
    const colStart: number[] = [];
    let edge = root.w / 2 + GAP_X;
    for (let l = 1; l < colW.length; l++) {
      colStart[l] = edge;
      edge += (colW[l] ?? 0) + GAP_X;
    }
    const place = (d: Draft, top: number): void => {
      const s = slot(d);
      d.node.x = sign * (colStart[d.node.level]! + d.node.w / 2);
      if (d.kids.length === 0) {
        d.node.y = top + s / 2;
        return;
      }
      let t = top + (s - d.kids.reduce((a, c) => a + slot(c), 0)) / 2;
      for (const c of d.kids) {
        place(c, t);
        t += slot(c);
      }
      d.node.y = (d.kids[0]!.node.y + d.kids[d.kids.length - 1]!.node.y) / 2;
    };
    let t = -drafts.reduce((s, d) => s + slot(d), 0) / 2;
    for (const d of drafts) {
      place(d, t);
      t += slot(d);
    }
    const link = (d: Draft, parent: LaidNode) => {
      const n = d.node;
      const x1 = parent.x + sign * (parent.w / 2);
      const x2 = n.x - sign * (n.w / 2);
      const xm = (x1 + x2) / 2;
      links.push({ from: parent.id, to: n.id, level: n.level, branch: n.branch, d: `M${r(x1)},${r(parent.y)} C${r(xm)},${r(parent.y)} ${r(xm)},${r(n.y)} ${r(x2)},${r(n.y)}` });
      d.kids.forEach((c) => link(c, n));
    };
    drafts.forEach((d) => link(d, root));
  }

  const minX = Math.min(...all.map((n) => n.x - n.w / 2)) - 16;
  const maxX = Math.max(...all.map((n) => n.x + n.w / 2)) + 16;
  const minY = Math.min(...all.map((n) => n.y - n.h / 2)) - 16;
  const maxY = Math.max(...all.map((n) => n.y + n.h / 2)) + 16;
  return { nodes: all, links, minX: r(minX), minY: r(minY), width: r(maxX - minX), height: r(maxY - minY) };
}

const r = (n: number) => Math.round(n * 10) / 10;

/* ---------- SVG ---------- */

/** Branch colors, from the site's chapter colors. Each has at least 4.5:1 contrast with the ink on it. */
export const BRANCH_COLORS = ['#00adef', '#ffb000', '#a6d93d', '#e27bff', '#f25937', '#2ee6a6', '#b07cff', '#fff426'];
export const INK = '#111111';
export const PAPER = '#fffbf0';
const FONT = 'Arial, Helvetica, sans-serif';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colorOf = (branch: number) => BRANCH_COLORS[branch % BRANCH_COLORS.length]!;

/** A self-contained SVG: fixed colors and fonts, so it looks the same on the page, in a file and in print. */
export function renderSvg(center: string, nodes: OutlineNode[], opts: { label?: string; fluid?: boolean } = {}): string {
  const lay = layoutMap(center, nodes);
  const label = opts.label ?? `Mind map of ${lay.nodes[0]!.text}, with ${nodes.length} ${nodes.length === 1 ? 'branch' : 'branches'}.`;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${lay.minX} ${lay.minY} ${lay.width} ${lay.height}" ${opts.fluid ? `style="width:100%;min-width:${Math.min(lay.width, 960)}px;height:auto;display:block"` : `width="${lay.width}" height="${lay.height}"`} role="img" aria-label="${esc(label)}" font-family="${FONT}" font-size="14">`);
  parts.push(`<title>${esc(label)}</title>`);
  parts.push(`<rect x="${lay.minX}" y="${lay.minY}" width="${lay.width}" height="${lay.height}" fill="${PAPER}"/>`);
  const widthOf = (level: number) => (level === 1 ? 5 : level === 2 ? 3.5 : 2.5);
  for (const l of [...lay.links].sort((a, b) => a.level - b.level)) {
    parts.push(`<path d="${l.d}" fill="none" stroke="${colorOf(l.branch)}" stroke-width="${widthOf(l.level)}" stroke-linecap="round"/>`);
  }
  for (const n of lay.nodes) {
    const x = r(n.x - n.w / 2);
    const y = r(n.y - n.h / 2);
    const rx = Math.min(n.h / 2, 18);
    let fill = PAPER;
    let stroke = colorOf(n.branch);
    let text = INK;
    let weight = 'normal';
    if (n.level === 0) {
      fill = INK;
      stroke = INK;
      text = PAPER;
      weight = 'bold';
    } else if (n.level === 1) {
      fill = colorOf(n.branch);
      weight = 'bold';
    }
    parts.push(`<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`);
    const tspans = n.lines.map((ln, i) => `<tspan x="${r(n.x)}" y="${r(n.y - n.h / 2 + PAD_Y + i * LINE_H + 13)}">${esc(ln)}</tspan>`).join('');
    parts.push(`<text text-anchor="middle" fill="${text}" font-weight="${weight}">${tspans}</text>`);
  }
  parts.push('</svg>');
  return parts.join('');
}

/** The file the player downloads: the same SVG with an XML declaration. */
export const svgFile = (center: string, nodes: OutlineNode[]): string => `<?xml version="1.0" encoding="UTF-8"?>\n${renderSvg(center, nodes)}\n`;

/* ---------- Starters and the worked example ---------- */

/** The six question words from the book's Chapter 4 game, What's Your Problem? */
export const QUESTION_WORDS = ['Who', 'What', 'Why', 'When', 'How', 'Which'];

/**
 * The book's running problem, as a map. The seven branches are the book's own seven "problemettes"
 * from Chapter 6 (the collage exercise). Every idea under them is ours.
 */
export const EXAMPLE = {
  center: 'Traffic in Los Angeles',
  outline: [
    'Too many cars',
    '  Make leaving the car at home the easy choice',
    'People driving alone',
    '  Car pooling',
    '  Shared minibuses',
    'No good alternative transport',
    '  Places to leave a bike safely',
    'The need to travel to get to work',
    '  Start at different times',
    '    Let each team choose its own hours',
    '  Work without traveling one day a week',
    'People in LA love cars',
    '  Give people something to listen to on the way',
    'Too few major roads',
    '  Show drivers where the jams are before they set off',
    'Accidents on roads causing delays',
    '  Warn drivers about a crash early',
  ].join('\n'),
};

export const WORKED_EXAMPLE: WorkedExample = {
  title: 'A worked example',
  steps: [
    {
      heading: 'Write the topic in the center.',
      text: `The book’s running example is traffic in Los Angeles, so the center is “${EXAMPLE.center}”.`,
    },
    {
      heading: 'Add the main branches.',
      text: 'One branch for each part of the problem. In its collage exercise, Chapter 6 splits the same problem into seven parts, which make the branches here:',
      list: ['Too many cars', 'People driving alone', 'No good alternative transport', 'The need to travel to get to work', 'People in LA love cars', 'Too few major roads', 'Accidents on roads causing delays'],
    },
    {
      heading: 'Grow ideas from each branch.',
      text: 'Indent a line to hang it under the branch above it. These ideas are ours, to show the shape. For example, under “The need to travel to get to work”:',
      list: ['Start at different times', 'Work without traveling one day a week'],
    },
    {
      heading: 'Look at the whole map.',
      text: 'Branches with many ideas show where you have been thorough. Empty branches show where you have not looked yet, and each is a prompt for the next round.',
    },
  ],
  slots: [],
  bridge: 'Now draw your own.',
};
