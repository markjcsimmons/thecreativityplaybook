import { useEffect, useState } from 'preact/hooks';
import { STAGE_LABELS, getNotes, sourceLabel, takeHandoff, type Note, type Stage } from '../../lib/notebook';

interface Props {
  /** Pick problems instead of ideas (the Problem Reframing game saves problems). */
  kind?: 'idea' | 'problem';
  /** Choose exactly one, with radio buttons. */
  single?: boolean;
  /** Most that can be picked. */
  max?: number;
  /** Game id. Ideas sent from the notebook page for this game are loaded when it opens. */
  handoffGame?: string;
  /** Ideas at this stage are ticked first when the panel opens. */
  preferStage?: Stage;
  onPick: (texts: string[]) => void;
}

/**
 * "Pick from your notebook" for a game's input box. Reads the browser-only notebook, lets the
 * player tick ideas, and hands the chosen text to the game. Renders nothing when the notebook
 * has nothing of the right kind.
 */
export default function NotebookPicker({ kind = 'idea', single = false, max = 30, handoffGame, preferStage, onPick }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const mine = getNotes().filter((n) => (n.kind === 'problem') === (kind === 'problem'));
    setNotes(mine);
    if (!handoffGame) return;
    const sent = takeHandoff(handoffGame).filter((n) => (n.kind === 'problem') === (kind === 'problem')).slice(0, max);
    if (sent.length > 0) {
      onPick(sent.map((n) => n.text));
      setChecked(sent.map((n) => n.id));
      setMessage(`Loaded ${sent.length} ${sent.length === 1 ? 'idea' : 'ideas'} from your notebook.`);
    }
  }, []);

  if (notes.length === 0) return null;
  const noun = kind === 'problem' ? 'problem' : 'idea';

  const toggle = () => {
    if (!open && checked.length === 0 && preferStage) {
      const first = notes.filter((n) => n.stage === preferStage).slice(0, single ? 1 : max);
      setChecked(first.map((n) => n.id));
    }
    setOpen(!open);
  };

  const tick = (id: string, on: boolean) => setChecked(single ? (on ? [id] : []) : on ? [...checked, id] : checked.filter((x) => x !== id));

  const use = () => {
    const chosen = notes.filter((n) => checked.includes(n.id));
    if (chosen.length === 0) return setMessage(`Tick at least one ${noun} first.`);
    onPick(chosen.map((n) => n.text));
    setMessage(`Added ${chosen.length} from your notebook.`);
    setOpen(false);
  };

  return (
    <div class="no-print grid gap-2">
      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="btn btn-ghost" aria-expanded={open} onClick={toggle}>
          {single ? `Use a saved ${noun}` : `Pick from your notebook (${notes.length})`}
        </button>
        <span role="status" aria-live="polite">
          {message}
        </span>
      </div>
      {open && (
        <fieldset class="sticker m-0 grid gap-2 p-3">
          <legend class="px-1 font-bold">{single ? `Choose a ${noun}` : `Tick up to ${max}`}</legend>
          <ul class="m-0 grid max-h-72 list-none gap-2 overflow-y-auto p-0">
            {notes.map((n) => (
              <li key={n.id}>
                <label class="flex items-start gap-2">
                  <input
                    class="mt-1"
                    type={single ? 'radio' : 'checkbox'}
                    name="notebook-pick"
                    checked={checked.includes(n.id)}
                    disabled={!single && !checked.includes(n.id) && checked.length >= max}
                    onChange={(e) => tick(n.id, (e.target as HTMLInputElement).checked)}
                  />
                  <span class="min-w-0 break-words">
                    {n.text} <span class="text-sm">({sourceLabel(n.source)}, {STAGE_LABELS[n.stage].toLowerCase()})</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div class="flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={use}>
              {single ? `Use this ${noun}` : 'Use these'}
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
}
