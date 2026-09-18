import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importSnapshot, recordStatus, fetchJSON } from '../scripts/lib/importer';
import { teamsFixture, ratingsFixture, standingsFixture } from './fixtures/data';

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'knights-import-test-'));
  const files = {
    teams: teamsFixture,
    sources: { ratings: { access: 'approved', authorizationReference: 'TEST FIXTURE ONLY' } },
    standings: { snapshots: [] },
    ratings: { snapshots: [] },
    status: {
      standings: { state: 'pending', lastSuccessAt: null },
      ratings: { state: 'pending', lastSuccessAt: null },
    },
  };
  for (const [name, value] of Object.entries(files))
    await writeFile(join(dir, `${name}.json`), JSON.stringify(value));
  return dir;
}
test('failed import preserves the last valid file; subsequent recovery succeeds', async () => {
  const dir = await setup();
  try {
    const now = new Date('2026-10-30');
    await importSnapshot('standings', standingsFixture(), dir, now);
    const before = await readFile(join(dir, 'standings.json'), 'utf8');
    await assert.rejects(() => importSnapshot('standings', { rows: [] }, dir, now));
    assert.equal(await readFile(join(dir, 'standings.json'), 'utf8'), before);
    await recordStatus('standings', { state: 'error', message: 'Test failure' }, dir);
    const next = standingsFixture();
    next.rows[0].gp = 1;
    next.rows[0].w = 1;
    next.rows[0].points = 2;
    assert.equal(await importSnapshot('standings', next, dir, now), true);
    assert.equal(await importSnapshot('standings', next, dir, now), false);
    assert.equal(JSON.parse(await readFile(join(dir, 'standings.json'), 'utf8')).snapshots.length, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('MHR permission gate applies to file imports too', async () => {
  const dir = await setup();
  try {
    await writeFile(
      join(dir, 'sources.json'),
      JSON.stringify({ ratings: { access: 'pending', authorizationReference: null } }),
    );
    await assert.rejects(
      () => importSnapshot('ratings', ratingsFixture('2026-09-23'), dir, new Date('2026-10-30')),
      /authorization/,
    );
    assert.deepEqual(JSON.parse(await readFile(join(dir, 'ratings.json'), 'utf8')), { snapshots: [] });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('feed rejects blocked access without retrying or bypassing, and refuses HTML', async () => {
  let calls = 0;
  const blocked = (async () => {
    calls++;
    return new Response('Forbidden', { status: 403 });
  }) as typeof fetch;
  await assert.rejects(() => fetchJSON('https://example.com', undefined, blocked), /403/);
  assert.equal(calls, 1);
  const html = (async () =>
    new Response('<html>challenge</html>', { headers: { 'content-type': 'text/html' } })) as typeof fetch;
  await assert.rejects(() => fetchJSON('https://example.com', undefined, html), /JSON/);
});
test('approved feed requests use bearer auth, reject redirects and have a timeout', async () => {
  const mock = (async (_url, options) => {
    assert.equal(options?.redirect, 'error');
    assert.ok(options?.signal);
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer TEST');
    return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  assert.deepEqual(await fetchJSON('https://example.com', 'TEST', mock), { ok: true });
});
