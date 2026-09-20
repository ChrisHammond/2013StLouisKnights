import { z } from 'zod';

export const gameSchema = z
  .object({
    id: z.string().regex(/^\d+$/),
    homeTeamId: z.string(),
    awayTeamId: z.string(),
    gameNumber: z.string().min(1),
    date: z.iso.date(),
    startsAt: z.iso.datetime().nullable(),
    venue: z.string().min(1),
    kind: z.enum(['league', 'tournament', 'other']),
    status: z.enum(['scheduled', 'cancelled', 'postponed']),
  })
  .strict();
export type Game = z.infer<typeof gameSchema> & {
  crossbar?: { opponent: string; label: string; placeholder: boolean; note?: string };
};
export const scheduleSnapshotSchema = z
  .object({
    season: z.literal('2026-27'),
    sourceUrl: z.literal(
      'https://gamesheetstats.com/seasons/15220/games?filter%5Bdivision%5D=81589&filter%5Btype%5D=regular_season',
    ),
    sourceName: z.literal('CSDHL / GameSheet'),
    sourcePublishedAt: z.null(),
    collectedAt: z.iso.datetime(),
    coveredTeamIds: z.array(z.string()).length(13),
    games: z.array(gameSchema).min(1),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    if (new Set(snapshot.games.map((g) => g.id)).size !== snapshot.games.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate schedule IDs' });
    for (const game of snapshot.games) {
      if (
        !snapshot.coveredTeamIds.includes(game.homeTeamId) ||
        !snapshot.coveredTeamIds.includes(game.awayTeamId) ||
        game.homeTeamId === game.awayTeamId ||
        game.date < '2026-07-01' ||
        game.date > '2027-07-31'
      )
        ctx.addIssue({ code: 'custom', message: 'Wrong team or season' });
      if (game.startsAt && centralDate(new Date(game.startsAt)) !== game.date)
        ctx.addIssue({ code: 'custom', message: 'Game date disagrees with start time' });
    }
  });
export type ScheduleSnapshot = z.infer<typeof scheduleSnapshotSchema>;
export function validateSchedule(input: unknown, teamIds: string[]) {
  const snapshot = scheduleSnapshotSchema.parse(input);
  if (
    new Set(snapshot.coveredTeamIds).size !== teamIds.length ||
    snapshot.coveredTeamIds.some((id) => !teamIds.includes(id))
  )
    throw new Error('Schedule team mappings do not match the division');
  if (Date.parse(snapshot.collectedAt) > Date.now() + 60000) throw new Error('Future collection timestamp');
  return { ...snapshot, games: sortGames(snapshot.games) };
}
export const centralDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
export function centralInstant(date: string, hour: number, minute: number): string {
  const wall = Date.parse(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`);
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      timeZoneName: 'longOffset',
    }).formatToParts(new Date(instant));
    const offset = parts.find((p) => p.type === 'timeZoneName')!.value.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!offset) throw new Error('Unable to resolve Central time');
    const minutes = (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === '-' ? -1 : 1);
    instant = wall - minutes * 60000;
  }
  return new Date(instant).toISOString();
}
export function isUpcoming(game: Game, now = new Date()) {
  return (
    game.status === 'scheduled' &&
    (game.startsAt ? Date.parse(game.startsAt) > now.getTime() : game.date >= centralDate(now))
  );
}
export function sortGames(games: Game[]) {
  return [...games].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.startsAt === null
        ? b.startsAt === null
          ? 0
          : 1
        : b.startsAt === null
          ? -1
          : a.startsAt.localeCompare(b.startsAt)) ||
      a.id.localeCompare(b.id),
  );
}
export function nextGame(games: Game[], now = new Date()) {
  return sortGames(games).find((game) => isUpcoming(game, now));
}
export function gameTime(game: Game) {
  return game.startsAt
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(game.startsAt))
    : 'Time TBD';
}
export function gameDate(game: Game) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${game.date}T12:00:00Z`));
}
