import { z } from 'zod';

const integer = z.number().int().nonnegative();
const timestamp = z.iso.datetime();
const httpsUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'A public HTTPS URL is required');
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const teamSchema = z.object({
  id, name: z.string().min(1), sourceName: z.string().min(1), abbr: z.string().min(1),
  gamesheetId: z.string().regex(/^\d+$/), mhrId: z.string().regex(/^\d+$/),
  leagueUrl: httpsUrl, clubUrl: httpsUrl, clubLinkType: z.enum(['club','team']),
  mhrUrl: httpsUrl, verifiedAt: z.iso.date(),
}).strict();
export type Team = z.infer<typeof teamSchema>;

const common = {
  season: z.literal('2026-27'), division: z.literal('csdhl-13u'),
  sourceUrl: httpsUrl, sourcePublishedAt: timestamp.nullable(),
  observedAt: timestamp, collectedAt: timestamp,
};
export const standingRowSchema = z.object({
  teamId: id, position: integer.min(1), gp: integer, w: integer, l: integer,
  t: integer, otw: integer, otl: integer, points: integer, gf: integer, ga: integer,
}).strict().refine(row => row.gp === row.w + row.l + row.t + row.otw + row.otl,
  'Games played must equal W + L + T + OTW + OTL');
export const standingsSchema = z.object({
  ...common, source: z.literal('gamesheet'),
  method: z.enum(['browser-observation','official-export','approved-feed']),
  rows: z.array(standingRowSchema).min(1),
}).strict();
export const ratingRowSchema = z.object({
  teamId: id, rating: z.number().positive().max(200).nullable(),
  rank: integer.min(1).nullable(),
}).strict();
export const ratingsSchema = z.object({
  ...common, source: z.literal('myhockeyrankings'), sourcePublishedAt: timestamp,
  releaseDate: z.iso.date(), category: z.string().min(1),
  method: z.enum(['authorized-export','approved-feed']),
  rows: z.array(ratingRowSchema).min(1),
}).strict();
export type StandingsSnapshot = z.infer<typeof standingsSchema>;
export type RatingsSnapshot = z.infer<typeof ratingsSchema>;
export type Snapshot = StandingsSnapshot | RatingsSnapshot;
export type Kind = 'standings' | 'ratings';
export type Store<T> = { snapshots: T[] };
export type SourceStatus = {
  state: 'pending' | 'manual' | 'ok' | 'error';
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  message: string;
};

export function validateTeams(input: unknown): Team[] {
  const teams = z.array(teamSchema).min(1).parse(input);
  for (const key of ['id','gamesheetId','mhrId'] as const) {
    if (new Set(teams.map(team => team[key])).size !== teams.length) throw new Error(`Duplicate ${key}`);
  }
  for (const team of teams) {
    const mhr = new URL(team.mhrUrl);
    if (mhr.searchParams.get('y') !== '2026' || mhr.searchParams.get('t') !== team.mhrId)
      throw new Error(`Wrong MHR season or team: ${team.id}`);
    if (new URL(team.leagueUrl).pathname !== `/seasons/15220/teams/${team.gamesheetId}`)
      throw new Error(`Wrong GameSheet season or team: ${team.id}`);
  }
  return teams;
}

export function validateSnapshot(kind: Kind, input: unknown, teams: Team[], now = new Date()): Snapshot {
  const snapshot = kind === 'standings' ? standingsSchema.parse(input) : ratingsSchema.parse(input);
  const expected = new Set(teams.map(team => team.id));
  const actual = snapshot.rows.map(row => row.teamId);
  if (actual.length !== expected.size || new Set(actual).size !== actual.length || actual.some(team => !expected.has(team)))
    throw new Error('Snapshot must contain every division team exactly once; use null for unavailable ratings');
  const collected = Date.parse(snapshot.collectedAt);
  const observed = Date.parse(snapshot.observedAt);
  const published = snapshot.sourcePublishedAt ? Date.parse(snapshot.sourcePublishedAt) : null;
  if (collected > now.getTime() + 60_000 || observed > collected || (published !== null && published > observed))
    throw new Error('Invalid chronology: publication ≤ observation ≤ collection ≤ now');
  if (snapshot.source === 'myhockeyrankings') {
    if (snapshot.releaseDate < '2026-08-01' || snapshot.releaseDate > '2027-07-31' || snapshot.releaseDate > snapshot.observedAt.slice(0,10))
      throw new Error('Rating release is outside the season or in the future');
    for (const row of snapshot.rows) if (row.rating === null && row.rank !== null)
      throw new Error('An unrated team cannot have a rank');
  } else {
    const sourceUrl = new URL(snapshot.sourceUrl);
    if (sourceUrl.hostname !== 'gamesheetstats.com' || sourceUrl.pathname !== '/seasons/15220/standings' || sourceUrl.searchParams.get('filter[division]') !== '81589' || sourceUrl.searchParams.get('filter[type]') !== 'regular_season')
      throw new Error('Standings must identify the official season, division, and regular-season filter');
    if (snapshot.observedAt.slice(0,10) < '2026-08-01' || snapshot.observedAt.slice(0,10) > '2027-07-31')
      throw new Error('Standings observation is outside the season');
    if (snapshot.rows.some((row,i) => row.position !== i + 1))
      throw new Error('Standings must retain consecutive official source positions');
  }
  return snapshot;
}
