import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { createMapPicture } from '../src/mind/map-picture.mjs';
import { createContextBuilder } from '../src/mind/context.mjs';

const mapMemory = {
  start: [0, 0], last: [1, 0], route: [[0, 0], [1, 0]], level: 0, heading: 90,
  cell: 1, cells: [[0, 0]], leads: [], things: [], openings: [], surfaces: [],
};

function pngPixels(png) {
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  return { width, height, pixel(x, y) { const i = y * (width * 3 + 1) + 1 + x * 3; return [...raw.subarray(i, i + 3)]; } };
}

test('renders bounded PNG, caption, and only remembered ground plus seen automap floor', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dfo-map-'));
  try {
    const map = createMapPicture({ runDir: root });
    const result = await map.write(mapMemory, { cell: 1, cells: [[3, 0]] });
    const decoded = pngPixels(fs.readFileSync(result.path));
    assert.ok(decoded.width <= 420 && decoded.height <= 420);
    assert.match(result.caption, /Session map, level 0, facing 90°/);
    assert.match(result.caption, /grey walked/);
    assert.deepEqual(decoded.pixel(Math.round((0.5 - result.bounds.minX) / result.metresPerPixel), Math.round((result.bounds.maxZ - 0.5) / result.metresPerPixel)), [120, 120, 128]);
    const unseenX = Math.round((2.5 - result.bounds.minX) / result.metresPerPixel);
    const unseenY = Math.round((result.bounds.maxZ - 0.5) / result.metresPerPixel);
    assert.deepEqual(decoded.pixel(unseenX, unseenY), [24, 24, 28]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('adds navigation pictures within context budget, dedupes bytes, and never sends one to Luna', () => {
  const memory = { persona: { name: 'Rowan', identity: '', values: [] }, snapshot: () => ({ goal: null }), select: () => [] };
  const config = { roles: Object.fromEntries(['luna', 'terra', 'sol'].map(role => [role, { images: role === 'sol' ? 'never' : 'ui', contextBytes: 6000 }])) };
  const builder = createContextBuilder({ memory, config });
  const picture = { path: 'run/map-picture.png', sha256: 'same-bytes', caption: 'Session map caption.' };
  const args = { snapshot: {}, plan: { goal: 'Explore the western passage', steps: [{ skill: 'goto' }] }, placePicture: picture, includeImage: true };
  const first = builder.build({ role: 'terra', ...args });
  assert.deepEqual(first.images, [picture.path]);
  assert.equal(first.payload.mapPicture.caption, picture.caption);
  assert.ok(first.bytes <= first.limit);
  const repeated = builder.build({ role: 'terra', ...args });
  assert.deepEqual(repeated.images, []);
  assert.equal(repeated.payload.mapPicture.caption, picture.caption);
  assert.deepEqual(builder.build({ role: 'luna', ...args }).images, []);
  assert.deepEqual(builder.build({ role: 'sol', ...args }).images, []);
});

test('does not add a map picture to routine planning context', () => {
  const memory = { persona: { name: 'Rowan', identity: '', values: [] }, snapshot: () => ({ goal: null }), select: () => [] };
  const config = { roles: Object.fromEntries(['luna', 'terra', 'sol'].map(role => [role, { images: 'ui', contextBytes: 6000 }])) };
  const builder = createContextBuilder({ memory, config });
  const result = builder.build({ role: 'terra', snapshot: {}, placePicture: { path: 'map.png', sha256: 'x', caption: 'map' }, includeImage: true });
  assert.deepEqual(result.images, []);
  assert.equal(result.payload.mapPicture, undefined);
});
