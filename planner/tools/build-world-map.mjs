#!/usr/bin/env node
// Local data only. Never reads travel-map pictures, textures, sprites or game icons.
// node planner/tools/build-world-map.mjs [ARENA2] [--markers file.json|file.md] [--paths-dir directory]
// DFO_SRC overrides upstream/daggerfall-js-source/src. Outputs are gitignored.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { createPathLayers, strokePathLayers } from '../../handbook/theme/map/path-layers.mjs';

/** Undirected in-bounds pixel edges, including one-sided bits at grade transitions.
 * Trace maximal degree-two runs and cycles; drop only collinear intermediate vertices.
 * Flat coordinate pairs are pixel centres, with y increasing south, as in DIR_DELTA.
 */
export function maskToPolylines(mask, width, height) {
  assert(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0);
  assert.equal(mask.length, width * height, 'Path mask dimensions');
  const directions = [[128,0,-1],[64,1,-1],[32,1,0],[16,1,1],[8,0,1],[4,-1,1],[2,-1,0],[1,-1,-1]];
  const nodes = new Map(), edges = new Set(), count = width * height;
  const edgeKey = (a, b) => Math.min(a, b) * count + Math.max(a, b);
  const link = (a, b) => { if (!nodes.has(a)) nodes.set(a, []); nodes.get(a).push(b); };
  for (let a = 0; a < mask.length; a++) {
    if (!mask[a]) continue;
    const x = a % width, y = Math.floor(a / width);
    for (const [bit, dx, dy] of directions) if (mask[a] & bit) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const b = nx + ny * width, key = edgeKey(a, b);
      if (edges.has(key)) continue;
      edges.add(key); link(a, b); link(b, a);
    }
  }
  const lines = [];
  const trace = (start, next) => {
    const points = [start]; let at = start;
    while (edges.delete(edgeKey(at, next))) {
      points.push(next);
      const previous = at; at = next;
      if (at === start || nodes.get(at).length !== 2) break;
      next = nodes.get(at).find(n => n !== previous);
    }
    const line = [];
    for (const p of points) {
      const x = p % width + .5, y = Math.floor(p / width) + .5, n = line.length;
      if (n >= 4 && (line[n-2]-line[n-4]) * (y-line[n-1]) === (line[n-1]-line[n-3]) * (x-line[n-2])) {
        line[n-2] = x; line[n-1] = y;
      } else line.push(x, y);
    }
    lines.push(line);
  };
  for (const [a, adjacent] of nodes) if (adjacent.length !== 2) {
    for (const b of adjacent) if (edges.has(edgeKey(a, b))) trace(a, b);
  }
  // Components with no endpoint/junction are closed cycles.
  for (const [a, adjacent] of nodes) for (const b of adjacent) if (edges.has(edgeKey(a, b))) trace(a, b);
  return lines;
}

export function buildPathsFile(directory, output, width = 1000, height = 500) {
  const layers = {}, inputHashes = {};
  for (const [layer, stem] of [['roads','road'],['tracks','track'],['rivers','river'],['streams','stream']]) {
    const file = `${stem}Data.bytes`, bytes = readFileSync(join(directory, file));
    layers[layer] = maskToPolylines(bytes, width, height);
    inputHashes[file] = createHash('sha256').update(bytes).digest('hex');
  }
  const paths = { formatVersion: 1, width, height,
    coordinates: 'Flat x,y pairs at map pixel centres; origin northwest, y south; collinear vertices omitted.',
    attribution: 'Roads, tracks, rivers and streams: Basic Roads by Hazelnut', inputHashes, layers };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(paths));
  return paths;
}

const norm = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
/** Resolve conservatively. Duplicate or approximate names are reported, never silently assigned. */
export function resolveMarkers(entries, data) {
  if (!Array.isArray(entries)) throw Error('Marker data must be an array');
  const resolved = [], unresolved = [];
  for (const entry of entries) {
    if (!entry || typeof entry.name !== 'string') { unresolved.push({ entry, reason: 'Missing name' }); continue; }
    const n = norm(entry.name);
    const zone = ['openzone', 'theopenzone'].includes(n) || (entry.kind === 'open_zone' && n === norm(data.regions[data.overlays.openZone.region].name)) ? data.overlays.openZone : ['jungleofbantha', 'thejungleofbantha', 'banthajungle'].includes(n) ? data.overlays.jungle : null;
    if (zone) { resolved.push({ ...entry, x: zone.anchor[0], y: zone.anchor[1], resolvedAs: zone.name, placement: 'area anchor' }); continue; }
    if (entry.kind === 'region') {
      const region = data.regions.find(r => norm(r.name) === n);
      if (region?.anchor) resolved.push({ ...entry, x: region.anchor[0], y: region.anchor[1], resolvedAs: region.name, placement: 'region anchor' });
      else unresolved.push({ entry, reason: region ? 'Region has no pixels in POLITIC.PAK' : 'No exact region match' });
      continue;
    }
    if (entry.kind === 'port_network' && n === 'iliacbayports') {
      for (const l of data.locations.filter(l => l.port)) resolved.push({ ...entry, name: l.name + ' port', x: l.x + .5, y: l.y + .5, location: [l.region, l.index], resolvedAs: l.name, resolvedRegion: data.regions[l.region].name, placement: 'port town' });
      continue;
    }
    // Two named structures are located by their reviewed parent location, not by guessed building coordinates.
    const parentName = n === 'daggerfallarena' ? 'Daggerfall' : n === 'lefaymonument' ? "Privateer's Hold" : null;
    if (parentName) {
      const parent = data.locations.find(l => l.name === parentName && l.region === 17);
      if (parent) {
        resolved.push({ ...entry, x: parent.x + .5, y: parent.y + .5, location: [parent.region,parent.index],
          resolvedAs: parent.name, resolvedRegion: data.regions[parent.region].name, placement: 'parent-location anchor',
          where: entry.where + ' | Map pin is the parent location centre, not an exact structure position.' });
        continue;
      }
    }
    let matches = data.locations.filter(l => norm(l.name) === n || norm(l.name).replace(/^the/, '') === n.replace(/^the/, ''));
    if (entry.region != null && entry.region !== '') matches = matches.filter(l => String(l.region) === String(entry.region) || norm(data.regions[l.region].name) === norm(entry.region));
    if (matches.length === 1) {
      const l = matches[0]; resolved.push({ ...entry, x: l.x + .5, y: l.y + .5, location: [l.region, l.index], resolvedAs: l.name, resolvedRegion: data.regions[l.region].name, placement: 'location' });
    } else unresolved.push({ entry, reason: matches.length ? 'Ambiguous name; specify region' : 'No exact location match', candidates: matches.map(l => ({ name: l.name, region: data.regions[l.region].name })) });
  }
  return { resolved, unresolved };
}

// Importing the geometry helpers never opens game files or writes build outputs.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'docs/build');
const SRC = resolve(process.env.DFO_SRC ?? join(ROOT, 'upstream/daggerfall-js-source/src'));
const args = process.argv.slice(2);
const pi = args.indexOf('--paths-dir');
if (pi >= 0 && !args[pi + 1]) throw Error('--paths-dir needs a directory');
const pathsDirectory = pi >= 0 ? args.splice(pi, 2)[1] : join(SRC, '../vendor/roads-hazelnut');
const mi = args.indexOf('--markers');
if (mi >= 0 && !args[mi + 1]) throw Error('--markers needs a JSON or Markdown file');
const markerArg = mi >= 0 ? args.splice(mi, 2)[1] : null;
if (args.some(a => a.startsWith('--')) || args.length > 1) throw Error('Usage: build-world-map.mjs [ARENA2] [--markers file] [--paths-dir directory]');
const ARENA = resolve(args[0] ?? process.env.ARENA2_PATH ?? 'C:/Program Files (x86)/Steam/steamapps/common/The Elder Scrolls Daggerfall/DF/DAGGER/ARENA2');
const source = p => readFileSync(join(SRC, p), 'utf8');
const dfo = p => import(pathToFileURL(join(SRC, p)).href);
const pureModule = code => import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
// Some exported laws import browser hosts transitively (and the src-only export has no vendor assets).
// Evaluate their ORIGINAL pure declarations, bounded by exact source anchors; never reimplement the law.
function between(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw Error(`DFO source changed: cannot find ${start} / ${end}`);
  return text.slice(a, b);
}
function fn(text, name) {
  const start = `export function ${name}(`;
  return between(text, start, '\n}') + '\n}';
}
const mapModule = await dfo('formats/mapsFile.js');
const carriageLaw = await pureModule(between(source('world/immersiveTravelGates.js'), 'export const IT_GATE_FILE', '/** The two arrays'));
const { BUILDING_TYPES: BT } = await pureModule(between(source('world/buildingNames.js'), 'export const BUILDING_TYPES', '/** PROF-FOUND'));
const { GUILD_FACTION_IDS: GF } = await dfo('systems/guild/guildFactions.js');
const yardLaw = await pureModule(`const LOCATION_TYPES=${JSON.stringify(mapModule.LOCATION_TYPES)};\n${between(source('systems/merchantYards.js'), 'export const YARD_TOWN_TYPES', '/** STEED1:')}`);
const SERVICES = [
 ['carriage','Carriage','Instant paid land travel outside city gates; see Travel.'],
 ['port','Port','Friendly-ship passage and ship services.'],
 ['generalStore','General Store','Needed by early questline steps, including The Court Crafter.'],
 ['fightersGuild','Fighters Guild','Guild quests and Hand-to-Hand training.'],
 ['magesGuild','Mages Guild','Guild services; teleport depends on rank and settings.'],
 ['temple','Temple','Temple services and quest sites.'],
 ['armorer','Armorer','Armour shopping and quest sites.'],
 ['tavern','Tavern','Town stop, quest sites and festival Wyrd Sisters.'],
 ['weaponSmith','Weapon smith','Weapon shopping.'],
 ['bank','Bank','Bank carried gold; see the guide for death loss.'],
 ['stable','Stable/Wagon Yard','Eligible city or town; horse and wagon yards need free ground.']
];
function servicesOf(loc, port) {
 const buildings=loc?.exterior?.buildings??[], has=type=>buildings.some(b=>b.buildingType===type);
 const guild=id=>buildings.some(b=>b.buildingType===BT.GuildHall&&b.factionId===id);
 return {carriage:carriageLaw.hasCarriageGate(loc),port,generalStore:has(BT.GeneralStore),fightersGuild:guild(GF.FightersGuild),magesGuild:guild(GF.MagesGuild),temple:has(BT.Temple),armorer:has(BT.Armorer),tavern:has(BT.Tavern),weaponSmith:has(BT.WeaponSmith),bank:has(BT.Bank),stable:yardLaw.isYardTown(loc)};
}
const { MapsFile, REGION_NAMES, LOCATION_TYPES, DUNGEON_TYPES, CLIMATES, longitudeLatitudeToMapPixel, MAX_MAP_PIXEL_X: W, MAX_MAP_PIXEL_Y: H } = mapModule;
const { WoodsFile } = await dfo('formats/woodsFile.js');
const wildText = source('systems/wild/wildZone.js');
const wild = await pureModule(between(wildText, 'export const WILD_REGION', '/**\n * THE ZONE\'S EDGE'));
const { BANTHA_AREA_ROWS, banthaAreaHas } = await dfo('world/jungle/banthaArea.js');
const rarity = await pureModule(between(source('systems/loot/lootRarity.js'), 'export const DUNGEON_RARITY_TIER', 'export const dungeonRarityTier'));
const ports = await dfo('systems/travel/travelPorts.js');
const terrainText = source('world/terrain/terrainSampler.js');
const terrainConstants = ['BASE_HEIGHT_SCALE', 'SCALED_OCEAN_ELEVATION'].map(n => {
  const match = terrainText.match(new RegExp(`export const ${n} = [^;]+;`));
  if (!match) throw Error(`Missing terrain constant ${n}`);
  return match[0];
}).join('\n');
const waterLaw = await pureModule(`const CLIMATES=${JSON.stringify(CLIMATES)};\n${terrainConstants}\n${fn(source('ui/overworldModel.js'), 'isWaterPixel')}`);
const portSitesText = source('world/portSites.js');
const fortText = source('net/fortLaw.js');
const seaLaw = await pureModule(`${fortText.match(/export const SEA_RING = [^;]+;/)?.[0]}\n${fn(fortText, 'seaBears')}\n${fn(portSitesText, 'openSeaOf')}`);

const inputHashes = {};
function readGame(name) {
  const bytes = new Uint8Array(readFileSync(join(ARENA, name)));
  inputHashes[name] = createHash('sha256').update(bytes).digest('hex');
  return bytes;
}
const maps = new MapsFile();
assert(maps.load(readGame('MAPS.BSA'), readGame('CLIMATE.PAK'), readGame('POLITIC.PAK')));
const woods = new WoodsFile();
assert(woods.load(readGame('WOODS.WLD')));
const political = new Int16Array(W * H), climate = new Uint8Array(W * H), land = new Int16Array(W * H).fill(-1);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x;
  political[i] = maps.getRegionIndexAt(x, y);
  climate[i] = maps.getClimateIndex(x, y);
  if (!waterLaw.isWaterPixel(climate[i], woods.getHeightMapValue(x, y))) land[i] = political[i];
}
const sea = seaLaw.openSeaOf((x, y) => land[y * W + x] < 0, W, H);

// Exact pixel-corner polygons. Merge straight edges, including lake holes; no element per pixel.
function outline(grid, value) {
  const edges = new Map();
  const add = (ax, ay, bx, by) => {
    const key = ay * (W + 1) + ax;
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push(by * (W + 1) + bx);
  };
  const has = (x, y) => x >= 0 && y >= 0 && x < W && y < H && grid[y * W + x] === value;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (has(x, y)) {
    if (!has(x, y - 1)) add(x, y, x + 1, y);
    if (!has(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!has(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!has(x - 1, y)) add(x, y + 1, x, y);
  }
  let path = '';
  const xy = k => [k % (W + 1), Math.floor(k / (W + 1))];
  while (edges.size) {
    const start = edges.keys().next().value;
    const points = [xy(start)];
    let at = start;
    do {
      const list = edges.get(at), next = list.pop();
      if (!list.length) edges.delete(at);
      const p = xy(next), a = points.at(-2), b = points.at(-1);
      if (a && ((a[0] === b[0] && b[0] === p[0]) || (a[1] === b[1] && b[1] === p[1]))) points[points.length - 1] = p;
      else points.push(p);
      at = next;
    } while (at !== start);
    path += `M${points[0].join(',')}` + points.slice(1).map(p => `L${p.join(',')}`).join('') + 'Z';
  }
  return path;
}
function rows(grid) {
  const out = [];
  for (let y = 0; y < H; y++) {
    const row = [y];
    for (let x = 0; x < W;) {
      const v = grid[y * W + x], start = x++;
      while (x < W && grid[y * W + x] === v) x++;
      row.push(start, x - 1, v);
    }
    out.push(row);
  }
  return out;
}
function pathArea(path) {
  let twice = 0;
  for (const ring of path.matchAll(/M([^Z]+)Z/g)) {
    const points = ring[1].split('L').map(p => p.split(',').map(Number));
    for (let i = 0; i < points.length; i++) { const a = points[i], b = points[(i + 1) % points.length]; twice += a[0] * b[1] - b[0] * a[1]; }
  }
  return twice / 2;
}
const nameWords = s => s.replace(/([a-z])([A-Z])/g, '$1 $2');
const typeNames = Object.fromEntries(Object.entries(LOCATION_TYPES).map(([k, v]) => [v, k]));
const dungeonNames = Object.fromEntries(Object.entries(DUNGEON_TYPES).map(([k, v]) => [v, nameWords(k)]));
const kindNames = { 0: 'city', 1: 'hamlet', 2: 'village', 3: 'farm', 4: 'dungeon', 5: 'temple', 6: 'tavern', 7: 'dungeon', 8: 'wealthy home', 9: 'cult', 10: 'dungeon', 11: 'home', 12: 'graveyard', 13: 'coven', 14: 'ship' };
const locations = [], regions = [];
for (let r = 0; r < maps.regionCount; r++) {
  const region = maps.getRegion(r);
  if (region) for (let i = 0; i < region.locationCount; i++) {
    const t = region.mapTable[i], p = longitudeLatitudeToMapPixel(t.longitude, t.latitude);
    assert(p.x >= 0 && p.x < W && p.y >= 0 && p.y < H);
    const loc = maps.getLocation(r, i);
    const portCandidate = ports.hasPort(t.mapId) || (loc?.exterior?.exteriorData?.portTownAndUnknown ?? 0) !== 0;
    const isSettlement = [0, 1, 2].includes(t.locationType);
    const port = isSettlement && portCandidate && seaLaw.seaBears(p.x, p.y, (x, y) => x >= 0 && y >= 0 && x < W && y < H && !!sea[y * W + x]);
    // A city's palace also has an RDB. It is not a dungeon destination on the world map.
    const hasDungeon = !!loc?.hasDungeon && [4, 7, 10, 12, 13].includes(t.locationType);
    locations.push({ name: region.mapNames[i], region: r, index: i, mapId: t.mapId, x: p.x, y: p.y,
      kind: kindNames[t.locationType] ?? 'unknown', locationType: t.locationType, locationTypeName: typeNames[t.locationType],
      dungeonType: hasDungeon ? t.dungeonType : null, dungeonFamily: hasDungeon ? dungeonNames[t.dungeonType] ?? 'Unknown' : null,
      dangerTier: hasDungeon ? rarity.DUNGEON_RARITY_TIER[t.dungeonType] ?? null : null, port, climate: maps.getClimateIndex(p.x, p.y), ...(isSettlement ? {services:servicesOf(loc,port)} : {}) });
  }
  // All region memberships are kept, even regions consisting of water or holding no locations.
  const path = outline(political, r), landPath = outline(land, r);
  let sx = 0, sy = 0, n = 0, anchor = null, best = Infinity;
  for (let j = 0; j < land.length; j++) if (land[j] === r) { sx += j % W; sy += Math.floor(j / W); n++; }
  if (n) for (let j = 0; j < land.length; j++) if (land[j] === r) {
    const x = j % W, y = Math.floor(j / W), d = (x - sx / n) ** 2 + (y - sy / n) ** 2;
    if (d < best) { best = d; anchor = [x + .5, y + .5]; }
  }
  const politicalGrid = new Uint8Array(W * H);
  for (let j = 0; j < political.length; j++) politicalGrid[j] = +(political[j] === r);
  assert.equal(pathArea(landPath), n, `Land outline area, region ${r}`);
  assert.equal(pathArea(path), politicalGrid.reduce((a,b)=>a+b,0), `Political outline area, region ${r}`);
  const politicalAnchor = zoneAnchor(politicalGrid);
  regions.push({ index: r, name: REGION_NAMES[r], path, landPath, anchor: anchor ?? politicalAnchor, landPixels: n });
}
const mask = wild.wildMaskOf(maps, W, H), ringGrid = new Uint8Array(W * H), jungleGrid = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  ringGrid[y * W + x] = wild.wildRingAt(x, y, mask);
  jungleGrid[y * W + x] = +banthaAreaHas(x, y);
}
const rings = Array.from({ length: wild.WILD_RINGS }, (_, i) => ({ ring: i + 1, name: wild.wildRingName(i + 1), lootMultiplier: wild.WILD_RING_LOOT[i], path: outline(ringGrid, i + 1), pixels: ringGrid.reduce((n, v) => n + (v === i + 1), 0) }));
for (const ring of rings) assert.equal(pathArea(ring.path), ring.pixels, `Ring ${ring.ring} outline area`);
function zoneAnchor(grid) {
  const hits = []; let sx = 0, sy = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i]) { hits.push(i); sx += i % W; sy += Math.floor(i / W); }
  let best = Infinity, point = null;
  for (const i of hits) { const x = i % W, y = Math.floor(i / W), d = (x - sx / hits.length) ** 2 + (y - sy / hits.length) ** 2; if (d < best) { best = d; point = [x + .5, y + .5]; } }
  return point;
}
const overlays = {
  openZone: { name: 'Open Zone', region: wild.WILD_REGION, anchor: zoneAnchor(mask.inside), path: outline(mask.inside, 1), nearPath: outline(mask.near, 1), nearPixels: wild.WILD_NEAR_PX,
    cut: wild.WILD_CUT, keepOutTowns: wild.WILD_KEEPOUT_TOWNS, keepOutPixels: wild.WILD_KEEPOUT_PX, rings,
    foeHealthMultiplier: wild.WILD_FOE_HEALTH_MULT, foeDamageMultiplier: wild.WILD_FOE_DAMAGE_MULT },
  jungle: { name: 'Jungle of Bantha', anchor: zoneAnchor(jungleGrid), path: outline(jungleGrid, 1), rows: BANTHA_AREA_ROWS }
};
for (const loc of locations) { loc.openZoneRing = ringGrid[loc.y * W + loc.x]; loc.jungle = !!jungleGrid[loc.y * W + loc.x]; }


function readMarkers(file) {
  const text = readFileSync(file, 'utf8');
  if (/\.md$/i.test(file)) {
    const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)```/g)];
    if (!blocks.length) throw Error(`No fenced JSON list in ${file}`);
    return JSON.parse(blocks.at(-1)[1]);
  }
  return JSON.parse(text);
}
const network = buildPathsFile(resolve(pathsDirectory), join(OUT, 'paths.json'), W, H);
const sources = {
  paths: network.attribution + '; vendor/roads-hazelnut/{road,track,river,stream}Data.bytes; src/world/road/roadNetwork.js: DIR, DIR_DELTA; src/world/road/roadPainter.js; src/systems/online/onlineLane.js: ONLINE_ROOM_MOD_KEYS',
  services: 'src/world/immersiveTravelGates.js: IT_GATE_FILE, hasCarriageGate; src/formats/mapsFile.js: _readMapPItem exterior.buildings; src/formats/blocksFile.js: readBuildingData; src/world/buildingNames.js: BUILDING_TYPES; src/systems/guild/guildFactions.js: GUILD_FACTION_IDS; src/systems/quest/place.js: _townBuildingsOfType; src/systems/merchantYards.js: isYardTown, YARD_TOWN_TYPES; src/world/merchantYards/merchantYardSites.js: yardSitesOn (placement needs free ground)',
  geography: 'src/formats/mapsFile.js: MapsFile.load, getRegion, getLocation, getRegionIndexAt, getClimateIndex, longitudeLatitudeToMapPixel, LOCATION_TYPES; src/formats/mapsTables.js: REGION_NAMES; src/formats/pakFile.js: PakFile.load; src/formats/woodsFile.js: WoodsFile.load',
  waterAndPorts: 'src/ui/overworldModel.js: isWaterPixel; src/world/terrain/terrainSampler.js: BASE_HEIGHT_SCALE, SCALED_OCEAN_ELEVATION; src/world/portSites.js: openSeaOf, portTownOnSea; src/systems/portPlaces.js: portTownByData; src/systems/travel/travelPorts.js: hasPort; src/net/fortLaw.js: seaBears, SEA_RING',
  openZone: 'src/systems/wild/wildZone.js: wildMaskOf, buildWildMask, WILD_CUT, WILD_KEEPOUT_TOWNS, WILD_KEEPOUT_PX, wildRingAt, WILD_RING_LOOT, WILD_FOE_HEALTH_MULT, WILD_FOE_DAMAGE_MULT',
  jungle: 'src/world/jungle/banthaArea.js: BANTHA_AREA_ROWS, banthaAreaHas',
  danger: 'src/systems/loot/lootRarity.js: DUNGEON_RARITY_TIER; src/formats/mapsFile.js: DUNGEON_TYPES'
};
const data = { formatVersion: 2, services: SERVICES, mapSquareKm: 0.8192, width: W, height: H, coordinates: 'Map pixels; origin northwest, x east, y south. Location icon centres add 0.5 to each coordinate.',
  provenance: { builtAt: new Date().toISOString(), sourceHashes: Object.fromEntries(['world/immersiveTravelGates.js', 'world/buildingNames.js', 'systems/guild/guildFactions.js', 'systems/merchantYards.js', 'world/merchantYards/merchantYardSites.js', 'formats/mapsFile.js', 'formats/mapsTables.js', 'formats/pakFile.js', 'formats/woodsFile.js', 'systems/wild/wildZone.js', 'world/jungle/banthaArea.js', 'systems/loot/lootRarity.js', 'world/portSites.js', 'net/fortLaw.js', 'systems/travel/travelPorts.js', 'world/terrain/terrainSampler.js', 'ui/overworldModel.js'].map(p => [p, createHash('sha256').update(source(p)).digest('hex')])), inputHashes },
  pathsFile: 'paths.json', sources, regions, locations, dungeonTypes: Object.entries(DUNGEON_TYPES).map(([name,index])=>({index,name:nameWords(name),dangerTier:rarity.DUNGEON_RARITY_TIER[index]??null})),
  locationTypes: Object.entries(LOCATION_TYPES).map(([name,index])=>({index,name})), climate: { encoding: '[row, startX, endX, value, ...]', names: CLIMATES, rows: rows(climate) }, overlays };
const samples = ['Daggerfall', "Privateer's Hold", 'Wayrest', 'Sentinel', 'Orsinium', 'Direnni Tower', 'Open Zone', 'Jungle of Bantha'].map(name => ({ name, kind: 'guide', region: '', where: 'Resolver smoke check' }));
const sampleResult = resolveMarkers(samples, data);
assert.equal(sampleResult.unresolved.length, 0, JSON.stringify(sampleResult.unresolved));
assert.equal(resolveMarkers([{ name: 'Missing test location' }], data).unresolved.length, 1);
assert.equal(resolveMarkers([{ name: 'Daggerfall', region: 'Wayrest' }], data).unresolved.length, 1);
assert.equal(resolveMarkers([{ name: 'Daggerfall', kind: 'region' }], data).resolved[0].placement, 'region anchor');
assert.equal(locations.find(l => l.name === 'Daggerfall' && l.region === 17)?.dungeonFamily, null);
const wrothgaria = locations.find(l => l.name === 'Wrothgaria');
assert(wrothgaria && !wrothgaria.openZoneRing, 'Wrothgaria must be outside Open Zone');
const defaultMarkers = join(ROOT, 'docs/25-world-regions.md');
const markerFile = markerArg ? resolve(markerArg) : existsSync(defaultMarkers) ? defaultMarkers : null;
const markerResult = markerFile ? resolveMarkers(readMarkers(markerFile), data) : { resolved: [], unresolved: [] };
if (markerFile) markerResult.inputSha256 = createHash('sha256').update(readFileSync(markerFile)).digest('hex');
const report = { checks: { outlineAreas: 'All region land and political outlines and all four rings equal source pixel counts', markerSmoke: '8/8; missing-name, wrong-region and region-anchor checks passed', wrothgaria: 'Outside Open Zone' }, counts: { regions: regions.length, locations: locations.length, ports: locations.filter(l => l.port).length }, markerFile: markerFile ? markerFile.replaceAll('\\', '/').split('/').at(-1) : null, ...markerResult, smokeChecks: sampleResult, spotChecks: sampleResult.resolved.filter(m => m.location).map(m => { const l = locations.find(l => l.region === m.location[0] && l.index === m.location[1]); return { name: l.name, region: REGION_NAMES[l.region], x: l.x, y: l.y, climate: l.climate, dungeon: l.dungeonFamily }; }) };
const settlements=locations.filter(l=>l.services);
assert.equal(settlements.length,3444,'Player settlement census changed');
assert.equal(settlements.filter(l=>l.services.carriage).length,410,'Carriage gate census changed');
assert(settlements.filter(l=>l.services.carriage).every(l=>l.kind==='city'));
const hold=locations.find(l=>l.name==="Privateer's Hold");
const nearestCarriage=settlements.filter(l=>l.services.carriage).sort((a,b)=>Math.hypot(a.x-hold.x,a.y-hold.y)-Math.hypot(b.x-hold.x,b.y-hold.y))[0];
assert.equal(nearestCarriage.name,'Chesterwark');
assert(settlements.find(l=>l.name==='Daggerfall'&&l.region===17).services.carriage);
report.services={settlements:settlements.length,counts:Object.fromEntries(SERVICES.map(([k])=>[k,settlements.filter(l=>l.services[k]).length])),nearestCarriage:{name:nearestCarriage.name,squares:Math.hypot(nearestCarriage.x-hold.x,nearestCarriage.y-hold.y)}};
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'world-map.json'), JSON.stringify(data));
writeFileSync(join(OUT, 'world-markers.json'), JSON.stringify(markerResult, null, 2));
writeFileSync(join(OUT, 'world-map-checks.json'), JSON.stringify(report, null, 2));
const html = component(data, markerResult.resolved);
// Preserve the original page budget; only the self-contained local map embeds the path asset.
assert(Buffer.byteLength(html) - Buffer.byteLength(JSON.stringify(network)) < 1_500_000, 'Component excluding path asset exceeds 1.5 MB');
assert(Buffer.byteLength(html) < 2_000_000, 'Standalone component exceeds 2 MB');
assert(!/<\/?(?:html|head|body)\b|<!doctype|\bfetch\s*\(|XMLHttpRequest|https?:\/\//i.test(html), 'Component must be inline and contain no external requests');
writeFileSync(join(OUT, 'world-map.html'), html);
for (const f of ['world-map.json', 'world-map.html', 'world-markers.json', 'paths.json']) console.log(`${f}: ${readFileSync(join(OUT, f)).length.toLocaleString()} bytes`);
console.log(`${regions.length} regions; ${locations.length} locations; ${report.counts.ports} ports. Markers: ${markerResult.resolved.length} placed, ${markerResult.unresolved.length} unresolved. Details: docs/build/world-map-checks.json`);
for (const u of markerResult.unresolved) console.warn(`Unplaced: ${u.entry.name} (${u.reason})`);
console.log(JSON.stringify(report.spotChecks, null, 2));

function component(data, markers) {
  // Short tuples keep the standalone component small. Full named records remain in world-map.json.
  const packed = { regions: data.regions.map(r => [r.name, r.landPath, r.anchor]),
    locations: data.locations.map(l => [l.name, l.region, l.x, l.y, l.kind, l.dungeonFamily, l.dangerTier, +l.port, l.openZoneRing, +l.jungle, l.services ? SERVICES.reduce((n,[k],i)=>n+(l.services[k]?2**i:0),0) : null, l.mapId >>> 0]),
    services: SERVICES, mapSquareKm: data.mapSquareKm, zone: data.overlays.openZone, jungle: data.overlays.jungle, markers };
  const safeJSON = JSON.stringify(packed).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const dark = '--bg:#17252d;--fg:#e3e9e6;--surface:#20323b;--panel:#293f49;--muted:#b1c3c7;--line:#526c76;--accent:#dbc58d;--sea:#89c8bd;--focus:#91d9e6;--map-road:#e7b779;--map-water:#182f40;--map-land:#43554b;--map-land-alt:#4c5b4d;--map-low:#a4dbc4;--map-mid:#f0ce80;--map-high:#eea982;--map-deadly:#f59fbe;--map-ring1:#8b5658;--map-ring2:#a14e5c;--map-ring3:#b44461;--map-ring4:#cc3e6b;--map-jungle:#427e66;--map-halo:#17252d;color-scheme:dark';
  return `<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
.world-map{--bg:#edf0ef;--fg:#24343e;--surface:#fafcfb;--panel:#e2e8e7;--muted:#50636a;--line:#a8b8bb;--accent:#715618;--sea:#286b68;--focus:#076f83;--map-road:#8a501e;--map-water:#d0e4e8;--map-land:#d8ddc9;--map-land-alt:#e0dfca;--map-low:#175747;--map-mid:#76510b;--map-high:#923c1a;--map-deadly:#861b4b;--map-ring1:#e9b4aa;--map-ring2:#d99392;--map-ring3:#c97284;--map-ring4:#ad536d;--map-jungle:#8dbb97;--map-halo:#fafcfb;color-scheme:light}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) .world-map{${dark}}}
:root[data-theme="dark"] .world-map{${dark}}
.world-map,.world-map *{box-sizing:border-box}.world-map{font:15px/1.45 'Segoe UI',sans-serif;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;max-width:1160px;min-width:0;margin:16px auto}.world-map h2{font-size:26px;line-height:1.1;margin:0}.map-head{padding:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.map-head p{margin:6px 0 0;color:var(--muted)}.world-map button,.world-map input{font:inherit;color:var(--fg);background:var(--surface);border:1px solid var(--line);border-radius:6px;min-height:44px}.world-map button{padding:8px 13px;cursor:pointer}.world-map :focus-visible{outline:3px solid var(--focus);outline-offset:2px}.map-search{flex:1;max-width:390px;min-width:180px}.map-search input{width:100%;padding:10px}.map-results{display:grid;gap:3px;max-height:240px;overflow:auto;margin-top:4px}.map-results:empty{display:none}.map-results button{text-align:left;overflow-wrap:anywhere}.map-services{padding:14px 20px;border-top:1px solid var(--line)}.map-services p{font-size:14px;margin:8px 0;max-width:none}.map-chips,.map-near{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.map-chips [aria-pressed="true"]{background:var(--accent);color:var(--surface)}.world-map select{font:inherit;max-width:100%;min-height:44px;background:var(--surface);color:var(--fg);border:1px solid var(--line)}.map-nearest-results{display:grid;gap:5px}.map-nearest-results button{text-align:left}.map-near{margin-top:14px}.map-near label{display:flex;gap:8px;align-items:center}.map-stage{position:relative;background:var(--map-water);height:clamp(370px,62vw,600px);overflow:hidden}.map-stage canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}.map-stage canvas:active{cursor:grabbing}.map-tools{position:absolute;top:12px;left:12px;display:flex;gap:5px;flex-wrap:wrap}.map-tools button{background:var(--surface);font-weight:650}.map-scale{position:absolute;bottom:8px;left:12px;background:var(--surface);border-radius:5px;padding:4px 8px;font-size:12px;pointer-events:none}.map-detail{border-top:1px solid var(--line);padding:14px 20px;min-height:88px;background:var(--panel);overflow-wrap:anywhere}.map-detail strong{font-size:18px}.map-detail p{margin:4px 0}.map-layers{padding:12px 20px;display:flex;flex-wrap:wrap;gap:7px 18px;border-top:1px solid var(--line)}.map-layers label{display:flex;align-items:center;gap:6px;min-height:36px}.map-layers input{min-height:20px;width:19px;height:19px;accent-color:var(--sea)}.map-legend{padding:10px 20px;display:flex;flex-wrap:wrap;gap:8px 16px;font-size:13px;color:var(--muted)}.map-legend span{display:inline-flex;align-items:center;gap:5px}.map-legend svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.5}.map-foot{padding:0 20px 16px;font-size:12px;color:var(--muted)}.map-foot p{margin:7px 0}.map-foot a{color:var(--sea)}.map-low{color:var(--map-low)}.map-mid{color:var(--map-mid)}.map-high{color:var(--map-high)}.map-deadly{color:var(--map-deadly)}.map-rings{display:flex;gap:12px;flex-wrap:wrap;padding:0 20px 12px;font-size:13px}.map-rings i{display:inline-block;width:13px;height:13px;margin-right:4px;background:var(--map-ring1)}.map-rings span:nth-child(2) i{background:var(--map-ring2)}.map-rings span:nth-child(3) i{background:var(--map-ring3)}.map-rings span:nth-child(4) i{background:var(--map-ring4)}
.map-path-key{display:inline-block;width:22px;border-top:2px solid var(--map-road)}.map-path-tracks{border-top-width:1px;border-top-style:dashed}.map-path-rivers{border-color:var(--sea);border-top-width:3px}.map-path-streams{border-color:var(--sea);border-top-width:1px}
.map-hover{position:fixed;z-index:90;pointer-events:none;width:min(370px,calc(100vw - 32px));background:var(--surface);color:var(--fg);border:1px solid var(--line);border-top:3px solid var(--sea);box-shadow:0 10px 35px #0003;padding:16px;font-size:14px;line-height:1.45}.map-hover[hidden]{display:none}.map-hover strong{display:block;color:var(--accent);font-size:20px;margin-bottom:7px}.map-hover p{margin:0}
@media(max-width:500px){.map-head{padding:14px}.map-search{max-width:none;flex-basis:100%}.map-stage{height:440px}.map-layers{padding:10px 14px;gap:5px 12px;font-size:13px}.map-detail{padding:12px 14px}.map-foot,.map-legend{padding-left:14px;padding-right:14px}}
@media(prefers-reduced-motion:reduce){.world-map *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
<section class="world-map" aria-label="Interactive Iliac Bay map">
<div class="map-head"><div><h2>The Iliac Bay</h2><p>Find a place. Read the ground before you go.</p></div><div class="map-search"><label>Search places or regions<input type="search" placeholder="Daggerfall, Wayrest, a dungeon&hellip;" autocomplete="off" aria-label="Search places or regions"></label><div class="map-results" aria-live="polite"></div></div></div>
<div class="map-services"><strong>Find a service</strong><p>Choose services to show places with <b>all</b> selected services. Matching places remain visible at every zoom.</p><div class="map-chips">${SERVICES.map(([k,n,why])=>`<button type="button" data-service="${k}" aria-pressed="false" title="${why}">${n}</button>`).join('')}<button type="button" data-clear>Clear filters</button></div><p class="map-service-note" aria-live="polite">Select a service to read what it is good for.</p><details><summary>What each service is good for</summary>${SERVICES.map(([,n,why])=>`<p><b>${n}:</b> ${why}</p>`).join('')}</details><div class="map-near"><span class="map-origin">Nearest to: search and select a place above.</span><label>Service <select aria-label="Nearest service">${SERVICES.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label><button type="button" data-nearest>Find nearest</button></div><p>Straight-line distances, not road routes or safe journeys. 1 map square = 819.2 m. Yards mark eligible towns, not verified free ground. Buildings are the installed base records; replacements can differ.</p><div class="map-nearest-results" aria-live="polite"></div><p><em>Sources: src/world/immersiveTravelGates.js (hasCarriageGate, IT_GATE_FILE); src/formats/mapsFile.js (exterior.buildings); src/formats/blocksFile.js (readBuildingData); src/world/buildingNames.js (BUILDING_TYPES); src/systems/guild/guildFactions.js (GUILD_FACTION_IDS); src/systems/quest/place.js (_townBuildingsOfType); src/systems/merchantYards.js (isYardTown); src/world/merchantYards/merchantYardSites.js (yardSitesOn); src/world/terrain/terrainSampler.js (TERRAIN_SIZE).</em></p></div>
<div class="map-stage"><canvas tabindex="0" role="img" aria-label="Iliac Bay. Drag to pan; wheel or pinch to zoom. Arrow keys pan; plus and minus zoom. Search provides keyboard access to every place."></canvas><div class="map-tools"><button type="button" data-action="in" aria-label="Zoom in">+</button><button type="button" data-action="out" aria-label="Zoom out">&minus;</button><button type="button" data-action="reset" aria-label="Show the whole Bay">Whole Bay</button></div><span class="map-scale"></span></div>
<div class="map-detail" aria-live="polite"><strong>Explore the Bay</strong><p>Search any place, or zoom in and tap an icon. Smaller places appear as you zoom.</p></div>
<div class="map-layers" aria-label="Map layers">${[['roads','Roads and tracks'],['waterways','Rivers and streams'],['settlements','Settlements'],['other','Temples & other sites'],['ports','Ports'],['low','Dungeons 3-5'],['mid','Dungeons 6-9'],['high','Dungeons 10-14'],['deadly','Dungeons 15-18'],['zones','DFO zones'],['labels','Region names'],['markers','Guide markers']].map(([key,label])=>`<label><input type="checkbox" data-layer="${key}" checked>${label}</label>`).join('')}</div>
<div class="map-rings">${rings.map(r=>`<span><i></i>${r.name}: +${Math.round((r.lootMultiplier-1)*100)}% loot</span>`).join('')}</div>
<div class="map-legend">${[['roads','Roads'],['tracks','Tracks'],['rivers','Rivers'],['streams','Streams']].map(([key,label])=>`<span><i class="map-path-key map-path-${key}" aria-hidden="true"></i>${label}</span>`).join('')}${[['City','M-7,6V-5H-4V-8H-1V-5H2V-8H5V-5H7V6ZM-2,6V1H2V6'],['Village / hamlet','M-7,0L0,-7L7,0M-5,-2V6H5V-2'],['Temple','M-7,6H7M-6,-3L0,-7L6,-3ZM-4,-3V6M4,-3V6'],['Port','M0,-7V6M-6,1Q-6,7 0,7Q6,7 6,1M-4,-3H4'],['Dungeon | family glyph','M-7,6Q-7,-6 0,-7Q7,-6 7,6ZM-2,6V0H2V6'],['Guide point','M0,-8L2,-2L8,0L2,2L0,8L-2,2L-8,0L-2,-2Z']].map(([label,path])=>`<span><svg viewBox="-10 -10 20 20" aria-hidden="true"><path d="${path}"/></svg>${label}</span>`).join('')}<span class="map-low">Tier 3-5</span><span class="map-mid">Tier 6-9</span><span class="map-high">Tier 10-14</span><span class="map-deadly">Tier 15-18</span></div>
<div class="map-foot"><p class="map-attribution">${network.attribution}</p><p>Static online geography. No live players, spawned dungeons, events or guild harbours. Dungeon colour is the base type tier; Open Zone danger applies on top. The Open Zone base is x${data.overlays.openZone.foeHealthMultiplier} foe health and x${data.overlays.openZone.foeDamageMultiplier} damage; ring factors raise this to x5 through x8 overall. The dashed line shows the map concealment band, ${data.overlays.openZone.nearPixels} map pixels beyond the zone. Green ground marks the Jungle of Bantha. Port anchors mark coastal towns, not individual docks.</p><p>Search includes all source locations. TownCity is shown as city; TownHamlet as town / hamlet. Layers can force detail on at any zoom after being toggled off and on. The map is drawn from geographic data with original symbols. No game artwork is included. Build data remains local.</p><details><summary>Map sources</summary><p><em>Sources: ${sources.paths}.</em></p><p><em>Sources: src/formats/mapsFile.js (MapsFile, longitudeLatitudeToMapPixel, LOCATION_TYPES); mapsTables.js (REGION_NAMES); pakFile.js (PakFile); woodsFile.js (WoodsFile).</em></p><p><em>Sources: src/ui/overworldModel.js (isWaterPixel); src/world/portSites.js (openSeaOf, portTownOnSea); src/net/fortLaw.js (seaBears); src/systems/travel/travelPorts.js (hasPort).</em></p><p><em>Sources: src/systems/wild/wildZone.js (wildMaskOf, buildWildMask, WILD_CUT, WILD_KEEPOUT_TOWNS, wildRingAt, WILD_RING_LOOT, WILD_NEAR_PX, WILD_FOE_HEALTH_MULT, WILD_FOE_DAMAGE_MULT).</em></p><p><em>Sources: src/world/jungle/banthaArea.js (BANTHA_AREA_ROWS, banthaAreaHas); src/systems/loot/lootRarity.js (DUNGEON_RARITY_TIER).</em></p></details><p>Progression and travel advice: <a href="23-playing-online.html">the online guide</a>. Recent additions: <a href="24-whats-new-2026-10.md">what's new</a>.</p></div>
<script type="application/json" class="map-path-data">${JSON.stringify(network)}</script>
<script type="application/json" class="map-data">${safeJSON}</script>
<script>(${browserMap.toString()})(document.currentScript.closest('.world-map'), ${createPathLayers.toString()}, ${strokePathLayers.toString()});</script>
</section>`;
}

function browserMap(root, createPathLayers, strokePathLayers) {
  const networkPaths = createPathLayers(JSON.parse(root.querySelector('.map-path-data').textContent));
  const data = JSON.parse(root.querySelector('.map-data').textContent);
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
  const search = root.querySelector('input[type=search]'), results = root.querySelector('.map-results'), detail = root.querySelector('.map-detail');
  const regions = data.regions.map(([name,path,anchor])=>({name,path:new Path2D(path),anchor}));
  const locations = data.locations.map(([name,region,x,y,kind,family,tier,port,ring,jungle,services,mapId])=>({name,region,x:x+.5,y:y+.5,kind,family,tier,port,ring,jungle,services,mapId}));
  const zonePaths = data.zone.rings.map(r=>new Path2D(r.path));
  const junglePath = new Path2D(data.jungle.path), nearPath = new Path2D(data.zone.nearPath);
  const layer = Object.fromEntries([...root.querySelectorAll('[data-layer]')].map(e=>[e.dataset.layer,e.checked]));
  let markers = data.markers, selected = null, width = 0, height = 0, zoom = 1, cx = 500, cy = 250, hits = [], colours;
  const activeServices=new Set(), forcedLayers=new Set(); let origin=null, nearest=[];
  // All hover text comes from the same extracted place records as the tap detail panel.
  const hover=document.createElement('div');hover.className='map-hover';hover.hidden=true;
  hover.setAttribute('role','tooltip');hover.id='map-hover-card';root.append(hover);
  function hoverCard(l,x,y,control=canvas){
    const linked=l.kind!=='region'&&l.placement!=='region anchor'?locations.find(p=>p.x===l.x&&p.y===l.y&&(p.name===(l.resolvedAs??l.name)||p.name+' port'===l.name)):null;
    const p=linked??l,lines=[];
    lines.push(p.family?p.family+' dungeon · danger tier '+(p.tier??'unconfirmed'):(p.kind??'Guide marker').replaceAll('_',' '));
    if(p.region!=null)lines.push(regions[p.region]?.name??p.region);
    if(p.services!=null)lines.push('Services: '+(data.services.filter(([k])=>hasService(p,k)).map(s=>s[1]).join(', ')||'none recorded'));
    if(p.port)lines.push('Port');if(p.ring)lines.push('Open Zone: '+data.zone.rings[p.ring-1].name);if(p.jungle)lines.push('Jungle of Bantha');
    if(l.name===data.zone.name||l.resolvedAs===data.zone.name)lines.push('Open PvP · stronger foes · four loot rings');
    if(l.name===data.jungle.name||l.resolvedAs===data.jungle.name)lines.push('Jungle on the southeastern Bay shore');
    if(l.where&&!/(?:src|bible|server|planner)\//.test(String(l.where)))lines.push(String(l.where).split(/\n/)[0]);
    hover.replaceChildren();const title=document.createElement('strong'),text=document.createElement('p');title.textContent=l.name;text.textContent=lines.join(' · ');hover.append(title);hover.append(text);hover.hidden=false;
    const r=hover.getBoundingClientRect();hover.style.left=Math.max(16,Math.min(x+14,innerWidth-r.width-16))+'px';hover.style.top=Math.max(16,Math.min(y+16,innerHeight-r.height-16))+'px';
    control.setAttribute('aria-describedby',hover.id);
  }
  function hideHover(){hover.hidden=true;root.querySelectorAll('[aria-describedby="map-hover-card"]').forEach(n=>n.removeAttribute('aria-describedby'));}
  function hoverButton(button,l){button.addEventListener('focus',()=>{const r=button.getBoundingClientRect();hoverCard(l,r.left,r.bottom,button);});button.addEventListener('blur',hideHover);button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')hoverCard(l,e.clientX,e.clientY,button);});button.addEventListener('pointerleave',hideHover);}
  window.addEventListener('scroll',hideHover,{passive:true});
  root.addEventListener('keydown',e=>{if(e.key==='Escape')hideHover();});
  let queued = false;
  const request = () => { if (!queued) { queued=true; requestAnimationFrame(()=>{queued=false;draw();}); } };
  const css = name => getComputedStyle(root).getPropertyValue(name).trim();
  const scale = () => Math.min(width/1000,height/500)*zoom;
  const screen = (x,y) => [(x-cx)*scale()+width/2,(y-cy)*scale()+height/2];
  const world = (x,y) => [(x-width/2)/scale()+cx,(y-height/2)/scale()+cy];
  const tierKey = tier => tier<=5?'low':tier<=9?'mid':tier<=14?'high':'deadly';
  const glyphs = {
    city:'M-6,5V-4H-4V-7H-1V-4H2V-7H5V-4H6V5ZM-2,5V0H2V5',
    village:'M-6,0L0,-6L6,0M-4,-2V5H4V-2',hamlet:'M-5,0L0,-5L5,0M-3,-2V4H3V-2',
    temple:'M-6,5H6M-5,-3L0,-6L5,-3ZM-3,-3V5M3,-3V5',
    port:'M0,-6V5M-5,0Q-5,6 0,6Q5,6 5,0M-4,-3H4',
    other:'M0,-5L5,0L0,5L-5,0Z',guide:'M0,-9L2,-2L9,0L2,2L0,9L-2,2L-9,0L-2,-2Z',
    cave:'M-6,5Q-5,-6 0,-6Q5,-6 6,5ZM-2,5V0H2V5',
    keep:'M-6,5V-5H-3V-2H3V-5H6V5ZM-1,5V1H1V5',
    orc:'M-6,5V-5H-3V-2H3V-5H6V5ZM-3,1L-1,4L0,1L1,4L3,1',
    human:'M-6,5V-3H6V5ZM0,-3V-8L5,-6L0,-5',
    barbarian:'M-5,-6L5,6M5,-6L-5,6M-5,-6L-7,-2L-2,-3M5,-6L7,-2L2,-3',
    giant:'M-6,6V-3H-3V-8H3V-3H6V6ZM-1,6V1H1V6',
    ruin:'M-6,5V-5L-2,-2L0,-5L1,1L6,-2V5ZM-2,5V2H1V5',
    crypt:'M-6,5H6M-4,5V-2Q0,-7 4,-2V5M0,-2V3M-2,0H2',
    spider:'M-6,-5L6,5M6,-5L-6,5M-6,0H6M0,-6V6',
    scorpion:'M-5,5L-2,1L-5,-2M5,5L2,1L5,-2M-2,1H2V-4Q2,-8 -3,-6L-1,-4',
    harpy:'M-7,-4L-3,3L0,-1L3,3L7,-4L3,-2L0,-6L-3,-2Z',
    cemetery:'M-6,5H6M-5,4V-2H-2V4M1,4V-5H5V4',
    dragon:'M-6,5L-3,-6L0,0L3,-6L6,5L0,2Z',
    cult:'M0,-6L6,5H-6ZM0,-1V2M0,4V4.2',
    vampire:'M-7,-4L0,-1L7,-4L4,4L0,1L-4,4Z',
    laboratory:'M-2,-6H2M-1,-6V-1L-5,5H5L1,-1V-6M-3,2H3',
    prison:'M-5,-5H5V5H-5ZM-2,-5V5M2,-5V5',
    mine:'M-6,-3Q0,-7 6,-3M0,-5L-3,6',
    volcano:'M-7,6L-2,-3L2,-3L7,6ZM0,-5V-8M-4,-5L-6,-7M4,-5L6,-7',
    tavern:'M-5,-4H3V5H-5ZM3,-2H6V2H3M-6,6H5',
    farm:'M-6,6V-2L0,-7L6,-2V6ZM-2,6V1H2V6M-5,-1H5',
    home:'M-6,0L0,-6L6,0M-4,-2V5H4V-2M0,5V1H2',
    ship:'M-7,3H7L4,6H-4ZM0,3V-7L6,1H0'
  };
  const paths = Object.fromEntries(Object.entries(glyphs).map(([k,p])=>[k,new Path2D(p)]));
  function familyGlyph(f) {
    if (/Cemetery/.test(f)) return 'cemetery';
    if (/Crypt/.test(f)) return 'crypt';
    if (/Spider/.test(f)) return 'spider';
    if (/Scorpion/.test(f)) return 'scorpion';
    if (/Harpy/.test(f)) return 'harpy';
    if (/Dragon/.test(f)) return 'dragon';
    if (/Volcanic/.test(f)) return 'volcano';
    if (/Mine/.test(f)) return 'mine';
    if (/Cave/.test(f)) return 'cave';
    if (/Temple|Coven/.test(f)) return 'cult';
    if (/Vampire/.test(f)) return 'vampire';
    if (/Laboratory/.test(f)) return 'laboratory';
    if (/Prison/.test(f)) return 'prison';
    if (/Orc/.test(f)) return 'orc';
    if (/Human/.test(f)) return 'human';
    if (/Barbarian/.test(f)) return 'barbarian';
    if (/Giant/.test(f)) return 'giant';
    if (/Ruined/.test(f)) return 'ruin';
    return 'keep';
  }
  function icon(key,x,y,colour,size=1) {
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.lineWidth=3.5;ctx.strokeStyle=colours.halo;ctx.lineJoin='round';ctx.stroke(paths[key]??paths.other);ctx.lineWidth=1.5;ctx.strokeStyle=colour;ctx.stroke(paths[key]??paths.other);ctx.restore();
  }
  const hasService=(l,k)=>l.services!=null&&!!(l.services&(2**data.services.findIndex(s=>s[0]===k)));
  function visible(l) {
    if(activeServices.size)return [...activeServices].every(k=>hasService(l,k));
    if(l===selected||nearest.includes(l))return true;
    if(l.port&&layer.ports&&(zoom>=3||forcedLayers.has('ports')))return true;
    if(l.family)return layer[tierKey(l.tier)]&&(zoom>=6||forcedLayers.has(tierKey(l.tier)));
    if(['city','hamlet','village'].includes(l.kind))return layer.settlements&&(forcedLayers.has('settlements')||zoom>=(l.kind==='city'?1:l.kind==='hamlet'?3:6));
    return layer.other&&(zoom>=6||forcedLayers.has('other'));
  }
  function draw() {
    if (!width || !height) return;
    colours={halo:css('--map-halo'),fg:css('--fg'),muted:css('--muted'),accent:css('--accent'),line:css('--line'),sea:css('--sea')};
    ctx.clearRect(0,0,width,height);ctx.fillStyle=css('--map-water');ctx.fillRect(0,0,width,height);
    const s=scale();ctx.save();ctx.translate(width/2-cx*s,height/2-cy*s);ctx.scale(s,s);
    regions.forEach((r,i)=>{ctx.fillStyle=css(i%2?'--map-land':'--map-land-alt');ctx.fill(r.path,'evenodd');ctx.strokeStyle=colours.line;ctx.lineWidth=.65/s;ctx.stroke(r.path);});
    if(layer.zones){ctx.fillStyle=css('--map-jungle');ctx.fill(junglePath,'evenodd');zonePaths.forEach((p,i)=>{ctx.fillStyle=css('--map-ring'+(i+1));ctx.fill(p,'evenodd');ctx.strokeStyle=css('--map-deadly');ctx.lineWidth=.8/s;ctx.stroke(p);});ctx.strokeStyle=css('--map-high');ctx.lineWidth=1/s;ctx.setLineDash([4/s,4/s]);ctx.stroke(nearPath);ctx.setLineDash([]);}
    strokePathLayers(ctx, networkPaths, layer, s, css('--map-road'), colours.sea);
    ctx.restore();hits=[];
    const labelBoxes=[];
    if(layer.labels) regions.forEach(r=>{if(!r.anchor)return;const [x,y]=screen(...r.anchor);if(x<10||x>width-10||y<14||y>height-10)return;ctx.font='600 '+(zoom<2?10:12)+'px Segoe UI,sans-serif';const tw=ctx.measureText(r.name).width;const b=[x-tw/2,y-7,x+tw/2,y+7];if(labelBoxes.some(a=>b[0]<a[2]+4&&b[2]>a[0]-4&&b[1]<a[3]+4&&b[3]>a[1]-4))return;labelBoxes.push(b);ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=colours.halo;ctx.strokeText(r.name,x,y);ctx.fillStyle=colours.muted;ctx.fillText(r.name,x,y);});
    const occupied=new Set();
    for(const l of locations){if(!visible(l))continue;const [x,y]=screen(l.x,l.y);if(x< -10||y< -10||x>width+10||y>height+10)continue;const gap=zoom<3?54:zoom<6?28:15;const cell=Math.floor(x/gap)+','+Math.floor(y/gap);if(occupied.has(cell)&&l!==selected&&zoom<12)continue;occupied.add(cell);let colour=l.family?css('--map-'+tierKey(l.tier)):colours.fg;const key=l.port&&layer.ports?'port':l.family?familyGlyph(l.family):({'wealthy home':'home',cult:'cult',coven:'cult',graveyard:'cemetery'}[l.kind]??l.kind);icon(key,x,y,colour,l===selected?1.4:zoom<3?.65:.85);hits.push({x,y,l});}
    if(layer.zones)for(const [z,key]of [[data.zone,'cult'],[data.jungle,'other']]){const[x,y]=screen(...z.anchor);icon(key,x,y,colours.accent,1.4);hits.push({x,y,l:{...z,x:z.anchor[0],y:z.anchor[1],kind:'DFO zone'}});}
    if(layer.markers&&!activeServices.size){const pinCells=new Set();for(const m of markers){if(zoom<3&&(m.placement==='region anchor'||m.kind==='port_network'))continue;const[x,y]=screen(m.x,m.y);if(x<0||y<0||x>width||y>height)continue;const cell=Math.floor(x/18)+','+Math.floor(y/18);if(zoom<5&&pinCells.has(cell))continue;pinCells.add(cell);icon('guide',x,y,colours.accent,zoom<2?.7:1.1);hits.push({x,y,l:m});}}
    for(const l of nearest){const[x,y]=screen(l.x,l.y);ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.strokeStyle=colours.sea;ctx.lineWidth=3;ctx.stroke();}
    if(selected){const[x,y]=screen(selected.x,selected.y);ctx.beginPath();ctx.arc(x,y,15,0,Math.PI*2);ctx.lineWidth=2;ctx.strokeStyle=colours.accent;ctx.stroke();}
    root.querySelector('.map-scale').textContent='N up | '+zoom.toFixed(1)+'x | '+Math.round(width/s)+' map pixels across';
  }
  function show(l,centre=false){
    selected=l;origin=l;root.querySelector('.map-origin').textContent='Nearest to: '+l.name;if(centre){cx=l.x;cy=l.y;zoom=Math.max(zoom,8);}
    const linked=l.kind!=='region'&&l.placement!=='region anchor'?locations.find(p=>p.x===l.x&&p.y===l.y&&(p.name===(l.resolvedAs??l.name)||p.name+' port'===l.name)):null;
    const place=linked??l;
    detail.replaceChildren();const title=document.createElement('strong');title.textContent=l.name;detail.append(title);
    const lines=[];if(place.region!=null)lines.push(regions[place.region]?.name??place.region);
    lines.push(place.family?place.family+' dungeon | danger tier '+(place.tier??'unconfirmed'):place.kind??'Guide point');
    if(place.services!=null)lines.push('Services: '+data.services.filter(([k])=>hasService(place,k)).map(s=>s[1]).join(', '));
    if(place.port)lines.push('Coastal port');if(place.ring)lines.push('Open Zone | '+data.zone.rings[place.ring-1].name);if(place.jungle)lines.push('Jungle of Bantha');
    if(l.name===data.zone.name||l.resolvedAs===data.zone.name)lines.push('Open PvP | four loot rings | stronger foes');
    lines.push('Map pixel '+Math.floor(l.x)+', '+Math.floor(l.y));
    const p=document.createElement('p');p.textContent=lines.join(' | ');detail.append(p);
    if(l.kind==='region'||l.placement==='region anchor'){const link=document.createElement('a');link.href='#regions';link.dataset.ref='regions';link.textContent='Read The World, Region by Region';if(document.getElementById('regions'))detail.append(link);}
    if(l.where){const note=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');summary.textContent='Guide marker note';text.textContent=typeof l.where==='string'?l.where:JSON.stringify(l.where);note.append(summary,text);detail.append(note);}
    hideHover();
    root.dispatchEvent(new CustomEvent('place-selected',{detail:{...place,regionName:regions[place.region]?.name}}));
    request();
  }
  function zoomAt(f,x=width/2,y=height/2){const before=world(x,y);zoom=Math.max(1,Math.min(48,zoom*f));const after=world(x,y);cx+=before[0]-after[0];cy+=before[1]-after[1];request();}
  const reset=()=>{cx=500;cy=250;zoom=1;request();};
  root.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>b.dataset.action==='reset'?reset():zoomAt(b.dataset.action==='in'?1.6:1/1.6)));
  root.querySelectorAll('[data-layer]').forEach(e=>e.addEventListener('change',()=>{layer[e.dataset.layer]=e.checked;if(e.checked)forcedLayers.add(e.dataset.layer);else forcedLayers.delete(e.dataset.layer);request();}));
  const note=root.querySelector('.map-service-note');
  function filtersChanged(){
    root.querySelectorAll('[data-service]').forEach(b=>b.setAttribute('aria-pressed',String(activeServices.has(b.dataset.service))));
    const count=locations.filter(l=>[...activeServices].every(k=>hasService(l,k))&&l.services!=null).length;
    note.textContent=activeServices.size?count+' matching settlements. '+data.services.filter(([k])=>activeServices.has(k)).map(([,n,why])=>n+': '+why).join(' '):'Select a service to read what it is good for.';
    request();
  }
  root.querySelectorAll('[data-service]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.service;activeServices.has(k)?activeServices.delete(k):activeServices.add(k);filtersChanged();}));
  root.querySelector('[data-clear]').addEventListener('click',()=>{activeServices.clear();nearest=[];root.querySelector('.map-nearest-results').replaceChildren();filtersChanged();});
  root.querySelector('[data-nearest]').addEventListener('click',()=>{
    const out=root.querySelector('.map-nearest-results');out.replaceChildren();
    if(!origin){out.textContent='Search and select a starting place first.';search.focus();return;}
    const k=root.querySelector('select').value;
    nearest=locations.filter(l=>hasService(l,k)).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y)).slice(0,5);
    activeServices.clear();activeServices.add(k);filtersChanged();
    const source=origin;
    for(const l of nearest){const dx=l.x-source.x,dy=l.y-source.y,d=Math.hypot(dx,dy),direction=d===0?'here':['N','NE','E','SE','S','SW','W','NW'][Math.round(Math.atan2(dx,-dy)/(Math.PI/4)+8)%8];const b=document.createElement('button');b.type='button';b.textContent=l.name+' ('+regions[l.region].name+') - '+d.toFixed(1)+' map squares / '+(d*data.mapSquareKm).toFixed(1)+' km '+direction;b.addEventListener('click',()=>{show(l,true);origin=source;root.querySelector('.map-origin').textContent='Nearest to: '+source.name;});out.append(b);}
    cx=source.x;cy=source.y;zoom=5;request();
  });
  canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  const pointers=new Map();let moved=false,start=null;
  const local=e=>{const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];};
  canvas.addEventListener('pointerdown',e=>{hideHover();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,local(e));start=local(e);moved=false;});
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||pointers.size)return;
    const p=local(e);let best=null,d=18;for(const h of hits){const n=Math.hypot(p[0]-h.x,p[1]-h.y);if(n<d){d=n;best=h.l;}}
    if(!best&&layer.zones){const w=world(...p);if(areaHit(new Path2D(data.zone.path),w))best={...data.zone,kind:'DFO zone'};else if(areaHit(junglePath,w))best={...data.jungle,kind:'DFO zone'};}
    if(best)hoverCard(best,e.clientX,e.clientY);else hideHover();
  });
  canvas.addEventListener('pointerleave',hideHover);
  canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=[...pointers.values()],prev=pointers.get(e.pointerId),p=local(e);pointers.set(e.pointerId,p);if(Math.hypot(p[0]-start[0],p[1]-start[1])>5)moved=true;if(pointers.size===1){cx-=(p[0]-prev[0])/scale();cy-=(p[1]-prev[1])/scale();}else{moved=true;const now=[...pointers.values()],dist=a=>Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);const a=[(old[0][0]+old[1][0])/2,(old[0][1]+old[1][1])/2],b=[(now[0][0]+now[1][0])/2,(now[0][1]+now[1][1])/2];if(dist(old)>0)zoomAt(dist(now)/dist(old),...a);cx-=(b[0]-a[0])/scale();cy-=(b[1]-a[1])/scale();}request();});
  function areaHit(path,point){ctx.save();ctx.setTransform(1,0,0,1,0,0);const hit=ctx.isPointInPath(path,...point,'evenodd');ctx.restore();return hit;}
  canvas.addEventListener('pointerup',e=>{const p=local(e);if(!moved&&pointers.size===1){let best=null,d=20;for(const h of hits){const n=Math.hypot(p[0]-h.x,p[1]-h.y);if(n<d){d=n;best=h;}}if(best)show(best.l);else if(layer.zones){const w=world(...p);if(areaHit(new Path2D(data.zone.path),w))show({...data.zone,x:w[0],y:w[1],kind:'DFO zone'});else if(areaHit(junglePath,w))show({...data.jungle,x:w[0],y:w[1],kind:'DFO zone'});}}pointers.delete(e.pointerId);});
  canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));
  canvas.addEventListener('keydown',e=>{const step=60/scale();if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')cx-=step;if(e.key==='ArrowRight')cx+=step;if(e.key==='ArrowUp')cy-=step;if(e.key==='ArrowDown')cy+=step;if(['+','='].includes(e.key))zoomAt(1.6);if(e.key==='-')zoomAt(1/1.6);if(e.key==='Home')reset();request();});
  const normalize=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  search.addEventListener('input',()=>{hideHover();results.replaceChildren();const q=normalize(search.value);if(q.length<2)return;const candidates=[...locations,...[data.zone,data.jungle].map(z=>({...z,x:z.anchor[0],y:z.anchor[1],kind:'DFO zone'})),...regions.filter(r=>r.anchor).map(r=>({name:r.name,x:r.anchor[0],y:r.anchor[1],kind:'region'}))];const found=candidates.filter(l=>normalize(l.name).includes(q)).sort((a,b)=>(normalize(a.name)!==q)-(normalize(b.name)!==q)).slice(0,20);for(const l of found){const b=document.createElement('button');b.type='button';b.textContent=l.name+' | '+(l.region!=null?regions[l.region].name:l.kind);hoverButton(b,l);b.addEventListener('click',()=>{hideHover();show(l,true);results.replaceChildren();canvas.focus();});results.append(b);}if(!found.length)results.textContent='No matching places.';});
  search.addEventListener('keydown',e=>{if(e.key==='Enter'){results.querySelector('button')?.click();e.preventDefault();}if(e.key==='Escape')results.replaceChildren();});
  // Embedding contract: root.setMarkers(list) resolves exact names; root.setResolvedMarkers(list) accepts build output.
  // Both return unresolved entries so the guide can report missing/ambiguous pins.
  root.setResolvedMarkers=list=>{markers=list.filter(m=>Number.isFinite(m.x)&&Number.isFinite(m.y));request();return list.filter(m=>!markers.includes(m));};
  root.setMarkers=list=>{
    const pins=[],unresolved=[];
    for(const m of list){
      const n=normalize(m.name);
      const z=[data.zone,data.jungle].find(z=>normalize(z.name)===n||normalize('The '+z.name)===n||(m.kind==='open_zone'&&z===data.zone&&n===normalize(regions[z.region].name)));
      if(z){pins.push({...m,x:z.anchor[0],y:z.anchor[1]});continue;}
      if(m.kind==='region'){const r=regions.find(r=>normalize(r.name)===n);if(r?.anchor)pins.push({...m,x:r.anchor[0],y:r.anchor[1]});else unresolved.push(m);continue;}
      if(m.kind==='port_network'&&n==='iliacbayports'){for(const l of locations.filter(l=>l.port))pins.push({...m,name:l.name+' port',x:l.x,y:l.y});continue;}
      const matches=locations.filter(l=>(normalize(l.name).replace(/^the/,'')===n.replace(/^the/,''))&&(m.region==null||m.region===''||String(l.region)===String(m.region)||normalize(regions[l.region].name)===normalize(m.region)));
      if(matches.length===1)pins.push({...m,x:matches[0].x,y:matches[0].y});else unresolved.push(m);
    }
    markers=pins;request();return unresolved;
  };
  new ResizeObserver(()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);request();}).observe(canvas);
  new MutationObserver(request).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',request);
}

}
