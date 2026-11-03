import SlotTool, { type SlotToolConfig } from '../shared/SlotTool';
import { QUESTION, SEED_COUNT, rollProduct } from '../../lib/product-ideas';

const config: SlotToolConfig = {
  tool: 'invention-idea-generator',
  slotCount: SEED_COUNT,
  defaultSeeds: ['start', 'begin', 'play'],
  question: QUESTION,
  build: (seeds) => rollProduct(seeds),
};

export default function ProductGenerator({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  return <SlotTool config={{ ...config, waitlistOpen }} />;
}
