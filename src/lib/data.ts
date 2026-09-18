import teamData from '../../data/teams.json';
import standingsData from '../../data/standings.json';
import ratingsData from '../../data/ratings.json';
import statusData from '../../data/status.json';
import sourceData from '../../data/sources.json';
import {
  validateTeams,
  validateSnapshot,
  type StandingsSnapshot,
  type RatingsSnapshot,
  type SourceStatus,
} from './schema';
import { currentSnapshot, ratingReleases } from './history';
export const teams = validateTeams(teamData);
export const teamMap = new Map(teams.map((team) => [team.id, team]));
export const sources = sourceData;
export const status = statusData as Record<'standings' | 'ratings', SourceStatus>;
export const standings = currentSnapshot(
  standingsData.snapshots.map((s) => validateSnapshot('standings', s, teams) as StandingsSnapshot),
);
export const releases = ratingReleases(
  ratingsData.snapshots.map((s) => validateSnapshot('ratings', s, teams) as RatingsSnapshot),
);
export const latestRatings = releases.at(-1);
export const knights = teams.find((team) => team.id === 'st-louis-knights')!;
export const preseason = standings?.rows.every((row) => row.gp === 0) ?? true;
