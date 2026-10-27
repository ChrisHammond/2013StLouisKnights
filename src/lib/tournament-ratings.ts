import { z } from 'zod';
import store from '../../data/tournament-ratings.json';

export const tournamentRatingsSchema = z
  .object({
    observations: z.array(
      z
        .object({
          season: z.literal('2026-27'),
          opponent: z.string().min(1),
          sourceTeam: z.string().min(1).nullable(),
          category: z.literal('USA 13U - All'),
          releaseDate: z.iso.date().nullable(),
          collectedAt: z.iso.datetime(),
          sourceUrl: z.url(),
          rating: z.number().positive().nullable(),
          rank: z.number().int().positive().nullable(),
          note: z.string().min(1),
        })
        .strict()
        .superRefine((row, ctx) => {
          if (row.rating !== null && (!row.sourceTeam || !row.releaseDate))
            ctx.addIssue({
              code: 'custom',
              message: 'Rated opponents require verified identity and edition',
            });
          if (row.rating === null && row.rank !== null)
            ctx.addIssue({ code: 'custom', message: 'Unavailable rating cannot have a rank' });
        }),
    ),
  })
  .strict();

const observations = tournamentRatingsSchema.parse(store).observations;
export function tournamentRating(opponent: string) {
  return observations
    .filter((row) => row.opponent === opponent)
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0];
}
