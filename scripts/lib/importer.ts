import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateTeams, validateSnapshot, type Kind, type Snapshot, type Store, type SourceStatus } from '../../src/lib/schema';
import { appendSnapshot } from '../../src/lib/history';

async function readJSON(path: string) { return JSON.parse(await readFile(path,'utf8')); }
async function atomicJSON(path: string, value: unknown) {
  const temp = `${path}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value,null,2) + '\n');
  await rename(temp,path);
}
export async function importSnapshot(kind: Kind, input: unknown, directory = 'data', now = new Date()) {
  const teams = validateTeams(await readJSON(join(directory,'teams.json')));
  const sources = await readJSON(join(directory,'sources.json'));
  if (kind === 'ratings' && (sources.ratings.access !== 'approved' || !sources.ratings.authorizationReference))
    throw new Error('MHR authorization is pending. Record collection, storage, and display permission before importing.');
  const snapshot = validateSnapshot(kind,input,teams,now);
  const path = join(directory,`${kind}.json`);
  const store = await readJSON(path) as Store<Snapshot>;
  for (const saved of store.snapshots) validateSnapshot(kind,saved,teams,now);
  const result = appendSnapshot(store,snapshot);
  if (result.changed) await atomicJSON(path,result.store);
  return result.changed;
}
export async function recordStatus(kind: Kind, update: Partial<SourceStatus>, directory = 'data') {
  await mkdir(directory,{recursive:true});
  const path = join(directory,'status.json');
  const status = await readJSON(path);
  status[kind] = { ...status[kind], ...update };
  await atomicJSON(path,status);
}
export async function fetchJSON(url: string, token?: string, fetcher: typeof fetch = fetch): Promise<unknown> {
  if (new URL(url).protocol !== 'https:') throw new Error('Feed must use HTTPS');
  // No redirects with credentials; retry only transient responses, at most three attempts.
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetcher(url, { redirect:'error', signal:AbortSignal.timeout(20000), headers: {
      Accept:'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}),
    }});
    if (response.ok) {
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Expected JSON feed, received a different content type');
      const body = await response.text();
      if (body.length > 2_000_000) throw new Error('Feed exceeds size limit');
      return JSON.parse(body);
    }
    if (![429,500,502,503,504].includes(response.status) || attempt === 2) throw new Error(`Feed HTTP ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
  }
  throw new Error('Feed unavailable');
}
