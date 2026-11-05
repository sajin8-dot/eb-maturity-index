// Shared helpers for the API routes. Files starting with "_" are not exposed as routes.

// CSRF defence in depth on top of SameSite=Lax: a state-changing request must come from this
// site. Browsers always send Origin on cross-origin POST/PATCH/DELETE; Sec-Fetch-Site covers the rest.
export function sameOrigin(req) {
  const m = req.method || 'GET';
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return true;
  const h = req.headers;
  const site = h['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = h.origin;
  if (origin) {
    try {
      return new URL(origin).host === String(h['x-forwarded-host'] || h.host || '').split(',')[0].trim();
    } catch {
      return false;
    }
  }
  return !!site; // no Origin: accept only if the browser vouched for same-origin via Sec-Fetch-Site
}

// Client IP for throttling. Vercel sets x-real-ip and x-vercel-forwarded-for itself and
// overwrites any client-supplied value; the left-most x-forwarded-for entry is attacker-controlled.
export function clientIp(req) {
  const h = req.headers;
  const ip = h['x-real-ip'] || h['x-vercel-forwarded-for'] || String(h['x-forwarded-for'] || '').split(',').pop();
  return String(ip || '').trim().slice(0, 64) || 'unknown';
}

// Headers that identify this proxy to the edge function (see EBMI_PROXY_SECRET there).
export function proxyHeaders() {
  return process.env.PROXY_SECRET ? { 'x-ebmi-proxy': process.env.PROXY_SECRET } : {};
}
