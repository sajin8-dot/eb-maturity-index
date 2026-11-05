import { createClient } from "npm:@supabase/supabase-js@2";
import { benchmark, buildPool, clean, leagueRows, summarize } from "./scoring.js";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const enc = new TextEncoder();
const SESSION_SECONDS = 12 * 3600;
const PROXY_SECRET = Deno.env.get("EBMI_PROXY_SECRET") || "";

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
    // Secrets set as edge function secrets win over the table, so they can be kept out of the database.
    CFG = { sign_key: Deno.env.get("EBMI_SIGN_KEY") || m.sign_key, pepper: Deno.env.get("EBMI_PEPPER") || m.pepper };
    if (!CFG.sign_key || !CFG.pepper) { CFG = null; throw new Error("ebmi_config is missing sign_key or pepper"); }
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

// ---------- scoring and benchmark maths live in scoring.js (pure, unit-tested) ----------
async function poolRows(basis: string) {
  const { data: snaps, error } = await db.from("ebmi_snapshots").select("id,cohort_id,client_id,taken_on,wave,answers,idx,idx_v,avg,avg_v,n_valid,n_scored,pillars,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  const { data: clients } = await db.from("ebmi_clients").select("id,name,archived");
  const { data: cohorts } = await db.from("ebmi_cohorts").select("id,name");
  return buildPool(snaps || [], clients || [], cohorts || [], basis);
}
const benchmarkFor = async (cohortId: string, pool: string, basis: string, min: number) => benchmark(await poolRows(basis), cohortId, pool, basis, min);
const league = async (pool: string, basis: string, min: number) => leagueRows(await poolRows(basis), pool, min);

// ---------- handlers ----------
async function login(req: Request) {
  const b = await req.json().catch(() => ({}));
  // x-ebmi-ip is only believed when the call carries the shared proxy secret. Without this a caller
  // hitting the function URL directly could rotate the header and dodge the per-IP throttle.
  const proxied = !PROXY_SECRET || same(req.headers.get("x-ebmi-proxy") || "", PROXY_SECRET);
  const ip = proxied ? (req.headers.get("x-ebmi-ip") || "unknown").slice(0, 64) : "direct";
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
  const ids = (clients || []).map((c) => c.id);
  if (!ids.length) return { role: me.role, clients: [] };
  const { data: cohorts } = await db.from("ebmi_cohorts").select("id,client_id,name,answers").in("client_id", ids).order("created_at");
  const { data: snaps } = await db.from("ebmi_snapshots").select("id,cohort_id,taken_on,idx,idx_v,avg,n_scope,n_scored,n_valid").in("client_id", ids).order("created_at");
  return {
    role: me.role,
    clients: (clients || []).map((c) => ({
      ...c,
      cohorts: (cohorts || []).filter((h) => h.client_id === c.id).map((h) => ({
        id: h.id, name: h.name, a: h.answers || {},
        hist: (snaps || []).filter((s) => s.cohort_id === h.id).map((s) => ({ id: s.id, d: s.taken_on, idx: s.idx, idxv: s.idx_v, avg: s.avg == null ? null : +s.avg, n: s.n_scope, s: s.n_scored, v: s.n_valid })),
      })),
    })),
  };
}

async function cohortFor(me: any, id: string) {
  const { data } = await db.from("ebmi_cohorts").select("id,client_id,name,answers").eq("id", id).maybeSingle();
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
      await db.from("ebmi_clients").update(upd).eq("id", body.id);
      return json({ ok: true });
    }
    if (path === "/client" && m === "DELETE") {
      if (!admin) return err("forbidden", 403);
      await db.from("ebmi_clients").delete().eq("id", q.get("id"));
      return json({ ok: true });
    }

    // cohorts
    if (path === "/cohort" && m === "POST") {
      const cid = admin ? body.client_id : me.client_id;
      if (!cid) return err("client required");
      const { data: h, error } = await db.from("ebmi_cohorts").insert({ client_id: cid, name: String(body.name || "New cohort").slice(0, 120) }).select("id,name").single();
      if (error) throw error;
      return json({ id: h.id, name: h.name, a: {}, hist: [] });
    }
    if (path === "/cohort" && m === "PATCH") {
      const h = await cohortFor(me, body.id);
      if (!h) return err("not found", 404);
      const upd: any = { updated_at: new Date().toISOString() };
      if (typeof body.name === "string") upd.name = body.name.trim().slice(0, 120) || "Unnamed";
      if (body.answers !== undefined) upd.answers = clean(body.answers);
      await db.from("ebmi_cohorts").update(upd).eq("id", h.id);
      return json({ ok: true });
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
      const ans = clean(h.answers), s = summarize(ans);
      const { data: row, error } = await db.from("ebmi_snapshots").insert({ cohort_id: h.id, client_id: h.client_id, wave: c!.wave, answers: ans, ...s }).select("id,taken_on").single();
      if (error) throw error;
      return json({ id: row.id, d: row.taken_on, idx: s.idx, idxv: s.idx_v, avg: s.avg, n: s.n_scope, s: s.n_scored, v: s.n_valid });
    }
    if (path === "/snapshot" && m === "DELETE") {
      if (!admin) return err("forbidden", 403);
      await db.from("ebmi_snapshots").delete().eq("id", q.get("id"));
      return json({ ok: true });
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
