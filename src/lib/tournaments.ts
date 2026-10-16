import { z } from 'zod';
import { centralDate, sortGames, type Game } from './schedule';
export const tournamentSchema = z
  .object({
    season: z.literal('2026-27'),
    sourceUrl: z.url(),
    sourcePublishedAt: z.null(),
    collectedAt: z.iso.datetime(),
    label: z.string().min(1),
    games: z
      .array(
        z
          .object({
            id: z.string().startsWith('ccm-world-2026-'),
            gameNumber: z.string().min(1),
            date: z.iso.date(),
            startsAt: z.iso.datetime(),
            opponent: z.string().min(1),
            side: z.enum(['home', 'away']),
            venue: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (new Set(s.games.map((g) => g.id)).size !== s.games.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate tournament game' });
    for (const g of s.games)
      if (centralDate(new Date(g.startsAt)) !== g.date)
        ctx.addIssue({ code: 'custom', message: 'Tournament date disagrees with Central start' });
  });
export function mergeTournament(games: Game[], input: unknown): Game[] {
  const s = tournamentSchema.parse(input);
  const dates = new Set(s.games.map((g) => g.date));
  // Replace whole-day Crossbar blocks only on dates with confirmed fixtures.
  const retained = games.filter(
    (g) => !(g.crossbar?.placeholder && dates.has(g.date) && /CCM|World/i.test(g.crossbar.opponent)),
  );
  const additions: Game[] = s.games.map((g) => ({
    id: g.id,
    gameNumber: g.gameNumber,
    date: g.date,
    startsAt: g.startsAt,
    venue: g.venue,
    kind: 'tournament',
    status: 'scheduled',
    homeTeamId: g.side === 'home' ? 'st-louis-knights' : 'tournament-opponent',
    awayTeamId: g.side === 'away' ? 'st-louis-knights' : 'tournament-opponent',
    tournament: { opponent: g.opponent, label: s.label, sourceUrl: s.sourceUrl },
  }));
  return sortGames([...retained, ...additions]);
}
