export type Country = 'us' | 'uk' | 'ca' | 'au';

const DOMAINS: Record<Country, string> = {
  us: 'www.amazon.com',
  uk: 'www.amazon.co.uk',
  ca: 'www.amazon.ca',
  au: 'www.amazon.com.au',
};

/**
 * Amazon product link for a country. `tag` is the Associates tracking ID for that
 * storefront (BRIEF §16.7). Third-party book lists need it; our own book does not
 * exist on Amazon yet, so nothing calls this for it.
 */
export function amazonUrl(asin: string, country: Country, tag?: string): string {
  const url = new URL(`https://${DOMAINS[country]}/dp/${encodeURIComponent(asin)}`);
  if (tag) url.searchParams.set('tag', tag);
  return url.href;
}

/** Affiliate links must carry rel="sponsored" and be disclosed on the page (BRIEF §2.2). */
export const AFFILIATE_REL = 'sponsored noopener';
