// Vercel Function: POST /api/subscribe
// Keeps ESP keys server-side (BRIEF §4). The ESP adapter lives in src/lib/email.ts.
import { getEmailProvider, isValidEmail } from '../src/lib/email';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400);
  }

  // Honeypot: bots fill the hidden field. Pretend success and drop it.
  if (typeof body.company === 'string' && body.company.trim() !== '') return json({ ok: true });

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 80) : undefined;
  const source = typeof body.source === 'string' ? body.source.slice(0, 120) : 'unknown';
  const magnet = typeof body.magnet === 'string' ? body.magnet.slice(0, 60) : 'launch-alert';
  if (!isValidEmail(email)) return json({ ok: false, error: 'invalid-email' }, 422);

  const result = await getEmailProvider(process.env).subscribe({ email, firstName, source, magnet });
  return result.ok ? json({ ok: true }) : json({ ok: false, error: result.error }, 502);
}
