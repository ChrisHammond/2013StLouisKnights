import test from 'node:test';
import assert from 'node:assert/strict';
import { standingRowSchema } from '../src/lib/schema';

test('GameSheet includes overtime wins in W but reports overtime losses separately', () => {
  const winner = { teamId: 'vernon-hills-ice-dogs', position: 8, gp: 1, w: 1, l: 0, t: 0, otw: 1, otl: 0, points: 2, gf: 3, ga: 2 };
  assert.ok(standingRowSchema.safeParse(winner).success);
  assert.ok(standingRowSchema.safeParse({ ...winner, gp: 3, w: 1, t: 1, otw: 0, otl: 1 }).success);
  assert.equal(standingRowSchema.safeParse({ ...winner, gp: 2 }).success, false);
  assert.equal(standingRowSchema.safeParse({ ...winner, otw: 2 }).success, false);
});
