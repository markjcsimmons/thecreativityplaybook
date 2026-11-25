import { useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { EXAMPLE, MAX_NODES, QUESTION_WORDS, WORKED_EXAMPLE, addBranches, leaves, parseOutline, renderSvg, svgFile, toOutlineText } from '../../lib/mind-map';
import { download } from '../../lib/tool-client';
import SaveToNotebook from '../shared/SaveToNotebook';
import WorkedExampleView from '../shared/WorkedExample';

/**
 * Mind Map. Type a center and an outline, one branch per line, and the tool draws the map. Nothing
 * leaves the browser and nothing is stored unless the player presses Save to notebook. The map is
 * a plain SVG string from `src/lib/mind-map.ts`, so the file you download is the picture you see.
 */
const TOOL = 'mind-map';

export default function MindMap({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [center, setCenter] = useState('');
  const [outline, setOutline] = useState('');
  const [announce, setAnnounce] = useState('');

  const parsed = parseOutline(outline);
  const hasMap = parsed.nodes.length > 0;
  const ideas = leaves(center, parsed.nodes);

  const loadExample = () => {
    setCenter(EXAMPLE.center);
    setOutline(EXAMPLE.outline);
    setAnnounce('The example is loaded.');
    track('tool_generate', { tool: TOOL });
  };

  const addQuestions = () => {
    setOutline((o) => addBranches(o, QUESTION_WORDS));
    setAnnounce('The six question words are added as branches.');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toOutlineText(center, parsed.nodes));
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const print = () => {
    const root = document.documentElement;
    root.classList.add('print-sheet-only');
    const clear = () => {
      root.classList.remove('print-sheet-only');
      window.removeEventListener('afterprint', clear);
    };
    window.addEventListener('afterprint', clear);
    track('tool_export', { tool: TOOL });
    window.print();
  };

  const reset = () => {
    setCenter('');
    setOutline('');
    setAnnounce('Cleared.');
  };

  return (
    <div class="grid grid-cols-1 gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <div class="grid grid-cols-1 gap-4">
        <label class="grid gap-1">
          <span class="font-bold">The center: your topic or problem</span>
          <input class="field" type="text" maxLength={80} value={center} onInput={(e) => setCenter((e.target as HTMLInputElement).value)} />
        </label>
        <label class="grid gap-1">
          <span class="font-bold">The branches, one per line</span>
          <span class="text-sm">Indent a line by two spaces to hang it under the line above, and by four to go one level further. Three levels is the most the map draws.</span>
          <textarea class="field font-mono" rows={12} spellcheck={false} value={outline} onInput={(e) => setOutline((e.target as HTMLTextAreaElement).value)} />
        </label>
        <div class="no-print flex flex-wrap gap-3">
          <button type="button" class="btn btn-ghost" onClick={addQuestions}>
            Add the six question words
          </button>
          <button type="button" class="btn btn-ghost" onClick={loadExample}>
            Fill in the example
          </button>
        </div>
        {parsed.truncated && <p class="m-0 font-bold">{`Only the first ${MAX_NODES} lines are drawn. Split the rest into a second map.`}</p>}
      </div>

      <section class="print-sheet grid gap-2 border-t-4 border-ink pt-4" aria-label="Your mind map">
        <p class="m-0 hidden font-display text-2xl uppercase print:block">{center.trim() ? `Mind map: ${center.trim()}` : 'Mind map'}</p>
        <div class="overflow-x-auto border-2 border-ink">
          <div dangerouslySetInnerHTML={{ __html: renderSvg(center, parsed.nodes, { fluid: true }) }} />
        </div>
        {!hasMap && <p class="no-print m-0 text-sm">Add a branch above and it appears here. The picture grows as you type.</p>}
        <p class="no-print m-0 text-sm">If the map is wider than the page, scroll it sideways.</p>
        <p class="m-0 hidden text-sm print:block">From The Creativity Playbook</p>
      </section>

      <section class="grid gap-3 border-t-4 border-ink pt-4" aria-label="Keep your map">
        <div class="no-print flex flex-wrap gap-3">
          {ideas.length > 0 && (
            <SaveToNotebook source={TOOL} label="Save the ideas to notebook" items={ideas.map((i) => ({ text: i.text, note: `From a mind map${i.path ? `: ${i.path}` : ''}` }))} />
          )}
          <button
            type="button"
            class="btn"
            disabled={!hasMap}
            onClick={() => {
              download('mind-map.svg', 'image/svg+xml', svgFile(center, parsed.nodes));
              track('tool_export', { tool: TOOL });
            }}
          >
            Download the map (SVG)
          </button>
          <button type="button" class="btn btn-ghost" disabled={!hasMap} onClick={print}>
            Print
          </button>
          <button type="button" class="btn btn-ghost" disabled={!hasMap} onClick={copy}>
            Copy as an outline
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            disabled={!hasMap}
            onClick={() => {
              download('mind-map.txt', 'text/plain', toOutlineText(center, parsed.nodes));
              track('tool_export', { tool: TOOL });
            }}
          >
            Export text
          </button>
          <button type="button" class="btn btn-ghost" onClick={reset}>
            Clear and start again
          </button>
        </div>
        {waitlistOpen && (
          <p class="no-print m-0 border-l-8 border-ink pl-4">
            Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
          </p>
        )}
      </section>
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
