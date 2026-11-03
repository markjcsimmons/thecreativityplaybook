/**
 * Email service adapter (BRIEF §4). The ESP is not chosen yet (§16.3), so only a
 * stub exists. The sign-up function calls `getEmailProvider()`; API keys stay in
 * server-side env vars and never reach the browser. Double opt-in is the ESP's
 * job: `subscribe` must create a *pending* subscriber and trigger the
 * confirmation email.
 */
export type SubscribeRequest = {
  email: string;
  firstName?: string;
  /** Where the sign-up happened, e.g. "tool:random-idea-generator" or "page:/book/". */
  source: string;
  /** Which lead magnet or list, e.g. "launch-alert". */
  magnet: string;
};

export type SubscribeResult = { ok: true; pending: true } | { ok: false; error: string };

export interface EmailProvider {
  readonly name: string;
  subscribe(req: SubscribeRequest): Promise<SubscribeResult>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (s: string) => s.length <= 254 && EMAIL_RE.test(s);

/** Accepts every valid request and stores nothing. Use until an ESP is chosen. */
export const stubProvider: EmailProvider = {
  name: 'stub',
  async subscribe(req) {
    if (!isValidEmail(req.email)) return { ok: false, error: 'invalid-email' };
    console.log(`[email:stub] pending double opt-in: source=${req.source} magnet=${req.magnet}`);
    return { ok: true, pending: true };
  },
};

export function getEmailProvider(_env: Record<string, string | undefined> = {}): EmailProvider {
  // Add a branch per ESP (kit, mailerlite, beehiiv) keyed on env.EMAIL_PROVIDER.
  return stubProvider;
}
