import test from 'node:test';
import assert from 'node:assert/strict';
import { benchmark, buildPool, clean, label, leagueRows, pctOf, quant, rankOf, summarize, toIdx, validId } from '../supabase/functions/ebmi-api/scoring.js';

test('validId accepts only real sub-outcomes', () => {
  assert.ok(validId('1.1') && validId('1.7') && validId('3.9') && validId('5.8'));
  assert.ok(!validId('1.8') && !validId('3.10') && !validId('6.1') && !validId('1.0') && !validId('x'));
});

test('clean clamps scores, trims evidence and drops unknown ids', () => {
  const out = clean({ '1.1': { in: 1, sc: 9, vd: 'z', ev: 'x'.repeat(5000), pr: 'f' }, '9.9': { in: true, sc: 3 }, '2.1': { sc: -4 } });
  assert.deepEqual(Object.keys(out).sort(), ['1.1', '2.1']);
  assert.equal(out['1.1'].sc, 5);
  assert.equal(out['1.1'].vd, '');
  assert.equal(out['1.1'].ev.length, 2000);
  assert.equal(out['1.1'].pr, 'f');
  assert.equal(out['2.1'].sc, 0);
  assert.deepEqual(clean(null), {});
});

test('toIdx maps 1..5 onto 0..100', () => {
  assert.equal(toIdx(1), 0);
  assert.equal(toIdx(3), 50);
  assert.equal(toIdx(5), 100);
  assert.equal(toIdx(null), null);
});

test('summarize counts only in-scope scored rows, and evidenced rows separately', () => {
  const s = summarize({
    '1.1': { in: true, sc: 5, ev: 'doc', vd: 'a' },
    '1.2': { in: true, sc: 3, ev: '  ', vd: 'b' },
    '2.1': { in: true, sc: 0, ev: 'doc' },
    '2.2': { in: false, sc: 5, ev: 'doc' },
    '9.9': { in: true, sc: 5, ev: 'doc' },
  });
  assert.equal(s.n_scope, 3);
  assert.equal(s.n_scored, 2);
  assert.equal(s.n_valid, 1);
  assert.equal(s.n_below, 1);
  assert.equal(s.avg, 4);
  assert.equal(s.avg_v, 5);
  assert.equal(s.idx, 75);
  assert.equal(s.idx_v, 100);
  assert.equal(s.pillars[0].n, 2);
  assert.equal(s.pillars[0].nv, 1);
  assert.equal(s.pillars[1].avg, null);
});

test('mid-rank percentile, rank and quantile', () => {
  const v = [10, 20, 20, 40];
  assert.equal(pctOf(v, 10), 13); // (0 + .5) / 4 = 12.5 -> 13
  assert.equal(pctOf(v, 20), 50); // (1 + 1) / 4
  assert.equal(pctOf(v, 40), 88); // (3 + .5) / 4 = 87.5 -> 88
  assert.equal(rankOf(v, 40), 1);
  assert.equal(rankOf(v, 20), 2);
  assert.equal(rankOf(v, 10), 4);
  assert.equal(quant([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quant([5], 0.25), 5);
});

test('label bands', () => {
  assert.equal(label(75), 'Top quartile');
  assert.equal(label(74), 'Upper half');
  assert.equal(label(50), 'Upper half');
  assert.equal(label(25), 'Lower half');
  assert.equal(label(24), 'Bottom quartile');
});

const snap = (id, cohort, client, wave, idxV, nValid, extra = {}) => ({
  id, cohort_id: cohort, client_id: client, wave, taken_on: '2026-01-01',
  idx: idxV, idx_v: idxV, n_valid: nValid, n_scored: nValid,
  pillars: [0, 1, 2, 3, 4].map(() => ({ avg: 3, avg_v: 3 })),
  answers: { '1.1': { in: true, sc: 3, ev: 'doc' } }, ...extra,
});
const clients = [1, 2, 3, 4, 5, 6].map((i) => ({ id: 'c' + i, name: 'Client ' + i, archived: i === 6 }));
const cohorts = [1, 2, 3, 4, 5, 6].map((i) => ({ id: 'h' + i, name: 'Cohort ' + i }));

test('buildPool keeps the latest snapshot per cohort and drops archived clients', () => {
  const snaps = [snap('new', 'h1', 'c1', 2, 80, 10), snap('old', 'h1', 'c1', 2, 20, 10), snap('x', 'h6', 'c6', 2, 50, 10)];
  const pool = buildPool(snaps, clients, cohorts, 'evidenced');
  assert.equal(pool.length, 1);
  assert.equal(pool[0].snapshot_id, 'new');
  assert.equal(pool[0].idx, 80);
});

test('evidenced basis ignores sub-outcomes with no artefact; provisional counts them', () => {
  const s = snap('a', 'h1', 'c1', 2, 50, 10, { n_scored: 12, idx: 60, answers: { '1.1': { in: true, sc: 4, ev: '' }, '1.2': { in: true, sc: 2, ev: 'doc' } } });
  const ev = buildPool([s], clients, cohorts, 'evidenced')[0];
  const pr = buildPool([s], clients, cohorts, 'provisional')[0];
  assert.deepEqual(Object.keys(ev.subs), ['1.2']);
  assert.deepEqual(Object.keys(pr.subs).sort(), ['1.1', '1.2']);
  assert.equal(ev.idx, 50);
  assert.equal(pr.idx, 60);
  assert.equal(ev.n, 10);
  assert.equal(pr.n, 12);
});

function pool5() {
  const snaps = [1, 2, 3, 4, 5].map((i) => snap('s' + i, 'h' + i, 'c' + i, i <= 3 ? 2 : 3, i * 20, 10));
  return buildPool(snaps, clients, cohorts, 'evidenced');
}

test('benchmark: percentile, rank and spread over the full pool', () => {
  const b = benchmark(pool5(), 'h4', 'all', 'evidenced', 5);
  assert.equal(b.eligible, true);
  assert.equal(b.pool.n, 5);
  assert.equal(b.pool.thin, false);
  assert.equal(b.idx.v, 80);
  assert.equal(b.idx.rank, 2);
  assert.equal(b.idx.pct, 70);
  assert.equal(b.idx.med, 60);
  assert.equal(b.idx.p25, 40);
  assert.equal(b.idx.p75, 80);
  assert.equal(b.position, 'Upper half');
});

test('benchmark: wave pool only compares like with like', () => {
  const b = benchmark(pool5(), 'h4', 'wave', 'evidenced', 5);
  assert.equal(b.pool.n, 2);
  assert.equal(b.pool.thin, true);
  assert.equal(b.idx.p25, undefined);
  assert.equal(b.position, null); // fewer than 3 cohorts: no band
});

test('benchmark: ineligible cases', () => {
  assert.deepEqual(benchmark(pool5(), 'nope', 'all', 'evidenced', 5), { eligible: false, reason: 'no_snapshot' });
  const b = benchmark(pool5(), 'h1', 'all', 'evidenced', 11);
  assert.equal(b.eligible, false);
  assert.equal(b.reason, 'too_few');
  assert.equal(b.need, 11);
});

test('benchmark: sub-outcome position needs at least three cohorts', () => {
  const all = pool5();
  const b = benchmark(all, 'h1', 'all', 'evidenced', 5);
  const sub = b.subs.find((s) => s.id === '1.1');
  assert.equal(sub.n, 5);
  assert.ok(sub.pct != null);
  const two = buildPool([snap('a', 'h1', 'c1', 2, 40, 10), snap('b', 'h2', 'c2', 2, 60, 10)], clients, cohorts, 'evidenced');
  assert.equal(benchmark(two, 'h1', 'all', 'evidenced', 5).subs[0].pct, undefined);
});

test('league ranks best first and flags cohorts below the minimum', () => {
  const snaps = [snap('s1', 'h1', 'c1', 2, 40, 10), snap('s2', 'h2', 'c2', 2, 90, 10), snap('s3', 'h3', 'c3', 2, 65, 2)];
  const rows = leagueRows(buildPool(snaps, clients, cohorts, 'evidenced'), 'all', 5);
  assert.deepEqual(rows.map((r) => r.cohort_id), ['h2', 'h1', 'h3']);
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[2].eligible, false);
  assert.equal(rows[2].pct, undefined);
});
