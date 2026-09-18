import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { validateSchedule } from '../src/lib/schedule';
import { validateTeams } from '../src/lib/schema';
import { fetchJSON } from './lib/importer';
const path = 'data/schedule.json';
const atomic = async (value: unknown) => {
  const temp = `${path}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n');
  await rename(temp, path);
};
const store = JSON.parse(await readFile(path, 'utf8'));
const file = process.argv.slice(2).find((arg) => arg !== '--scheduled');
if (!file && !process.env.SCHEDULE_FEED_URL) {
  console.log('Schedule feed not configured. Retaining dated GameSheet browser observation.');
  process.exit(0);
}
try {
  const input = file
    ? JSON.parse(await readFile(file, 'utf8'))
    : await fetchJSON(process.env.SCHEDULE_FEED_URL!, process.env.SCHEDULE_FEED_TOKEN);
  const teams = validateTeams(JSON.parse(await readFile('data/teams.json', 'utf8')));
  const snapshot = validateSchedule(
    input,
    teams.map((t) => t.id),
  );
  for (const saved of store.snapshots)
    validateSchedule(
      saved,
      teams.map((t) => t.id),
    );
  const last = store.snapshots.at(-1);
  if (last && snapshot.collectedAt < last.collectedAt)
    throw new Error('Older snapshot cannot replace the current schedule');
  const changed = JSON.stringify(last?.games) !== JSON.stringify(snapshot.games);
  if (changed || last?.collectedAt !== snapshot.collectedAt) store.snapshots.push(snapshot);
  store.lastSuccessfulCheck = snapshot.collectedAt;
  store.lastAttemptAt = new Date().toISOString();
  store.error = null;
  await atomic(store);
  console.log(
    `${snapshot.games.length} official games validated; ${changed ? 'new revision saved' : 'unchanged games'}.`,
  );
} catch {
  store.lastAttemptAt = new Date().toISOString();
  store.error = 'Schedule refresh failed validation or source access. Previous schedule retained.';
  await atomic(store);
  console.error(store.error);
  process.exitCode = 1;
}
