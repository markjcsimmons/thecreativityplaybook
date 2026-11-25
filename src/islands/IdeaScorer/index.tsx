import { useMemo, useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { normalizeIdea } from '../../lib/game-utils';
import {
  CRITERIA,
  MAX_IDEAS,
  MIN_IDEAS,
  WEIGHT_LABELS,
  WORKED_EXAMPLE,
  chartPoints,
  defaultWeights,
  parseIdeas,
  rankIdeas,
  toCsv,
  toText,
  type CriterionId,
  type Ranked,
  type Scores,
  type Weights,
} from '../../lib/idea-scorer';
import { download } from '../../lib/tool-client';
import WorkedExampleView from '../shared/WorkedExample';
import SaveToNotebook from '../shared/SaveToNotebook';
import NotebookPicker from '../shared/NotebookPicker';

/**
 * Idea Scorer. Line ideas up against six plain criteria and see a ranking and an impact and
 * effort chart. The ranking is the player's own judgment, added up; it is not a prediction. Nothing
 * leaves the browser and nothing is stored unless the player presses Save to notebook.
 */
const TOOL = 'idea-scorer';

const SIZE = 360;
const PAD = 44;
const PLOT = SIZE - PAD * 2;
/** Maps a 1 to 5 score to a position along an axis. */
const at = (v: number) => PAD + ((v - 0.5) / 5) * PLOT;

function Chart({ rows }: { rows: Ranked[] }) {
  const pts = chartPoints(rows);
  if (pts.length === 0) return null;
  return (
    <figure class="m-0 grid max-w-md gap-2">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Impact and effort chart. The ranking table has the same information in words." class="h-auto w-full border-2 border-ink">
        <title>Impact and effort chart</title>
        <rect x={PAD} y={PAD} width={PLOT} height={PLOT} class="fill-paper" />
        <line x1={at(3)} y1={PAD} x2={at(3)} y2={PAD + PLOT} class="stroke-ink" stroke-dasharray="4 4" />
        <line x1={PAD} y1={at(3)} x2={PAD + PLOT} y2={at(3)} class="stroke-ink" stroke-dasharray="4 4" />
        <rect x={PAD} y={PAD} width={PLOT} height={PLOT} fill="none" class="stroke-ink" stroke-width="2" />
        <text x={PAD + 6} y={PAD + 16} class="fill-ink" font-size="12" font-weight="700">
          Quick wins
        </text>
        <text x={PAD + PLOT - 6} y={PAD + 16} text-anchor="end" class="fill-ink" font-size="12" font-weight="700">
          Big bets
        </text>
        <text x={PAD + 6} y={PAD + PLOT - 8} class="fill-ink" font-size="12" font-weight="700">
          Fill-ins
        </text>
        <text x={PAD + PLOT - 6} y={PAD + PLOT - 8} text-anchor="end" class="fill-ink" font-size="12" font-weight="700">
          Time sinks
        </text>
        <text x={PAD + PLOT / 2} y={SIZE - 10} text-anchor="middle" class="fill-ink" font-size="13">
          Effort: low to high
        </text>
        <text transform={`translate(14 ${PAD + PLOT / 2}) rotate(-90)`} text-anchor="middle" class="fill-ink" font-size="13">
          Impact: low to high
        </text>
        {pts.map((p) => (
          <g key={p.index}>
            <circle cx={at(p.x)} cy={at(6 - p.y)} r="11" class="fill-ink stroke-paper" stroke-width="2" />
            <text x={at(p.x)} y={at(6 - p.y) + 4} text-anchor="middle" class="fill-paper" font-size="11" font-weight="700">
              {String(p.index + 1)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption class="text-sm">Each number is the idea&rsquo;s place in your list. Ideas that score 3 on either axis count as in between.</figcaption>
    </figure>
  );
}

export default function IdeaScorer({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [problem, setProblem] = useState('');
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'enter' | 'score'>('enter');
  const [weights, setWeights] = useState<Weights>(defaultWeights());
  const [scores, setScores] = useState<Record<string, Scores>>({});
  const [shortlist, setShortlist] = useState(3);
  const [announce, setAnnounce] = useState('');
  const [started, setStarted] = useState(false);

  const ideas = useMemo(() => parseIdeas(text), [text]);
  const tooMany = ideas.length > MAX_IDEAS;
  const ready = ideas.length >= MIN_IDEAS && !tooMany;

  const rows = useMemo(() => rankIdeas(ideas.map((t) => ({ text: t, scores: scores[normalizeIdea(t)] ?? {} })), weights), [ideas, scores, weights]);
  const ranked = rows.filter((r) => r.total !== null);
  const unscored = rows.filter((r) => r.total === null);

  const begin = () => {
    if (!ready) return;
    setPhase('score');
    if (!started) {
      setStarted(true);
      track('tool_generate', { tool: TOOL });
    }
    setAnnounce('Score each idea from 1 to 5.');
  };

  const setScore = (idea: string, id: CriterionId, value: string) => {
    const key = normalizeIdea(idea);
    setScores((all) => {
      const next = { ...(all[key] ?? {}) };
      if (value === '') delete next[id];
      else next[id] = Number(value);
      return { ...all, [key]: next };
    });
  };

  const body = () => toText(rows, weights, problem);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(body());
      setAnnounce('Copied.');
    } catch {
      setAnnounce('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
  };

  const saveItems = ranked.map((r, i) => ({
    text: r.text,
    ...(i < shortlist ? { stage: 'shortlisted' as const } : {}),
    note: `Idea Scorer: ${r.total}/100${r.quadrant ? `, ${r.quadrant.toLowerCase()}` : ''}`,
  }));

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      {phase === 'enter' && (
        <div class="grid gap-4">
          <label class="grid gap-1">
            <span class="font-bold">What are you choosing for? (optional)</span>
            <input class="field" type="text" value={problem} onInput={(e) => setProblem((e.target as HTMLInputElement).value)} autocomplete="off" />
          </label>
          <label class="grid gap-1">
            <span class="font-bold">
              Your ideas, one per line ({MIN_IDEAS} to {MAX_IDEAS})
            </span>
            <textarea class="field" rows={8} value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} />
          </label>
          <NotebookPicker preferStage="shortlisted" max={MAX_IDEAS} onPick={(picked) => setText((cur) => parseIdeas([cur, ...picked].join('\n')).slice(0, MAX_IDEAS).join('\n'))} />
          <p class="m-0" aria-live="polite">
            {`${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}${tooMany ? `. That is too many: keep the best ${MAX_IDEAS}.` : ideas.length < MIN_IDEAS ? `. Add at least ${MIN_IDEAS}.` : '.'}`}
          </p>
          <button type="button" class="btn w-fit" disabled={!ready} onClick={begin}>
            Score these ideas
          </button>
        </div>
      )}

      {phase === 'score' && (
        <div class="grid gap-6">
          {problem.trim() && <p class="m-0 font-bold">{`Choosing for: ${problem.trim()}`}</p>}
          <button type="button" class="btn btn-ghost no-print w-fit" onClick={() => setPhase('enter')}>
            Change the ideas
          </button>

          <fieldset class="no-print sticker m-0 grid gap-3 p-4">
            <legend class="px-1 font-bold">What matters most? Set a weight for each criterion.</legend>
            <ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {CRITERIA.map((c) => (
                <li class="grid gap-1">
                  <label class="grid gap-1">
                    <span class="font-bold">{c.label}</span>
                    <span class="text-sm">{c.question}</span>
                    <select class="field" value={String(weights[c.id])} onChange={(e) => setWeights({ ...weights, [c.id]: Number((e.target as HTMLSelectElement).value) })}>
                      {WEIGHT_LABELS.map((l, n) => (
                        <option value={String(n)}>{l}</option>
                      ))}
                    </select>
                  </label>
                  <span class="text-sm">{`1 is ${c.low.toLowerCase()}. 5 is ${c.high.toLowerCase()}.`}</span>
                </li>
              ))}
            </ul>
          </fieldset>

          <div class="no-print grid gap-4">
            <h3 class="m-0 font-slab text-2xl font-bold">Score each idea</h3>
            <p class="m-0">Leave a score blank if you cannot tell yet. A blank is left out, not counted as zero.</p>
            <ol class="m-0 grid list-none gap-4 p-0">
              {ideas.map((idea, n) => {
                const s = scores[normalizeIdea(idea)] ?? {};
                return (
                  <li key={normalizeIdea(idea)}>
                    <fieldset class="m-0 grid gap-3 border-2 border-ink p-3">
                      <legend class="px-1 font-bold">{`${n + 1}. ${idea}`}</legend>
                      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {CRITERIA.map((c) => (
                          <label class="grid gap-1">
                            <span>{c.label}</span>
                            <select class="field" value={s[c.id] ? String(s[c.id]) : ''} onChange={(e) => setScore(idea, c.id, (e.target as HTMLSelectElement).value)}>
                              <option value="">Not scored</option>
                              <option value="1">{`1, ${c.low.toLowerCase()}`}</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">{`5, ${c.high.toLowerCase()}`}</option>
                            </select>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </li>
                );
              })}
            </ol>
          </div>

          <section class="grid gap-4 border-t-4 border-ink pt-4" aria-label="Ranking">
            <h3 class="m-0 font-slab text-2xl font-bold">Ranking</h3>
            {ranked.length === 0 ? (
              <p class="m-0">Score at least one criterion for an idea, and the ranking appears here.</p>
            ) : (
              <div class="overflow-x-auto" role="region" aria-label="Ranking table" tabindex={0}>
                <table class="w-full border-collapse text-left">
                  <caption class="visually-hidden">Ideas ranked by weighted score out of 100</caption>
                  <thead>
                    <tr>
                      <th class="border-2 border-ink p-2">Rank</th>
                      <th class="border-2 border-ink p-2">Idea</th>
                      <th class="border-2 border-ink p-2">Score</th>
                      <th class="border-2 border-ink p-2">Impact</th>
                      <th class="border-2 border-ink p-2">Effort</th>
                      <th class="border-2 border-ink p-2">Where it sits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r) => (
                      <tr key={r.index}>
                        <td class="border-2 border-ink p-2 font-display text-xl">{r.rank}</td>
                        <td class="border-2 border-ink p-2">{`${r.index + 1}. ${r.text}`}</td>
                        <td class="border-2 border-ink p-2">{`${r.total} of 100`}</td>
                        <td class="border-2 border-ink p-2">{r.scores.impact ?? 'Not scored'}</td>
                        <td class="border-2 border-ink p-2">{r.scores.effort ?? 'Not scored'}</td>
                        <td class="border-2 border-ink p-2">{r.quadrant ?? 'Needs impact and effort'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {unscored.length > 0 && ranked.length > 0 && <p class="m-0">{`Not scored yet: ${unscored.map((r) => r.index + 1).join(', ')}.`}</p>}
            <p class="m-0 text-sm">
              The score is a weighted average of your own 1 to 5 judgments, shown out of 100, with effort and cost counted against an idea. It ranks what you said. It does not tell you whether an idea will work.
            </p>
            <Chart rows={rows} />
          </section>

          {ranked.length > 0 && (
            <div class="no-print grid gap-3 border-t-4 border-ink pt-4">
              <label class="grid w-fit gap-1">
                <span class="font-bold">Shortlist the top</span>
                <select class="field" value={String(shortlist)} onChange={(e) => setShortlist(Number((e.target as HTMLSelectElement).value))}>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option value={String(n)}>{n === 0 ? 'None' : `${n} ${n === 1 ? 'idea' : 'ideas'}`}</option>
                  ))}
                </select>
              </label>
              <div class="flex flex-wrap gap-3">
                <SaveToNotebook source={TOOL} items={saveItems} label="Save to notebook" />
                <button type="button" class="btn" onClick={copy}>
                  Copy ranking
                </button>
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => {
                    download('idea-scores.csv', 'text/csv', toCsv(rows));
                    track('tool_export', { tool: TOOL });
                  }}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => {
                    download('idea-scores.txt', 'text/plain', body());
                    track('tool_export', { tool: TOOL });
                  }}
                >
                  Export text
                </button>
                <button type="button" class="btn btn-ghost" onClick={() => window.print()}>
                  Print
                </button>
              </div>
              <p class="m-0">
                Still undecided? <a href="/games/kill-the-idea/">Kill the Idea</a> makes you choose, and <a href="/games/blast-off/">Blast Off</a> turns the winner into a plan.
              </p>
              {waitlistOpen && (
                <p class="m-0 border-l-8 border-ink pl-4">
                  Enjoying this? <a href="#waitlist">Get the launch-day alert for the book.</a>
                </p>
              )}
            </div>
          )}
        </div>
      )}
      <p class="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
