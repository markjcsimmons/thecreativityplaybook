import { useEffect, useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { newSeed } from '../../lib/prng';
import { csvCell, download, readList, writeList } from '../../lib/tool-client';

/**
 * A generator made of locked-or-rolled slots (BRIEF §8.0): each slot has its own seed,
 * the URL carries the seeds (`s=a.b.c`), locked slots (`lock=0,2`) and any option, so every
 * result is shareable. Used by the Business and Product idea generators.
 *
 * With `composePitch: false` the tool deals only the parts. It starts blank, shows no
 * sentence of its own, and the user writes the pitch (Save, Copy and Export use their text).
 */
export type Built = { slots: { label: string; value: string }[]; text: string; extra?: string };
export type OptionGroup = { key: string; label: string; choices: { value: string; label: string }[] };
export type Mode = { value: string; label: string; set: Record<string, string> };
/** A worked example shown above the tool, rendered on the server so it works without JavaScript. */
export type WorkedExample = { title: string; slots: { label: string; value: string }[]; reaction: string[]; note?: string };

export type SlotToolConfig = {
  tool: string;
  slotCount: number;
  /** Fixed seeds so the server renders a real example and the browser hydrates to the same markup. */
  defaultSeeds: string[];
  question: string;
  build: (seeds: string[], options: Record<string, string>) => Built;
  /** Quick presets that set several options at once; the URL key is `mode`. */
  modes?: Mode[];
  groups?: OptionGroup[];
  extraLabel?: string;
  /** Default true: show the tool's own one-line sentence. False: deal parts only and let the user write the pitch. */
  composePitch?: boolean;
  example?: WorkedExample;
  waitlistOpen?: boolean;
};

export default function SlotTool({ config }: { config: SlotToolConfig }) {
  const { tool, slotCount, defaultSeeds, question, build, modes = [], groups = [], extraLabel, composePitch = true, example } = config;
  const savedKey = `cp:${tool}:saved`;
  const fallback: Record<string, string> = Object.fromEntries([
    ...(modes.length ? [['mode', modes[0]!.value]] : []),
    ...groups.map((g) => [g.key, g.choices[0]!.value]),
  ]);

  const [options, setOptions] = useState<Record<string, string>>(fallback);
  const [seeds, setSeeds] = useState<string[]>(defaultSeeds);
  const [locks, setLocks] = useState<boolean[]>(Array(slotCount).fill(false));
  const [rolls, setRolls] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [announce, setAnnounce] = useState('');
  // In parts-only mode the tool starts blank until the first roll or a shared link.
  const [started, setStarted] = useState(composePitch);
  const [draft, setDraft] = useState('');

  // Read the shared link once the page is in the browser.
  useEffect(() => {
    const q = new URL(location.href).searchParams;
    const next = { ...fallback };
    const mode = modes.find((m) => m.value === q.get('mode'));
    if (mode) Object.assign(next, mode.set, { mode: mode.value });
    for (const g of groups) {
      const v = q.get(g.key);
      if (v && g.choices.some((c) => c.value === v)) next[g.key] = v;
    }
    setOptions(next);
    const s = q.get('s')?.split('.');
    if (s && s.length === defaultSeeds.length && s.every((x) => /^[a-z0-9]{1,12}$/.test(x))) {
      setSeeds(s);
      setStarted(true);
    }
    const lock = q.get('lock')?.split(',') ?? [];
    setLocks(Array.from({ length: slotCount }, (_, i) => lock.includes(String(i))));
    setSaved(readList(savedKey));
  }, []);

  const writeUrl = (nextOptions: Record<string, string>, nextSeeds: string[], nextLocks: boolean[], live = started) => {
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(nextOptions)) {
      if (v === fallback[k]) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    if (live) url.searchParams.set('s', nextSeeds.join('.'));
    const locked = nextLocks.flatMap((l, i) => (l ? [String(i)] : []));
    if (locked.length) url.searchParams.set('lock', locked.join(','));
    else url.searchParams.delete('lock');
    history.replaceState(null, '', url);
  };

  const built = build(seeds, options);
  const result = composePitch ? built.text : draft.trim();
  const partsText = (b: Built) => b.slots.map((x) => `${x.label}: ${x.value}.`).join(' ');
  const describe = (b: Built) => (composePitch ? b.text : partsText(b));

  const chooseMode = (m: Mode) => {
    const next = { ...options, ...m.set, mode: m.value };
    setOptions(next);
    writeUrl(next, seeds, locks);
    setAnnounce(`${m.label} preset on.${started ? ` ${describe(build(seeds, next))}` : ''}`);
  };

  const chooseOption = (key: string, value: string) => {
    const next = { ...options, [key]: value, ...(modes.length ? { mode: modes[0]!.value } : {}) };
    setOptions(next);
    writeUrl(next, seeds, locks);
    if (started) setAnnounce(describe(build(seeds, next)));
  };

  const roll = () => {
    const next = seeds.map((s, i) => (i < slotCount && locks[i] ? s : newSeed()));
    if (extraLabel) next[slotCount] = seeds[slotCount]!;
    setSeeds(next);
    setStarted(true);
    setRolls((n) => n + 1);
    writeUrl(options, next, locks, true);
    setAnnounce(describe(build(next, options)));
    track('tool_generate', { tool });
  };

  const rollExtra = () => {
    const next = seeds.map((s, i) => (i === slotCount ? newSeed() : s));
    setSeeds(next);
    writeUrl(options, next, locks);
    setAnnounce(build(next, options).extra ?? '');
    track('tool_generate', { tool });
  };

  const toggleLock = (i: number) => {
    const next = locks.map((l, j) => (j === i ? !l : l));
    setLocks(next);
    writeUrl(options, seeds, next);
    setAnnounce(`${built.slots[i]!.label} ${next[i] ? 'locked' : 'unlocked'}.`);
    if (next[i]) track('tool_lock', { tool });
  };

  const copyText = async (text: string, done: string) => {
    if (!text) return setAnnounce('Write your pitch first, then copy it.');
    try {
      await navigator.clipboard.writeText(text);
      setAnnounce(done);
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const share = () => {
    track('tool_share', { tool });
    void copyText(location.href, 'Link copied.');
  };

  const save = () => {
    if (!result) return setAnnounce('Write your pitch first, then save it.');
    if (saved.includes(result)) return setAnnounce('Already saved.');
    const next = [...saved, result];
    setSaved(next);
    writeList(savedKey, next);
    track('tool_save', { tool });
    if (!composePitch) setDraft('');
    setAnnounce(`Saved. ${next.length} in your list.`);
  };

  const exportList = (format: 'txt' | 'csv') => {
    if (saved.length === 0) return setAnnounce('Nothing to export yet.');
    track('tool_export', { tool });
    if (format === 'txt') download('ideas.txt', 'text/plain', saved.map((x, i) => `${i + 1}. ${x}`).join('\n') + '\n');
    else download('ideas.csv', 'text/csv', ['number,idea', ...saved.map((x, i) => `${i + 1},${csvCell(x)}`)].join('\n') + '\n');
  };

  const showSoftPrompt = rolls >= 5;

  return (
    <div class="grid gap-5">
      {example && (
        <section class="grid gap-3 border-b-4 border-ink pb-5" aria-label={example.title}>
          <span class="eyebrow">{example.title}</span>
          <ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
            {example.slots.map((slot) => (
              <li class="grid content-start gap-1 border-2 border-ink p-2">
                <span class="eyebrow">{slot.label}</span>
                <span class="break-words font-display text-xl uppercase leading-tight">{slot.value}</span>
              </li>
            ))}
          </ul>
          {example.reaction.map((para) => (
            <p class="m-0">{para}</p>
          ))}
          {example.note && <p class="m-0 font-bold">{example.note}</p>}
        </section>
      )}
      {modes.length > 0 && (
        <div role="group" aria-label="Preset" class="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button type="button" class={`btn !min-h-0 !px-3 !py-2 !text-base ${options.mode === m.value ? '' : 'btn-ghost'}`} aria-pressed={options.mode === m.value} onClick={() => chooseMode(m)}>
              {m.label}
            </button>
          ))}
        </div>
      )}
      {groups.length > 0 && (
        <details class="no-print">
          <summary class="cursor-pointer font-bold">Filters</summary>
          <div class="mt-3 grid gap-3">
            {groups.map((g) => (
              <div role="group" aria-label={g.label} class="flex flex-wrap items-center gap-2">
                <span class="eyebrow w-24">{g.label}</span>
                {g.choices.map((c) => (
                  <button type="button" class={`btn !min-h-0 !px-3 !py-1 !text-base ${options[g.key] === c.value ? '' : 'btn-ghost'}`} aria-pressed={options[g.key] === c.value} onClick={() => chooseOption(g.key, c.value)}>
                    {c.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </details>
      )}

      <ul class="m-0 grid list-none grid-cols-2 gap-3 p-0">
        {built.slots.map((slot, i) => (
          <li class="sticker grid content-start gap-2 p-3 sm:p-4">
            <span class="eyebrow">{slot.label}</span>
            <span class="break-words font-display text-2xl uppercase leading-tight sm:text-3xl">{started ? slot.value : '?'}</span>
            <button type="button" class="btn btn-ghost w-fit !min-h-0 !py-1 !text-base" aria-pressed={locks[i]} disabled={!started} onClick={() => toggleLock(i)}>
              {locks[i] ? 'Locked' : 'Lock'}
              <span class="visually-hidden"> {slot.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {composePitch ? (
        <>
          <p class="m-0 font-slab text-2xl font-bold leading-snug">{built.text}</p>
          <p class="m-0">{question}</p>
        </>
      ) : started ? (
        <div class="grid gap-2">
          <label for={`${tool}-draft`} class="font-slab text-xl font-bold leading-snug">
            Your turn: {question}
          </label>
          <textarea id={`${tool}-draft`} class="field" rows={4} value={draft} onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)} />
        </div>
      ) : (
        <p class="m-0">Press Roll to deal four parts. Then write your own pitch from them.</p>
      )}
      <div class="no-print flex flex-wrap gap-3">
        <button type="button" class="btn" onClick={roll}>
          {started ? 'Roll again' : 'Roll'}
        </button>
        {started && (
          <>
            <button type="button" class="btn btn-ghost" onClick={() => copyText(result, 'Copied.')}>
              Copy
            </button>
            <button type="button" class="btn btn-ghost" onClick={share}>
              Share link
            </button>
            <button type="button" class="btn btn-ghost" onClick={save}>
              Save
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
              Print
            </button>
          </>
        )}
      </div>

      {extraLabel && built.extra && started && (
        <section class="sticker grid gap-2 p-4" aria-label={extraLabel}>
          <span class="eyebrow">{extraLabel}</span>
          <p class="m-0">{built.extra}</p>
          <button type="button" class="btn btn-ghost no-print w-fit !min-h-0 !py-1 !text-base" onClick={rollExtra}>
            Another prompt
          </button>
        </section>
      )}

      {saved.length > 0 && (
        <section class="grid gap-2" aria-label="Saved ideas">
          <h3 class="m-0 !text-xl">Saved on this device ({saved.length})</h3>
          <ol class="m-0 pl-5">
            {saved.map((s) => (
              <li>{s}</li>
            ))}
          </ol>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn btn-ghost" onClick={() => exportList('txt')}>
              Export text
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => exportList('csv')}>
              Export CSV
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              onClick={() => {
                setSaved([]);
                writeList(savedKey, []);
              }}
            >
              Clear saved
            </button>
          </div>
        </section>
      )}

      {showSoftPrompt && config.waitlistOpen && (
        <p class="no-print m-0 border-l-8 border-ink pl-4">
          Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
        </p>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
