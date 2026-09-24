import { z } from 'zod';

export const statLabels = [
  'All shifts',
  'Time on ice',
  'Goals',
  'First assist',
  'Second assist',
  'Assists',
  'Points',
  '+/-',
  'Penalties drawn',
  'Penalty time',
  'Faceoffs',
  'Faceoffs won',
  'Faceoffs won, %',
  'Hits',
  'Shots',
  'Shots on goal',
  'Blocked shots',
  'Power play shots',
  'Short-handed shots',
  'Passes to the slot',
] as const;
export const playerStatsSchema = z.object({
  playerId: z.literal('daniel-hammond'),
  season: z.literal('2026-27'),
  sourceUrl: z.literal('https://app.hudl.com/instat/hockey/players/2473445/games'),
  importedAt: z.iso.datetime(),
  games: z
    .array(
      z.object({
        key: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        opponent: z.string().min(1),
        venue: z.enum(['away', 'home']),
        goalsFor: z.number().int().nonnegative(),
        goalsAgainst: z.number().int().nonnegative(),
        stats: z.record(z.string(), z.union([z.number(), z.string(), z.null()])),
        source: z.object({
          file: z.string(),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
          asOf: z.iso.date(),
        }),
      }),
    )
    .min(1),
});
export type PlayerStats = z.infer<typeof playerStatsSchema>;
export type PlayerGame = PlayerStats['games'][number];
export function total(games: PlayerGame[], label: string): number | null {
  const values = games.map((g) => g.stats[label]);
  return values.every((v) => typeof v === 'number') ? (values as number[]).reduce((a, b) => a + b, 0) : null;
}
export function averageIceTime(games: PlayerGame[]): string {
  const times = games.map((g) => g.stats['Time on ice']);
  if (!times.every((t) => typeof t === 'string' && /^\d+:\d{2}$/.test(t))) return '—';
  const seconds = Math.round(
    (times as string[]).reduce((sum, t) => {
      const [m, s] = t.split(':').map(Number);
      return sum + m * 60 + s;
    }, 0) / games.length,
  );
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export const displayStat = (value: unknown) => (value === null || value === undefined ? '—' : String(value));
