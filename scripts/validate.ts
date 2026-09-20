import { readFile } from 'node:fs/promises';
import { validateTeams, validateSnapshot, type Kind } from '../src/lib/schema';
import { validateSchedule } from '../src/lib/schedule';
import '../src/lib/photos';
import '../src/lib/results';
import '../src/lib/videos';
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
const logos = await read('team-logos');
if (
  logos.length !== teams.length ||
  new Set(logos.map((logo: { teamId: string }) => logo.teamId)).size !== teams.length
)
  throw new Error('A unique logo mapping is required for every team');
for (const team of teams) {
  const logo = logos.find((item: { teamId: string }) => item.teamId === team.id);
  if (
    !logo ||
    logo.sourcePage !== team.leagueUrl ||
    !logo.path.startsWith(`/team-logos/${team.id}.`) ||
    logo.path.includes('..')
  )
    throw new Error(`Invalid logo mapping for ${team.id}`);
  await readFile(`public${logo.path}`);
}
for (const snapshot of (await read('schedule')).snapshots)
  validateSchedule(
    snapshot,
    teams.map((t) => t.id),
  );
