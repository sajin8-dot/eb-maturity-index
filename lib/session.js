// Session token check shared by the middleware and its tests.
const enc = new TextEncoder();

export function b64u(bytes) {
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

export async function valid(token, secret) {
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

