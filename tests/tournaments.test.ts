import test from 'node:test';
import assert from 'node:assert/strict';
import store from '../data/tournaments.json';
import { mergeTournament, tournamentSchema } from '../src/lib/tournaments';
import { centralInstant, type Game } from '../src/lib/schedule';
test('Chicago tournament times use Central standard time and preserve home/visitor assignment', () => {
  const games = mergeTournament([], store);
  assert.equal(games.length, 3);
  assert.equal(games[0].startsAt, centralInstant('2026-11-06', 9, 30));
  assert.equal(games[0].awayTeamId, 'st-louis-knights');
  assert.equal(games[1].homeTeamId, 'st-louis-knights');
  assert.equal(games[2].tournament?.opponent, 'St. Jude Knights');
  assert.ok(games.every((g) => g.kind === 'tournament'));
});
test('confirmed games replace matching day blocks but retain an unassigned Sunday bracket day', () => {
  const blocks = ['2026-11-06', '2026-11-07', '2026-11-08'].map(
    (date) =>
      ({
        id: 'crossbar-' + date,
        date,
        startsAt: null,
        homeTeamId: 'st-louis-knights',
        awayTeamId: 'crossbar-opponent',
        gameNumber: '',
        venue: 'TBD',
        kind: 'tournament',
        status: 'scheduled',
        crossbar: { opponent: 'CCM World Invite', label: 'Tournament', placeholder: true },
      }) as Game,
  );
  const games = mergeTournament(blocks, store);
  assert.equal(games.length, 4);
  assert.equal(games.filter((g) => g.crossbar?.placeholder).length, 1);
  assert.equal(games.find((g) => g.crossbar?.placeholder)?.date, '2026-11-08');
  const invalid = structuredClone(store);
  invalid.games[0].startsAt = '2026-11-07T15:00:00.000Z';
  assert.throws(() => tournamentSchema.parse(invalid));
});
