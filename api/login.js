import { clientIp, proxyHeaders, sameOrigin } from './_lib.js';

// Exchanges a password for a signed session. The password is checked by the Supabase edge
// function; this endpoint only turns the returned token into an HttpOnly cookie.
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!sameOrigin(req)) return res.status(403).json({ error: 'forbidden' });
  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!password) return res.status(400).json({ error: 'Enter your password.' });
  const ip = clientIp(req);
  let r;
  try {
    r = await fetch(process.env.FN_URL + '/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ebmi-ip': ip, ...proxyHeaders() },
      body: JSON.stringify({ password }),
    });
  } catch {
    return res.status(502).json({ error: 'Could not reach the server.' });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return res.status(r.status).json({ error: j.error || 'Sign in failed.' });
  res.setHeader('Set-Cookie', `ebmi_s=${j.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${j.max_age || 43200}`);
  return res.status(200).json({ ok: true, role: j.role });
}
