export default function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('Set-Cookie', 'ebmi_s=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return res.status(200).json({ ok: true });
}
