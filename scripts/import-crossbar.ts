import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { crossbarUrl, parseCrossbar, mergeCrossbar } from '../src/lib/crossbar';
const path = 'data/crossbar.json';
const store = JSON.parse(await readFile(path, 'utf8'));
const now = new Date().toISOString();
try {
  const file = process.argv[2];
  let html: string;
  if (file) html = await readFile(file, 'utf8');
  else {
    const response = await fetch(crossbarUrl, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Crossbar unavailable');
    html = await response.text();
  }
  const snapshot = parseCrossbar(html, now);
  const official = JSON.parse(await readFile('data/schedule.json', 'utf8')).snapshots.at(-1).games;
  mergeCrossbar(official, snapshot);
  const last = store.snapshots.at(-1);
  if (last && snapshot.entries.length < last.entries.length * 0.75)
    throw new Error('Unexpected schedule shrinkage; review source before accepting');
  if (JSON.stringify(last?.entries) !== JSON.stringify(snapshot.entries)) store.snapshots.push(snapshot);
  store.lastSuccessfulCheck = now;
  store.error = null;
  console.log(
    `${snapshot.entries.length} Crossbar entries checked and merged without duplicate CSDHL games.`,
  );
} catch (error) {
  store.error = 'Crossbar refresh failed. Last verified schedule retained.';
  console.error(store.error, error instanceof Error ? error.message : '');
  process.exitCode = 1;
}
store.lastAttemptAt = now;
const temp = `${path}.${randomUUID()}.tmp`;
await writeFile(temp, JSON.stringify(store, null, 2) + '\n');
await rename(temp, path);
