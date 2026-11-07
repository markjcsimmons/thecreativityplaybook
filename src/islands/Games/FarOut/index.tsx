import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { splitLines } from '../../../lib/game-utils';
import { COMMON, OFF_LIST, ON_LIST, WORKED_EXAMPLE, spaces } from '../../../lib/far-out';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * Far Out (Ch8). Write down uses for a paperclip, then check each one against the book's list of
 * common suggestions: one space for an idea on the list, two for an idea that is not. Whether an
 * idea is on the list is the player's call. Nothing leaves the browser and nothing is stored.
 */
const TOOL = 'far-out';
type Idea = { text: string; onList: boolean };

export default function FarOut({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [text, setText] = useState('');
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [announce, setAnnounce] = useState('');

  const lines = splitLines(text);
  const total = ideas ? spaces(ideas) : 0;

  const check = () => {
    if (!lines.length) return;
    setIdeas(lines.map((t) => ({ text: t, onList: false })));
    track('tool_generate', { tool: TOOL });
  };

  const toggle = (i: number) => setIdeas((list) => list!.map((x, j) => (j === i ? { ...x, onList: !x.onList } : x)));

  const copy = async () => {
    const body = [...ideas!.map((x, i) => `${i + 1}. ${x.text}${x.onList ? ' (on the list, 1 space)' : ' (not on the list, 2 spaces)'}`), `Total: ${total} spaces`].join('\n');
    try {
      await navigator.clipboard.writeText(body);
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {!ideas && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">Things to do with a paperclip, one per line</span>
            <textarea class="field" rows={8} value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} />
          </label>
          <p class="m-0" aria-live="polite">
            {lines.length} {lines.length === 1 ? 'idea' : 'ideas'}
          </p>
          <button type="button" class="btn w-fit" disabled={!lines.length} onClick={check}>
            Done: check against the book&rsquo;s list
          </button>
        </div>
      )}

      {ideas && (
        <div class="grid gap-4">
          <p class="m-0">
            Here is the book&rsquo;s list of ideas people commonly come up with. Tick each of your ideas that is on it, or close enough. Ideas on the list move you {ON_LIST} space and
            ideas that are not move you {OFF_LIST}.
          </p>
          <ul class="m-0 grid list-none gap-2 p-0">
            {ideas.map((x, i) => (
              <li class="border-2 border-ink p-2">
                <label class="flex cursor-pointer flex-wrap items-baseline gap-x-3">
                  <input type="checkbox" checked={x.onList} onChange={() => toggle(i)} />
                  <span class="min-w-0 flex-1 break-words">{x.text}</span>
                  <span class="eyebrow">{x.onList ? `On the list: ${ON_LIST}` : `Not on the list: ${OFF_LIST}`}</span>
                </label>
              </li>
            ))}
          </ul>
          <details open>
            <summary class="cursor-pointer font-bold">The book&rsquo;s list ({COMMON.length} common ideas)</summary>
            <ul class="m-0 mt-2 grid list-disc gap-1 pl-6">
              {COMMON.map((c) => (
                <li>{c}</li>
              ))}
            </ul>
          </details>

          <div class="grid gap-3 border-t-4 border-ink pt-4">
            <p class="m-0 font-slab text-3xl font-bold leading-snug">
              You moved {total} {total === 1 ? 'space' : 'spaces'} along the board.
            </p>
            <div class="flex flex-wrap gap-1" aria-hidden="true">
              {ideas.flatMap((x, i) =>
                Array.from({ length: x.onList ? ON_LIST : OFF_LIST }, (_, k) => <span key={`${i}-${k}`} class={`h-3 w-7 rounded-full border-2 border-ink ${x.onList ? '' : 'bg-ink'}`} />),
              )}
            </div>
            <p class="m-0 text-sm">Each link is one space. Filled links are far-out ideas that earned two.</p>
            <div class="no-print flex flex-wrap gap-3">
              <button type="button" class="btn" onClick={copy}>
                Copy result
              </button>
              <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
                Print
              </button>
              <button type="button" class="btn btn-ghost" onClick={() => setIdeas(null)}>
                Add more ideas
              </button>
              <button
                type="button"
                class="btn btn-ghost"
                onClick={() => {
                  setIdeas(null);
                  setText('');
                }}
              >
                Play again
              </button>
            </div>
            {waitlistOpen && (
              <p class="no-print m-0 border-l-8 border-ink pl-4">
                Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
              </p>
            )}
          </div>
        </div>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
