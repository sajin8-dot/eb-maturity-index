// Server-side gate. Every request except the login page and login endpoint must carry a
// valid signed session cookie, so the framework and app code are never sent to anyone
// who has not signed in with a client password.
import { next } from '@vercel/edge';

import { valid } from './lib/session.js';

// Everything is gated except the sign-in page and its endpoint. No other exemptions: add one only
// on purpose, and update test/middleware.test.js with it.
export const config = { matcher: ['/((?!login\\.html$|api/login$).*)'] };

export default async function middleware(request) {
  const url = new URL(request.url);
  const cookie = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith('ebmi_s='));
  const token = cookie ? cookie.slice(7) : '';
  if (await valid(token, process.env.SESSION_SECRET)) return next();
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'unauthorised' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }
  return Response.redirect(new URL('/login.html', request.url), 302);
}
