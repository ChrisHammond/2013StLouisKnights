import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  appendSnapshot,
  currentSnapshot,
  ratingReleases,
  weeklyChange,
  freshness,
  formatDate,
} from '../src/lib/history';
import { chartModel } from '../src/lib/chart';
import { validateSnapshot, validateTeams } from '../src/lib/schema';
import { ratingsFixture, teamsFixture, standingsFixture } from './fixtures/data';

test('reject duplicate or missing division teams, wrong season, and untrusted extra fields', () => {
  const valid = ratingsFixture('2026-09-23');
  assert.doesNotThrow(() => validateSnapshot('ratings', valid, teamsFixture, new Date('2026-10-30')));
  for (const invalid of [
    { ...valid, rows: valid.rows.slice(1) },
    { ...valid, rows: [valid.rows[0], valid.rows[0]] },
    { ...valid, season: '2025-26' },
    { ...valid, sample: true },
  ])
    assert.throws(() => validateSnapshot('ratings', invalid, teamsFixture, new Date('2026-10-30')));
});
test('reject future observations, invalid games totals, and wrong source division', () => {
  assert.throws(() =>
    validateSnapshot('standings', standingsFixture(), teamsFixture, new Date('2026-08-01')),
  );
  const bad = standingsFixture();
  bad.rows[0].gp = 5;
  assert.throws(() => validateSnapshot('standings', bad, teamsFixture, new Date('2026-10-30')));
  const wrong = standingsFixture();
  wrong.sourceUrl = wrong.sourceUrl.replace('81589', '12345');
  assert.throws(() => validateSnapshot('standings', wrong, teamsFixture, new Date('2026-10-30')));
});
test('validate season-specific links and reject duplicate identities', () => {
  assert.equal(validateTeams(teamsFixture).length, 2);
  assert.throws(() => validateTeams([...teamsFixture, teamsFixture[0]]));
  const changed = structuredClone(teamsFixture);
  changed[0].mhrUrl = changed[0].mhrUrl.replace('2026', '2025');
  assert.throws(() => validateTeams(changed));
});
test('retries do not create duplicate releases; corrections preserve original observations', () => {
  const first = ratingsFixture('2026-09-23');
  const retry = { ...first, collectedAt: '2026-09-24T22:00:00.000Z', observedAt: '2026-09-24T21:00:00.000Z' };
  const start = appendSnapshot({ snapshots: [] }, first).store;
  assert.equal(appendSnapshot(start, retry).changed, false);
  const corrected = structuredClone(retry);
  corrected.rows[0].rating = 88.25;
  const next = appendSnapshot(start, corrected).store;
  assert.equal(next.snapshots.length, 2);
  assert.equal(next.snapshots[0].rows[0].rating, 85);
  assert.equal(ratingReleases(next.snapshots)[0].rows[0].rating, 88.25);
  assert.equal(appendSnapshot(next, first).store.snapshots.length, 3);
});
test('same-day unchanged standings retry is idempotent', () => {
  const first = standingsFixture();
  const later = { ...first, observedAt: '2026-09-23T23:00:00.000Z', collectedAt: '2026-09-23T23:00:00.000Z' };
  assert.equal(appendSnapshot({ snapshots: [first] }, later).changed, false);
});
test('backfills do not replace the latest release', () => {
  const early = ratingsFixture('2026-09-23');
  const late = ratingsFixture('2026-10-07');
  assert.equal(currentSnapshot([late, early])?.releaseDate, '2026-10-07');
});
test('weekly changes require consecutive weeks, rated values and same category', () => {
  const a = ratingsFixture('2026-09-23');
  const b = ratingsFixture('2026-09-30');
  b.rows[0].rating = 85.35;
  assert.equal(weeklyChange([a, b], 'fixture-knights'), 0.35);
  assert.equal(weeklyChange([a, ratingsFixture('2026-10-07')], 'fixture-knights'), null);
  b.rows[0].rating = null;
  assert.equal(weeklyChange([a, b], 'fixture-knights'), null);
  b.rows[0].rating = 90;
  b.category = 'Different category';
  assert.equal(weeklyChange([a, b], 'fixture-knights'), null);
});
test('chart preserves numeric y positions, missing weeks and null gaps', () => {
  const a = ratingsFixture('2026-09-23');
  const b = ratingsFixture('2026-09-30');
  b.rows[0].rating = 87;
  const c = ratingsFixture('2026-10-14');
  const d = ratingsFixture('2026-10-21');
  d.rows[0].rating = null;
  const e = ratingsFixture('2026-10-28');
  const model = chartModel([a, b, c, d, e], ['fixture-knights'])!;
  assert.deepEqual(
    model.series[0].segments.map((segment) => segment.length),
    [2, 1, 1],
  );
  assert.ok(model.y(87) < model.y(85));
  assert.ok(model.x(c.releaseDate) > model.x(b.releaseDate));
  assert.equal(chartModel([a], []), null);
  assert.equal(chartModel([], ['fixture-knights']), null);
  assert.equal(chartModel([a], ['fixture-knights'])?.series[0].segments[0][0].x, 450);
});
test('freshness ages correctly and date-only releases never shift time zone', () => {
  assert.equal(freshness(null, 48), 'missing');
  assert.equal(freshness('2026-09-23T00:00:00Z', 48, new Date('2026-09-26')), 'stale');
  assert.equal(freshness('2026-09-23T00:00:00Z', 48, new Date('2026-09-24')), 'fresh');
  assert.equal(formatDate('2026-09-23'), 'Sep 23, 2026');
});
