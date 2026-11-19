import { useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { upsertNotes, type NewNote } from '../../lib/notebook';

interface Props {
  /** Tool id, e.g. "kill-the-idea". Also the name the visit counter records. */
  source: string;
  items: Omit<NewNote, 'source'>[];
  label?: string;
}

/**
 * "Save to notebook" for a finished game. Nothing is saved until the player presses it, so the
 * games' promise that nothing is stored without a click stays true. An idea already in the
 * notebook is updated (its stage moves on, a launch plan is attached) instead of copied.
 */
export default function SaveToNotebook({ source, items, label = 'Save to notebook' }: Props) {
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => {
    const r = upsertNotes(items.map((i) => ({ ...i, source })));
    track('tool_save', { tool: source });
    const parts = [r.added > 0 && `${r.added} new`, r.updated > 0 && `${r.updated} updated`].filter(Boolean);
    if (parts.length > 0) {
      setSaved(true);
      setMessage(`Saved to your notebook: ${parts.join(', ')}.`);
    } else if (r.unchanged > 0) {
      setSaved(true);
      setMessage('Already up to date in your notebook.');
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
