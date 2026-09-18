import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  centralInstant,
  nextGame,
  isUpcoming,
  validateSchedule,
  gameTime,
  type Game,
} from '../src/lib/schedule';
import schedule from '../data/schedule.json';
import teams from '../data/teams.json';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const snapshot = schedule.snapshots[0];
const ids = teams.map((t) => t.id);
const games = validateSchedule(snapshot, ids).games;
test('schedule import retries deduplicate, failed imports retain games, and recovery clears error', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'knights-schedule-test-'));
  try {
    await mkdir(join(directory, 'data'));
    await writeFile(join(directory, 'data/teams.json'), JSON.stringify(teams));
    await writeFile(join(directory, 'data/schedule.json'), JSON.stringify(schedule));
    const input = join(directory, 'input.json');
    const run = () =>
      spawnSync(
        process.execPath,
        [
          '--import',
          import.meta.resolve('tsx'),
          fileURLToPath(new URL('../scripts/import-schedule.ts', import.meta.url)),
          input,
        ],
        { cwd: directory, encoding: 'utf8' },
      );
    await writeFile(input, JSON.stringify(snapshot));
    assert.equal(run().status, 0);
    let saved = JSON.parse(await readFile(join(directory, 'data/schedule.json'), 'utf8'));
    assert.equal(saved.snapshots.length, 1);
    await writeFile(input, JSON.stringify({ ...snapshot, games: [{ ...games[0], homeTeamId: 'bad-id' }] }));
    assert.equal(run().status, 1);
    saved = JSON.parse(await readFile(join(directory, 'data/schedule.json'), 'utf8'));
    assert.deepEqual(saved.snapshots, schedule.snapshots);
    assert.ok(saved.error);
    await writeFile(input, JSON.stringify(snapshot));
    assert.equal(run().status, 0);
    saved = JSON.parse(await readFile(join(directory, 'data/schedule.json'), 'utf8'));
    assert.equal(saved.error, null);
    assert.equal(saved.snapshots.length, 1);
  } finally {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
    await rm(directory, { recursive: true, force: true });
  }
});
test('official capture has 156 distinct games and 24 per mapped team', () => {
  assert.equal(games.length, 156);
  assert.equal(new Set(games.map((g) => g.id)).size, 156);
  for (const id of ids)
    assert.equal(games.filter((g) => g.homeTeamId === id || g.awayTeamId === id).length, 24);
});
test('Central time conversion handles season DST change', () => {
  assert.equal(centralInstant('2026-09-19', 11, 20), '2026-09-19T16:20:00.000Z');
  assert.equal(centralInstant('2027-01-03', 19, 20), '2027-01-04T01:20:00.000Z');
});
test('next game advances at puck drop and excludes cancelled and postponed games', () => {
  const knights = games.filter(
    (g) => g.homeTeamId === 'st-louis-knights' || g.awayTeamId === 'st-louis-knights',
  );
  assert.equal(nextGame(knights, new Date('2026-09-18T12:00:00Z'))?.id, '2951469');
  assert.equal(nextGame(knights, new Date('2026-09-19T16:20:00Z'))?.id, '2951488');
  const cancelled = knights.map((g, i) => (i === 0 ? { ...g, status: 'cancelled' as const } : g));
  assert.equal(nextGame(cancelled, new Date('2026-09-18T12:00:00Z'))?.id, '2951488');
  assert.equal(nextGame(knights, new Date('2027-08-01T00:00:00Z')), undefined);
});
test('TBD time remains undetermined and uses Central date boundary', () => {
  const tbd: Game = { ...games[0], startsAt: null };
  assert.equal(gameTime(tbd), 'Time TBD');
  assert.ok(isUpcoming(tbd, new Date('2026-09-20T04:59:00Z')));
  assert.ok(!isUpcoming(tbd, new Date('2026-09-20T05:00:00Z')));
});
test('rejects duplicate IDs, wrong participants and mismatched timestamps', () => {
  assert.throws(() => validateSchedule({ ...snapshot, games: [games[0], games[0]] }, ids));
  assert.throws(() =>
    validateSchedule({ ...snapshot, games: [{ ...games[0], homeTeamId: 'unknown' }] }, ids),
  );
  assert.throws(() => validateSchedule({ ...snapshot, games: [{ ...games[0], date: '2026-10-01' }] }, ids));
});
