import { useEffect, useRef, useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import chapters from '../../data/chapters.json';
import { QUESTIONS, ROUNDS, ROUND_SECONDS, STYLES, scoreAll, scoreStyle, validAnswers } from '../../lib/creativity-test';
import { clock } from '../../lib/tool-client';

const TOOL = 'creativity-test';
type Phase = 'intro' | 'round' | 'between' | 'questions' | 'results';

const DISCLAIMER = 'This test is for fun and self-reflection. It is not a validated psychological assessment, and it cannot tell you how creative you are.';

export default function CreativityTest({ livePaths = [] }: { livePaths?: string[] }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(ROUNDS.map(() => []));
  const [draft, setDraft] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [q, setQ] = useState(0);
  const [choices, setChoices] = useState<number[]>(QUESTIONS.map(() => -1));
  const [announce, setAnnounce] = useState('');
  const endsAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (phase !== 'intro') headingRef.current?.focus();
  }, [phase, round, q]);

  const finishRound = () => {
    setPhase('between');
    setAnnounce(`Time. You wrote ${validAnswers(answers[round]!).length} ideas.`);
  };

  useEffect(() => {
    if (phase !== 'round') return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) finishRound();
      else if (left === 60) setAnnounce('One minute left.');
    }, 250);
    return () => clearInterval(id);
  }, [phase, round, answers]);

  const startRound = (i: number) => {
    setRound(i);
    setDraft('');
    setSecondsLeft(ROUND_SECONDS);
    endsAt.current = Date.now() + ROUND_SECONDS * 1000;
    setPhase('round');
    setAnnounce(`Round ${i + 1}. Two minutes. List uses for a ${ROUNDS[i]!.object}.`);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const addAnswer = (e: Event) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setAnswers((all) => all.map((list, i) => (i === round ? [...list, text] : list)));
    setDraft('');
    inputRef.current?.focus();
  };

  const restart = () => {
    setAnswers(ROUNDS.map(() => []));
    setChoices(QUESTIONS.map(() => -1));
    setQ(0);
    setRound(0);
    setPhase('intro');
  };

  const finishQuestions = () => {
    setPhase('results');
    track('tool_generate', { tool: TOOL });
  };

  const result = phase === 'results' ? { a: scoreAll(answers), s: scoreStyle(choices) } : null;
  const chapterOf = (id: string) => chapters.find((c) => c.id === id);
  const copyResult = async () => {
    if (!result) return;
    const ch = chapterOf(result.s.top.chapterId);
    const text = `My Creative Style on The Creativity Playbook: ${result.s.top.name} (Chapter ${ch?.number}: ${ch?.title}). ${result.a.fluency} uses across three rounds. ${location.origin}${location.pathname}`;
    track('tool_share', { tool: TOOL });
    try {
      await navigator.clipboard.writeText(text);
      setAnnounce('Result copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const heading = 'font-slab text-2xl font-bold leading-snug outline-none';

  return (
    <div class="grid gap-5">
      {phase === 'intro' && (
        <>
          <p class="m-0 font-slab text-2xl font-bold leading-snug">Two parts, about ten minutes.</p>
          <ol class="m-0 grid gap-1 pl-5">
            <li>
              <strong>Uses.</strong> Three rounds of two minutes. For each object, list as many uses as you can.
            </li>
            <li>
              <strong>Style.</strong> Ten quick questions that point to one of six creative styles from the book.
            </li>
          </ol>
          <p class="m-0 border-l-8 border-ink pl-4">{DISCLAIMER} Your answers stay in your browser. Nothing is sent to us.</p>
          <button type="button" class="btn w-fit" onClick={() => startRound(0)}>
            Start part one
          </button>
        </>
      )}

      {phase === 'round' && (
        <>
          <p class="eyebrow m-0">
            Round {round + 1} of {ROUNDS.length}
          </p>
          <h3 ref={headingRef} tabIndex={-1} class={`m-0 !mt-0 ${heading}`}>
            Uses for a {ROUNDS[round]!.object}
          </h3>
          <p class="m-0 font-display text-5xl leading-none" aria-hidden="true">
            {clock(secondsLeft)}
          </p>
          <form class="grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={addAnswer}>
            <label class="grid gap-1">
              <span class="font-bold">Type a use and press Enter</span>
              <input ref={inputRef} class="field" type="text" value={draft} onInput={(e) => setDraft((e.target as HTMLInputElement).value)} autocomplete="off" />
            </label>
            <button type="submit" class="btn self-end">
              Add
            </button>
          </form>
          <p class="m-0">
            {validAnswers(answers[round]!).length} {validAnswers(answers[round]!).length === 1 ? 'idea' : 'ideas'} so far
          </p>
          {answers[round]!.length > 0 && (
            <ol class="m-0 grid gap-1 pl-5">
              {answers[round]!.map((a) => (
                <li>{a}</li>
              ))}
            </ol>
          )}
          <button type="button" class="btn btn-ghost w-fit" onClick={finishRound}>
            I'm done
          </button>
        </>
      )}

      {phase === 'between' && (
        <>
          <h3 ref={headingRef} tabIndex={-1} class={`m-0 !mt-0 ${heading}`}>
            Round {round + 1} done: {validAnswers(answers[round]!).length} {validAnswers(answers[round]!).length === 1 ? 'idea' : 'ideas'}
          </h3>
          {round + 1 < ROUNDS.length ? (
            <button type="button" class="btn w-fit" onClick={() => startRound(round + 1)}>
              Start round {round + 2}: {ROUNDS[round + 1]!.object}
            </button>
          ) : (
            <>
              <p class="m-0">Part one is finished. Part two is ten questions with no right answers. Pick the statement that sounds most like you.</p>
              <button type="button" class="btn w-fit" onClick={() => { setQ(0); setPhase('questions'); }}>
                Start part two
              </button>
            </>
          )}
        </>
      )}

      {phase === 'questions' && (
        <form
          class="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (choices[q]! < 0) return;
            if (q + 1 < QUESTIONS.length) setQ(q + 1);
            else finishQuestions();
          }}
        >
          <p class="eyebrow m-0">
            Question {q + 1} of {QUESTIONS.length}
          </p>
          <fieldset class="m-0 grid gap-3 border-0 p-0">
            <legend ref={headingRef as never} tabIndex={-1} class={`mb-2 ${heading}`}>
              {QUESTIONS[q]!.prompt}
            </legend>
            {QUESTIONS[q]!.options.map((o, i) => (
              <label class="sticker flex cursor-pointer items-start gap-3 p-3">
                <input type="radio" name={`q${q}`} class="mt-1 h-5 w-5" checked={choices[q] === i} onChange={() => setChoices((c) => c.map((v, j) => (j === q ? i : v)))} />
                <span>{o.text}</span>
              </label>
            ))}
          </fieldset>
          <div class="flex flex-wrap gap-3">
            {q > 0 && (
              <button type="button" class="btn btn-ghost" onClick={() => setQ(q - 1)}>
                Back
              </button>
            )}
            <button type="submit" class="btn" disabled={choices[q]! < 0}>
              {q + 1 < QUESTIONS.length ? 'Next' : 'See my results'}
            </button>
          </div>
        </form>
      )}

      {phase === 'results' && result && (
        <>
          {(() => {
            const ch = chapterOf(result.s.top.chapterId);
            const second = result.s.second;
            const next = result.s.top.next;
            const nextLive = livePaths.includes(next.path.split('?')[0]!);
            return (
              <section class="sticker fill grid gap-2 p-5" style={ch ? `--accent: ${ch.color}` : undefined} aria-label="Your creative style">
                <p class="eyebrow m-0">Your creative style</p>
                <h3 ref={headingRef} tabIndex={-1} class="m-0 !mt-0 font-display text-4xl font-normal uppercase leading-none outline-none">
                  {result.s.top.name}
                </h3>
                <p class="m-0">{result.s.top.summary}</p>
                <p class="m-0">
                  <strong>Read next:</strong> Chapter {ch?.number}, {ch?.title}. {ch?.takeaway}
                </p>
                {nextLive && (
                  <p class="m-0">
                    <strong>Try next:</strong> <a href={next.path}>{next.label}</a>
                  </p>
                )}
                {second && <p class="m-0 text-base">You also lean toward {second.name}.</p>}
              </section>
            );
          })()}

          <section class="grid gap-2" aria-label="Your uses scores">
            <h3 class="m-0 !mt-0 !text-xl">Your uses</h3>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse text-base">
                <thead>
                  <tr>
                    <th class="border-2 border-ink p-2 text-left">Object</th>
                    <th class="border-2 border-ink p-2 text-left">Ideas</th>
                    <th class="border-2 border-ink p-2 text-left">Kinds</th>
                    <th class="border-2 border-ink p-2 text-left">Original</th>
                    <th class="border-2 border-ink p-2 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {result.a.perRound.map((r, i) => (
                    <tr>
                      <td class="border-2 border-ink p-2">{ROUNDS[i]!.object}</td>
                      <td class="border-2 border-ink p-2">{r.fluency}</td>
                      <td class="border-2 border-ink p-2">{r.flexibility}</td>
                      <td class="border-2 border-ink p-2">{r.originality}%</td>
                      <td class="border-2 border-ink p-2">{r.elaboration} words</td>
                    </tr>
                  ))}
                  <tr class="font-bold">
                    <td class="border-2 border-ink p-2">Overall</td>
                    <td class="border-2 border-ink p-2">{result.a.fluency}</td>
                    <td class="border-2 border-ink p-2">{result.a.flexibility} avg</td>
                    <td class="border-2 border-ink p-2">{result.a.originality}%</td>
                    <td class="border-2 border-ink p-2">{result.a.elaboration} words</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul class="m-0 grid gap-1 pl-5 text-base">
              <li>
                <strong>Ideas:</strong> how many different uses you wrote. The book's Idea Spaghetti chapter says quantity comes first.
              </li>
              <li>
                <strong>Kinds:</strong> how many different kinds of use, such as building, art or play. Uses our word list does not recognize count as one extra kind.
              </li>
              <li>
                <strong>Original:</strong> the share of your ideas that were not on our list of common answers.
              </li>
              <li>
                <strong>Detail:</strong> the average number of words per idea. More words usually means you pictured it.
              </li>
            </ul>
          </section>

          <p class="m-0 border-l-8 border-ink pl-4 text-base">{DISCLAIMER} The scores come from a simple word-matching rule we wrote, so a clever idea in unusual words can score lower than it deserves.</p>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={copyResult}>
              Copy my result
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" class="btn btn-ghost" onClick={restart}>
              Take it again
            </button>
          </div>
        </>
      )}

      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
