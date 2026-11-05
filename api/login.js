// Exchanges a password for a signed session. The password is checked by the Supabase edge
// function; this endpoint only turns the returned token into an HttpOnly cookie.
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!password) return res.status(400).json({ error: 'Please type your password to sign in.' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  let r;
  try {
    r = await fetch(process.env.FN_URL + '/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ebmi-ip': ip },
      body: JSON.stringify({ password }),
    });
  } catch {
    return res.status(502).json({ error: 'We could not reach the server. Please try again in a moment.' });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return res.status(r.status).json({ error: j.error || 'We could not sign you in. Please check your password and try again.' });
  res.setHeader('Set-Cookie', `ebmi_s=${j.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${j.max_age || 43200}`);
  return res.status(200).json({ ok: true, role: j.role });
}
