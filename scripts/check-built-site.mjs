import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])),
    )
  ).flat();
}
const htmlFiles = (await files('dist')).filter((path) => path.endsWith('.html'));
let links = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (/[\\/]players[\\/]/.test(file) || /href="\/players(?:\/|")/.test(html))
    throw new Error(`Removed player pages or links leaked into ${file}`);
  if (/TEST ONLY|fixture-knights|fixture-opponent|TEST FIXTURE/.test(html))
    throw new Error(`Test data leaked into ${file}`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^\"]*"/g)) {
    const target = match[1];
    if (target.startsWith('//')) continue;
    await access(join('dist', target.endsWith('/') ? `${target}index.html` : target));
    links++;
  }
  if (!html.includes('<h1')) throw new Error(`Missing page heading: ${file}`);
}
console.log(
  `Verified ${htmlFiles.length} built pages and ${links} local links/assets; no test fixtures leaked.`,
);
