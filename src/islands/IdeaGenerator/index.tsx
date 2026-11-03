import { useEffect, useRef, useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import {
  MODES,
  QUESTION,
  SPAGHETTI_SECONDS,
  SPAGHETTI_TARGET,
  dealPrompt,
  rollSlots,
  sentence,
  type Mode,
} from '../../lib/idea-words';
import { newSeed } from '../../lib/prng';

const TOOL = 'random-idea-generator';
const SAVED_KEY = 'cp:random-idea-generator:saved';
const MODE_LABEL: Record<Mode, string> = { connect: 'Connect', twist: 'Twist', spaghetti: 'Spaghetti' };
const MODE_BLURB: Record<Mode, string> = {
  connect: 'Smash two unrelated things together, from the Connected chapter.',
  twist: 'Take an everyday object and bend it with one constraint.',
  spaghetti: 'Five minutes, quick prompts, and a pile of ideas. Aim for 50.',
};

/** Fixed seeds so the server renders a real example and the browser hydrates to the same markup. */
const DEFAULT_SEEDS = ['start', 'begin'];

// localStorage can be missing or throw (private windows, blocked storage). The tool works without it.
const readSaved = (): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};
const writeSaved = (items: string[]) => {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(items));
  } catch {
    /* keep going without storage */
  }
};

const csvCell = (s: string) => `"${s.replaceAll('"', '""')}"`;
const download = (name: string, type: string, body: string) => {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function IdeaGenerator() {
  const [mode, setMode] = useState<Mode>('connect');
  const [seeds, setSeeds] = useState<string[]>(DEFAULT_SEEDS);
  const [locks, setLocks] = useState<boolean[]>([false, false]);
  const [rolls, setRolls] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [announce, setAnnounce] = useState('');

  // Spaghetti mode
  const [promptSeed, setPromptSeed] = useState('start');
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SPAGHETTI_SECONDS);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const endsAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read the shared link once the page is in the browser.
  useEffect(() => {
    const q = new URL(location.href).searchParams;
    const m = q.get('mode');
    if (m && (MODES as string[]).includes(m)) setMode(m as Mode);
    const s = q.get('s')?.split('.');
    if (s && s.length === 2 && s.every((x) => /^[a-z0-9]{1,12}$/.test(x))) setSeeds(s);
    const lock = q.get('lock')?.split(',') ?? [];
    setLocks([lock.includes('0'), lock.includes('1')]);
    setSaved(readSaved());
  }, []);

  const writeUrl = (nextMode: Mode, nextSeeds: string[], nextLocks: boolean[]) => {
    const url = new URL(location.href);
    url.searchParams.set('mode', nextMode);
    if (nextMode === 'spaghetti') {
      url.searchParams.delete('s');
      url.searchParams.delete('lock');
    } else {
      url.searchParams.set('s', nextSeeds.join('.'));
      const locked = nextLocks.flatMap((l, i) => (l ? [String(i)] : []));
      if (locked.length) url.searchParams.set('lock', locked.join(','));
      else url.searchParams.delete('lock');
    }
    history.replaceState(null, '', url);
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    writeUrl(next, seeds, locks);
  };

  const slots = mode === 'spaghetti' ? [] : rollSlots(mode, seeds);
  const result = mode === 'spaghetti' ? '' : sentence(mode, slots);

  const roll = () => {
    if (mode === 'spaghetti') return;
    const next = seeds.map((s, i) => (locks[i] ? s : newSeed()));
    setSeeds(next);
    setRolls((n) => n + 1);
    writeUrl(mode, next, locks);
    setAnnounce(sentence(mode, rollSlots(mode, next)));
    track('tool_generate', { tool: TOOL });
  };

  const toggleLock = (i: number) => {
    const next = locks.map((l, j) => (j === i ? !l : l));
    setLocks(next);
    writeUrl(mode, seeds, next);
    setAnnounce(`${slots[i]!.label} ${next[i] ? 'locked' : 'unlocked'}.`);
    if (next[i]) track('tool_lock', { tool: TOOL });
  };

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
    if (saved.includes(result)) return setAnnounce('Already saved.');
    const next = [...saved, result];
    setSaved(next);
    writeSaved(next);
    track('tool_save', { tool: TOOL });
    setAnnounce(`Saved. ${next.length} in your list.`);
  };

  const exportList = (format: 'txt' | 'csv', list: string[]) => {
    if (list.length === 0) return setAnnounce('Nothing to export yet.');
    track('tool_export', { tool: TOOL });
    if (format === 'txt') download('ideas.txt', 'text/plain', list.map((x, i) => `${i + 1}. ${x}`).join('\n') + '\n');
    else download('ideas.csv', 'text/csv', ['number,idea', ...list.map((x, i) => `${i + 1},${csvCell(x)}`)].join('\n') + '\n');
  };

  // --- Spaghetti mode ---
  const start = () => {
    endsAt.current = Date.now() + SPAGHETTI_SECONDS * 1000;
    setSecondsLeft(SPAGHETTI_SECONDS);
    setIdeas([]);
    setFinished(false);
    setRunning(true);
    setPromptSeed(newSeed());
    setAnnounce('Timer started. Five minutes. Go.');
    track('tool_generate', { tool: TOOL });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setRunning(false);
        setFinished(true);
      } else if (left % 60 === 0) {
        setAnnounce(`${left / 60} minute${left === 60 ? '' : 's'} left.`);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (finished) setAnnounce(`Time. You came up with ${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}.`);
  }, [finished]);

  const nextPrompt = () => {
    setPromptSeed(newSeed());
    track('tool_generate', { tool: TOOL });
  };

  const addIdea = (e: Event) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setIdeas((list) => [...list, text]);
    setDraft('');
    inputRef.current?.focus();
  };

  const stop = () => {
    setRunning(false);
    setFinished(true);
  };

  const showSoftPrompt = rolls + ideas.length >= 5;

  return (
    <div class="grid gap-5">
      <div role="group" aria-label="Mode" class="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button type="button" class={`btn !min-h-0 !px-3 !py-2 !text-base ${mode === m ? '' : 'btn-ghost'}`} aria-pressed={mode === m} onClick={() => changeMode(m)}>
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <p class="m-0">{MODE_BLURB[mode]}</p>

      {mode !== 'spaghetti' ? (
        <>
          <ul class="m-0 grid list-none grid-cols-2 gap-3 p-0">
            {slots.map((slot, i) => (
              <li class="sticker grid content-start gap-2 p-3 sm:p-4">
                <span class="eyebrow">{slot.label}</span>
                <span class="break-words font-display text-2xl uppercase leading-tight sm:text-3xl">{slot.value}</span>
                <button type="button" class="btn btn-ghost w-fit !min-h-0 !py-1 !text-base" aria-pressed={locks[i]} onClick={() => toggleLock(i)}>
                  {locks[i] ? 'Locked' : 'Lock'}
                  <span class="visually-hidden"> {slot.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <p class="m-0 font-slab text-2xl font-bold leading-snug">{result}</p>
          <p class="m-0">{QUESTION[mode]}</p>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={roll}>
              Roll again
            </button>
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
          </div>
          {saved.length > 0 && (
            <section class="grid gap-2" aria-label="Saved ideas">
              <h3 class="m-0 !text-xl">Saved on this device ({saved.length})</h3>
              <ol class="m-0 pl-5">
                {saved.map((s) => (
                  <li>{s}</li>
                ))}
              </ol>
              <div class="no-print flex flex-wrap gap-3">
                <button type="button" class="btn btn-ghost" onClick={() => exportList('txt', saved)}>
                  Export text
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => exportList('csv', saved)}>
                  Export CSV
                </button>
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => {
                    setSaved([]);
                    writeSaved([]);
                  }}
                >
                  Clear saved
                </button>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <div class="grid gap-2">
            <p class="m-0 font-display text-5xl leading-none" aria-hidden={running ? 'true' : undefined}>
              {clock(secondsLeft)}
            </p>
            <label class="grid gap-1">
              <span class="eyebrow">
                {ideas.length} of {SPAGHETTI_TARGET} ideas
              </span>
              <progress class="h-4 w-full" max={SPAGHETTI_TARGET} value={Math.min(ideas.length, SPAGHETTI_TARGET)} />
            </label>
          </div>

          {!running && !finished && (
            <button type="button" class="btn w-fit" onClick={start}>
              Start the five minutes
            </button>
          )}

          {(running || finished) && (
            <>
              {running && (
                <div class="sticker grid gap-3 p-4">
                  <span class="eyebrow">Prompt</span>
                  <span class="font-slab text-2xl font-bold leading-snug">{dealPrompt(promptSeed)}</span>
                  <button type="button" class="btn btn-ghost w-fit" onClick={nextPrompt}>
                    Next prompt
                  </button>
                </div>
              )}
              {running && (
                <form class="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={addIdea}>
                  <label class="grid gap-1">
                    <span class="font-bold">Type an idea and press Enter</span>
                    <input ref={inputRef} class="field" type="text" value={draft} onInput={(e) => setDraft((e.target as HTMLInputElement).value)} autocomplete="off" />
                  </label>
                  <button type="submit" class="btn self-end">
                    Add
                  </button>
                </form>
              )}
              {finished && (
                <p class="m-0 font-slab text-2xl font-bold">
                  Time. {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
                  {ideas.length >= SPAGHETTI_TARGET ? ', and you hit the target.' : '.'}
                </p>
              )}
              {ideas.length > 0 && (
                <ol class="m-0 grid gap-1 pl-5">
                  {ideas.map((x) => (
                    <li>{x}</li>
                  ))}
                </ol>
              )}
              <div class="no-print flex flex-wrap gap-3">
                {running && (
                  <button type="button" class="btn btn-ghost" onClick={stop}>
                    Stop
                  </button>
                )}
                {finished && (
                  <button type="button" class="btn" onClick={start}>
                    Go again
                  </button>
                )}
                <button type="button" class="btn btn-ghost" onClick={() => copyText(ideas.map((x, i) => `${i + 1}. ${x}`).join('\n'), 'List copied.')} disabled={ideas.length === 0}>
                  Copy list
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => exportList('txt', ideas)} disabled={ideas.length === 0}>
                  Export text
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => exportList('csv', ideas)} disabled={ideas.length === 0}>
                  Export CSV
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
                  Print
                </button>
              </div>
            </>
          )}
        </>
      )}

      {showSoftPrompt && (
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
