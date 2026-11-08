/** A worked example shown above a tool: numbered steps, with the dealt parts shown as cards where a step asks. */
export type WorkedExample = {
  title: string;
  steps: { heading: string; text: string; list?: string[]; cards?: boolean; result?: string }[];
  slots: { label: string; value: string; hint?: string; image?: { src: string; alt: string } }[];
  bridge?: string;
};

const COLUMNS: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' };

/** Plain markup with no state, so the server renders it and it works without JavaScript. */
export default function WorkedExampleView({ example }: { example: WorkedExample }) {
  return (
    <section class="grid gap-3 border-b-4 border-ink pb-5" aria-label={example.title}>
      <span class="eyebrow">{example.title}</span>
      <ol class="m-0 grid list-none gap-4 p-0">
        {example.steps.map((step, n) => (
          <li class="grid gap-2">
            <p class="m-0">
              <strong>
                {n + 1}. {step.heading}
              </strong>{' '}
              {step.text}
            </p>
            {step.list && (
              <ul class="m-0 grid list-disc gap-1 pl-6">
                {step.list.map((item) => (
                  <li>{item}</li>
                ))}
              </ul>
            )}
            {step.cards && (
              <ul class={`m-0 grid list-none gap-2 p-0 ${COLUMNS[example.slots.length] ?? 'grid-cols-2'}`}>
                {example.slots.map((slot) => (
                  <li class="grid content-start gap-1 border-2 border-ink p-2">
                    <span class="eyebrow">{slot.label}</span>
                    {slot.image && <img src={slot.image.src} alt={slot.image.alt} width="90" height="90" class="h-auto w-20" loading="lazy" />}
                    <span class="break-words font-display text-xl uppercase leading-tight">{slot.value}</span>
                    {slot.hint && <span class="text-sm leading-snug">{slot.hint}</span>}
                  </li>
                ))}
              </ul>
            )}
            {step.result && <p class="m-0 border-l-4 border-ink pl-3 font-display text-xl leading-tight">{step.result}</p>}
          </li>
        ))}
      </ol>
      {example.bridge && <p class="m-0 font-bold">{example.bridge}</p>}
    </section>
  );
}
