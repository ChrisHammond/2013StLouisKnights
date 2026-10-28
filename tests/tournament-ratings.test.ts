import test from 'node:test';
import assert from 'node:assert/strict';
import store from '../data/tournament-ratings.json';
import { tournamentRating, tournamentRatingsSchema } from '../src/lib/tournament-ratings';

test('tournament ratings retain category, edition and unmatched team state', () => {
  assert.equal(tournamentRating('Alabama Thunder')?.category, 'USA 13U - All');
  assert.match(tournamentRating('Santa Clarita Flyers')?.releaseDate ?? '', /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(tournamentRating('St. Jude Knights')?.rating, null);
  assert.equal(tournamentRating('Unknown opponent'), undefined);
  const unmatched = store.observations[2];
  assert.throws(() => tournamentRatingsSchema.parse({ observations: [{ ...unmatched, rank: 1 }] }));
  assert.throws(() => tournamentRatingsSchema.parse({ observations: [{ ...unmatched, rating: 80 }] }));
});
