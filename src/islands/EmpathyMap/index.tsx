import { useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { ALL_ROLES, BOXES, ROLE_GROUPS, WORKED_EXAMPLE, emptyEntries, filledCount, linesOf, randomRole, rolesIn, toText, type BoxId } from '../../lib/empathy-map';
import { download } from '../../lib/tool-client';
import NotebookPicker from '../shared/NotebookPicker';
import SaveToNotebook from '../shared/SaveToNotebook';
import WorkedExampleView from '../shared/WorkedExample';

/**
 * Empathy Map. Write a problem or idea, choose whose map it is (a role or a type, never a named
 * person), and fill in what they say, think, do and feel, then their pains and gains. Nothing leaves
 * the browser and nothing is stored unless the player presses Save to notebook.
 */
const TOOL = 'empathy-map';

export default function EmpathyMap({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [problem, setProblem] = useState('');
  const [role, setRole] = useState('');
  const [roleId, setRoleId] = useState('');
  const [entries, setEntries] = useState(emptyEntries());
  const [ideasText, setIdeasText] = useState('');
  const [announce, setAnnounce] = useState('');

  const picked = ALL_ROLES.find((c) => c.id === roleId);
  const ideas = linesOf(ideasText);
  const filled = filledCount(entries);

  const choose = (id: string) => {
    setRoleId(id);
    const card = ALL_ROLES.find((c) => c.id === id);
    if (card) {
      setRole(card.name);
      setAnnounce(`Role chosen: ${card.name}.`);
    }
  };

  const deal = () => {
    const card = randomRole(undefined, roleId);
    choose(card.id);
    track('tool_generate', { tool: TOOL });
  };

  const set = (id: BoxId, value: string) => setEntries((e) => ({ ...e, [id]: value }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText(role, problem, entries, ideas));
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const reset = () => {
    setEntries(emptyEntries());
    setIdeasText('');
    setRole('');
    setRoleId('');
    setAnnounce('Cleared.');
  };

  const box = (id: BoxId) => {
    const b = BOXES.find((x) => x.id === id)!;
    return (
      <label class="grid content-start gap-1 border-2 border-ink p-3">
        <span class="font-display text-2xl uppercase leading-none">{b.label}</span>
        <span class="text-sm">{b.prompt}</span>
        {b.book && <span class="eyebrow">From the book’s Chapter 12 questions</span>}
        <textarea class="field" rows={5} value={entries[id]} onInput={(e) => set(id, (e.target as HTMLTextAreaElement).value)} />
      </label>
    );
  };

  return (
    <div class="grid grid-cols-1 gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <div class="grid grid-cols-1 gap-4">
        <label class="grid gap-1">
          <span class="font-bold">The problem or idea</span>
          <textarea class="field" rows={2} value={problem} onInput={(e) => setProblem((e.target as HTMLTextAreaElement).value)} />
        </label>
        <NotebookPicker kind="problem" single onPick={(p) => setProblem(p[0] ?? '')} />
        <label class="grid gap-1">
          <span class="font-bold">Whose map is it?</span>
          <span class="text-sm">A role or a type of person, such as “a first-time customer”. Not someone you know by name.</span>
          <input class="field" type="text" value={role} onInput={(e) => { setRole((e.target as HTMLInputElement).value); setRoleId(''); }} />
        </label>
        <div class="no-print flex flex-wrap items-end gap-3">
          <label class="grid w-full min-w-0 max-w-sm gap-1">
            <span>Or pick a role from the Perspective Cards</span>
            <select class="field w-full max-w-full" value={roleId} onChange={(e) => choose((e.target as HTMLSelectElement).value)}>
              <option value="">Choose a role</option>
              {ROLE_GROUPS.map((g) => (
                <optgroup label={g.label}>
                  {rolesIn(g.id).map((c) => (
                    <option value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <button type="button" class="btn btn-ghost" onClick={deal}>
            Deal me a role
          </button>
        </div>
        {picked && <p class="m-0 font-bold">{picked.ask}</p>}
      </div>

      <section class="grid grid-cols-1 gap-3" aria-label="The empathy map">
        <p class="m-0 border-l-8 border-ink pl-4 font-display text-2xl leading-tight">{role.trim() ? `Empathy map: ${role.trim()}` : 'Empathy map'}</p>
        <div class="grid gap-3 sm:grid-cols-2">
          {box('says')}
          {box('thinks')}
          {box('does')}
          {box('feels')}
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          {box('pains')}
          {box('gains')}
        </div>
      </section>

      <section class="grid gap-3 border-t-4 border-ink pt-4" aria-label="Ideas from the map">
        <label class="grid gap-1">
          <span class="font-bold">Ideas this gives you, one per line</span>
          <span class="text-sm">Look for clashes between a pain and a gain, and for things they do that they do not say.</span>
          <textarea class="field" rows={4} value={ideasText} onInput={(e) => setIdeasText((e.target as HTMLTextAreaElement).value)} />
        </label>
        <div class="no-print flex flex-wrap gap-3">
          {ideas.length > 0 && (
            <SaveToNotebook source={TOOL} label="Save ideas to notebook" items={ideas.map((text) => ({ text, note: `From an empathy map${role.trim() ? ` for ${role.trim()}` : ''}${problem.trim() ? `. Problem: ${problem.trim()}` : ''}` }))} />
          )}
          <button type="button" class="btn" onClick={copy} disabled={filled === 0 && ideas.length === 0}>
            Copy everything
          </button>
          <button
            type="button"
            class="btn btn-ghost"
            disabled={filled === 0 && ideas.length === 0}
            onClick={() => {
              download('empathy-map.txt', 'text/plain', toText(role, problem, entries, ideas));
              track('tool_export', { tool: TOOL });
            }}
          >
            Export text
          </button>
          <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
            Print
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
