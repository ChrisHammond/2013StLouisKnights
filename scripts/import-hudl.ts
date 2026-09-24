import ExcelJS from 'exceljs';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { parseHudlRows, mergeGames } from './lib/hudl-import';
import { playerStatsSchema } from '../src/lib/player-stats';

const { values } = parseArgs({
  options: {
    file: { type: 'string' },
    player: { type: 'string' },
    season: { type: 'string' },
    'as-of': { type: 'string' },
  },
});
if (
  !values.file ||
  values.player !== 'daniel-hammond' ||
  values.season !== '2026-27' ||
  !values['as-of'] ||
  !/^\d{4}-\d{2}-\d{2}$/.test(values['as-of'])
)
  throw new Error(
    'Usage: npx tsx scripts/import-hudl.ts --file export.xlsx --player daniel-hammond --season 2026-27 --as-of YYYY-MM-DD',
  );
if (!basename(values.file).startsWith('Games - Daniel Hammond,') || !values.file.endsWith('.xlsx'))
  throw new Error(
    'Expected the original Games - Daniel Hammond, … .xlsx export. The workbook has no player identity; verify its owner before importing.',
  );
const bytes = await readFile(values.file);
if (bytes.length > 5 * 1024 * 1024) throw new Error('Export exceeds 5 MB');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(values.file);
const sheet = workbook.getWorksheet('Box score');
if (!sheet || sheet.rowCount > 500 || sheet.columnCount > 200)
  throw new Error('Unsupported Box score worksheet');
const rows: (string | number | null)[][] = [];
sheet.eachRow({ includeEmpty: true }, (row) => {
  const cells: (string | number | null)[] = [];
  for (let i = 1; i <= sheet.columnCount; i++) {
    const v = row.getCell(i).value;
    if (v !== null && typeof v !== 'string' && typeof v !== 'number')
      throw new Error('Unsupported cell type or formula; export unedited game statistics from Hudl');
    cells.push(v);
  }
  rows.push(cells);
});
const incoming = parseHudlRows(rows, {
  file: basename(values.file),
  sha256: createHash('sha256').update(bytes).digest('hex'),
  asOf: values['as-of'],
});
const output = 'data/players/daniel-hammond.json';
let existing: ReturnType<typeof playerStatsSchema.parse> | undefined;
try {
  existing = playerStatsSchema.parse(JSON.parse(await readFile(output, 'utf8')));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
const games = mergeGames(existing?.games ?? [], incoming);
if (JSON.stringify(games) === JSON.stringify(existing?.games)) {
  console.log('No changes: this export has already been imported.');
} else {
  const result = playerStatsSchema.parse({
    playerId: values.player,
    season: values.season,
    importedAt: new Date().toISOString(),
    sourceUrl: 'https://app.hudl.com/instat/hockey/players/2473445/games',
    games,
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(`${output}.tmp`, JSON.stringify(result, null, 2) + '\n');
  await rename(`${output}.tmp`, output);
  console.log(
    `Imported ${incoming.length} game rows; ${games.length} games saved to ${output}. Review the diff before publishing.`,
  );
}
