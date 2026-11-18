/**
 * Typewriter reveal for long-form text (used on /introduction/).
 *
 * The page ships the whole text as ordinary server-rendered HTML, so search, screen
 * readers, the markdown twin and no-JS visitors all get it at once. This script only
 * changes how it is *shown*: each text node is split into a visible part and a
 * transparent remainder, so the text is never removed from the page and the layout
 * never jumps. It adds typos that get corrected (from a fixed seed, so every visit
 * types the same way), word-level slips, and a selection sweep over marked phrases
 * (`[data-hl]`) before they turn bold.
 *
 * Nothing runs when the visitor prefers reduced motion. Pause and Skip buttons are
 * always offered while it types (WCAG 2.2.2).
 */
import { rngFromSeed } from './prng';

interface Slip {
  /** Phrase where the slip happens: the wrong text is typed just before it, then erased. */
  at: string;
  wrong: string;
}

interface Unit {
  orig: Text;
  text: string;
  shown: HTMLSpanElement;
  rest: HTMLSpanElement;
  offset: number;
  block: Element | null;
  hl: Element | null;
}

/** Neighbouring QWERTY keys, for believable typos. */
const NEIGHBORS: Record<string, string> = {
  q: 'wa', w: 'qes', e: 'wrd', r: 'etf', t: 'ryg', y: 'tuh', u: 'yij', i: 'uok', o: 'ipl', p: 'ol',
  a: 'qsz', s: 'awdx', d: 'sefc', f: 'drgv', g: 'fthb', h: 'gyjn', j: 'hukm', k: 'jilm', l: 'kop',
  z: 'asx', x: 'zsdc', c: 'xdfv', v: 'cfgb', b: 'vghn', n: 'bhjm', m: 'njk',
};
const TYPO_RATE = 1 / 150;

class Clock {
  paused = false;
  skipped = false;
  private waiters: Array<() => void> = [];

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.skipped) return resolve();
      setTimeout(async () => {
        while (this.paused && !this.skipped) await new Promise<void>((r) => this.waiters.push(r));
        resolve();
      }, ms);
    });
  }
  private flush() {
    this.waiters.splice(0).forEach((r) => r());
  }
  setPaused(p: boolean) {
    this.paused = p;
    if (!p) this.flush();
  }
  skip() {
    this.skipped = true;
    this.paused = false;
    this.flush();
  }
}

const delayFor = (ch: string, rng: () => number): number => {
  if (ch === '.' || ch === '!' || ch === '?') return 200;
  if (ch === ',' || ch === ';' || ch === ':') return 90;
  if (ch === '—') return 110;
  return 5 + rng() * 9;
};

function collectUnits(root: HTMLElement): Unit[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    if (n.data.trim()) nodes.push(n);
  }
  let offset = 0;
  return nodes.map((orig) => {
    const shown = document.createElement('span');
    shown.className = 'tw-shown';
    const rest = document.createElement('span');
    rest.className = 'tw-rest';
    rest.textContent = orig.data;
    const parent = orig.parentElement;
    const unit: Unit = {
      orig,
      text: orig.data,
      shown,
      rest,
      offset,
      block: parent?.closest('p, h1, h2, h3, li, blockquote') ?? null,
      hl: parent?.closest('[data-hl]') ?? null,
    };
    offset += orig.data.length + 1;
    orig.replaceWith(shown, rest);
    return unit;
  });
}

async function run(root: HTMLElement): Promise<void> {
  const slips: Slip[] = JSON.parse(root.dataset.slips ?? '[]');
  const rng = rngFromSeed(root.dataset.seed ?? 'typewriter');
  const clock = new Clock();
  const units = collectUnits(root);
  if (units.length === 0) return;

  const full = units.map((u) => u.text).join('\n');
  const slipAt = new Map<number, Slip>();
  for (const s of slips) {
    const idx = full.indexOf(s.at);
    if (idx !== -1) slipAt.set(idx, s);
  }
  // The selection sweep fires once the last text node of a marked phrase is typed.
  const hlLast = new Map<Unit, Element>();
  for (const u of units) if (u.hl) hlLast.set(u, u.hl);
  for (const [u, el] of [...hlLast]) {
    const later = units.some((v) => v !== u && v.hl === el && v.offset > u.offset);
    if (later) hlLast.delete(u);
  }

  const caret = document.createElement('span');
  caret.className = 'tw-caret';
  caret.setAttribute('aria-hidden', 'true');

  const controls = document.createElement('div');
  controls.className = 'tw-controls';
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'btn btn-ghost';
  pause.textContent = 'Pause typing';
  pause.addEventListener('click', () => {
    clock.setPaused(!clock.paused);
    pause.textContent = clock.paused ? 'Resume typing' : 'Pause typing';
  });
  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'btn btn-ghost';
  skip.textContent = 'Show it all';
  skip.addEventListener('click', () => clock.skip());
  controls.append(pause, skip);
  root.after(controls);

  const reveal = (u: Unit, i: number) => {
    u.shown.textContent = u.text.slice(0, i);
    u.rest.textContent = u.text.slice(i);
  };

  /** Types `wrong` just before the caret, holds, then erases it: a visible mistake. */
  const mistake = async (wrong: string, perChar: number, hold: number) => {
    const ghost = document.createElement('span');
    ghost.className = 'tw-typo';
    ghost.setAttribute('aria-hidden', 'true');
    caret.before(ghost);
    for (const c of wrong) {
      ghost.textContent += c;
      await clock.wait(perChar);
    }
    await clock.wait(hold);
    while ((ghost.textContent ?? '').length > 0 && !clock.skipped) {
      ghost.textContent = (ghost.textContent ?? '').slice(0, -1);
      await clock.wait(70);
    }
    await clock.wait(200);
    ghost.remove();
  };

  const select = async (el: Element) => {
    await clock.wait(320);
    el.classList.add('tw-sel');
    void (el as HTMLElement).offsetWidth; // let the transition start from 0%
    el.classList.add('tw-sel-on');
    await clock.wait(700);
    el.classList.remove('tw-sel', 'tw-sel-on');
    el.classList.add('tw-hl-done');
  };

  /** Keep the caret on screen, unless the visitor has scrolled well away from it. */
  const follow = () => {
    const r = caret.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom > vh - 140 && r.top < vh + 320) {
      window.scrollBy({ top: r.bottom - (vh - 140), behavior: 'instant' as ScrollBehavior });
    }
  };

  const finish = () => {
    for (const u of units) {
      u.shown.replaceWith(u.orig);
      u.rest.remove();
    }
    caret.remove();
    controls.remove();
    root.dataset.tw = 'done';
    root.querySelectorAll('.tw-sel, .tw-sel-on, .tw-hl-done').forEach((el) => el.classList.remove('tw-sel', 'tw-sel-on', 'tw-hl-done'));
  };

  root.dataset.tw = 'live';
  try {
    for (let n = 0; n < units.length && !clock.skipped; n++) {
      const unit = units[n];
      unit.shown.after(caret);
      for (let i = 0; i < unit.text.length && !clock.skipped; i++) {
        const ch = unit.text[i];
        const roll = rng();
        const slip = slipAt.get(unit.offset + i);
        if (slip) {
          await mistake(slip.wrong, 45, 650);
        } else if (i > 0 && roll < TYPO_RATE && NEIGHBORS[ch.toLowerCase()]) {
          const options = NEIGHBORS[ch.toLowerCase()];
          const wrong = options[Math.floor(rng() * options.length)];
          await mistake(ch === ch.toUpperCase() ? wrong.toUpperCase() : wrong, 0, 380);
        }
        reveal(unit, i + 1);
        follow();
        await clock.wait(delayFor(ch, rng));
      }
      const marked = hlLast.get(unit);
      if (marked && !clock.skipped) await select(marked);
      const next = units[n + 1];
      if (next && next.block !== unit.block) await clock.wait(380);
    }
  } finally {
    finish();
  }
}

export function startTypewriters(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-typewriter]').forEach((root) => {
    run(root).catch(() => {
      root.dataset.tw = 'done';
    });
  });
}
