import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCrossbar, mergeCrossbar } from '../src/lib/crossbar';
import official from '../data/schedule.json';
import crossbar from '../data/crossbar.json';
import { validateSchedule, nextGame } from '../src/lib/schedule';
import teams from '../data/teams.json';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const games = validateSchedule(
  official.snapshots[0],
  teams.map((t) => t.id),
).games;
const snapshot = crossbar.snapshots[0]!;
const initialStore = { ...crossbar, snapshots: [snapshot] };
const fixture =
  '2026-CS-REGULAR SEASON 2013 Knights' +
  snapshot.entries
    .map((e) => {
      const d = new Date(e.date + 'T12:00:00Z');
      const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d);
      const time = e.startsAt
        ? new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Chicago',
          }).format(new Date(e.startsAt))
        : 'TBD';
      return `<div class="box" style="margin-top:10px;"><h1>${month}</h1><h1>${Number(e.date.slice(-2))}</h1><h2><span>${e.side === 'home' ? 'vs.' : '@'}</span> ${e.opponent}</h2><span class="small">(${e.label})<br></span><p><a>${e.venue.replace(/&/g, '&amp;')}</a></p><h3>${time}</h3></div>`;
    })
    .join('');
test('Crossbar parsing preserves Central time, types, opponent labels and entities', () => {
  assert.deepEqual(parseCrossbar(fixture, snapshot.collectedAt), snapshot);
  assert.throws(() => parseCrossbar('login page', snapshot.collectedAt));
  assert.throws(() => parseCrossbar(fixture.replace('3:50 PM', 'unknown'), snapshot.collectedAt));
});
test('35 Crossbar entries add 11 events, preserving 24 CSDHL games without duplicates', () => {
  const merged = mergeCrossbar(games, snapshot);
  assert.equal(merged.length, games.length + 11);
  assert.equal(new Set(merged.map((g) => g.id)).size, merged.length);
  const extras = merged.filter((g) => g.id.startsWith('crossbar-'));
  assert.equal(extras.filter((g) => g.crossbar?.placeholder).length, 6);
  assert.ok(extras.every((g) => g.kind !== 'league'));
  const changed = merged.find((g) => g.id === '2951877')!;
  assert.equal(changed.startsAt, '2026-10-17T22:50:00.000Z');
  assert.match(changed.crossbar!.note!, /6:00 PM/);
  const knights = merged.filter(
    (g) => !g.crossbar?.placeholder && [g.homeTeamId, g.awayTeamId].includes('st-louis-knights'),
  );
  assert.equal(nextGame(knights, new Date('2026-10-31T22:00:00Z'))?.date, '2026-11-01');
  assert.equal(nextGame(knights, new Date('2026-11-05T22:00:00Z'))?.date, '2026-11-15');
  assert.throws(() =>
    mergeCrossbar(games, { ...snapshot, entries: [snapshot.entries[0], snapshot.entries[0]] }),
  );
});
test('ambiguous same-opponent doubleheaders require review rather than duplicate or hide games', () => {
  const game = games.find((g) => g.id === '2951877')!;
  assert.throws(() =>
    mergeCrossbar([...games, { ...game, id: '999', startsAt: '2026-10-18T01:00:00.000Z' }], snapshot),
  );
});
test('Crossbar import retries are idempotent; failures retain history and recovery clears error', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'knights-crossbar-test-'));
  try {
    await mkdir(join(directory, 'data'));
    await writeFile(join(directory, 'data/crossbar.json'), JSON.stringify(initialStore));
    await writeFile(
      join(directory, 'data/schedule.json'),
      JSON.stringify({ ...official, snapshots: [official.snapshots[0]] }),
    );
    const file = join(directory, 'source.html');
    const run = () =>
      spawnSync(
        process.execPath,
        [
          '--import',
          import.meta.resolve('tsx'),
          fileURLToPath(new URL('../scripts/import-crossbar.ts', import.meta.url)),
          file,
        ],
        { cwd: directory, encoding: 'utf8' },
      );
    const saved = async () => JSON.parse(await readFile(join(directory, 'data/crossbar.json'), 'utf8'));
    await writeFile(file, fixture);
    assert.equal(run().status, 0);
    assert.equal(run().status, 0);
    assert.deepEqual((await saved()).snapshots, initialStore.snapshots);
    await writeFile(file, 'unavailable');
    assert.equal(run().status, 1);
    assert.deepEqual((await saved()).snapshots, initialStore.snapshots);
    assert.ok((await saved()).error);
    await writeFile(file, fixture);
    assert.equal(run().status, 0);
    assert.equal((await saved()).error, null);
  } finally {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
    await rm(directory, { recursive: true, force: true });
  }
});
