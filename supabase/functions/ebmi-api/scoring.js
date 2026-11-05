// Pure scoring and benchmark maths. No I/O, so it runs in Deno (the edge function) and in
// Node (the tests). Keep it that way.
export const PCOUNT = [7, 8, 9, 8, 8];

export const validId = (id) => {
  const m = /^([1-5])\.(\d{1,2})$/.exec(id);
  return !!m && +m[2] >= 1 && +m[2] <= PCOUNT[+m[1] - 1];
};

export function clean(ans) {
  const out = {};
  if (!ans || typeof ans !== "object") return out;
  for (const [id, a0] of Object.entries(ans)) {
    if (!validId(id)) continue;
    const a = a0 || {};
    out[id] = {
      in: !!a.in,
      sc: Math.max(0, Math.min(5, a.sc | 0)),
      vd: ["b", "m", "a"].includes(a.vd) ? a.vd : "",
      ev: String(a.ev || "").slice(0, 2000),
      pr: a.pr === "f" ? "f" : "n",
    };
  }
  return out;
}

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const toIdx = (v) => (v == null ? null : Math.round(((v - 1) / 4) * 100));

export function summarize(ans) {
  const rows = [];
  for (const [id, a] of Object.entries(ans || {})) {
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
  return {
    n_scope: rows.length, n_scored: scored.length, n_valid: valid.length,
    n_below: scored.filter((r) => r.vd === "b").length,
    avg, avg_v: avgV, idx: toIdx(avg), idx_v: toIdx(avgV), pillars,
  };
}

// Mid-rank percentile: share of the pool below v, plus half the share equal to v.
export const pctOf = (vals, v) =>
  Math.round(((vals.filter((x) => x < v).length + 0.5 * vals.filter((x) => x === v).length) / vals.length) * 100);
export const rankOf = (vals, v) => 1 + vals.filter((x) => x > v).length;
export function quant(sorted, p) {
  const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
export const r1 = (x) => Math.round(x * 10) / 10;
export const label = (p) => (p >= 75 ? "Top quartile" : p >= 50 ? "Upper half" : p >= 25 ? "Lower half" : "Bottom quartile");

// snaps must be newest first. Keeps the latest snapshot per cohort, skipping archived clients.
export function buildPool(snaps, clients, cohorts, basis) {
  const cm = new Map((clients || []).map((c) => [c.id, c]));
  const hm = new Map((cohorts || []).map((c) => [c.id, c]));
  const seen = new Set(), out = [];
  for (const s of snaps || []) {
    if (seen.has(s.cohort_id)) continue;
    seen.add(s.cohort_id);
    const c = cm.get(s.client_id), h = hm.get(s.cohort_id);
    if (!c || c.archived || !h) continue;
    const ev = basis !== "provisional";
    const subs = {};
    for (const [id, a] of Object.entries(s.answers || {})) {
      if (a && a.in && a.sc > 0 && (!ev || String(a.ev || "").trim())) subs[id] = a.sc;
    }
    out.push({
      snapshot_id: s.id, cohort_id: s.cohort_id, client_id: s.client_id, client: c.name, cohort: h.name,
      wave: s.wave, taken_on: s.taken_on,
      n: ev ? s.n_valid : s.n_scored,
      idx: ev ? s.idx_v : s.idx,
      pillars: (s.pillars || []).map((p) => (ev ? p.avg_v : p.avg)),
      subs,
    });
  }
  return out;
}

export const applyPool = (rows, pool, wave, min) =>
  rows.filter((r) => r.idx != null && r.n >= min && (pool !== "wave" || r.wave === wave));

export function benchmark(all, cohortId, pool, basis, min) {
  const me = all.find((r) => r.cohort_id === cohortId);
  if (!me) return { eligible: false, reason: "no_snapshot" };
  if (me.idx == null || me.n < min) return { eligible: false, reason: "too_few", have: me.n, need: min };
  const rows = applyPool(all, pool, me.wave, min);
  const vals = rows.map((r) => r.idx);
  const n = vals.length, thin = n < 5;
  const sorted = [...vals].sort((a, b) => a - b);
  const stat = (list, v) => {
    const s = [...list].sort((a, b) => a - b);
    return { v, pct: pctOf(list, v), rank: rankOf(list, v), of: list.length, med: list.length ? r1(quant(s, 0.5)) : null };
  };
  const idx = { ...stat(vals, me.idx), ...(thin ? {} : { p25: r1(quant(sorted, 0.25)), p75: r1(quant(sorted, 0.75)) }) };
  const pillars = [0, 1, 2, 3, 4].map((p) => {
    const list = rows.map((r) => r.pillars[p]).filter((x) => x != null);
    const v = me.pillars[p];
    if (v == null) return { p, v: null, n: list.length };
    const o = { p, v: r1(v), n: list.length };
    if (list.length >= 3) Object.assign(o, { pct: pctOf(list, v), med: r1(quant([...list].sort((a, b) => a - b), 0.5)) });
    return o;
  });
  const subs = Object.entries(me.subs).map(([id, v]) => {
    const list = rows.map((r) => r.subs[id]).filter((x) => x != null);
    const o = { id, v, n: list.length };
    if (list.length >= 3) Object.assign(o, { pct: pctOf(list, v), med: r1(quant([...list].sort((a, b) => a - b), 0.5)) });
    return o;
  }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return {
    eligible: true, pool: { n, thin, mode: pool, basis, min, wave: me.wave },
    idx, position: n >= 3 ? label(idx.pct) : null, pillars, subs, taken_on: me.taken_on,
  };
}

export function leagueRows(all, pool, min) {
  return all.map((r) => {
    const ok = r.idx != null && r.n >= min;
    const peers = ok ? applyPool(all, pool, r.wave, min) : [];
    const vals = peers.map((x) => x.idx);
    const row = { client_id: r.client_id, cohort_id: r.cohort_id, client: r.client, cohort: r.cohort, wave: r.wave, taken_on: r.taken_on, n: r.n, idx: r.idx, eligible: ok };
    if (ok) {
      row.pct = pctOf(vals, r.idx); row.rank = rankOf(vals, r.idx); row.of = vals.length;
      row.pillars = [0, 1, 2, 3, 4].map((p) => {
        const list = peers.map((x) => x.pillars[p]).filter((x) => x != null);
        const v = r.pillars[p];
        return v == null ? null : { v: r1(v), pct: list.length >= 3 ? pctOf(list, v) : null };
      });
    }
    return row;
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || (b.idx ?? -1) - (a.idx ?? -1));
}
