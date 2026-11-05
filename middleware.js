// Server-side gate. Every request except the login page and login endpoint must carry a
// valid signed session cookie, so the framework and app code are never sent to anyone
// who has not signed in with a client password.
import { next } from '@vercel/edge';

const enc = new TextEncoder();

function b64u(bytes) {
  let s = '';
  bytes.forEach((c) => (s += String.fromCharCode(c)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function valid(token, secret) {
  if (!token || !secret || token.indexOf('.') < 1) return false;
  const [body, sig] = token.split('.');
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expect = b64u(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body))));
  if (!same(sig, expect)) return false;
  try {
    const p = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    return !!p.exp && p.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export const config = { matcher: ['/((?!login\\.html|api/login|favicon\\.ico).*)'] };

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
