/**
 * Thin analytics wrapper (BRIEF §12). Sends custom events to Vercel Web Analytics
 * (cookieless); swapping providers means changing `track` only. Safe to call anywhere: it does
 * nothing on the server or when the script is absent (ad blockers, no consent).
 */
export type AnalyticsEvent =
  | { name: 'tool_generate' | 'tool_lock' | 'tool_share' | 'tool_export' | 'tool_save'; params: { tool: string } }
  | { name: 'test_complete'; params: { style: string; fluency_band: string } }
  | { name: 'email_signup'; params: { source: string; magnet: string } }
  | { name: 'template_download'; params: { template: string; format: string } }
  | { name: 'outbound_buy'; params: { retailer: string; format: string; country: string } }
  | { name: 'puzzle_reveal'; params: { puzzle_id: string; hint_or_answer: 'hint' | 'answer' } };

/** The queue stub the analytics snippet in Base.astro installs; the script replaces it once loaded. */
type Va = (command: 'event', payload: { name: string; data?: Record<string, string | number | boolean> }) => void;

export function track<E extends AnalyticsEvent>(name: E['name'], params: Extract<E, { name: typeof name }>['params']): void {
  if (typeof window === 'undefined') return;
  const va = (window as unknown as { va?: Va }).va;
  try {
    va?.('event', { name, data: params as Record<string, string | number | boolean> });
  } catch {
    /* analytics must never break the page */
  }
}
