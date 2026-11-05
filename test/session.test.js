import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { valid } from '../lib/session.js';
import { clientIp, sameOrigin } from '../api/_lib.js';

const SECRET = 'test-secret';
const mint = (payload, secret = SECRET) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + createHmac('sha256', secret).update(body).digest('base64url');
};
const future = () => Math.floor(Date.now() / 1000) + 600;

test('valid accepts a good, unexpired token', async () => {
  assert.equal(await valid(mint({ exp: future() }), SECRET), true);
});

test('valid rejects expired, forged, malformed and secret-less tokens', async () => {
  assert.equal(await valid(mint({ exp: 1 }), SECRET), false);
  assert.equal(await valid(mint({ exp: future() }, 'other'), SECRET), false);
  assert.equal(await valid(mint({}), SECRET), false);
  assert.equal(await valid('', SECRET), false);
  assert.equal(await valid('nodot', SECRET), false);
  assert.equal(await valid(mint({ exp: future() }), ''), false);
  const t = mint({ exp: future() });
  assert.equal(await valid(t.slice(0, -2) + 'xx', SECRET), false);
});

test('middleware matcher exempts only the sign-in page and endpoint', async () => {
  const { config } = await import('../middleware.js').catch(() => ({ config: null }));
  const src = config ? config.matcher[0] : null;
  if (!src) return; // @vercel/edge not installed
  const re = new RegExp('^' + src + '$');
  for (const open of ['/login.html', '/api/login']) assert.equal(re.test(open), false, open);
  for (const gated of ['/', '/index.html', '/api/db', '/api/logout', '/login.html.bak', '/api/login/x', '/favicon.ico', '/api/login2']) assert.equal(re.test(gated), true, gated);
});

const req = (method, headers) => ({ method, headers });

test('sameOrigin lets reads through and blocks cross-site writes', () => {
  assert.equal(sameOrigin(req('GET', { origin: 'https://evil.example' })), true);
  assert.equal(sameOrigin(req('POST', { origin: 'https://evil.example', host: 'ebmi.example.com' })), false);
  assert.equal(sameOrigin(req('POST', { origin: 'https://ebmi.example.com', host: 'ebmi.example.com' })), true);
  assert.equal(sameOrigin(req('POST', { 'sec-fetch-site': 'cross-site', origin: 'https://ebmi.example.com', host: 'ebmi.example.com' })), false);
  assert.equal(sameOrigin(req('DELETE', { 'sec-fetch-site': 'same-origin' })), true);
  assert.equal(sameOrigin(req('POST', {})), false);
  assert.equal(sameOrigin(req('POST', { origin: 'not a url', host: 'x' })), false);
});

test('clientIp ignores the spoofable left of x-forwarded-for', () => {
  assert.equal(clientIp({ headers: { 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9, 1.2.3.4' } }), '1.2.3.4');
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '9.9.9.9, 5.6.7.8' } }), '5.6.7.8');
  assert.equal(clientIp({ headers: {} }), 'unknown');
});
