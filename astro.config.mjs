// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The domain is not decided yet (BRIEF §16.1). `.example` is a reserved TLD,
// so the placeholder can never collide with a real site.
const site = process.env.SITE_URL ?? 'https://thecreativityplaybook.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  // Pages are small, so inlining the (tiny) stylesheet removes a render-blocking round trip.
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [mdx(), preact(), sitemap({ filter: (url) => !url.includes('/styleguide/') && !url.includes('/404/') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
