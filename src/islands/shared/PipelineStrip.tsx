import { useEffect, useState } from 'preact/hooks';
import { getNotes, onNotebookChange, type Note } from '../../lib/notebook';

type Step = 'generate' | 'pile' | 'choose' | 'launch';

interface Props {
  /** The step the page you are on belongs to, if any. */
  current?: Step;
  /** Paths of pages that exist in this build, so a step only links to a page that does. */
  livePaths: string[];
}

const STEPS: { id: Step; label: string; path: string }[] = [
  { id: 'generate', label: 'Generate', path: '/tools/' },
  { id: 'pile', label: 'Pile up', path: '/games/idea-spaghetti/' },
  { id: 'choose', label: 'Choose', path: '/games/kill-the-idea/' },
  { id: 'launch', label: 'Launch', path: '/games/blast-off/' },
];

const PILE_SOURCES = ['idea-spaghetti', 'inspiral'];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The book's path from idea to launch, with counts from the browser-only notebook and one
 * suggested next step. It renders the four steps on the server and fills in the counts in the
 * browser, so the page reads fine without JavaScript.
 */
export default function PipelineStrip({ current, livePaths }: Props) {
  const [notes, setNotes] = useState<Note[] | null>(null);

  useEffect(() => {
    const refresh = () => setNotes(getNotes().filter((n) => n.kind !== 'problem'));
    refresh();
    return onNotebookChange(refresh);
  }, []);

  const count = (step: Step): string => {
    if (!notes) return '';
    if (step === 'generate') return plural(notes.length, 'idea', 'ideas');
    if (step === 'pile') return plural(notes.filter((n) => PILE_SOURCES.includes(n.source)).length, 'idea', 'ideas');
    if (step === 'choose') return `${notes.filter((n) => n.stage === 'shortlisted').length} shortlisted`;
    return `${notes.filter((n) => n.stage === 'launched').length} launched`;
  };

  const next = (): string => {
    if (!notes) return '';
    const fresh = notes.filter((n) => n.stage === 'new').length;
    const short = notes.filter((n) => n.stage === 'shortlisted').length;
    if (short > 0) return `${plural(short, 'idea is', 'ideas are')} shortlisted. Launch one with Blast Off.`;
    if (fresh >= 3) return `${fresh} ideas are waiting. Choose between them with Kill the Idea.`;
    if (notes.length > 0) return 'Pile up more ideas with Idea Spaghetti, then choose between them.';
    return 'Make some ideas with a generator and save them to your notebook.';
  };

  return (
    <nav aria-label="The path from idea to launch" class="no-print mb-5 grid gap-2">
      <ol class="m-0 flex list-none flex-wrap gap-2 p-0">
        {STEPS.map((s, i) => {
          const live = livePaths.includes(s.path);
          const here = s.id === current;
          return (
            <li class={`sticker px-3 py-1 ${here ? 'fill' : ''}`} aria-current={here ? 'step' : undefined}>
              <span class="font-bold">
                {`${i + 1}. `}
                {live && !here ? <a href={s.path}>{s.label}</a> : s.label}
              </span>
              {count(s.id) && <span class="text-sm"> ({count(s.id)})</span>}
            </li>
          );
        })}
      </ol>
      {notes && (
        <p class="m-0" aria-live="polite">
          <strong>Next:</strong> {next()} {current && livePaths.includes('/notebook/') && <a href="/notebook/">Open the notebook</a>}
        </p>
      )}
    </nav>
  );
}
