import { sameOrigin } from './_lib.js';

export default function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (!sameOrigin(req)) return res.status(403).json({ error: 'forbidden' });
  res.setHeader('Set-Cookie', 'ebmi_s=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return res.status(200).json({ ok: true });
}
