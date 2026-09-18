import { readFile } from 'node:fs/promises';
import { importSnapshot, recordStatus, fetchJSON } from './lib/importer';
import type { Kind } from '../src/lib/schema';

const kind = process.argv[2] as Kind;
if (!['standings', 'ratings'].includes(kind)) throw new Error('Choose standings or ratings');
const scheduled = process.argv.includes('--scheduled');
const file = process.argv.slice(3).find((arg) => !arg.startsWith('--'));
const sources = JSON.parse(await readFile('data/sources.json', 'utf8'));
const prefix = kind === 'ratings' ? 'MHR' : 'STANDINGS';
const url = process.env[`${prefix}_FEED_URL`];
const now = new Date().toISOString();
if (scheduled && (now.slice(0, 10) < '2026-08-01' || now.slice(0, 10) > '2027-07-31')) {
  console.log('Outside the configured season. No source request made.');
} else if (
  kind === 'ratings' &&
  (sources.ratings.access !== 'approved' || !sources.ratings.authorizationReference)
) {
  if (file) throw new Error('MHR permission is pending; imports are disabled.');
  console.log('MHR import not enabled: awaiting authorized source. No request made.');
} else if (scheduled && kind === 'ratings' && !sources.ratings.publicationScheduleVerified) {
  console.log('MHR schedule not verified for this season. No request made.');
} else if (!file && !url) {
  console.log(`${kind}: no approved feed configured. Existing observations retained.`);
} else {
  try {
    const input = file
      ? JSON.parse(await readFile(file, 'utf8'))
      : await fetchJSON(url!, process.env[`${prefix}_FEED_TOKEN`]);
    const changed = await importSnapshot(kind, input);
    await recordStatus(kind, {
      state: file ? 'manual' : 'ok',
      lastAttemptAt: now,
      lastSuccessAt: now,
      message: changed ? 'Validated source observation saved.' : 'Source checked; no new revision.',
    });
    console.log(changed ? 'New observation saved.' : 'No duplicate observation added.');
  } catch (error) {
    // Do not publish exception text: provider URLs or payloads could contain credentials.
    await recordStatus(kind, {
      state: 'error',
      lastAttemptAt: now,
      message:
        'The latest update failed validation or source access. The last valid observation is retained.',
    });
    console.error('Import failed. Check feed access and documented schema. Existing observations retained.');
    process.exitCode = 1;
  }
}
