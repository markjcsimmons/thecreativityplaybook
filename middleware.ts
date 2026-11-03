// Temporary site password (Vercel Routing Middleware). Runs before every request.
// Off unless SITE_PASSWORD is set, so local dev, previews and the build are unaffected.
// Remove the SITE_PASSWORD variable in Vercel (and redeploy) to open the site again.
//   SITE_PASSWORD  the password people must enter
//   ALLOWED_IPS    comma-separated IP addresses that skip the password (the owner's)
import { ipAddress, next } from '@vercel/functions';

const COOKIE = 'cp_gate';
const MAX_AGE = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

/** HMAC of a fixed string keyed by the password: equal passwords give equal tokens, and the cookie never holds the password. */
async function token(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode('creativity-playbook-gate'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison of two equal-length hex strings. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function cookieValue(request: Request, name: string): string {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return '';
}

function page(failed: boolean): Response {
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Password needed | The Creativity Playbook</title>
<style>
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 16px; background: #fffbf0; color: #111; font: 18px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { width: 100%; max-width: 26rem; border: 3px solid #111; border-radius: 14px; box-shadow: 5px 5px 0 #111; background: #fff426; padding: 1.5rem; }
  h1 { margin: 0 0 .5rem; font-size: 1.6rem; line-height: 1.15; text-transform: uppercase; }
  p { margin: 0 0 1rem; }
  label { display: block; font-weight: 700; margin-bottom: .25rem; }
  input { box-sizing: border-box; width: 100%; min-height: 3rem; padding: .5rem .9rem; border: 3px solid #111; border-radius: 12px; background: #fffbf0; color: #111; font: inherit; }
  button { margin-top: 1rem; min-height: 3rem; padding: .6rem 1.3rem; border: 3px solid #111; border-radius: 999px; background: #fffbf0; color: #111; font: inherit; font-weight: 700; cursor: pointer; }
  input:focus-visible, button:focus-visible { outline: 4px solid #0b4fd6; outline-offset: 3px; }
  .error { font-weight: 700; }
</style>
</head>
<body>
<main>
  <h1>The Creativity Playbook</h1>
  <p>This site is private while it is being built. Enter the password to continue.</p>
  ${failed ? '<p class="error" role="alert">That password is not right. Try again.</p>' : ''}
  <form method="post">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
    <button type="submit">Enter</button>
  </form>
</main>
</body>
</html>`;
  return new Response(body, {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
  });
}

export default async function middleware(request: Request): Promise<Response> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return next();

  const allowed = (process.env.ALLOWED_IPS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = ipAddress(request);
  if (ip && allowed.includes(ip)) return next();

  const expected = await token(password);
  if (same(cookieValue(request, COOKIE), expected)) return next();

  if (request.method === 'POST') {
    let submitted = '';
    try {
      const value = (await request.formData()).get('password');
      submitted = typeof value === 'string' ? value : '';
    } catch {
      /* not a form post: fall through to the password page */
    }
    if (submitted && same(await token(submitted), expected)) {
      const url = new URL(request.url);
      return new Response(null, {
        status: 303,
        headers: {
          location: url.pathname + url.search,
          'set-cookie': `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'cache-control': 'no-store',
        },
      });
    }
    return page(true);
  }
  return page(false);
}
