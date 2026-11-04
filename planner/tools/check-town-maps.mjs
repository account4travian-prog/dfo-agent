#!/usr/bin/env node
// Offline checks of the generated data, browser layout transform, publication map and page contract.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { decodeTownGrid, townField, townBuildingPoint } from '../guide/town-layout.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(root, 'docs/build'), dir = join(out, 'towns');
const read = p => JSON.parse(readFileSync(p, 'utf8'));
const index = read(join(dir, 'index.json')), manifest = read(join(dir, 'manifest.json'));
const checks = read(join(dir, 'checks.json'));
const fixture = new Uint8Array(4096); fixture[1] = 12; fixture[63 * 64 + 2] = 16;
const encoded = Buffer.from(fixture).toString('base64');
assert.deepEqual(decodeTownGrid(encoded), fixture);
assert.equal(decodeTownGrid([4096, 17])[4095], 17);
assert.throws(() => decodeTownGrid([4097, 1]));
assert.throws(() => decodeTownGrid([1, 1]));
const asymmetric = { grid: [2, 2], blocks: [{ p: [1, 0], map: encoded }], buildings: [] };
const f = townField(asymmetric);
assert.equal(f.bytes[64 * 128 + 65], 12, 'Block row flips, byte row stays unreversed');
assert.equal(f.bytes[127 * 128 + 66], 16);
assert.deepEqual(townBuildingPoint(asymmetric, { p: [65, 127] }), [65, 0]);
const lookup = new Map();
let buildings = 0, locations = 0, rawBytes = 0, gzipBytes = 0, waterBlocks = 0;
for (const region of index.files) {
  const published = 'towns/' + region.file;
  assert.equal(manifest[published], resolve(dir, region.file));
  assert(/^[0-9]+\.gz\.txt$/.test(region.file));
  const zipped = Buffer.from(readFileSync(manifest[published], 'utf8'), 'base64'), raw = gunzipSync(zipped);
  assert(raw.equals(readFileSync(join(dir, `${region.regionIndex}.json`))), 'Lossless compressed region');
  assert.equal(zipped.length, region.gzipBytes); rawBytes += raw.length; gzipBytes += zipped.length;
  const data = JSON.parse(raw); assert.equal(data.locations.length, region.locations);
  for (const town of data.locations) {
    const key = `${town.regionIndex}:${town.mapId}`;
    assert(!lookup.has(key), 'Unique town identity'); lookup.set(key, town);
    if (town.flags.carriage) assert(town.blocks.some(b => /^WALLAA(?:08|09|10|11)(?:\.|$)/i.test(b.n)), 'Every carriage town has a gate marker');
    for (const b of town.buildings) {
      assert(b.name && Array.isArray(b.p) && Number.isFinite(b.q)); buildings++;
    }
    for (const block of town.blocks) {
      assert(block.water, 'Water data must be exported');
      decodeTownGrid(block.map); decodeTownGrid(block.water); waterBlocks++;
    }
    locations++;
  }
}
assert.equal(index.locations.length, locations);
assert.equal(Object.keys(manifest).length, index.files.length + 1);
for (const entry of index.locations) {
  const town = lookup.get(`${entry.regionIndex}:${entry.mapId}`);
  assert.equal(town?.name, entry.name);
}
for (const spot of checks.checks) {
  const town = [...lookup.values()].find(t => t.name === spot.name && t.region === spot.region);
  assert.equal(town.buildings.length, spot.buildingCount);
  assert.deepEqual(town.buildings.map(b => ({ type: b.type, faction: b.factionName, name: b.name, block: b.block, record: b.record })), spot.names);
  const field = townField(town);
  assert(field.bytes.some(v => v > 0), 'Actual footprint grid');
  assert(field.water.some(v => v > 0), 'Actual water coverage');
}
// Compare actual spot layouts against the source function, without importing its browser renderer closure.
if (process.env.DFO_SRC) {
  const text = readFileSync(join(process.env.DFO_SRC, 'ui/ink/inkTown.js'), 'utf8');
  const start = text.indexOf('export function townBytes('), end = text.indexOf('\n}', start) + 2;
  assert(start >= 0 && end > start);
  const api = await import('data:text/javascript;base64,' + Buffer.from('const BLOCK_PX=64;\n' + text.slice(start, end)).toString('base64'));
  for (const spot of checks.checks) {
    const town = [...lookup.values()].find(t => t.name === spot.name && t.region === spot.region);
    const expected = api.townBytes(...town.grid, town.blocks.map(b => ({ x: b.p[0], y: b.p[1], autoMap: decodeTownGrid(b.map) })));
    assert.deepEqual(townField(town).bytes, expected.bytes, `Source orientation: ${spot.name}`);
  }
}
const html = readFileSync(join(out, 'field-guide.html'), 'utf8');
assert(Buffer.byteLength(html) < 3_000_000);
assert(!/<!doctype|<\/?(?:html|head|body)\b/i.test(html));
assert.equal((html.match(/class="map-data"/g) ?? []).length, 1);
const packed = JSON.parse(html.match(/<script type="application\/json" class="map-data">([\s\S]*?)<\/script>/)[1]);
for (const entry of index.locations) {
  assert(packed.locations.some(l => l[1] === entry.regionIndex && l[11] === entry.mapId && l[0] === entry.name), 'Bay-to-town identity includes mapId, including duplicated names');
}
assert(html.includes("new DecompressionStream('gzip')"));
assert(html.includes('About this article') && html.includes('about-article'), 'Wiki article notes stay intact');
assert(!/<iframe\b|\b(?:src|href)="https?:\/\/(?!fonts\.googleapis\.com\/)/i.test(html));
console.log(JSON.stringify({ regions: index.files.length, locations, buildings, waterBlocks, spotChecks: checks.checks.length, rawBytes, gzipBytes, indexBytes: readFileSync(join(dir, 'index.json')).length, pageBytes: Buffer.byteLength(html) }, null, 2));
