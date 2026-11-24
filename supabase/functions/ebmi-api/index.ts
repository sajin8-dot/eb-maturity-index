import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const enc = new TextEncoder();
const PCOUNT = [7, 8, 9, 8, 8];
const SESSION_SECONDS = 12 * 3600;

const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const err = (m: string, s = 400) => json({ error: m }, s);

// ---------- crypto ----------
let CFG: { sign_key: string; pepper: string } | null = null;
async function cfg() {
  if (!CFG) {
    const { data, error } = await db.from("ebmi_config").select("k,v");
    if (error) throw error;
    const m: Record<string, string> = {};
    (data || []).forEach((r) => (m[r.k] = r.v));
    CFG = { sign_key: m.sign_key, pepper: m.pepper };
  }
  return CFG!;
}
const b64u = (b: Uint8Array) => { let s = ""; b.forEach((c) => (s += String.fromCharCode(c))); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
function same(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
const normPw = (p: string) => String(p || "").replace(/\s+/g, "").toUpperCase();
async function pwHash(pw: string) { const c = await cfg(); return hex(await hmac(c.pepper, normPw(pw))); }
async function sign(p: object) { const c = await cfg(); const body = b64u(enc.encode(JSON.stringify(p))); return body + "." + b64u(await hmac(c.sign_key, body)); }
async function verify(t: string) {
  if (!t || t.indexOf(".") < 1) return null;
  const [body, sig] = t.split(".");
  const c = await cfg();
  if (!same(sig, b64u(await hmac(c.sign_key, body)))) return null;
  try {
    const p = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch { return null; }
}
function newPassword() {
  const al = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint8Array(16));
  const ch = [...r].map((x) => al[x % al.length]).join("");
  return ch.match(/.{4}/g)!.join("-");
}

// ---------- scoring (mirrors the app; unweighted so scores are comparable across clients) ----------
const validId = (id: string) => { const m = /^([1-5])\.(\d{1,2})$/.exec(id); return !!m && +m[2] >= 1 && +m[2] <= PCOUNT[+m[1] - 1]; };
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
function clean(ans: any) {
  const out: any = {};
  if (!ans || typeof ans !== "object") return out;
  for (const [id, a0] of Object.entries(ans)) {
    if (id === "_x") {
      const x: any = a0 || {};
      out._x = { sum: String(x.sum || "").slice(0, 4000), au: String(x.au || "").slice(0, 120), ad: isDate(x.ad) ? x.ad : "", iw: String(x.iw || "").slice(0, 1000) };
      continue;
    }
    if (!validId(id)) continue;
    const a: any = a0 || {};
    out[id] = { in: !!a.in, sc: Math.max(0, Math.min(5, (a.sc | 0))), vd: ["b", "m", "a"].includes(a.vd) ? a.vd : "", ev: String(a.ev || "").slice(0, 2000), pr: a.pr === "f" ? "f" : "n",
      iv: String(a.iv || "").slice(0, 200),
      ivd: isDate(a.ivd) ? a.ivd : "",
      nt: String(a.nt || "").slice(0, 2000),
      lk: (Array.isArray(a.lk) ? a.lk : []).slice(0, 5).map((l: any) => ({ t: String(l?.t || "").slice(0, 120), u: String(l?.u || "").slice(0, 500), d: /^\d{4}-\d{2}-\d{2}$/.test(String(l?.d || "")) ? l.d : "" })) };
  }
  return out;
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const toIdx = (v: number | null) => (v == null ? null : Math.round(((v - 1) / 4) * 100));
function summarize(ans: any) {
  const rows: any[] = [];
  for (const [id, a] of Object.entries<any>(ans || {})) {
    if (!validId(id) || !a || !a.in) continue;
    const sc = a.sc | 0;
    rows.push({ p: +id.split(".")[0] - 1, sc, ok: sc > 0 && String(a.ev || "").trim().length > 0, vd: a.vd });
  }
  const scored = rows.filter((r) => r.sc > 0), valid = scored.filter((r) => r.ok);
  const avg = mean(scored.map((r) => r.sc)), avgV = mean(valid.map((r) => r.sc));
  const pillars = [0, 1, 2, 3, 4].map((p) => ({
    p,
    avg: mean(scored.filter((r) => r.p === p).map((r) => r.sc)),
    avg_v: mean(valid.filter((r) => r.p === p).map((r) => r.sc)),
    n: scored.filter((r) => r.p === p).length,
    nv: valid.filter((r) => r.p === p).length,
  }));
  return { n_scope: rows.length, n_scored: scored.length, n_valid: valid.length, n_below: scored.filter((r) => r.vd === "b").length, avg, avg_v: avgV, idx: toIdx(avg), idx_v: toIdx(avgV), pillars };
}

// ---------- benchmark maths ----------
const pctOf = (vals: number[], v: number) => Math.round(((vals.filter((x) => x < v).length + 0.5 * vals.filter((x) => x === v).length) / vals.length) * 100);
const rankOf = (vals: number[], v: number) => 1 + vals.filter((x) => x > v).length;
function quant(sorted: number[], p: number) { const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo); }
const r1 = (x: number) => Math.round(x * 10) / 10;
const label = (p: number) => (p >= 75 ? "Top quartile" : p >= 50 ? "Upper half" : p >= 25 ? "Lower half" : "Bottom quartile");

async function poolRows(basis: string) {
  const { data: snaps, error } = await db.from("ebmi_snapshots").select("id,cohort_id,client_id,taken_on,wave,answers,idx,idx_v,avg,avg_v,n_valid,n_scored,pillars,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  const { data: clients } = await db.from("ebmi_clients").select("id,name,archived");
  const { data: cohorts } = await db.from("ebmi_cohorts").select("id,name");
  const cm = new Map((clients || []).map((c) => [c.id, c])), hm = new Map((cohorts || []).map((c) => [c.id, c]));
  const seen = new Set<string>(), out: any[] = [];
  for (const s of snaps || []) {
    if (seen.has(s.cohort_id)) continue;
    seen.add(s.cohort_id);
    const c = cm.get(s.client_id), h = hm.get(s.cohort_id);
    if (!c || c.archived || !h) continue;
    const ev = basis !== "provisional";
    const subs: Record<string, number> = {};
    for (const [id, a] of Object.entries<any>(s.answers || {})) {
      if (a && a.in && a.sc > 0 && (!ev || String(a.ev || "").trim())) subs[id] = a.sc;
    }
    out.push({
      snapshot_id: s.id, cohort_id: s.cohort_id, client_id: s.client_id, client: c.name, cohort: h.name, wave: s.wave, taken_on: s.taken_on,
      n: ev ? s.n_valid : s.n_scored,
      idx: ev ? s.idx_v : s.idx,
      pillars: (s.pillars || []).map((p: any) => ev ? p.avg_v : p.avg),
      subs,
    });
  }
  return out;
}
function applyPool(rows: any[], pool: string, wave: number, min: number) {
  return rows.filter((r) => r.idx != null && r.n >= min && (pool !== "wave" || r.wave === wave));
}

async function benchmarkFor(cohortId: string, pool: string, basis: string, min: number) {
  const all = await poolRows(basis);
  const me = all.find((r) => r.cohort_id === cohortId);
  if (!me) return { eligible: false, reason: "no_snapshot" };
  if (me.idx == null || me.n < min) return { eligible: false, reason: "too_few", have: me.n, need: min };
  const rows = applyPool(all, pool, me.wave, min);
  const vals = rows.map((r) => r.idx as number);
  const n = vals.length, thin = n < 5;
  const sorted = [...vals].sort((a, b) => a - b);
  const stat = (list: number[], v: number) => {
    const s = [...list].sort((a, b) => a - b);
    return { v, pct: pctOf(list, v), rank: rankOf(list, v), of: list.length, med: list.length ? r1(quant(s, 0.5)) : null };
  };
  const idx = { ...stat(vals, me.idx), ...(thin ? {} : { p25: r1(quant(sorted, 0.25)), p75: r1(quant(sorted, 0.75)) }) };
  const pillars = [0, 1, 2, 3, 4].map((p) => {
    const list = rows.map((r) => r.pillars[p]).filter((x: any) => x != null) as number[];
    const v = me.pillars[p];
    if (v == null) return { p, v: null, n: list.length };
    const o: any = { p, v: r1(v), n: list.length };
    if (list.length >= 3) {
      const s = [...list].sort((a, b) => a - b);
      Object.assign(o, {
        pct: pctOf(list, v),
        min: r1(s[0]),
        p25: r1(quant(s, 0.25)),
        med: r1(quant(s, 0.5)),
        p75: r1(quant(s, 0.75)),
        max: r1(s[s.length - 1]),
      });
    }
    return o;
  });
  const subs = Object.entries<number>(me.subs).map(([id, v]) => {
    const list = rows.map((r) => r.subs[id]).filter((x: any) => x != null) as number[];
    const o: any = { id, v, n: list.length };
    if (list.length >= 3) {
      const s = [...list].sort((a, b) => a - b);
      Object.assign(o, {
        pct: pctOf(list, v),
        rank: rankOf(list, v),
        of: list.length,
        p25: r1(quant(s, 0.25)),
        med: r1(quant(s, 0.5)),
        p75: r1(quant(s, 0.75)),
      });
    }
    return o;
  }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const dist = rows.length >= 3
    ? rows.map((r) => ({ wave: r.wave, idx: r.idx as number, me: r.cohort_id === cohortId })).sort((a, b) => b.idx - a.idx)
    : [];
  return { eligible: true, pool: { n, thin, mode: pool, basis, min, wave: me.wave }, idx, position: n >= 3 ? label(idx.pct) : null, pillars, subs, dist, taken_on: me.taken_on };
}

async function league(pool: string, basis: string, min: number) {
  const all = await poolRows(basis);
  return all.map((r) => {
    const ok = r.idx != null && r.n >= min;
    const peers = ok ? applyPool(all, pool, r.wave, min) : [];
    const vals = peers.map((x) => x.idx as number);
    const row: any = { client_id: r.client_id, cohort_id: r.cohort_id, client: r.client, cohort: r.cohort, wave: r.wave, taken_on: r.taken_on, n: r.n, idx: r.idx, eligible: ok };
    if (ok) {
      row.pct = pctOf(vals, r.idx); row.rank = rankOf(vals, r.idx); row.of = vals.length;
      row.pillars = [0, 1, 2, 3, 4].map((p) => {
        const list = peers.map((x) => x.pillars[p]).filter((x: any) => x != null) as number[];
        const v = r.pillars[p];
        return v == null ? null : { v: r1(v), pct: list.length >= 3 ? pctOf(list, v) : null };
      });
    }
    return row;
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || (b.idx ?? -1) - (a.idx ?? -1));
}

// ---------- handlers ----------
async function login(req: Request) {
  const b = await req.json().catch(() => ({}));
  const ip = (req.headers.get("x-ebmi-ip") || "unknown").slice(0, 64);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db.from("ebmi_attempts").select("id", { count: "exact", head: true }).eq("ip", ip).gt("at", since);
  if ((count || 0) >= 8) return err("Too many attempts. Wait ten minutes and try again.", 429);
  const h = await pwHash(b.password);
  const { data } = await db.from("ebmi_access").select("id,role,client_id,revoked").eq("pw_hash", h).maybeSingle();
  if (!data || data.revoked) {
    await db.from("ebmi_attempts").insert({ ip });
    await db.from("ebmi_attempts").delete().lt("at", new Date(Date.now() - 86400000).toISOString());
    return err("That password is not recognised.", 401);
  }
  await db.from("ebmi_access").update({ last_login: new Date().toISOString() }).eq("id", data.id);
  let name = null;
  if (data.client_id) { const { data: c } = await db.from("ebmi_clients").select("name").eq("id", data.client_id).maybeSingle(); name = c?.name || null; }
  const token = await sign({ a: data.id, r: data.role, c: data.client_id, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS });
  return json({ token, role: data.role, client_id: data.client_id, name, max_age: SESSION_SECONDS });
}

async function auth(req: Request) {
  const p = await verify(req.headers.get("x-ebmi-token") || "");
  if (!p) return null;
  const { data } = await db.from("ebmi_access").select("id,role,client_id,revoked").eq("id", p.a).maybeSingle();
  if (!data || data.revoked) return null;
  return { access: data.id as string, role: data.role as string, client_id: data.client_id as string | null };
}

async function getState(me: any) {
  let q = db.from("ebmi_clients").select("id,name,wave").eq("archived", false).order("created_at");
  if (me.role === "client") q = q.eq("id", me.client_id);
  const { data: clients } = await q;
  let archived: any[] = [];
  if (me.role === "admin") { const { data: ar } = await db.from("ebmi_clients").select("id,name,wave").eq("archived", true).order("name"); archived = ar || []; }
  const ids = (clients || []).map((c) => c.id);
  if (!ids.length) return { role: me.role, clients: [], archived };
  const { data: cohorts } = await db.from("ebmi_cohorts").select("id,client_id,name,answers,updated_at").in("client_id", ids).order("created_at");
  const { data: snaps } = await db.from("ebmi_snapshots").select("id,cohort_id,taken_on,idx,idx_v,avg,n_scope,n_scored,n_valid").in("client_id", ids).order("created_at");
  return {
    role: me.role,
    archived,
    clients: (clients || []).map((c) => ({
      ...c,
      cohorts: (cohorts || []).filter((h) => h.client_id === c.id).map((h) => ({
        id: h.id, name: h.name, a: h.answers || {}, u: h.updated_at,
        hist: (snaps || []).filter((s) => s.cohort_id === h.id).map((s) => ({ id: s.id, d: s.taken_on, idx: s.idx, idxv: s.idx_v, avg: s.avg == null ? null : +s.avg, n: s.n_scope, s: s.n_scored, v: s.n_valid })),
      })),
    })),
  };
}

async function cohortFor(me: any, id: string) {
  const { data } = await db.from("ebmi_cohorts").select("id,client_id,name,answers,updated_at").eq("id", id).maybeSingle();
  if (!data) return null;
  if (me.role !== "admin" && data.client_id !== me.client_id) return null;
  return data;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^.*\/ebmi-api/, "") || "/";
    const m = req.method;
    if (m === "OPTIONS") return new Response(null, { status: 204 });
    if (path === "/login" && m === "POST") return await login(req);
    const me = await auth(req);
    if (!me) return err("unauthorised", 401);
    const admin = me.role === "admin";
    const body = m === "GET" || m === "DELETE" ? {} : await req.json().catch(() => ({}));
    const q = url.searchParams;

    if (path === "/me" && m === "GET") return json({ role: me.role, client_id: me.client_id });
    if (path === "/state" && m === "GET") return json(await getState(me));

    // clients (admin)
    if (path === "/client" && m === "POST") {
      if (!admin) return err("forbidden", 403);
      const name = String(body.name || "").trim().slice(0, 120) || "New client";
      const wave = Math.max(1, Math.min(4, body.wave | 0 || 2));
      const { data: c, error } = await db.from("ebmi_clients").insert({ name, wave }).select("id,name,wave").single();
      if (error) throw error;
      const { data: h } = await db.from("ebmi_cohorts").insert({ client_id: c.id, name: "Whole centre" }).select("id,name").single();
      return json({ ...c, cohorts: [{ id: h!.id, name: h!.name, a: {}, hist: [] }] });
    }
    if (path === "/client" && m === "PATCH") {
      if (!admin) return err("forbidden", 403);
      const upd: any = {};
      if (typeof body.name === "string") upd.name = body.name.trim().slice(0, 120) || "Unnamed client";
      if (body.wave) upd.wave = Math.max(1, Math.min(4, body.wave | 0));
      if (typeof body.archived === "boolean") upd.archived = body.archived;
      if (!Object.keys(upd).length) return json({ ok: true });
      await db.from("ebmi_clients").update(upd).eq("id", body.id);
      return json({ ok: true });
    }
    if (path === "/client" && m === "DELETE") {
      if (!admin) return err("forbidden", 403);
      const { data: dc } = await db.from("ebmi_clients").select("archived").eq("id", q.get("id")).maybeSingle();
      if (!dc) return err("client not found", 404);
      if (!dc.archived) return err("Please archive this client first. Only archived clients can be deleted permanently.", 400);
      await db.from("ebmi_clients").delete().eq("id", q.get("id"));
      return json({ ok: true });
    }

    // cohorts
    if (path === "/cohort" && m === "POST") {
      const cid = admin ? body.client_id : me.client_id;
      if (!cid) return err("client required");
      const { data: h, error } = await db.from("ebmi_cohorts").insert({ client_id: cid, name: String(body.name || "New cohort").slice(0, 120) }).select("id,name,updated_at").single();
      if (error) throw error;
      return json({ id: h.id, name: h.name, a: {}, u: h.updated_at, hist: [] });
    }
    if (path === "/cohort" && m === "PATCH") {
      const h = await cohortFor(me, body.id);
      if (!h) return err("not found", 404);
      const upd: any = {};
      if (typeof body.name === "string") upd.name = body.name.trim().slice(0, 120) || "Unnamed";
      const checked = body.answers !== undefined && body.force !== true && !!body.base;
      if (body.answers !== undefined) {
        // Stale-write protection: refuse when the cohort changed after the editor loaded it.
        if (checked && new Date(body.base).getTime() !== new Date(h.updated_at).getTime()) return err("conflict", 409);
        upd.answers = clean(body.answers);
        upd.updated_at = new Date().toISOString();
      }
      if (!Object.keys(upd).length) return json({ ok: true, u: h.updated_at });
      let uq = db.from("ebmi_cohorts").update(upd).eq("id", h.id);
      if (checked) uq = uq.eq("updated_at", h.updated_at);
      const { data: rows, error } = await uq.select("updated_at");
      if (error) throw error;
      if (!rows || !rows.length) return err("conflict", 409);
      return json({ ok: true, u: rows[0].updated_at });
    }
    if (path === "/cohort" && m === "DELETE") {
      const h = await cohortFor(me, q.get("id") || "");
      if (!h) return err("not found", 404);
      await db.from("ebmi_cohorts").delete().eq("id", h.id);
      return json({ ok: true });
    }

    // snapshots
    if (path === "/snapshot" && m === "POST") {
      const h = await cohortFor(me, body.cohort_id);
      if (!h) return err("not found", 404);
      const { data: c } = await db.from("ebmi_clients").select("wave").eq("id", h.client_id).single();
      const rawAns = admin && body.answers && typeof body.answers === "object" ? body.answers : h.answers;
      const ans = clean(rawAns), s = summarize(ans);
      const ins: any = { cohort_id: h.id, client_id: h.client_id, wave: c!.wave, answers: ans, ...s };
      if (admin && isDate(body.taken_on)) ins.taken_on = body.taken_on;
      const { data: row, error } = await db.from("ebmi_snapshots").insert(ins).select("id,taken_on").single();
      if (error) throw error;
      return json({ id: row.id, d: row.taken_on, idx: s.idx, idxv: s.idx_v, avg: s.avg, n: s.n_scope, s: s.n_scored, v: s.n_valid });
    }
    if (path === "/snapshot" && m === "GET") {
      const { data: sn } = await db.from("ebmi_snapshots").select("id,client_id,taken_on,wave,answers,idx,idx_v").eq("id", q.get("id") || "").maybeSingle();
      if (!sn || (!admin && sn.client_id !== me.client_id)) return err("not found", 404);
      return json({ id: sn.id, taken_on: sn.taken_on, wave: sn.wave, answers: sn.answers || {}, idx: sn.idx, idx_v: sn.idx_v });
    }
    if (path === "/snapshot" && m === "DELETE") {
      if (!admin) return err("forbidden", 403);
      await db.from("ebmi_snapshots").delete().eq("id", q.get("id"));
      return json({ ok: true });
    }

    // export of everything held for one client (admin: any client; client: its own)
    if (path === "/export" && m === "GET") {
      const cid = admin ? q.get("client") : me.client_id;
      if (!cid || (!admin && q.get("client") && q.get("client") !== me.client_id)) return err("forbidden", 403);
      const { data: cl } = await db.from("ebmi_clients").select("id,name,wave,archived,created_at").eq("id", cid).maybeSingle();
      if (!cl) return err("client not found", 404);
      const { data: co } = await db.from("ebmi_cohorts").select("id,name,answers,created_at,updated_at").eq("client_id", cid).order("created_at");
      const { data: sn } = await db.from("ebmi_snapshots").select("id,cohort_id,taken_on,wave,answers,n_scope,n_scored,n_valid,n_below,avg,avg_v,idx,idx_v,pillars,created_at").eq("client_id", cid).order("created_at");
      return json({ exported_at: new Date().toISOString(), client: cl, cohorts: co || [], snapshots: sn || [] });
    }

    // benchmark
    if (path === "/benchmark" && m === "GET") {
      const h = await cohortFor(me, q.get("cohort") || "");
      if (!h) return err("not found", 404);
      const pool = q.get("pool") === "wave" ? "wave" : "all";
      const basis = q.get("basis") === "provisional" ? "provisional" : "evidenced";
      const min = Math.max(1, Math.min(15, +(q.get("min") || 5) | 0));
      return json(await benchmarkFor(h.id, pool, basis, min));
    }
    if (path === "/league" && m === "GET") {
      if (!admin) return err("forbidden", 403);
      const pool = q.get("pool") === "wave" ? "wave" : "all";
      const basis = q.get("basis") === "provisional" ? "provisional" : "evidenced";
      const min = Math.max(1, Math.min(15, +(q.get("min") || 5) | 0));
      return json({ rows: await league(pool, basis, min), pool, basis, min });
    }

    // access (admin)
    if (path === "/access" && m === "GET") {
      if (!admin) return err("forbidden", 403);
      const { data } = await db.from("ebmi_access").select("id,client_id,label,revoked,last_login,created_at").eq("role", "client").order("created_at");
      return json({ access: data || [] });
    }
    if (path === "/access" && m === "POST") {
      if (!admin) return err("forbidden", 403);
      const { data: c } = await db.from("ebmi_clients").select("id").eq("id", body.client_id).maybeSingle();
      if (!c) return err("client not found", 404);
      const password = newPassword();
      const { data, error } = await db.from("ebmi_access").insert({ role: "client", client_id: c.id, label: String(body.label || "Client access").slice(0, 80), pw_hash: await pwHash(password) }).select("id").single();
      if (error) throw error;
      return json({ id: data.id, password });
    }
    if (path === "/admin/password" && m === "POST") {
      if (!admin) return err("forbidden", 403);
      const key = "pw:" + me.access;
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await db.from("ebmi_attempts").select("id", { count: "exact", head: true }).eq("ip", key).gt("at", since);
      if ((count || 0) >= 5) return err("Too many attempts. Wait ten minutes and try again.", 429);
      const { data: row } = await db.from("ebmi_access").select("id,pw_hash").eq("id", me.access).maybeSingle();
      if (!row || !same(row.pw_hash, await pwHash(body.current))) {
        await db.from("ebmi_attempts").insert({ ip: key });
        return err("Your current password is not right.", 403);
      }
      const next = normPw(body.next);
      if (next.length < 12) return err("Use at least 12 characters (spaces do not count).");
      if (new Set(next).size < 5) return err("That password is too repetitive.");
      const h = await pwHash(next);
      if (same(h, row.pw_hash)) return err("The new password is the same as the current one.");
      const { data: clash } = await db.from("ebmi_access").select("id").eq("pw_hash", h).maybeSingle();
      if (clash) return err("Choose a different password.");
      await db.from("ebmi_access").update({ pw_hash: h }).eq("id", me.access);
      return json({ ok: true });
    }
    if (path === "/access/revoke" && m === "POST") {
      if (!admin) return err("forbidden", 403);
      await db.from("ebmi_access").update({ revoked: body.revoked !== false }).eq("id", body.id).eq("role", "client");
      return json({ ok: true });
    }
    return err("not found", 404);
  } catch (e) {
    console.error(e);
    return err("server error", 500);
  }
});
