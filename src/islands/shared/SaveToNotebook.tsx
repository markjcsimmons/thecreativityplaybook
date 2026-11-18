import { useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { addNotes, type NewNote } from '../../lib/notebook';

interface Props {
  /** Tool id, e.g. "kill-the-idea". Also the name the visit counter records. */
  source: string;
  items: Omit<NewNote, 'source'>[];
  label?: string;
}

/**
 * "Save to notebook" for a finished game. Nothing is saved until the player presses it, so the
 * games' promise that nothing is stored without a click stays true.
 */
export default function SaveToNotebook({ source, items, label = 'Save to notebook' }: Props) {
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => {
    const r = addNotes(items.map((i) => ({ ...i, source })));
    track('tool_save', { tool: source });
    if (r.added > 0) {
      setSaved(true);
      setMessage(`Saved ${r.added} to your notebook${r.duplicates ? ` (${r.duplicates} already there)` : ''}.`);
    } else if (r.duplicates > 0) {
      setSaved(true);
      setMessage('Already in your notebook.');
    } else {
      setSaved(false);
      setMessage('The notebook is full, or this browser is blocking storage.');
    }
  };

  return (
    <>
      <button type="button" class="btn" disabled={items.length === 0} onClick={save}>
        {label}
      </button>
      <span class="self-center" role="status" aria-live="polite">
        {message}
        {saved && (
          <>
            {' '}
            <a href="/notebook/">Open the notebook</a>
          </>
        )}
      </span>
    </>
  );
}
