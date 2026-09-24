import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHudlRows, mergeGames } from '../scripts/lib/hudl-import';
import { statLabels, total } from '../src/lib/player-stats';
const source = { file: 'synthetic.xlsx', sha256: '0'.repeat(64), asOf: '2026-09-24' };
const headers = ['Date', 'Opponent', 'Score', ...statLabels];
const row: (string | number | null)[] = [
  '19/09',
  '@ Test opponent',
  '4:1',
  11,
  '15:59',
  1,
  0,
  0,
  0,
  1,
  1,
  0,
  '00:00',
  0,
  0,
  '-',
  1,
  9,
  8,
  1,
  1,
  1,
  '-',
];
test('imports game rows and ignores inaccurate average rows', () => {
  const games = parseHudlRows([headers, row, [null, 'Average per game', null, 999]], source);
  assert.equal(games.length, 1);
  assert.equal(games[0].date, '2026-09-19');
  assert.equal(games[0].stats['Faceoffs won, %'], null);
  assert.equal(games[0].stats.Goals, 1);
  assert.equal(games[0].goalsFor, 4);
});
test('header mapping supports reordered columns', () => {
  const games = parseHudlRows([[...headers].reverse(), [...row].reverse()], source);
  assert.equal(games[0].stats['Shots on goal'], 8);
});
test('reimports replace corrected games without duplicates or dropping history', () => {
  const first = parseHudlRows([headers, row], source);
  const corrected = structuredClone(first);
  corrected[0].stats.Hits = 3;
  const merged = mergeGames(first, corrected);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].stats.Hits, 3);
  assert.throws(
    () =>
      mergeGames(
        merged,
        first.map((g) => ({ ...g, source: { ...source, asOf: '2026-09-23' } })),
      ),
    /older/,
  );
});
test('rejects ambiguous dates and duplicate games', () => {
  assert.throws(() => parseHudlRows([headers, ['31/09', ...row.slice(1)]], source), /date/);
  assert.throws(() => parseHudlRows([headers, row, row], source), /Ambiguous/);
  assert.throws(() => parseHudlRows([headers, ['01/01', ...row.slice(1)]], source), /future/);
});
test('missing values stay missing in totals', () => {
  const games = parseHudlRows([headers, row], source);
  assert.equal(total(games, 'Passes to the slot'), null);
  assert.equal(total(games, 'Assists'), 0);
});
