import book from '../data/book.json';
import people from '../data/people.json';
import type { PageData } from './schemas';

export const SITE_NAME = 'The Creativity Playbook';

/** Absolute canonical URL for a site path. Tool query variants pass the base path. */
export function canonicalUrl(path: string, site: URL | string): string {
  return new URL(path, site).href;
}

type Ld = Record<string, unknown>;

export function websiteLd(site: URL | string): Ld {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: new URL('/', site).href };
}

export function organizationLd(site: URL | string): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: new URL('/', site).href,
  };
}

type PersonKey = 'dave-stewart' | 'mark-simmons';
export function personLd(key: PersonKey, site: URL | string): Ld {
  const p = people[key];
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': new URL(`/authors/#${key}`, site).href,
    name: p.name,
    jobTitle: p.jobTitle,
    ...(p.sameAs.length ? { sameAs: p.sameAs } : {}),
  };
}

/**
 * Book schema for the new edition. While status is 'prelaunch' there is no
 * `offers`, no `isbn` and no `workExample`: nothing is claimed that isn't true yet.
 */
export function bookLd(site: URL | string): Ld {
  const live = book.status === 'live';
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    alternativeHeadline: book.subtitle,
    author: [personLd('dave-stewart', site), personLd('mark-simmons', site)].map(({ '@context': _c, ...rest }) => rest),
    url: new URL('/book/', site).href,
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(live && book.formats.length ? { workExample: book.formats } : {}),
  };
}

type Crumb = { name: string; path: string };
export function breadcrumbLd(crumbs: Crumb[], site: URL | string): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: new URL(c.path, site).href,
    })),
  };
}

export function articleLd(page: PageData, site: URL | string): Ld {
  const byline =
    page.author === 'mark'
      ? personLd('mark-simmons', site)
      : page.author === 'dave'
        ? personLd('dave-stewart', site)
        : { '@type': 'Organization', name: SITE_NAME };
  const { '@context': _c, ...author } = byline as Ld;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.description,
    mainEntityOfPage: new URL(page.path, site).href,
    dateModified: page.updated.toISOString().slice(0, 10),
    author,
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
}

export function webApplicationLd(page: PageData, site: URL | string): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: page.title,
    description: page.description,
    url: new URL(page.path, site).href,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
  };
}

export function itemListLd(items: { name: string; path: string }[], site: URL | string): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: new URL(it.path, site).href,
    })),
  };
}

/** JSON-LD for a page, by page type. HowTo is deprecated and never emitted (BRIEF §10.2). */
export function jsonLdForPage(page: PageData, site: URL | string, crumbs: Crumb[]): Ld[] {
  const out: Ld[] = [breadcrumbLd(crumbs, site)];
  switch (page.pageType) {
    case 'home':
      out.push(websiteLd(site), organizationLd(site));
      break;
    case 'book':
      out.push(bookLd(site));
      break;
    case 'about':
      out.push(personLd('dave-stewart', site), personLd('mark-simmons', site));
      break;
    case 'tool':
      out.push(webApplicationLd(page, site));
      break;
    case 'guide':
    case 'pillar-guide':
    case 'hub-guide':
    case 'technique':
      out.push(articleLd(page, site));
      break;
    default:
      break;
  }
  return out;
}
