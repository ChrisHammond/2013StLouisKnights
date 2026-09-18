import { readFile } from 'node:fs/promises';
import { validateTeams, validateSnapshot, type Kind } from '../src/lib/schema';
import { validateSchedule } from '../src/lib/schedule';
const read = async (name: string) => JSON.parse(await readFile(`data/${name}.json`, 'utf8'));
const teams = validateTeams(await read('teams'));
const sources = await read('sources');
for (const kind of ['standings', 'ratings'] as Kind[]) {
  const data = await read(kind);
  if (!Array.isArray(data.snapshots)) throw new Error(`Missing ${kind} snapshots`);
  if (
    kind === 'ratings' &&
    data.snapshots.length &&
    (sources.ratings.access !== 'approved' || !sources.ratings.authorizationReference)
  )
    throw new Error('Production ratings require documented collection, storage, and display authorization');
  for (const snapshot of data.snapshots) validateSnapshot(kind, snapshot, teams);
  console.log(`${kind}: ${data.snapshots.length} validated observations`);
}
console.log(`${teams.length} verified team mappings validated`);
for (const snapshot of (await read('schedule')).snapshots)
  validateSchedule(
    snapshot,
    teams.map((t) => t.id),
  );
