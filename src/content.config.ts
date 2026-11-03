import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pageSchema } from './lib/schemas';

const collection = (folder: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: `./src/content/${folder}` }),
    schema: pageSchema,
  });

// One folder per BRIEF §5, plus `pages` for the top-level routes (/, /authors,
// /book, /lateral-thinking, /products/...). The URL comes from each entry's
// `path`, not from the folder, and is checked against docs/keyword-map.csv.
export const collections = {
  pages: collection('pages'),
  guides: collection('guides'),
  techniques: collection('techniques'),
  exercises: collection('exercises'),
  books: collection('books'),
  quotes: collection('quotes'),
  puzzles: collection('puzzles'),
  templates: collection('templates'),
  tools: collection('tools'),
};
