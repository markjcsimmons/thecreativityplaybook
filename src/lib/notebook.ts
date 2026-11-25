/**
 * The Idea Notebook: one list of ideas that every tool and game saves into, kept in this
 * browser's localStorage and nowhere else (no accounts, nothing sent to us). Every call is
 * safe without storage: reads return an empty list and writes do nothing.
 *
 * The tools' older per-tool saved lists (`cp:<tool>:saved`) are folded in the first time the
 * notebook is read, and from then on `readList`/`writeList` in tool-client.ts route those keys
 * here, so a tool's "Saved on this device" panel is a view of the notebook.
 */

export const NOTEBOOK_KEY = 'cp:notebook:v1';
const MIGRATED_KEY = 'cp:notebook:migrated';
/** Changes inside this tab are announced with this event; other tabs use the `storage` event. */
export const NOTEBOOK_EVENT = 'cp:notebook';

export const MAX_NOTES = 500;
export const MAX_TEXT = 1000;
export const MAX_NOTE = 4000;

export const STAGES = ['new', 'shortlisted', 'launched', 'set-aside'] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = { new: 'New', shortlisted: 'Shortlisted', launched: 'Launched', 'set-aside': 'Set aside' };

/** An entry is an idea unless a tool saved it as a problem (the Problem Reframing game does). */
export type Kind = 'idea' | 'problem';

export interface Note {
  id: string;
  text: string;
  /** Tool id the idea came from, or "notebook" when it was typed in here. */
  source: string;
  /** ISO date-time. */
  added: string;
  stage: Stage;
  /** Optional extra text, such as a launch plan or the problem the idea answers. */
  note?: string;
  /** Only present for problems; everything else is an idea. */
  kind?: 'problem';
}

/** What a tool passes when it saves an idea. */
export interface NewNote {
  text: string;
  source: string;
  note?: string;
  stage?: Stage;
  kind?: Kind;
}

export const SOURCE_LABELS: Record<string, string> = {
  notebook: 'Typed here',
  'random-idea-generator': 'Random Idea Generator',
  'business-idea-generator': 'Business Idea Generator',
  'invention-idea-generator': 'Product Idea Generator',
  'attribute-listing': 'Attribute Listing',
  'idea-spaghetti': 'Idea Spaghetti game',
  inspiral: 'Inspiral game',
  'kill-the-idea': 'Kill the Idea game',
  'blast-off': 'Idea Launch game',
  'shoe-swapper': 'Shoe Swapper game',
  'brain-flash': 'Brain Flash game',
  'whats-your-problem': 'Problem Reframing game',
  'all-together-now': 'Brainwriting game',
  'wheel-of-distraction': 'Wheel of Distraction',
  'far-out': 'Paperclip game',
  'idea-scorer': 'Idea Scorer',
  'perspective-cards': 'Perspective Cards',
  'reverse-brainstorm': 'Reverse Brainstorm',
  'empathy-map': 'Empathy Map',
};
export const sourceLabel = (source: string) => SOURCE_LABELS[source] ?? source;

const hasWindow = () => typeof window !== 'undefined';
const clean = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max);
const sameText = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const isStage = (s: unknown): s is Stage => (STAGES as readonly unknown[]).includes(s);

const newId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
};

/** Accepts anything and keeps only well-formed notes (a restored backup is untrusted input). */
function parseNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  const out: Note[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    if (typeof o.text !== 'string' || !o.text.trim()) continue;
    const added = typeof o.added === 'string' && !Number.isNaN(Date.parse(o.added)) ? o.added : new Date().toISOString();
    const note = typeof o.note === 'string' && o.note.trim() ? o.note.slice(0, MAX_NOTE) : undefined;
    out.push({
      id: typeof o.id === 'string' && o.id ? o.id.slice(0, 64) : newId(),
      text: clean(o.text, MAX_TEXT),
      source: typeof o.source === 'string' && o.source ? o.source.slice(0, 64) : 'notebook',
      added,
      stage: isStage(o.stage) ? o.stage : 'new',
      ...(note ? { note } : {}),
      ...(o.kind === 'problem' ? { kind: 'problem' as const } : {}),
    });
  }
  return out;
}

const readRaw = (): Note[] => {
  if (!hasWindow()) return [];
  try {
    return parseNotes(JSON.parse(localStorage.getItem(NOTEBOOK_KEY) ?? '[]'));
  } catch {
    return [];
  }
};

/** Returns false when the browser refused the write (full or blocked storage). */
const writeRaw = (notes: Note[]): boolean => {
  if (!hasWindow()) return false;
  try {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(notes));
  } catch {
    return false;
  }
  try {
    window.dispatchEvent(new Event(NOTEBOOK_EVENT));
  } catch {
    /* nothing is listening */
  }
  return true;
};

/** Folds the old per-tool saved lists into the notebook, once. */
function migrate(): void {
  if (!hasWindow()) return;
  try {
    if (localStorage.getItem(MIGRATED_KEY) !== null) return;
    const legacy: { key: string; source: string; items: string[] }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? '';
      const m = /^cp:([a-z0-9-]+):saved$/.exec(key);
      if (!m) continue;
      try {
        const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
        if (Array.isArray(raw)) legacy.push({ key, source: m[1]!, items: raw.filter((x): x is string => typeof x === 'string') });
      } catch {
        /* skip an unreadable list */
      }
    }
    const notes = readRaw();
    for (const l of legacy) {
      for (const text of l.items) {
        const t = clean(text, MAX_TEXT);
        if (!t || notes.some((n) => n.source === l.source && sameText(n.text, t)) || notes.length >= MAX_NOTES) continue;
        notes.push({ id: newId(), text: t, source: l.source, added: new Date().toISOString(), stage: 'new' });
      }
    }
    if (legacy.length > 0 && !writeRaw(notes)) return; // keep the old lists if the copy failed
    for (const l of legacy) localStorage.removeItem(l.key);
    localStorage.setItem(MIGRATED_KEY, '1');
  } catch {
    /* storage blocked: the notebook just starts empty */
  }
}

export const getNotes = (): Note[] => {
  migrate();
  return readRaw();
};

export interface AddResult {
  added: number;
  /** Already in the notebook from the same tool. */
  duplicates: number;
  /** Not saved because the notebook is full or the browser refused the write. */
  failed: number;
}

export function addNotes(items: NewNote[]): AddResult {
  const notes = getNotes();
  const result: AddResult = { added: 0, duplicates: 0, failed: 0 };
  const now = new Date().toISOString();
  for (const item of items) {
    const text = clean(item.text, MAX_TEXT);
    if (!text) continue;
    if (notes.some((n) => n.source === item.source && sameText(n.text, text))) {
      result.duplicates++;
      continue;
    }
    if (notes.length >= MAX_NOTES) {
      result.failed++;
      continue;
    }
    const note = item.note?.trim() ? item.note.trim().slice(0, MAX_NOTE) : undefined;
    notes.push({ id: newId(), text, source: item.source, added: now, stage: item.stage ?? 'new', ...(note ? { note } : {}), ...(item.kind === 'problem' ? { kind: 'problem' as const } : {}) });
    result.added++;
  }
  if (result.added > 0 && !writeRaw(notes)) {
    result.failed += result.added;
    result.added = 0;
  }
  return result;
}

export interface UpsertResult {
  added: number;
  updated: number;
  unchanged: number;
  failed: number;
}

/** A finished tool outranks an earlier one: a launched idea is never moved back to shortlisted. */
const keepsStage = (current: Stage, next: Stage) => current === 'launched' && next !== 'launched';

/**
 * Saves a tool's results, updating the notebook entry with the same text (from any tool) instead
 * of adding a copy: the stage moves on, and a note such as a launch plan is attached. Anything
 * not in the notebook yet is added.
 */
export function upsertNotes(items: NewNote[]): UpsertResult {
  const notes = getNotes();
  const r: UpsertResult = { added: 0, updated: 0, unchanged: 0, failed: 0 };
  const now = new Date().toISOString();
  for (const item of items) {
    const text = clean(item.text, MAX_TEXT);
    if (!text) continue;
    const problem = item.kind === 'problem';
    const extra = item.note?.trim();
    const hit = notes.find((n) => sameText(n.text, text) && (n.kind === 'problem') === problem);
    if (hit) {
      let changed = false;
      if (item.stage && item.stage !== hit.stage && !keepsStage(hit.stage, item.stage)) {
        hit.stage = item.stage;
        changed = true;
      }
      if (extra && !(hit.note ?? '').includes(extra)) {
        hit.note = `${hit.note ? hit.note + '\n\n' : ''}${extra}`.slice(0, MAX_NOTE);
        changed = true;
      }
      if (changed) r.updated++;
      else r.unchanged++;
    } else if (notes.length >= MAX_NOTES) {
      r.failed++;
    } else {
      notes.push({ id: newId(), text, source: item.source, added: now, stage: item.stage ?? 'new', ...(extra ? { note: extra.slice(0, MAX_NOTE) } : {}), ...(problem ? { kind: 'problem' as const } : {}) });
      r.added++;
    }
  }
  if (r.added + r.updated > 0 && !writeRaw(notes)) {
    r.failed += r.added + r.updated;
    r.added = 0;
    r.updated = 0;
  }
  return r;
}

export function updateNote(id: string, patch: Partial<Pick<Note, 'text' | 'stage' | 'note'>>): void {
  const notes = getNotes().map((n) => {
    if (n.id !== id) return n;
    const next = { ...n };
    if (typeof patch.text === 'string' && patch.text.trim()) next.text = clean(patch.text, MAX_TEXT);
    if (isStage(patch.stage)) next.stage = patch.stage;
    if (typeof patch.note === 'string') {
      const t = patch.note.trim().slice(0, MAX_NOTE);
      if (t) next.note = t;
      else delete next.note;
    }
    return next;
  });
  writeRaw(notes);
}

export const removeNote = (id: string): void => void writeRaw(getNotes().filter((n) => n.id !== id));
export const clearNotes = (): void => void writeRaw([]);

/** A tool's saved list is its notes, as plain strings. */
export const readSaved = (source: string): string[] => getNotes().filter((n) => n.source === source).map((n) => n.text);

/** Makes a tool's notes match `texts`: drops the ones no longer listed, adds the new ones. */
export function writeSaved(source: string, texts: string[]): void {
  const wanted = texts.map((t) => clean(t, MAX_TEXT)).filter(Boolean);
  const kept = getNotes().filter((n) => n.source !== source || wanted.some((t) => sameText(t, n.text)));
  if (kept.length !== getNotes().length) writeRaw(kept);
  addNotes(wanted.map((text) => ({ text, source })));
}

export const SAVED_KEY_PATTERN = /^cp:([a-z0-9-]+):saved$/;

/** Backup file: the notes plus a version, so a later format can be told apart. */
export const exportJson = (notes: Note[]): string => JSON.stringify({ app: 'creativity-playbook-notebook', version: 1, notes }, null, 2);

/** Restores a backup. Returns how many notes were new, or null when the file is not a backup. */
export function importJson(text: string): AddResult | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const list = Array.isArray(data) ? data : data && typeof data === 'object' ? (data as { notes?: unknown }).notes : undefined;
  if (!Array.isArray(list)) return null;
  const incoming = parseNotes(list);
  const notes = getNotes();
  const result: AddResult = { added: 0, duplicates: 0, failed: 0 };
  for (const n of incoming) {
    if (notes.some((m) => m.source === n.source && sameText(m.text, n.text))) result.duplicates++;
    else if (notes.length >= MAX_NOTES) result.failed++;
    else {
      notes.push({ ...n, id: notes.some((m) => m.id === n.id) ? newId() : n.id });
      result.added++;
    }
  }
  if (result.added > 0 && !writeRaw(notes)) {
    result.failed += result.added;
    result.added = 0;
  }
  return result;
}

/** Calls `fn` whenever the notebook changes, in this tab or another. Returns the unsubscribe. */
export function onNotebookChange(fn: () => void): () => void {
  if (!hasWindow()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === NOTEBOOK_KEY) fn();
  };
  window.addEventListener(NOTEBOOK_EVENT, fn);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(NOTEBOOK_EVENT, fn);
    window.removeEventListener('storage', onStorage);
  };
}

// --- Hand-off: the notebook page sends picked ideas to a game, which takes them once. ---
const HANDOFF_KEY = 'cp:handoff:v1';
const HANDOFF_MAX_AGE_MS = 10 * 60 * 1000;

export function setHandoff(game: string, ids: string[]): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify({ game, ids, at: Date.now() }));
  } catch {
    /* the player can still pick the ideas by hand in the game */
  }
}

/** Returns the notes sent to this game and clears the hand-off, so a reload does not repeat it. */
export function takeHandoff(game: string): Note[] {
  if (!hasWindow()) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(HANDOFF_KEY) ?? 'null') as { game?: unknown; ids?: unknown; at?: unknown } | null;
    if (!raw || raw.game !== game) return [];
    localStorage.removeItem(HANDOFF_KEY);
    if (!Array.isArray(raw.ids) || typeof raw.at !== 'number' || Date.now() - raw.at > HANDOFF_MAX_AGE_MS) return [];
    const all = getNotes();
    return raw.ids.flatMap((id) => all.filter((n) => n.id === id));
  } catch {
    return [];
  }
}
