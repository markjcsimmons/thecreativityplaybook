/**
 * Thin analytics wrapper (BRIEF §12). Defaults to Plausible custom events;
 * swapping to GA4 means changing `send` only. Safe to call anywhere: it does
 * nothing on the server or when the script is absent (ad blockers, no consent).
 */
export type AnalyticsEvent =
  | { name: 'tool_generate' | 'tool_lock' | 'tool_share' | 'tool_export' | 'tool_save'; params: { tool: string } }
  | { name: 'test_complete'; params: { style: string; fluency_band: string } }
  | { name: 'email_signup'; params: { source: string; magnet: string } }
  | { name: 'template_download'; params: { template: string; format: string } }
  | { name: 'outbound_buy'; params: { retailer: string; format: string; country: string } }
  | { name: 'puzzle_reveal'; params: { puzzle_id: string; hint_or_answer: 'hint' | 'answer' } };

type Plausible = (name: string, opts?: { props?: Record<string, string> }) => void;

export function track<E extends AnalyticsEvent>(name: E['name'], params: Extract<E, { name: typeof name }>['params']): void {
  if (typeof window === 'undefined') return;
  const plausible = (window as unknown as { plausible?: Plausible }).plausible;
  try {
    plausible?.(name, { props: params as Record<string, string> });
  } catch {
    /* analytics must never break the page */
  }
}
