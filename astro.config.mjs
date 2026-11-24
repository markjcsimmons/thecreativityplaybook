// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The domain is not decided yet (BRIEF §16.1). `.example` is a reserved TLD,
// so the placeholder can never collide with a real site.
const site = process.env.SITE_URL ?? 'https://thecreativityplaybook.com';

// Sitemap <lastmod> per URL, from each page's `updated` frontmatter. The date is hidden on
// the page itself (Mark, 2026-11-19), so the sitemap is where search engines see freshness.
function lastmodByPath() {
  const out = new Map();
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.mdx?$/.test(e.name)) {
        const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(p, 'utf8'))?.[1] ?? '';
        const path = /^path:\s*["']?([^"'\r\n]+?)["']?\s*$/m.exec(fm)?.[1];
        const updated = /^updated:\s*["']?(\d{4}-\d{2}-\d{2})/m.exec(fm)?.[1];
        if (path && updated) out.set(path, updated);
      }
    }
  };
  walk('src/content');
  return out;
}
const lastmods = lastmodByPath();

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  // Pages are small, so inlining the (tiny) stylesheet removes a render-blocking round trip.
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    mdx(),
    preact(),
    sitemap({
      filter: (url) => !url.includes('/styleguide/') && !url.includes('/404/'),
      serialize(item) {
        const lastmod = lastmods.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod: new Date(lastmod).toISOString() } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
