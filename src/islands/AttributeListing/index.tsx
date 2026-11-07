import { useEffect, useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import {
  CHARTS,
  CUSTOM_ID,
  EMPTY_DRAFT,
  MAX_ATTRIBUTES,
  QUESTION,
  buildCustom,
  combo,
  otherOption,
  parsePicks,
  savedLine,
  startPicks,
  type Chart,
  type CustomDraft,
} from '../../lib/attribute-charts';
import { csvCell, download, readList, writeList } from '../../lib/tool-client';

/**
 * Attribute Listing (Scavengers chapter): a chart of attributes and options for a thing.
 * The tool never writes an idea. It shows one option picked in each column, lets the user change
 * one at a time (or shuffle the rest), and asks them to judge the result. The URL carries the
 * chart, the picks and the locks (`c`, `p`, `lock`), so a result is shareable; a user's own chart
 * stays on their device.
 */
const TOOL = 'attribute-listing';
const SAVED_KEY = 'cp:attribute-listing:saved';
const CUSTOM_KEY = 'cp:attribute-listing:custom';
const DEFAULT_CHART = CHARTS[0]!;

const readDraft = (): CustomDraft | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? 'null') as CustomDraft | null;
    return raw && typeof raw.thing === 'string' && Array.isArray(raw.attributes) ? raw : null;
  } catch {
    return null;
  }
};
const writeDraft = (draft: CustomDraft) => {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(draft));
  } catch {
    /* keep going without storage */
  }
};

export default function AttributeListing({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [chartId, setChartId] = useState(DEFAULT_CHART.id);
  const [custom, setCustom] = useState<Chart | null>(null);
  const [draft, setDraft] = useState<CustomDraft>(EMPTY_DRAFT);
  const [draftError, setDraftError] = useState('');
  const [picks, setPicks] = useState<number[]>(startPicks(DEFAULT_CHART));
  const [locks, setLocks] = useState<boolean[]>(DEFAULT_CHART.attributes.map(() => false));
  const [changed, setChanged] = useState<boolean[]>(DEFAULT_CHART.attributes.map(() => false));
  const [note, setNote] = useState('');
  const [rolls, setRolls] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [announce, setAnnounce] = useState('');

  const chart: Chart | null = chartId === CUSTOM_ID ? custom : (CHARTS.find((c) => c.id === chartId) ?? DEFAULT_CHART);

  // Read the shared link and the saved lists once the page is in the browser.
  useEffect(() => {
    setSaved(readList(SAVED_KEY));
    const stored = readDraft();
    if (stored) {
      setDraft(stored);
      const built = buildCustom(stored);
      if ('chart' in built) setCustom(built.chart);
    }
    const q = new URL(location.href).searchParams;
    const wanted = CHARTS.find((c) => c.id === q.get('c'));
    if (!wanted) return;
    setChartId(wanted.id);
    const linked = parsePicks(wanted, q.get('p'));
    setPicks(linked ?? startPicks(wanted));
    const lock = q.get('lock')?.split(',') ?? [];
    setLocks(wanted.attributes.map((_, i) => lock.includes(String(i))));
    setChanged(wanted.attributes.map(() => false));
  }, []);

  const writeUrl = (id: string, nextPicks: number[], nextLocks: boolean[], live: boolean) => {
    const url = new URL(location.href);
    const shareable = live && id !== CUSTOM_ID;
    if (shareable) url.searchParams.set('c', id);
    else url.searchParams.delete('c');
    if (shareable) url.searchParams.set('p', nextPicks.join('.'));
    else url.searchParams.delete('p');
    const locked = nextLocks.flatMap((l, i) => (l && shareable ? [String(i)] : []));
    if (locked.length) url.searchParams.set('lock', locked.join(','));
    else url.searchParams.delete('lock');
    history.replaceState(null, '', url);
  };

  const open = (next: Chart, id: string) => {
    const p = startPicks(next);
    setChartId(id);
    setPicks(p);
    setLocks(next.attributes.map(() => false));
    setChanged(next.attributes.map(() => false));
    setNote('');
    writeUrl(id, p, next.attributes.map(() => false), false);
  };

  const chooseChart = (id: string) => {
    if (id === CUSTOM_ID) {
      setChartId(CUSTOM_ID);
      if (custom) open(custom, CUSTOM_ID);
      else writeUrl(CUSTOM_ID, [], [], false);
      setAnnounce('Make your own chart.');
      return;
    }
    const next = CHARTS.find((c) => c.id === id)!;
    open(next, id);
    setAnnounce(`${next.name} chart. ${combo(next, startPicks(next)).join(', ')}.`);
  };

  const apply = (nextPicks: number[], nextChanged: boolean[], message: string) => {
    if (!chart) return;
    setPicks(nextPicks);
    setChanged(nextChanged);
    setRolls((n) => n + 1);
    writeUrl(chartId, nextPicks, locks, true);
    setAnnounce(message);
    track('tool_generate', { tool: TOOL });
  };

  const choose = (i: number, j: number) => {
    if (!chart || picks[i] === j) return;
    apply(picks.map((p, k) => (k === i ? j : p)), chart.attributes.map((_, k) => k === i), `${chart.attributes[i]!.name} changed to ${chart.attributes[i]!.options[j]}.`);
  };

  const changeOne = (i: number) => {
    if (!chart) return;
    choose(i, otherOption(chart.attributes[i]!, picks[i]!));
  };

  const shuffle = () => {
    if (!chart) return;
    const free = chart.attributes.map((_, i) => !locks[i]);
    if (!free.some(Boolean)) return setAnnounce('Every attribute is locked. Unlock one to shuffle.');
    const next = picks.map((p, i) => (free[i] ? otherOption(chart.attributes[i]!, p) : p));
    apply(next, free, `Shuffled. ${combo(chart, next).join(', ')}.`);
  };

  const reset = () => {
    if (!chart) return;
    const p = startPicks(chart);
    setPicks(p);
    setChanged(chart.attributes.map(() => false));
    writeUrl(chartId, p, locks, true);
    setAnnounce(`Back to the ordinary version. ${combo(chart, p).join(', ')}.`);
  };

  const toggleLock = (i: number) => {
    if (!chart) return;
    const next = locks.map((l, j) => (j === i ? !l : l));
    setLocks(next);
    writeUrl(chartId, picks, next, true);
    setAnnounce(`${chart.attributes[i]!.name} ${next[i] ? 'locked' : 'unlocked'}.`);
    if (next[i]) track('tool_lock', { tool: TOOL });
  };

  const buildChart = () => {
    const built = buildCustom(draft);
    if ('error' in built) return setDraftError(built.error);
    setDraftError('');
    writeDraft(draft);
    setCustom(built.chart);
    open(built.chart, CUSTOM_ID);
    setAnnounce(`Your ${built.chart.name} chart is ready.`);
  };

  const setAttr = (i: number, field: 'name' | 'options', value: string) =>
    setDraft((d) => ({ ...d, attributes: d.attributes.map((a, k) => (k === i ? { ...a, [field]: value } : a)) }));

  const line = chart ? savedLine(chart, picks, note.trim()) : '';

  const copyText = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAnnounce(done);
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const share = () => {
    track('tool_share', { tool: TOOL });
    void copyText(location.href, 'Link copied.');
  };

  const save = () => {
    if (!chart) return;
    if (saved.includes(line)) return setAnnounce('Already saved.');
    const next = [...saved, line];
    setSaved(next);
    writeList(SAVED_KEY, next);
    setNote('');
    track('tool_save', { tool: TOOL });
    setAnnounce(`Saved. ${next.length} in your list.`);
  };

  const exportList = (format: 'txt' | 'csv') => {
    if (saved.length === 0) return setAnnounce('Nothing to export yet.');
    track('tool_export', { tool: TOOL });
    if (format === 'txt') download('combinations.txt', 'text/plain', saved.map((x, i) => `${i + 1}. ${x}`).join('\n') + '\n');
    else download('combinations.csv', 'text/csv', ['number,combination', ...saved.map((x, i) => `${i + 1},${csvCell(x)}`)].join('\n') + '\n');
  };

  return (
    <div class="grid gap-5">
      <div role="group" aria-label="Pick a thing to break up" class="flex flex-wrap gap-2">
        {CHARTS.map((c) => (
          <button type="button" class={`btn !min-h-0 !px-3 !py-2 !text-base ${chartId === c.id ? '' : 'btn-ghost'}`} aria-pressed={chartId === c.id} onClick={() => chooseChart(c.id)}>
            {c.name}
          </button>
        ))}
        <button type="button" class={`btn !min-h-0 !px-3 !py-2 !text-base ${chartId === CUSTOM_ID ? '' : 'btn-ghost'}`} aria-pressed={chartId === CUSTOM_ID} onClick={() => chooseChart(CUSTOM_ID)}>
          Make your own
        </button>
      </div>

      {chartId === CUSTOM_ID && (
        <form
          class="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            buildChart();
          }}
        >
          <p class="m-0">
            Name a thing, then list its attributes and the options for each, as the book does for a restaurant. Put one option on each line, or separate them with commas. Your chart stays on this device.
          </p>
          <label class="grid gap-1 font-bold">
            The thing
            <input class="field font-normal" type="text" value={draft.thing} placeholder="For example: bicycle" onInput={(e) => {
                const value = (e.target as HTMLInputElement).value;
                setDraft((d) => ({ ...d, thing: value }));
              }} autocomplete="off" />
          </label>
          {draft.attributes.map((a, i) => (
            <div class="sticker grid gap-2 p-3">
              <label class="grid gap-1 font-bold">
                Attribute {i + 1}
                <input class="field font-normal" type="text" value={a.name} placeholder="For example: Frame" onInput={(e) => setAttr(i, 'name', (e.target as HTMLInputElement).value)} autocomplete="off" />
              </label>
              <label class="grid gap-1 font-bold">
                Options for attribute {i + 1}
                <textarea class="field font-normal" rows={3} value={a.options} placeholder={'Steel\nBamboo\nWood'} onInput={(e) => setAttr(i, 'options', (e.target as HTMLTextAreaElement).value)} />
              </label>
              {draft.attributes.length > 2 && (
                <button type="button" class="btn btn-ghost w-fit !min-h-0 !py-1 !text-base" onClick={() => setDraft({ ...draft, attributes: draft.attributes.filter((_, k) => k !== i) })}>
                  Remove attribute {i + 1}
                </button>
              )}
            </div>
          ))}
          {draftError && (
            <p class="m-0 font-bold" role="alert">
              {draftError}
            </p>
          )}
          <div class="flex flex-wrap gap-3">
            {draft.attributes.length < MAX_ATTRIBUTES && (
              <button type="button" class="btn btn-ghost" onClick={() => setDraft({ ...draft, attributes: [...draft.attributes, { name: '', options: '' }] })}>
                Add an attribute
              </button>
            )}
            <button type="submit" class="btn">
              Build my chart
            </button>
          </div>
        </form>
      )}

      {chart && (
        <>
          <ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {chart.attributes.map((attr, i) => (
              <li class="sticker grid content-start gap-3 p-3 sm:p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="eyebrow">{attr.name}</span>
                  {changed[i] && <span class="fill px-2 py-0.5 text-sm font-bold">Changed</span>}
                </div>
                <div role="group" aria-label={`${attr.name} options`} class="flex flex-wrap gap-2">
                  {attr.options.map((opt, j) => (
                    <button type="button" class={`btn !min-h-0 !px-3 !py-1 !text-base ${picks[i] === j ? '' : 'btn-ghost'}`} aria-pressed={picks[i] === j} onClick={() => choose(i, j)}>
                      {opt}
                    </button>
                  ))}
                </div>
                <div class="no-print flex flex-wrap gap-2">
                  <button type="button" class="btn btn-ghost w-fit !min-h-0 !py-1 !text-base" onClick={() => changeOne(i)}>
                    Change this
                    <span class="visually-hidden"> {attr.name}</span>
                  </button>
                  <button type="button" class="btn btn-ghost w-fit !min-h-0 !py-1 !text-base" aria-pressed={locks[i]} onClick={() => toggleLock(i)}>
                    {locks[i] ? 'Locked' : 'Lock'}
                    <span class="visually-hidden"> {attr.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={shuffle}>
              Shuffle all
            </button>
            <button type="button" class="btn btn-ghost" onClick={reset}>
              Back to the ordinary version
            </button>
          </div>

          <p class="m-0 font-slab text-2xl font-bold leading-snug">
            <span class="eyebrow block">Your combination</span>
            {combo(chart, picks).join(' · ')}
          </p>

          <div class="grid gap-2">
            <label for="attribute-note" class="font-slab text-xl font-bold leading-snug">
              Your turn: {QUESTION}
            </label>
            <textarea id="attribute-note" class="field" rows={4} value={note} onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)} />
          </div>

          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn btn-ghost" onClick={() => copyText(line, 'Copied.')}>
              Copy
            </button>
            {chartId !== CUSTOM_ID && (
              <button type="button" class="btn btn-ghost" onClick={share}>
                Share link
              </button>
            )}
            <button type="button" class="btn btn-ghost" onClick={save}>
              Save
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </>
      )}

      {saved.length > 0 && (
        <section class="grid gap-2" aria-label="Saved combinations">
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
                writeList(SAVED_KEY, []);
              }}
            >
              Clear saved
            </button>
          </div>
        </section>
      )}

      {rolls >= 5 && waitlistOpen && (
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
