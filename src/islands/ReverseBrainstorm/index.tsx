import { useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { normalizeIdea } from '../../lib/game-utils';
import { MAX_BAD, NUDGES, ROUND_SECONDS, WORKED_EXAMPLE, buildPairs, fixesOf, nextNudge, parseBad, toText } from '../../lib/reverse-brainstorm';
import { download } from '../../lib/tool-client';
import Countdown from '../shared/Countdown';
import NotebookPicker from '../shared/NotebookPicker';
import SaveToNotebook from '../shared/SaveToNotebook';
import WorkedExampleView from '../shared/WorkedExample';

/**
 * Reverse Brainstorm. Write a goal, list ways to make it fail, then turn each one round into a
 * fix. Nothing leaves the browser and nothing is stored unless the player presses Save to notebook.
 */
const TOOL = 'reverse-brainstorm';

export default function ReverseBrainstorm({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [goal, setGoal] = useState('');
  const [badText, setBadText] = useState('');
  const [phase, setPhase] = useState<'list' | 'flip'>('list');
  const [fixes, setFixes] = useState<Record<string, string>>({});
  const [usedNudges, setUsedNudges] = useState<number[]>([]);
  const [nudge, setNudge] = useState<number | null>(null);
  const [timerOn, setTimerOn] = useState(true);
  const [announce, setAnnounce] = useState('');

  const bad = parseBad(badText);
  const pairs = buildPairs(bad, fixes);
  const kept = fixesOf(pairs);
  const ready = goal.trim().length > 0;

  const askNudge = () => {
    const r = nextNudge(usedNudges);
    setUsedNudges(r.used);
    setNudge(r.index);
    setAnnounce(`${NUDGES[r.index]}${r.reset ? ' You have seen every prompt, so they start again.' : ''}`);
  };

  const flip = () => {
    setPhase('flip');
    track('tool_generate', { tool: TOOL });
    setAnnounce(`${bad.length} ways to make it worse. Now write a fix for each one.`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toText(goal, pairs));
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const reset = () => {
    setBadText('');
    setFixes({});
    setPhase('list');
    setNudge(null);
    setUsedNudges([]);
    setAnnounce('Cleared.');
  };

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <div class="grid gap-4">
        <label class="grid gap-1">
          <span class="font-bold">The goal you want to reach</span>
          <textarea class="field" rows={2} value={goal} onInput={(e) => setGoal((e.target as HTMLTextAreaElement).value)} />
        </label>
        <NotebookPicker kind="problem" single onPick={(picked) => setGoal(picked[0] ?? '')} />
      </div>

      {ready && phase === 'list' && (
        <div class="grid gap-4">
          <p class="m-0 border-l-8 border-ink pl-4 font-display text-2xl leading-tight">{`What is the surest way to make this worse? “${goal.trim()}”`}</p>
          <label class="grid gap-1">
            <span class="font-bold">{`Ways to make it worse, one per line (up to ${MAX_BAD})`}</span>
            <span class="text-sm">Make them silly and extreme. Nobody is going to do them.</span>
            <textarea class="field" rows={7} value={badText} onInput={(e) => setBadText((e.target as HTMLTextAreaElement).value)} />
          </label>
          <div class="no-print flex flex-wrap items-center gap-3">
            <button type="button" class="btn btn-ghost" onClick={askNudge}>
              Give me a prompt
            </button>
            {nudge !== null && <p class="m-0 font-bold">{NUDGES[nudge]}</p>}
          </div>
          <label class="no-print flex items-center gap-2">
            <input type="checkbox" checked={timerOn} onChange={(e) => setTimerOn((e.target as HTMLInputElement).checked)} />
            <span>{`Offer a ${ROUND_SECONDS / 60}-minute timer`}</span>
          </label>
          {timerOn && <Countdown seconds={ROUND_SECONDS} label={`Start the ${ROUND_SECONDS / 60}-minute timer`} />}
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" disabled={bad.length === 0} onClick={flip}>
              {bad.length === 0 ? 'Flip them' : `Flip these ${bad.length}`}
            </button>
          </div>
        </div>
      )}

      {ready && phase === 'flip' && (
        <section class="grid gap-4" aria-label="Turn each bad idea into a fix">
          <p class="m-0 font-bold">{`Goal: ${goal.trim()}`}</p>
          <p class="m-0">Read each one, then write what would stop it, or what the opposite would be. You can leave some blank.</p>
          <ol class="m-0 grid list-none gap-3 p-0">
            {pairs.map((p, i) => (
              <li class="grid gap-2 border-2 border-ink p-3">
                <span class="eyebrow">{`Way to make it worse ${i + 1}`}</span>
                <span class="break-words font-bold">{p.bad}</span>
                <label class="grid gap-1">
                  <span class="text-sm">The fix</span>
                  <input
                    class="field"
                    type="text"
                    value={fixes[normalizeIdea(p.bad)] ?? ''}
                    onInput={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      setFixes((f) => ({ ...f, [normalizeIdea(p.bad)]: v }));
                    }}
                  />
                </label>
              </li>
            ))}
          </ol>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn btn-ghost" onClick={() => setPhase('list')}>
              Back to the list
            </button>
          </div>
        </section>
      )}

      {phase === 'flip' && kept.length > 0 && (
        <section class="grid gap-4 border-t-4 border-ink pt-4" aria-label="Your fixes">
          <h3 class="m-0 font-slab text-2xl font-bold">{`Your fixes (${kept.length})`}</h3>
          <ul class="m-0 grid list-disc gap-1 pl-5">
            {kept.map((k) => (
              <li class="break-words">{k}</li>
            ))}
          </ul>
          <p class="m-0">Now sort them. Which would you fight for, and which can wait? The book’s three piles or the Idea Scorer will help.</p>
          <div class="no-print flex flex-wrap gap-3">
            <SaveToNotebook source={TOOL} label="Save fixes to notebook" items={kept.map((text) => ({ text, note: `Fix from reverse brainstorming. Goal: ${goal.trim()}` }))} />
            <button type="button" class="btn" onClick={copy}>
              Copy everything
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              onClick={() => {
                download('reverse-brainstorm.txt', 'text/plain', toText(goal, pairs));
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
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
