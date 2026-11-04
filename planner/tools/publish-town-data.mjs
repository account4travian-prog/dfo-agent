// Generated game data stays in docs/build. This manifest is the artifact host's files map.
// The host serves text but not .gz, so each gzip region is published as base64 text (<region>.gz.txt).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';

export function publishTownData(directory) {
  const index = JSON.parse(readFileSync(join(directory, 'index.json'), 'utf8'));
  const files = {}, regions = [];
  let rawBytes = 0, gzipBytes = 0;
  for (const region of index.files) {
    const file = `${region.regionIndex}.json`;
    const bytes = readFileSync(join(directory, file));
    const data = JSON.parse(bytes);
    assert.equal(data.regionIndex, region.regionIndex);
    assert.equal(data.locations.length, region.locations);
    assert(data.locations.every(t => t.buildings.every(b => typeof b.name === 'string' && b.name.length)));
    const compressed = gzipSync(bytes, { level: 9 });
    assert(gunzipSync(compressed).equals(bytes), `Lossless gzip: ${file}`);
    const name = `${region.regionIndex}.gz.txt`;
    writeFileSync(join(directory, name), compressed.toString('base64'));
    files['towns/' + name] = resolve(directory, name);
    rawBytes += bytes.length;
    gzipBytes += compressed.length;
    regions.push({ ...region, file: name, bytes: bytes.length, gzipBytes: compressed.length });
  }
  // Stable small index; do not put the enormous per-town records into the page.
  writeFileSync(join(directory, 'index.json'), JSON.stringify({
    files: regions,
    locations: index.locations.map(({ mapId, name, regionIndex }) => ({ mapId, name, regionIndex })),
  }));
  files['towns/index.json'] = resolve(directory, 'index.json');
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify(files, null, 2) + '\n');
  return { regions: regions.length, rawBytes, gzipBytes, files };
}
