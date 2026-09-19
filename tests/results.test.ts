import { test } from 'node:test';
import assert from 'node:assert/strict';
import data from '../data/results.json';
import { validateResults, results } from '../src/lib/results';

test('verified first final maps visitor/home scores correctly', () => {
  const result = results.get('2951469')!;
  assert.equal(result.awayTeamId, 'st-louis-knights');
  assert.equal(result.awayScore, 1);
  assert.equal(result.homeScore, 4);
});
test('reject duplicate observations, mismatched teams, negative scores and wrong box-score URLs', () => {
  const result = data.observations[0];
  assert.throws(() => validateResults({ observations: [result, result] }));
  for (const change of [
    { awayTeamId: 'chicago-blues' },
    { awayScore: -1 },
    { sourceUrl: 'https://gamesheetstats.com/seasons/15220/games/2951488?tab=box-score' },
  ])
    assert.throws(() => validateResults({ observations: [{ ...result, ...change }] }));
});
