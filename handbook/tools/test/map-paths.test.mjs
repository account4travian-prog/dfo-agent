import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { maskToPolylines, buildPathsFile } from '../../../planner/tools/build-world-map.mjs';
import { createPathLayers, strokePathLayers } from '../../theme/map/path-layers.mjs';
import { mapPlugin } from '../map-plugin.mjs';

const compass = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const edge = (a, b) => [a.join(','), b.join(',')].sort().join('|');
function maskEdges(mask, width, height) {
  const edges = new Set();
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    compass.forEach(([dx, dy], d) => {
      const nx = x + dx, ny = y + dy;
      if ((mask[x + y * width] & (128 >> d)) && nx >= 0 && ny >= 0 && nx < width && ny < height) {
        edges.add(edge([x, y], [nx, ny]));
      }
    });
  }
  return edges;
}
function decodedEdges(lines) {
  const edges = new Set();
  for (const line of lines) {
    assert.ok(line.length >= 4 && line.length % 2 === 0);
    assert.ok(line.every(n => Number.isFinite(n) && n % 1 === .5));
    for (let i = 2; i < line.length; i += 2) {
      const dx = line[i] - line[i-2], dy = line[i+1] - line[i-1];
      assert.ok(dx || dy);
      assert.ok(!dx || !dy || Math.abs(dx) === Math.abs(dy));
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      let x = line[i-2] - .5, y = line[i-1] - .5;
      for (let j = 0; j < steps; j++) {
        const nx = x + Math.sign(dx), ny = y + Math.sign(dy), key = edge([x, y], [nx, ny]);
        assert.ok(!edges.has(key), `Duplicate edge ${key}`);
        edges.add(key); x = nx; y = ny;
      }
    }
  }
  return edges;
}
function stamp(mask, width, points) {
  for (let i = 1; i < points.length; i++) {
    const [x,y] = points[i-1], [nx,ny] = points[i];
    const d = compass.findIndex(([dx,dy]) => dx === nx-x && dy === ny-y);
    assert.ok(d >= 0);
    mask[x+y*width] |= 128 >> d;
    mask[nx+ny*width] |= 128 >> ((d+4)%8);
  }
}

test('polylines preserve every compass mask, including one-sided bits and borders', () => {
  for (let bits = 0; bits < 256; bits++) {
    for (const index of [0, 4, 8]) {
      const mask = new Uint8Array(9); mask[index] = bits;
      assert.deepEqual(decodedEdges(maskToPolylines(mask, 3, 3)), maskEdges(mask, 3, 3));
    }
  }
  assert.throws(() => maskToPolylines(new Uint8Array(8), 3, 3), /dimensions/);
});

test('runs merge straight vertices and preserve bends, junctions, diagonal crossings and cycles', () => {
  const w = 12, h = 10, mask = new Uint8Array(w*h);
  for (const points of [
    [[0,0],[1,0],[2,0],[3,0],[4,0]],
    [[2,0],[2,1],[3,2],[4,3],[5,3]],
    [[6,0],[7,0],[7,1],[6,1],[6,0]],
    [[0,7],[1,8]], [[0,8],[1,7]],
    [[8,6],[9,7],[10,8],[11,9]],
  ]) stamp(mask, w, points);
  const lines = maskToPolylines(mask, w, h);
  assert.deepEqual(decodedEdges(lines), maskEdges(mask, w, h));
  assert.ok(lines.some(line => line.join(',') === '8.5,6.5,11.5,9.5'));
  assert.ok(lines.some(line => line.length > 4 && line[0] === line.at(-2) && line[1] === line.at(-1)));
  assert.deepEqual(lines, maskToPolylines(mask, w, h), 'Stable output');
});

test('paths.json is produced from four arrays and published separately with attribution', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'bay-paths-'));
  try {
    const input = join(temp, 'map'), dist = join(temp, 'dist'), mask = new Uint8Array(12);
    await mkdir(join(input, 'towns'), { recursive: true });
    stamp(mask, 4, [[0,0],[1,0],[2,0],[3,1]]);
    for (const stem of ['road','track','river','stream']) await writeFile(join(temp, `${stem}Data.bytes`), mask);
    const built = buildPathsFile(temp, join(input, 'paths.json'), 4, 3);
    assert.deepEqual(JSON.parse(await readFile(join(input, 'paths.json'), 'utf8')), built);
    for (const lines of Object.values(built.layers)) assert.deepEqual(decodedEdges(lines), maskEdges(mask, 4, 3));
    assert.equal(Object.keys(built.inputHashes).length, 4);
    await writeFile(join(input, 'world-map.json'), '{}');
    await writeFile(join(input, 'towns/index.json'), '[]');
    await writeFile(join(input, 'world-map.html'), `<section class="world-map"><script type="application/json" class="map-path-data">${JSON.stringify(built)}</script><script type="application/json" class="map-data">{}</script><p>${built.attribution}</p></section>`);
    const plugin = await mapPlugin({ map: true, mapDir: input });
    assert.equal(typeof plugin.publish, 'function');
    await plugin.publish(dist);
    assert.equal(await readFile(join(dist, 'map-data/paths.json'), 'utf8'), JSON.stringify(built));
    assert.match(plugin.html, /Basic Roads by Hazelnut/);
    assert.doesNotMatch(plugin.html, /class="map-path-data"/);
    assert.match(plugin.html, /class="map-data"/);
    assert.ok((await readFile(join(dist, 'theme/map/path-layers.mjs'))).length);
    const disabled = await mapPlugin({ map: false, mapDir: input });
    assert.equal(disabled.publish, undefined);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('cached canvas paths respect toggles, dashes and bounded screen widths at every zoom', () => {
  const previous = globalThis.Path2D;
  globalThis.Path2D = class { moveTo() {} lineTo() {} };
  try {
    const paths = createPathLayers({ layers: Object.fromEntries(['roads','tracks','rivers','streams'].map(key => [key, [[.5,.5,2.5,.5]]])) });
    const calls = [];
    const ctx = { save() {}, restore() {}, setLineDash(dash) { this.dash = dash; },
      stroke(path) { calls.push({ path, width: this.lineWidth, dash: this.dash, colour: this.strokeStyle }); } };
    for (const scale of [.25, 1, 8, 64]) {
      calls.length = 0;
      strokePathLayers(ctx, paths, { roads: true, waterways: true }, scale, 'warm', 'water');
      assert.equal(calls.length, 4);
      assert.ok(calls.every(c => c.width * scale >= .35 && c.width * scale <= 2.8));
      assert.ok(calls[1].width > calls[0].width, 'River thicker than stream');
      assert.ok(calls[3].width > calls[2].width, 'Road thicker than track');
      assert.deepEqual(calls.map(c => c.dash.length), [0,0,2,0]);
      assert.equal(calls[3].path, paths.roads, 'Reuses cached geometry');
    }
    calls.length = 0;
    strokePathLayers(ctx, paths, { roads: false, waterways: true }, 1, 'warm', 'water');
    assert.deepEqual(calls.map(c => c.colour), ['water','water']);
    calls.length = 0;
    strokePathLayers(ctx, paths, {}, 1, 'warm', 'water');
    assert.equal(calls.length, 0);
  } finally { globalThis.Path2D = previous; }
});

test('vendored online networks round-trip to exactly the source pixel edges', { skip: !process.env.DFO_SRC }, async () => {
  for (const stem of ['road','track','river','stream']) {
    const mask = await readFile(resolve(process.env.DFO_SRC, `../vendor/roads-hazelnut/${stem}Data.bytes`));
    assert.deepEqual(decodedEdges(maskToPolylines(mask, 1000, 500)), maskEdges(mask, 1000, 500), stem);
  }
});
