import { test } from 'node:test';
import assert from 'node:assert/strict';
import { teamOutcome } from '../src/lib/outcome';
test('outcome follows the selected team and only labels verified finals', () => {
  const score = { status: 'final', homeTeamId: 'home', awayTeamId: 'away', homeScore: 1, awayScore: 4 };
  assert.equal(teamOutcome(score, 'home'), 'Loss');
  assert.equal(teamOutcome(score, 'away'), 'Win');
  assert.equal(teamOutcome({ ...score, homeScore: 4 }, 'home'), 'Tie');
  assert.equal(teamOutcome({ ...score, homeScore: 4 }, 'away'), 'Tie');
  assert.equal(teamOutcome({ ...score, status: 'in-progress' }, 'away'), null);
  assert.equal(teamOutcome(score, 'unrelated'), null);
  assert.equal(teamOutcome(undefined, 'home'), null);
});
