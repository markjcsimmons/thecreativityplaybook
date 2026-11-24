import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllPages } from '../../lib/content';
import { renderOg } from '../../lib/og';
import { ogPathFor } from '../../lib/seo';

// One social card per public page, drawn at build time (BRIEF §4, §10). A page's
// own `ogImage` frontmatter still wins in Base.astro; this is the default.
export const getStaticPaths = (async () => {
  const pages = await getAllPages();
  return pages.map((entry) => ({
    params: { slug: ogPathFor(entry.data.path).replace(/^\/og\//, '').replace(/\.png$/, '') },
    props: { page: { path: entry.data.path, title: entry.data.title, h1: entry.data.h1, bookChapter: entry.data.bookChapter } },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props.page);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
