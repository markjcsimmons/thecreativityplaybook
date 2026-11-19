import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import {
  MAX_NOTES,
  STAGES,
  STAGE_LABELS,
  addNotes,
  clearNotes,
  exportJson,
  getNotes,
  importJson,
  onNotebookChange,
  removeNote,
  setHandoff,
  sourceLabel,
  updateNote,
  type Note,
  type Stage,
} from '../../lib/notebook';
import { MAX_IDEAS, MIN_IDEAS } from '../../lib/kill-the-idea';
import { csvCell, download } from '../../lib/tool-client';

/**
 * The Idea Notebook. Every tool and game saves here, and the ideas live in this browser only
 * (src/lib/notebook.ts). You can add, edit, search, sort, export, back up and restore them.
 */
const TOOL = 'notebook';
type Sort = 'newest' | 'oldest' | 'alpha';

const when = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Notebook({ livePaths = [] }: { livePaths?: string[] }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [stage, setStage] = useState<'all' | Stage>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editNote, setEditNote] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setNotes(getNotes());
    refresh();
    setLoaded(true);
    return onNotebookChange(refresh);
  }, []);

  const sources = useMemo(() => [...new Set(notes.map((n) => n.source))].sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b))), [notes]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = notes.filter(
      (n) =>
        (source === 'all' || n.source === source) &&
        (stage === 'all' || n.stage === stage) &&
        (!q || n.text.toLowerCase().includes(q) || (n.note ?? '').toLowerCase().includes(q)),
    );
    if (sort === 'alpha') return list.sort((a, b) => a.text.localeCompare(b.text));
    // Notes are stored oldest first, so "newest" reverses them (a stable sort keeps batches in order).
    return sort === 'newest' ? list.slice().reverse() : list;
  }, [notes, query, source, stage, sort]);

  const add = (e: Event) => {
    e.preventDefault();
    const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return setAnnounce('Type an idea first.');
    const r = addNotes(lines.map((text) => ({ text, source: TOOL })));
    if (r.added > 0) {
      track('tool_save', { tool: TOOL });
      setDraft('');
      setAnnounce(`Added ${r.added}${r.duplicates ? `, ${r.duplicates} already there` : ''}.`);
    } else if (r.duplicates > 0) setAnnounce('Already in your notebook.');
    else setAnnounce(`The notebook holds ${MAX_NOTES} ideas at most, or this browser is blocking storage.`);
  };

  const startEdit = (n: Note) => {
    setEditing(n.id);
    setEditText(n.text);
    setEditNote(n.note ?? '');
  };
  const saveEdit = () => {
    if (!editing) return;
    if (!editText.trim()) return setAnnounce('An idea needs some text. Delete it instead if you do not want it.');
    updateNote(editing, { text: editText, note: editNote });
    setEditing(null);
    setAnnounce('Saved.');
  };

  const exportText = () => {
    if (shown.length === 0) return setAnnounce('Nothing to export.');
    track('tool_export', { tool: TOOL });
    const body = shown.map((n, i) => `${i + 1}. ${n.text}  [${sourceLabel(n.source)}, ${STAGE_LABELS[n.stage].toLowerCase()}]${n.note ? '\n' + n.note.split('\n').map((l) => `     ${l}`).join('\n') : ''}`).join('\n');
    download('idea-notebook.txt', 'text/plain', body + '\n');
  };
  const exportCsv = () => {
    if (shown.length === 0) return setAnnounce('Nothing to export.');
    track('tool_export', { tool: TOOL });
    const rows = shown.map((n, i) => [i + 1, csvCell(n.text), csvCell(sourceLabel(n.source)), STAGE_LABELS[n.stage], n.added.slice(0, 10), csvCell(n.note ?? '')].join(','));
    download('idea-notebook.csv', 'text/csv', ['number,idea,source,stage,date,notes', ...rows].join('\n') + '\n');
  };
  const backup = () => {
    if (notes.length === 0) return setAnnounce('Nothing to back up.');
    track('tool_export', { tool: TOOL });
    download('idea-notebook-backup.json', 'application/json', exportJson(notes) + '\n');
  };
  const restore = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 5_000_000) return setAnnounce('That file is too big to be a notebook backup.');
    const r = importJson(await file.text());
    if (!r) return setAnnounce('That file is not a notebook backup.');
    setAnnounce(`Restored ${r.added} ${r.added === 1 ? 'idea' : 'ideas'}${r.duplicates ? `, ${r.duplicates} already there` : ''}${r.failed ? `, ${r.failed} did not fit` : ''}.`);
  };

  const canSend = (path: string) => livePaths.includes(path);
  const send = (game: string) => {
    setHandoff(game, picked);
    location.href = `/games/${game}/`;
  };
  const togglePick = (id: string, on: boolean) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id));
  const killOk = picked.length >= MIN_IDEAS && picked.length <= MAX_IDEAS;

  const clearAll = () => {
    if (!confirmClear) return setConfirmClear(true);
    clearNotes();
    setConfirmClear(false);
    setAnnounce('Notebook cleared.');
  };

  if (!loaded) return <p class="m-0">Your notebook opens here. It needs JavaScript, because your ideas are kept in this browser.</p>;

  return (
    <div class="grid gap-5">
      <form class="no-print grid gap-2" onSubmit={add}>
        <label class="grid gap-1">
          <span class="font-bold">Add an idea. One per line adds several at once.</span>
          <textarea class="field" rows={3} value={draft} onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)} />
        </label>
        <button type="submit" class="btn w-fit">
          Add to notebook
        </button>
      </form>

      {notes.length === 0 ? (
        <div class="grid gap-2 border-t-4 border-ink pt-4">
          <p class="m-0 font-slab text-2xl font-bold leading-snug">Your notebook is empty.</p>
          <p class="m-0">
            Save an idea from any <a href="/tools/">tool</a> or <a href="/games/">game</a>, or type one above. Everything stays in this browser.
          </p>
        </div>
      ) : (
        <>
          <div class="no-print grid gap-3 border-t-4 border-ink pt-4 sm:grid-cols-2">
            <label class="grid gap-1 sm:col-span-2">
              <span class="font-bold">Search your ideas</span>
              <input class="field" type="search" value={query} onInput={(e) => setQuery((e.target as HTMLInputElement).value)} autocomplete="off" />
            </label>
            <label class="grid gap-1">
              <span class="font-bold">From</span>
              <select class="field" value={source} onChange={(e) => setSource((e.target as HTMLSelectElement).value)}>
                <option value="all">Everywhere</option>
                {sources.map((s) => (
                  <option value={s}>{sourceLabel(s)}</option>
                ))}
              </select>
            </label>
            <label class="grid gap-1">
              <span class="font-bold">Stage</span>
              <select class="field" value={stage} onChange={(e) => setStage((e.target as HTMLSelectElement).value as 'all' | Stage)}>
                <option value="all">Any stage</option>
                {STAGES.map((s) => (
                  <option value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label class="grid gap-1">
              <span class="font-bold">Order</span>
              <select class="field" value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as Sort)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="alpha">A to Z</option>
              </select>
            </label>
          </div>

          <p class="m-0 font-bold" aria-live="polite">
            {shown.length === notes.length ? `${notes.length} ${notes.length === 1 ? 'idea' : 'ideas'}` : `Showing ${shown.length} of ${notes.length}`}
            <span class="font-normal"> (the notebook holds up to {MAX_NOTES})</span>
          </p>

          {(canSend('/games/kill-the-idea/') || canSend('/games/blast-off/')) && (
            <div class="no-print grid gap-2">
              {!picking ? (
                <button type="button" class="btn btn-ghost w-fit" onClick={() => setPicking(true)}>
                  Pick ideas to work on
                </button>
              ) : (
                <div class="sticker grid gap-2 p-3">
                  <p class="m-0 font-bold" aria-live="polite">
                    {picked.length} picked. Tick ideas below, then send them to a game.
                  </p>
                  <div class="flex flex-wrap gap-3">
                    {canSend('/games/kill-the-idea/') && (
                      <button type="button" class="btn" disabled={!killOk} onClick={() => send('kill-the-idea')}>
                        Choose: send to Kill the Idea
                      </button>
                    )}
                    {canSend('/games/blast-off/') && (
                      <button type="button" class="btn" disabled={picked.length === 0} onClick={() => send('blast-off')}>
                        Launch: send to Blast Off
                      </button>
                    )}
                    <button
                      type="button"
                      class="btn btn-ghost"
                      onClick={() => {
                        setPicking(false);
                        setPicked([]);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <p class="m-0 text-sm">Kill the Idea needs {MIN_IDEAS} to {MAX_IDEAS} ideas. Blast Off takes any number and asks you to choose one.</p>
                </div>
              )}
            </div>
          )}

          <ol class="m-0 grid list-none gap-3 p-0">
            {shown.map((n) => (
              <li class="sticker grid gap-2 p-3" key={n.id}>
                {editing === n.id ? (
                  <div class="grid gap-2">
                    <label class="grid gap-1">
                      <span class="font-bold">Idea</span>
                      <textarea class="field" rows={2} value={editText} onInput={(e) => setEditText((e.target as HTMLTextAreaElement).value)} />
                    </label>
                    <label class="grid gap-1">
                      <span class="font-bold">Notes (optional)</span>
                      <textarea class="field" rows={3} value={editNote} onInput={(e) => setEditNote((e.target as HTMLTextAreaElement).value)} />
                    </label>
                    <div class="flex flex-wrap gap-3">
                      <button type="button" class="btn" onClick={saveEdit}>
                        Save
                      </button>
                      <button type="button" class="btn btn-ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {picking && n.kind !== 'problem' && (
                      <label class="no-print flex w-fit items-center gap-2 font-bold">
                        <input type="checkbox" checked={picked.includes(n.id)} onChange={(e) => togglePick(n.id, (e.target as HTMLInputElement).checked)} />
                        Pick<span class="visually-hidden">: {n.text}</span>
                      </label>
                    )}
                    <p class="m-0 break-words font-slab text-xl font-bold leading-snug">{n.text}</p>
                    <p class="m-0 text-sm">
                      {n.kind === 'problem' ? 'Problem \u00b7 ' : ''}{sourceLabel(n.source)} &middot; {when(n.added)} &middot; {STAGE_LABELS[n.stage]}
                    </p>
                    {n.note && (
                      <details>
                        <summary class="cursor-pointer font-bold">Notes</summary>
                        <p class="m-0 mt-1 whitespace-pre-wrap break-words">{n.note}</p>
                      </details>
                    )}
                    <div class="no-print flex flex-wrap items-center gap-3">
                      <label class="flex items-center gap-2">
                        <span class="font-bold">Stage</span>
                        <select class="field !w-auto" value={n.stage} onChange={(e) => updateNote(n.id, { stage: (e.target as HTMLSelectElement).value as Stage })}>
                          {STAGES.map((s) => (
                            <option value={s}>{STAGE_LABELS[s]}</option>
                          ))}
                        </select>
                      </label>
                      <button type="button" class="btn btn-ghost" onClick={() => startEdit(n)}>
                        Edit<span class="visually-hidden">: {n.text}</span>
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost"
                        onClick={() => {
                          removeNote(n.id);
                          setAnnounce('Deleted.');
                        }}
                      >
                        Delete<span class="visually-hidden">: {n.text}</span>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>

          <div class="no-print grid gap-3 border-t-4 border-ink pt-4">
            <p class="m-0 font-bold">Take your ideas with you</p>
            <div class="flex flex-wrap gap-3">
              <button type="button" class="btn btn-ghost" onClick={exportText}>
                Export text
              </button>
              <button type="button" class="btn btn-ghost" onClick={exportCsv}>
                Export CSV
              </button>
              <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
                Print
              </button>
              <button type="button" class="btn btn-ghost" onClick={backup}>
                Back up
              </button>
              <button type="button" class="btn btn-ghost" onClick={() => fileRef.current?.click()}>
                Restore a backup
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" class="visually-hidden" tabIndex={-1} aria-label="Choose a notebook backup file" onChange={restore} />
              <button type="button" class="btn btn-ghost" onClick={clearAll}>
                {confirmClear ? 'Press again to delete every idea' : 'Clear the notebook'}
              </button>
              {confirmClear && (
                <button type="button" class="btn btn-ghost" onClick={() => setConfirmClear(false)}>
                  Keep my ideas
                </button>
              )}
            </div>
            <p class="m-0 text-sm">Export text, Export CSV and Print use the ideas shown above. Back up always holds every idea.</p>
          </div>
        </>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
