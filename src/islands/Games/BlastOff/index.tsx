import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { splitLines } from '../../../lib/game-utils';
import { LAUNCH_SECONDS, WORKED_EXAMPLE, pickIdea } from '../../../lib/blast-off';
import { clock, download } from '../../../lib/tool-client';
import WorkedExampleView from '../../shared/WorkedExample';
import { useCountdown } from '../../shared/useCountdown';

/**
 * Blast Off! (Ch12). Choose one idea quickly, then fill in a launch plan within 30 minutes: a name
 * and a look, a short news story, and a crew. Nothing leaves the browser and nothing is stored.
 */
const TOOL = 'blast-off';
type Phase = 'ideas' | 'plan' | 'launched';

export default function BlastOff({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('ideas');
  const [text, setText] = useState('');
  const [idea, setIdea] = useState('');
  const [name, setName] = useState('');
  const [look, setLook] = useState('');
  const [headline, setHeadline] = useState('');
  const [story, setStory] = useState('');
  const [crew, setCrew] = useState('');
  const [timedOut, setTimedOut] = useState(false);
  const [announce, setAnnounce] = useState('');
  const timer = useCountdown(LAUNCH_SECONDS, () => {
    setTimedOut(true);
    setPhase('launched');
    setAnnounce('Time. Here is your launch plan.');
  });

  const ideas = splitLines(text);

  const choose = (chosen: string) => {
    setIdea(chosen);
    setPhase('plan');
    timer.start();
    track('tool_generate', { tool: TOOL });
    setAnnounce('Countdown started. Thirty minutes.');
  };

  const launch = () => {
    timer.stop();
    setPhase('launched');
  };

  const plan = () =>
    [
      `Idea: ${idea}`,
      `Name: ${name.trim() || '(not named)'}`,
      `Look: ${look.trim() || '(not described)'}`,
      `Headline: ${headline.trim() || '(none)'}`,
      `Story: ${story.trim() || '(none)'}`,
      'Crew:',
      ...(splitLines(crew).length ? splitLines(crew).map((c) => `  - ${c}`) : ['  (nobody yet)']),
    ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plan());
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const reset = () => {
    setPhase('ideas');
    setIdea('');
    setName('');
    setLook('');
    setHeadline('');
    setStory('');
    setCrew('');
    setTimedOut(false);
  };

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'ideas' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">Your ideas, one per line. Use ones you have already generated.</span>
            <textarea class="field" rows={6} value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} />
          </label>
          {ideas.length > 0 ? (
            <>
              <p class="m-0">Choose one now, on gut instinct. The countdown starts when you do.</p>
              <ul class="m-0 grid list-none gap-2 p-0">
                {ideas.map((x) => (
                  <li>
                    <button type="button" class="btn btn-ghost w-full !justify-start text-left" onClick={() => choose(x)}>
                      {x}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" class="btn w-fit" onClick={() => choose(ideas[pickIdea(ideas.length)]!)}>
                Pick one at random
              </button>
            </>
          ) : (
            <p class="m-0">Add at least one idea.</p>
          )}
        </div>
      )}

      {phase === 'plan' && (
        <div class="grid gap-4">
          <p class="m-0 font-display text-5xl leading-none" role="timer" aria-label="Time left">
            {clock(timer.left)}
          </p>
          <p class="m-0 font-slab text-2xl font-bold leading-snug">Launching: {idea}</p>
          <fieldset class="m-0 grid gap-2 border-0 p-0">
            <legend class="font-display text-2xl uppercase">Who am I?</legend>
            <label class="grid gap-1">
              <span class="font-bold">Name (however gimmicky)</span>
              <input class="field" type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} autocomplete="off" />
            </label>
            <label class="grid gap-1">
              <span class="font-bold">What it looks like. Sketch it on paper, then describe it here.</span>
              <textarea class="field" rows={2} value={look} onInput={(e) => setLook((e.target as HTMLTextAreaElement).value)} />
            </label>
          </fieldset>
          <fieldset class="m-0 grid gap-2 border-0 p-0">
            <legend class="font-display text-2xl uppercase">What is my mission?</legend>
            <label class="grid gap-1">
              <span class="font-bold">A punchy headline</span>
              <input class="field" type="text" value={headline} onInput={(e) => setHeadline((e.target as HTMLInputElement).value)} autocomplete="off" />
            </label>
            <label class="grid gap-1">
              <span class="font-bold">The story: what it is, what the point is, who it is for</span>
              <textarea class="field" rows={4} value={story} onInput={(e) => setStory((e.target as HTMLTextAreaElement).value)} />
            </label>
          </fieldset>
          <fieldset class="m-0 grid gap-2 border-0 p-0">
            <legend class="font-display text-2xl uppercase">Who is on the crew?</legend>
            <label class="grid gap-1">
              <span class="font-bold">People inside and outside your organization who can help, one per line</span>
              <textarea class="field" rows={3} value={crew} onInput={(e) => setCrew((e.target as HTMLTextAreaElement).value)} />
            </label>
          </fieldset>
          <button type="button" class="btn w-fit" onClick={launch}>
            Blast off!
          </button>
        </div>
      )}

      {phase === 'launched' && (
        <div class="grid gap-3 border-t-4 border-ink pt-4">
          <p class="m-0 font-slab text-3xl font-bold leading-snug">{timedOut ? 'Time is up. This is your launch plan.' : 'Blast off! This is your launch plan.'}</p>
          <pre class="m-0 whitespace-pre-wrap break-words border-2 border-ink p-3 font-sans">{plan()}</pre>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={copy}>
              Copy plan
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => download('launch-plan.txt', 'text/plain', plan() + '\n')}>
              Export text
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" class="btn btn-ghost" onClick={reset}>
              Play again
            </button>
          </div>
          {waitlistOpen && (
            <p class="no-print m-0 border-l-8 border-ink pl-4">
              Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
            </p>
          )}
        </div>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
