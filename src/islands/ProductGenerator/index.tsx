import SlotTool, { type SlotToolConfig } from '../shared/SlotTool';
import { QUESTION, SEED_COUNT, WORKED_EXAMPLE, rollProduct } from '../../lib/product-ideas';

const config: SlotToolConfig = {
  tool: 'invention-idea-generator',
  slotCount: SEED_COUNT,
  defaultSeeds: ['start', 'begin', 'play'],
  question: QUESTION,
  build: (seeds) => rollProduct(seeds),
  example: WORKED_EXAMPLE,
};

export default function ProductGenerator({ waitlistOpen = false }: { waitlistOpen?: boolean }) {
  return <SlotTool config={{ ...config, waitlistOpen }} />;
}
