import { useState } from 'preact/hooks';
import { track } from '../../lib/analytics';
import { splitLines } from '../../lib/game-utils';
import { ALL_GROUPS, CARDS, GROUPS, ROUND_SECONDS, TEAM_SIZE, WORKED_EXAMPLE, cardNames, cardsIn, deal, dealSpread, groupLabel, type Card, type GroupId } from '../../lib/perspective-cards';
import { download } from '../../lib/tool-client';
import Countdown from '../shared/Countdown';
import NotebookPicker from '../shared/NotebookPicker';
import SaveToNotebook from '../shared/SaveToNotebook';
import WorkedExampleView from '../shared/WorkedExample';

/**
 * Perspective Cards. Write a problem, flip a card (a role, a way of thinking or a set of
 * conditions) and write ideas as that person would, for two minutes if you like. A team can deal
 * four cards at once. Nothing leaves the browser and nothing is stored unless the player presses
 * Save to notebook.
 */
const TOOL = 'perspective-cards';

type Round = { cards: Card[]; ideas: string[] };

function CardView({ card, label }: { card: Card; label?: string }) {
  return (
    <div class="sticker grid content-start gap-2 p-4">
      <span class="eyebrow">{label ? `${label}: ${groupLabel(card.group)}` : groupLabel(card.group)}</span>
      <span class="break-words font-display text-3xl uppercase leading-tight">{card.name}</span>
      <span class="leading-snug">{card.ask}</span>
      <span class="text-sm">{card.book ? `From the book: ${card.book}` : 'Our card'}</span>
    </div>
  );
}

export default function PerspectiveCards({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  const [problem, setProblem] = useState('');
  const [groups, setGroups] = useState<GroupId[]>(ALL_GROUPS);
  const [pile, setPile] = useState<string[]>([]);
  const [seen, setSeen] = useState(0);
  const [hand, setHand] = useState<Card[] | null>(null);
  const [handNo, setHandNo] = useState(0);
  const [draft, setDraft] = useState('');
  const [log, setLog] = useState<Round[]>([]);
  const [timerOn, setTimerOn] = useState(true);
  const [announce, setAnnounce] = useState('');

  const toggleGroup = (id: GroupId, on: boolean) => {
    const next = on ? [...groups, id] : groups.filter((g) => g !== id);
    if (next.length === 0) return;
    setGroups(next);
  };

  const flip = (count: number) => {
    const d = count > 1 ? dealSpread(pile, count, groups) : deal(pile, count, groups);
    setPile(d.pile);
    setSeen((n) => n + d.cards.length);
    setHand(d.cards);
    setHandNo((n) => n + 1);
    setDraft('');
    track('tool_generate', { tool: TOOL });
    setAnnounce(`${d.cards.length === 1 ? 'Card' : 'Cards'} dealt: ${cardNames(d.cards)}.${d.reshuffled && seen > 0 ? ' The deck has been shuffled again.' : ''}`);
  };

  const keep = (flipNext: boolean) => {
    if (!hand) return;
    const ideas = splitLines(draft);
    if (ideas.length > 0) setLog((l) => [...l, { cards: hand, ideas }]);
    if (flipNext) flip(hand.length);
    else {
      setHand(null);
      setDraft('');
      setAnnounce(ideas.length > 0 ? 'Ideas kept.' : 'Nothing to keep.');
    }
  };

  const allIdeas = log.flatMap((r) => r.ideas.map((text) => ({ text, round: r })));
  const summary = () =>
    [
      `Problem: ${problem.trim()}`,
      '',
      ...log.map((r) => `${r.cards.map((c) => c.name).join(' / ')}\n${r.ideas.map((x, i) => `  ${i + 1}. ${x}`).join('\n')}`),
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
    setHand(null);
    setLog([]);
    setDraft('');
    setPile([]);
    setSeen(0);
    setAnnounce('Cleared.');
  };

  const ready = problem.trim().length > 0;
  const team = hand !== null && hand.length > 1;

  return (
    <div class="grid gap-5">
      <WorkedExampleView example={WORKED_EXAMPLE} />

      <div class="grid gap-4">
        <label class="grid gap-1">
          <span class="font-bold">The problem you want to look at</span>
          <textarea class="field" rows={2} value={problem} onInput={(e) => setProblem((e.target as HTMLTextAreaElement).value)} />
        </label>
        <NotebookPicker kind="problem" single onPick={(picked) => setProblem(picked[0] ?? '')} />

        <fieldset class="no-print m-0 grid gap-2 border-2 border-ink p-3">
          <legend class="px-1 font-bold">{`Which cards are in the deck? (${cardsIn(groups).length} of ${CARDS.length})`}</legend>
          <ul class="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {GROUPS.map((g) => (
              <li>
                <label class="flex items-start gap-2">
                  <input class="mt-1" type="checkbox" checked={groups.includes(g.id)} disabled={groups.includes(g.id) && groups.length === 1} onChange={(e) => toggleGroup(g.id, (e.target as HTMLInputElement).checked)} />
                  <span>
                    <strong>{`${g.label} (${cardsIn([g.id]).length})`}</strong>
                    <span class="block text-sm">{g.about}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <label class="flex items-center gap-2">
            <input type="checkbox" checked={timerOn} onChange={(e) => setTimerOn((e.target as HTMLInputElement).checked)} />
            <span>{`Offer a ${ROUND_SECONDS / 60}-minute timer for each card`}</span>
          </label>
        </fieldset>

        {!hand && (
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" disabled={!ready} onClick={() => flip(1)}>
              {log.length > 0 ? 'Flip another card' : 'Flip a card'}
            </button>
            <button type="button" class="btn btn-ghost" disabled={!ready} onClick={() => flip(TEAM_SIZE)}>
              {`Deal ${TEAM_SIZE} cards for a team`}
            </button>
          </div>
        )}
        {!ready && !hand && <p class="m-0 text-sm">Write the problem first, then flip a card.</p>}
      </div>

      {hand && (
        <div class="grid gap-4">
          <p class="m-0 font-bold">{`Problem: ${problem.trim()}`}</p>
          <div class={`grid gap-3 ${team ? 'sm:grid-cols-2' : ''}`}>
            {hand.map((c, i) => (
              <CardView key={c.id} card={c} label={team ? `Person ${i + 1}` : undefined} />
            ))}
          </div>
          <p class="m-0">{team ? 'Each person thinks as their card would, then you read the ideas out.' : 'Think as this person, not as you. How would they solve it?'}</p>
          {timerOn && <Countdown key={handNo} seconds={ROUND_SECONDS} label={`Start the ${ROUND_SECONDS / 60}-minute timer`} />}
          <label class="grid gap-1">
            <span class="font-bold">{team ? 'The ideas from the round, one per line' : 'Your ideas as them, one per line'}</span>
            <textarea class="field" rows={5} value={draft} onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)} />
          </label>
          <div class="no-print flex flex-wrap gap-3">
            <button type="button" class="btn" onClick={() => keep(true)}>
              Keep these and flip another
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => keep(false)}>
              Keep these and stop
            </button>
            <button type="button" class="btn btn-ghost" onClick={() => flip(hand.length)}>
              Skip this card
            </button>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <section class="grid gap-4 border-t-4 border-ink pt-4" aria-label="Your ideas so far">
          <h3 class="m-0 font-slab text-2xl font-bold">{`Your ideas so far (${allIdeas.length})`}</h3>
          <ol class="m-0 grid list-none gap-3 p-0">
            {log.map((r) => (
              <li class="grid gap-1 border-2 border-ink p-3">
                <span class="eyebrow">{r.cards.map((c) => c.name).join(' / ')}</span>
                <ul class="m-0 grid list-disc gap-1 pl-5">
                  {r.ideas.map((x) => (
                    <li class="break-words">{x}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p class="m-0">
            Now look across the lists. Which ideas surprised you? Which would one of the other people reject, and how could you change it so they would not?
          </p>
          <div class="no-print flex flex-wrap gap-3">
            <SaveToNotebook
              source={TOOL}
              label="Save ideas to notebook"
              items={allIdeas.map((x) => ({ text: x.text, note: `As ${x.round.cards.map((c) => c.name.toLowerCase()).join(' / ')}. Problem: ${problem.trim()}` }))}
            />
            <button type="button" class="btn" onClick={copy}>
              Copy everything
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              onClick={() => {
                download('perspective-cards.txt', 'text/plain', summary() + '\n');
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
