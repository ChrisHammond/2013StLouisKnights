// Synthetic records: imported only by tests, never by a production route.
import type { Team, RatingsSnapshot, StandingsSnapshot } from '../../src/lib/schema';
export const teamsFixture: Team[] = ['fixture-knights', 'fixture-opponent'].map((id, index) => ({
  id,
  name: `TEST ONLY ${id}`,
  sourceName: id,
  abbr: 'TEST',
  gamesheetId: String(900 + index),
  mhrId: String(900 + index),
  leagueUrl: `https://gamesheetstats.com/seasons/15220/teams/${900 + index}`,
  mhrUrl: `https://myhockeyrankings.com/team-info?t=${900 + index}&y=2026`,
  clubUrl: 'https://example.com',
  clubLinkType: 'club',
  verifiedAt: '2026-09-23',
}));
export function ratingsFixture(releaseDate: string): RatingsSnapshot {
  return {
    season: '2026-27',
    division: 'csdhl-13u',
    source: 'myhockeyrankings',
    sourceUrl: 'https://example.com/authorized-test-feed',
    releaseDate,
    category: 'TEST ONLY 13U',
    sourcePublishedAt: `${releaseDate}T12:00:00.000Z`,
    observedAt: `${releaseDate}T18:00:00.000Z`,
    collectedAt: `${releaseDate}T18:00:00.000Z`,
    method: 'authorized-export',
    rows: teamsFixture.map((team, index) => ({ teamId: team.id, rating: 85 + index, rank: index + 1 })),
  };
}
export function standingsFixture(): StandingsSnapshot {
  return {
    season: '2026-27',
    division: 'csdhl-13u',
    source: 'gamesheet',
    sourceUrl:
      'https://gamesheetstats.com/seasons/15220/standings?filter%5Bdivision%5D=81589&filter%5Btype%5D=regular_season',
    sourcePublishedAt: null,
    observedAt: '2026-09-23T18:00:00.000Z',
    collectedAt: '2026-09-23T18:00:00.000Z',
    method: 'official-export',
    rows: teamsFixture.map((team, index) => ({
      teamId: team.id,
      position: index + 1,
      gp: 0,
      w: 0,
      l: 0,
      t: 0,
      otw: 0,
      otl: 0,
      points: 0,
      gf: 0,
      ga: 0,
    })),
  };
}
