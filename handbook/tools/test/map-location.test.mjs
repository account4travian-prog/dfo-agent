import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MAP_SQUARE_KM, PIN_STORAGE_KEY, validPin, hasService, distanceFrom, findNearest, loadPin, savePin } from '../../theme/map/map-location.mjs';
import { mapPlugin } from '../map-plugin.mjs';

const services = [['carriage', 'Carriage'], ['bank', 'Bank'], ['fighters', 'Fighters Guild']];
const origin = { x: 100.5, y: 100.5 };
const place = (name, dx, dy, bits, region = 0) => ({ name, x: origin.x + dx, y: origin.y + dy, services: bits, region });

test('straight-line distance uses the map square scale, including fractional and coincident pins', () => {
  const d = distanceFrom(origin, place('Diagonal', 3, 4, 1));
  assert.equal(MAP_SQUARE_KM, .8192);
  assert.equal(d.squares, 5);
  assert.equal(d.km, 4.096);
  assert.equal(d.direction, 'SE');
  assert.deepEqual(distanceFrom(origin, origin), { squares: 0, km: 0, direction: 'here' });
  assert.equal(distanceFrom(origin, place('Half', .5, 0, 1)).km, .4096);
});

test('compass directions follow north-up map coordinates and round to eight sectors', () => {
  for (const [direction, dx, dy] of [['N',0,-1],['NE',1,-1],['E',1,0],['SE',1,1],['S',0,1],['SW',-1,1],['W',-1,0],['NW',-1,-1]]) {
    assert.equal(distanceFrom(origin, place(direction, dx, dy, 1)).direction, direction);
  }
  assert.equal(distanceFrom(origin, place('Near north', .01, -1, 1)).direction, 'N');
  assert.equal(distanceFrom(origin, place('Near east', 1, -.01, 1)).direction, 'E');
});

test('nearest search requires every service, sorts by distance, and keeps the input unchanged', () => {
  const locations = [place('Far', 8, 0, 7), place('Only bank', 0, 0, 2), place('Zed', 3, 4, 6), place('Alpha', 0, -5, 6), place('Here', 0, 0, 6), place('No records', 0, 0, null)];
  const original = [...locations];
  const matches = findNearest(locations, origin, new Set(['bank', 'fighters']), services);
  assert.deepEqual(matches.map(row => row.place.name), ['Here', 'Alpha', 'Zed', 'Far']);
  assert.deepEqual(matches.map(row => row.squares), [0, 5, 5, 8]);
  assert.equal(matches[0].place, locations[4]);
  assert.deepEqual(locations, original);
  assert.equal(hasService(locations[0], 'carriage', services), true);
  assert.equal(hasService(locations[1], 'fighters', services), false);
  assert.equal(hasService(locations[0], 'unknown', services), false);
});

test('missing pin, empty services, unknown services and no matches return empty results', () => {
  const locations = [place('Bank', 1, 0, 2)];
  for (const [pin, keys] of [[null, ['bank']], [origin, []], [origin, ['fighters']], [origin, ['unknown']], [{ x: NaN, y: 0 }, ['bank']]]) {
    assert.deepEqual(findNearest(locations, pin, keys, services), []);
  }
  assert.deepEqual(findNearest([], origin, ['bank'], services), []);
});

test('nearest search returns all matches for five-at-a-time pagination', () => {
  const locations = Array.from({ length: 13 }, (_, i) => place(String(i), 13-i, 0, 1));
  const matches = findNearest(locations, origin, ['carriage'], services);
  assert.equal(matches.length, 13);
  assert.deepEqual(matches.slice(0, 5).map(row => row.squares), [1,2,3,4,5]);
  assert.deepEqual(matches.slice(5, 10).map(row => row.squares), [6,7,8,9,10]);
});

test('pin persistence round-trips exact coordinates, strips other fields, and removes the saved pin', () => {
  const values = new Map(), storage = () => ({ getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) });
  assert.equal(loadPin(storage), null);
  assert.equal(savePin({ ...origin, name: 'not stored' }, storage), true);
  assert.equal(values.get(PIN_STORAGE_KEY), JSON.stringify(origin));
  assert.deepEqual(loadPin(storage), origin);
  assert.equal(savePin(null, storage), true);
  assert.equal(loadPin(storage), null);
});

test('pin persistence tolerates denied storage access, reads, writes and removal', () => {
  const denied = () => { throw Error('Storage denied'); };
  for (const storage of [denied, () => ({ getItem: denied, setItem: denied, removeItem: denied }), () => undefined]) {
    assert.equal(loadPin(storage), null);
    assert.equal(savePin(origin, storage), false);
    assert.equal(savePin(null, storage), false);
  }
});

test('pin restoration rejects malformed, nonnumeric and out-of-bounds values', () => {
  for (const raw of ['{', 'null', '[]', 'true', '{"x":"1","y":2}', '{"x":-1,"y":2}', '{"x":1000,"y":2}', '{"x":1,"y":500}', '{"x":1}', '{"x":null,"y":2}']) {
    assert.equal(loadPin(() => ({ getItem: () => raw })), null, raw);
  }
  assert.equal(validPin({ x: 0, y: 0 }), true);
  assert.equal(validPin({ x: 999.999, y: 499.999 }), true);
  assert.equal(validPin({ x: Infinity, y: 0 }), false);
  assert.equal(savePin({ x: 1000, y: 0 }, () => { throw Error('Should not access storage'); }), false);
});

test('handbook plugin replaces the extracted chip panel with the typed nearest finder', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'bay-pin-'));
  try {
    const input = join(temp, 'input'), dist = join(temp, 'dist');
    await mkdir(join(input, 'towns'), { recursive: true });
    for (const file of ['world-map.json', 'paths.json', 'towns/index.json']) await writeFile(join(input, file), '{}');
    await writeFile(join(input, 'world-map.html'), '<section class="world-map"><div class="map-head"></div><div class="map-services"><div class="map-near"><span class="map-origin">Nearest to: search and select a place above.</span><select></select><button data-nearest>Find nearest</button></div><p>Choose one or more services above, then find the nearest places offering all of them.</p></div><div class="map-stage"></div><div class="map-nearest-results"></div></section>');
    const plugin = await mapPlugin({ map: true, mapDir: input });
    for (const attribute of ['data-pin-drop', 'data-pin-centre', 'data-pin-remove']) assert.ok(plugin.html.includes(attribute));
    assert.doesNotMatch(plugin.html, /data-nearest-carriage|data-nearest[ >]/);
    assert.doesNotMatch(plugin.html, /all of them/);
    assert.match(plugin.html, /role="status"/);
    assert.doesNotMatch(plugin.html, /<select|search and select a place above/);
    await plugin.publish(dist);
    assert.equal(await readFile(join(dist, 'theme/map/map-location.mjs'), 'utf8'), await readFile(new URL('../../theme/map/map-location.mjs', import.meta.url), 'utf8'));
  } finally { await rm(temp, { recursive: true, force: true }); }
});
