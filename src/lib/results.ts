import { z } from 'zod';
import data from '../../data/results.json';
import { games } from './schedule-data';
const count = z.number().int().nonnegative();
const schema = z
  .object({
    gameId: z.string(),
    status: z.literal('final'),
    awayTeamId: z.string(),
    homeTeamId: z.string(),
    awayScore: count,
    homeScore: count,
    awayShots: count.nullable(),
    homeShots: count.nullable(),
    sourceUrl: z.url(),
    sourcePublishedAt: z.iso.datetime().nullable(),
    observedAt: z.iso.datetime(),
  })
  .strict();
export function validateResults(input: unknown) {
  const store = z
    .object({ observations: z.array(schema) })
    .strict()
    .parse(input);
  const seen = new Set<string>();
  for (const result of store.observations) {
    const game = games.find((g) => g.id === result.gameId);
    const key = `${result.gameId}/${result.observedAt}`;
    if (!game || game.homeTeamId !== result.homeTeamId || game.awayTeamId !== result.awayTeamId)
      throw new Error('Result participants must match the scheduled game');
    if (result.sourceUrl !== `https://gamesheetstats.com/seasons/15220/games/${game.id}?tab=box-score`)
      throw new Error('Result must reference its official box score');
    if (seen.has(key)) throw new Error('Duplicate result observation');
    seen.add(key);
    if (
      Date.parse(result.observedAt) > Date.now() + 60000 ||
      (game.startsAt && result.observedAt < game.startsAt) ||
      (result.sourcePublishedAt && result.sourcePublishedAt > result.observedAt)
    )
      throw new Error('Invalid result observation time');
  }
  return store.observations;
}
// Later verified corrections supersede earlier observations without erasing them.
export const results = new Map(
  validateResults(data)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((result) => [result.gameId, result]),
);
