import { useState } from 'preact/hooks';
import { track } from '../../../lib/analytics';
import { download } from '../../../lib/tool-client';
import { STEPS, WORKED_EXAMPLE, questionWord, rollQuestion } from '../../../lib/whats-your-problem';
import WorkedExampleView from '../../shared/WorkedExample';

/**
 * What's Your Problem? (Ch4). Write a problem as "How can we ...?", roll a die at each of eight
 * steps to get a kind of question to ask about it, then rewrite the problem. Nothing leaves the
 * browser and nothing is stored.
 */
const TOOL = 'whats-your-problem';
type Phase = 'start' | 'steps' | 'rewrite' | 'done';
type Entry = { word: string; question: string; answer: string };

/** "How can we sell more music?" however the player typed it. */
const asProblem = (text: string) => {
  const rest = text.trim().replace(/^how can we\s*/i, '').replace(/[?.\s]+$/, '');
  return `How can we ${rest}?`;
};

export default function WhatsYourProblem({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [phase, setPhase] = useState<Phase>('start');
  const [problem, setProblem] = useState('');
  const [step, setStep] = useState(1);
  const [die, setDie] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [log, setLog] = useState<Entry[]>([]);
  const [rewrite, setRewrite] = useState('');
  const [announce, setAnnounce] = useState('');

  const start = () => {
    if (!problem.trim()) return;
    setPhase('steps');
    setStep(1);
    setDie(null);
    setLog([]);
    track('tool_generate', { tool: TOOL });
  };

  const roll = () => {
    const d = rollQuestion();
    setDie(d);
    setAnnounce(`You rolled a ${d}: ${questionWord(d)}.`);
  };

  const next = () => {
    if (die === null || !answer.trim()) return;
    setLog([...log, { word: questionWord(die), question: question.trim(), answer: answer.trim() }]);
    setQuestion('');
    setAnswer('');
    setDie(null);
    if (step >= STEPS) setPhase('rewrite');
    else setStep(step + 1);
  };

  const summary = () =>
    [
      `Starting problem: ${asProblem(problem)}`,
      ...log.map((e, i) => `${i + 1}. ${e.word}${e.question ? `: ${e.question}` : ''}\n   ${e.answer}`),
      `Rewritten problem: ${asProblem(rewrite)}`,
    ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary());
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const reset = () => {
    setPhase('start');
    setProblem('');
    setRewrite('');
    setLog([]);
    setDie(null);
  };

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'start' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="font-bold">Your problem. Finish the sentence: How can we ...</span>
            <input class="field" type="text" value={problem} onInput={(e) => setProblem((e.target as HTMLInputElement).value)} placeholder="sell more music?" autocomplete="off" />
          </label>
          <button type="button" class="btn w-fit" disabled={!problem.trim()} onClick={start}>
            Start the game
          </button>
        </div>
      )}

      {phase !== 'start' && <p class="m-0 font-bold">Starting problem: {asProblem(problem)}</p>}

      {phase === 'steps' && (
        <div class="grid gap-3">
          <label class="grid gap-1">
            <span class="eyebrow">
              Step {step} of {STEPS}
            </span>
            <progress class="h-4 w-full" max={STEPS} value={step - 1} />
          </label>
          {die === null ? (
            <button type="button" class="btn w-fit" onClick={roll}>
              Roll the die
            </button>
          ) : (
            <>
              <p class="m-0 font-display text-4xl uppercase leading-none">
                {die} = {questionWord(die)}?
              </p>
              <p class="m-0">Ask yourself a {questionWord(die)} question about the problem, then answer it.</p>
              <label class="grid gap-1">
                <span class="font-bold">Your {questionWord(die)} question (optional)</span>
                <input class="field" type="text" value={question} onInput={(e) => setQuestion((e.target as HTMLInputElement).value)} autocomplete="off" />
              </label>
              <label class="grid gap-1">
                <span class="font-bold">Your answer</span>
                <textarea class="field" rows={3} value={answer} onInput={(e) => setAnswer((e.target as HTMLTextAreaElement).value)} />
              </label>
              <button type="button" class="btn w-fit" disabled={!answer.trim()} onClick={next}>
                {step >= STEPS ? 'Go to the last space' : 'Next step'}
              </button>
            </>
          )}
        </div>
      )}

      {(phase === 'rewrite' || phase === 'done') && (
        <details open={phase === 'rewrite'}>
          <summary class="cursor-pointer font-bold">What you found ({log.length} steps)</summary>
          <ol class="m-0 mt-2 grid list-none gap-2 p-0">
            {log.map((e) => (
              <li>
                <strong>{e.word}</strong>
                {e.question ? `: ${e.question}` : ''}
                <br />
                {e.answer}
              </li>
            ))}
          </ol>
        </details>
      )}

      {phase === 'rewrite' && (
        <div class="grid gap-3">
          <p class="m-0">You have reached the last space. Use what you discovered to rewrite the problem. Keep it simple and clear.</p>
          <label class="grid gap-1">
            <span class="font-bold">The new problem. How can we ...</span>
            <input class="field" type="text" value={rewrite} onInput={(e) => setRewrite((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <button type="button" class="btn w-fit" disabled={!rewrite.trim()} onClick={() => setPhase('done')}>
            Finish
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div class="grid gap-3 border-t-4 border-ink pt-4">
          <p class="eyebrow m-0">Your new version of the problem</p>
          <p class="m-0 font-slab text-3xl font-bold leading-snug">{asProblem(rewrite)}</p>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={copy}>
              Copy everything
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => download('whats-your-problem.txt', 'text/plain', summary() + '\n')}>
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
