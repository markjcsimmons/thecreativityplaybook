import SlotTool, { type SlotToolConfig } from '../shared/SlotTool';
import { PRESETS, SEED_COUNT, rollPitch, type Filters } from '../../lib/business-ideas';

const config: SlotToolConfig = {
  tool: 'business-idea-generator',
  slotCount: 4,
  defaultSeeds: ['start', 'begin', 'play', 'make', 'look'].slice(0, SEED_COUNT),
  question: 'Who would pay for this, and why would they pick it over what they do today?',
  modes: PRESETS.map((p) => ({ value: p.value, label: p.label, set: { ...p.set } })),
  groups: [
    { key: 'budget', label: 'Budget', choices: [{ value: 'any', label: 'Any' }, { value: 'shoestring', label: 'Shoestring' }, { value: 'funded', label: 'Funded' }] },
    { key: 'channel', label: 'Where', choices: [{ value: 'any', label: 'Any' }, { value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }, { value: 'hybrid', label: 'Hybrid' }] },
    { key: 'team', label: 'Who', choices: [{ value: 'any', label: 'Any' }, { value: 'solo', label: 'Solo' }, { value: 'team', label: 'Team' }] },
  ],
  extraLabel: 'Scavenger prompt',
  build: (seeds, options) => {
    const pitch = rollPitch(seeds, options as unknown as Filters);
    return { slots: pitch.slots, text: pitch.text, extra: pitch.prompt };
  },
};

export default function BusinessGenerator({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  return <SlotTool config={{ ...config, waitlistOpen }} />;
}
