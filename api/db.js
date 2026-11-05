// Authenticated proxy to the Supabase edge function. The browser never sees the token:
// it lives in an HttpOnly cookie and is attached here, server side.
const ALLOWED = /^\/(me|state|client|cohort|snapshot|benchmark|league|access|access\/revoke|admin\/password)(\?[A-Za-z0-9=&_.%-]*)?$/;

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const cookie = String(req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith('ebmi_s='));
  const token = cookie ? cookie.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'unauthorised' });
  const p = String(req.query.p || '');
  if (!ALLOWED.test(p)) return res.status(400).json({ error: 'bad path' });
  const init = { method: req.method, headers: { 'x-ebmi-token': token, 'content-type': 'application/json' } };
  if (!['GET', 'DELETE', 'HEAD'].includes(req.method)) init.body = JSON.stringify(req.body || {});
  try {
    const r = await fetch(process.env.FN_URL + p, init);
    const text = await r.text();
    res.status(r.status).setHeader('content-type', 'application/json');
    return res.send(text);
  } catch {
    return res.status(502).json({ error: 'We could not reach the server. Please try again in a moment.' });
  }
}
