#!/usr/bin/env node
// Local town layouts from the player's own ARENA2; never reads game artwork.
// node planner/tools/build-town-maps.mjs [ARENA2]
// DFO_SRC overrides upstream/daggerfall-js-source/src. Output is gitignored.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'docs/build/towns');
const SRC = resolve(process.env.DFO_SRC ?? join(ROOT, 'upstream/daggerfall-js-source/src'));
const args = process.argv.slice(2);
if (args.length > 1 || args.some(a => a.startsWith('--'))) throw Error('Usage: build-town-maps.mjs [ARENA2]');
const ARENA = resolve(args[0] ?? process.env.ARENA2_PATH ?? 'C:/Program Files (x86)/Steam/steamapps/common/The Elder Scrolls Daggerfall/DF/DAGGER/ARENA2');
const source = p => readFileSync(join(SRC, p), 'utf8');
const dfo = p => import(pathToFileURL(join(SRC, p)).href);
const pureModule = code => import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
function between(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw Error(`DFO source changed: cannot find ${start} / ${end}`);
  return text.slice(a, b);
}
// This dataset targets DFO Online; buildingNames.isOnlinePage reads the page query.
if (!globalThis.location) globalThis.location = { search: '?online' };
const [mapsApi, blocksApi, layoutApi, namesApi, nameHelper, seatsApi, portApi, guildApi, nameplateApi, factionApi, textApi, textRscApi] = await Promise.all([
  dfo('formats/mapsFile.js'), dfo('formats/blocksFile.js'), dfo('world/locationLayout.js'),
  dfo('world/buildingNames.js'), dfo('characters/nameHelper.js'), dfo('systems/town/townSeats.js'),
  dfo('systems/travel/travelPorts.js'), dfo('systems/guild/guildFactions.js'), dfo('ui/nameplateLayout.js'),
  dfo('formats/factionFile.js'), dfo('systems/textManager.js'), dfo('formats/textRsc.js'),
]);
const { MapsFile, LOCATION_TYPES } = mapsApi;
const { BlocksFile, RMB_DIMENSION } = blocksApi;
const { layoutLocation } = layoutApi;
const { BUILDING_TYPES: BT, generateBuildingName, isResidence } = namesApi;
const { getNameBankOfRegion } = nameHelper;
const { nameplateAnchor } = nameplateApi;
const { FactionFile } = factionApi;
const { FACTION_TYPES } = factionApi;
const { getLocalizedFactionName } = textApi;
const { TextRsc } = textRscApi;
const { seatAtMapId, deriveTownSeats } = seatsApi;
const { WATER_DRAW_MASK_TABLE, waterCoverage } = await dfo('world/water/waterCorners.js');
const { convertTile } = await dfo('world/terrain/terrainSurface.js');
const { buildingPosition, buildingRotationY } = await pureModule(`
const RMB_DIMENSION=${RMB_DIMENSION}, ROTATION_DIVISOR=${(await blocksApi).ROTATION_DIVISOR}, GLOBAL_SCALE=0.025;
${between(source('world/buildingSummaries.js'), 'export function buildingPosition(', '/** BuildingSummary.Rotation')}
${between(source('world/buildingSummaries.js'), 'export const buildingRotationY', '/**\n * Every building')}
`);
const { findFactions } = await pureModule(`const FACTION_TYPES=${JSON.stringify(FACTION_TYPES)};\n${between(source('systems/talk/talk.js'), 'export function findFactions(', '/** PlayerGPS.GetPeopleOfCurrentRegion')}`);
const carriage = await pureModule(between(source('world/immersiveTravelGates.js'), 'export const IT_GATE_FILE', '/** The two arrays'));
const merchantYards = await pureModule(`const LOCATION_TYPES=${JSON.stringify(LOCATION_TYPES)};\n${between(source('systems/merchantYards.js'), 'export const YARD_TOWN_TYPES', '/** STEED1:')}`);
// These declarations are copied from the source section verbatim so the pool draw matches DFO's order/type rules.
const talk = await pureModule(`
const BUILDING_TYPES=${JSON.stringify(BT)};
const NAMED_BUILDING_TYPES=${JSON.stringify(namesApi.NAMED_BUILDING_TYPES)};
const isNamedBuildingType=${namesApi.isNamedBuildingType.toString()};
const blockBuildingCount=dfBlock=>dfBlock?.rmbBlock?.fldHeader?.numBlockDataRecords ?? dfBlock?.rmbBlock?.subRecords?.length ?? null;
const worldDataDoor=()=>null;
${between(source('systems/talk/talkTopics.js'), 'export const UNCARRIED_GUILD_FACTIONS', '/** Build the location\'s named-building directory.')}
`);

const read = name => new Uint8Array(readFileSync(join(ARENA, name)));
const maps = new MapsFile();
assert(maps.load(read('MAPS.BSA'), read('CLIMATE.PAK'), read('POLITIC.PAK')), 'MAPS.BSA load failed');
const blocks = new BlocksFile();
assert(blocks.load(read('BLOCKS.BSA')), 'BLOCKS.BSA load failed');
const factions = new FactionFile();
assert(factions.load(read('FACTION.TXT')), 'FACTION.TXT load failed');
const textRsc = new TextRsc().load(read('TEXT.RSC'));
mkdirSync(OUT, { recursive: true });

const locTypes = new Map(Object.entries(LOCATION_TYPES).map(([k, v]) => [v, k]));
const settlementTypes = new Set([LOCATION_TYPES.TownCity, LOCATION_TYPES.TownHamlet, LOCATION_TYPES.TownVillage]);
const standaloneTypes = new Set([LOCATION_TYPES.ReligionTemple, LOCATION_TYPES.Tavern, LOCATION_TYPES.HomeWealthy, LOCATION_TYPES.HomePoor]);
const guildById = Object.fromEntries(Object.entries(guildApi.GUILD_FACTION_IDS).map(([k, v]) => [v, k.replace('Guild', ' Guild')]));
const divineById = Object.fromEntries(Object.entries(guildApi.DIVINES).map(([k, v]) => [v, k]));
const shownFactionNames = namesApi.shownFactionNames(id => factions.getFaction(id));
const typeLabel = type => Object.entries(BT).find(([k, v]) => v === type)?.[0] ?? `Unknown ${type}`;
const factionLabel = b => {
  const f = factions.getFaction(b.factionId);
  if (b.buildingType === BT.Temple) {
    const childId = f?.children?.[0] ?? b.factionId;
    return getLocalizedFactionName(childId, factions.getFaction(childId)?.name ?? divineById[childId] ?? `Divine ${childId}`);
  }
  if (b.buildingType === BT.GuildHall) return getLocalizedFactionName(b.factionId, f?.name ?? guildById[b.factionId] ?? `Faction ${b.factionId}`);
  return f?.name ?? null;
};
const namesOf = (b, loc, regionName, region) => {
  const factionOf = id => factions.getFaction(id)?.name ?? guildById[id] ?? `Faction ${id}`;
  const templeOf = id => {
    const children = factions.getFaction(id)?.children;
    return factionOf(children?.length ? children[0] : id);
  };
  const name = generateBuildingName(b.nameSeed, b.buildingType, {
    locationName: loc.name, shownLocationName: loc.name, regionName, shownRegionName: regionName,
    nameBank: getNameBankOfRegion(region), regentRuler: findFactions(factions.factionDict, { type: FACTION_TYPES.Province, region })[0]?.ruler ?? 0, factionId: b.factionId,
    factionName: factionOf, templeName: templeOf,
    shownFactionName: shownFactionNames.shownFactionName,
    shownTempleName: shownFactionNames.shownTempleName,
    palaceName: locName => {
      const id = { Daggerfall: 475, Wayrest: 476, Sentinel: 477 }[locName];
      const value = id ? textRsc.plainText(id) : null;
      return value?.[0] ? value[0].replace(/\.$/, '') : null;
    },
  });
  if (name) return name;
  return isResidence(b.buildingType) || [BT.House5, BT.House6].includes(b.buildingType) ? 'Residence' : typeLabel(b.buildingType);
};
function rle(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length;) {
    const v = bytes[i]; let j = i + 1;
    while (j < bytes.length && bytes[j] === v && j - i < 65535) j++;
    out.push(j - i, v); i = j;
  }
  return out;
}
function compactMap(bytes) {
  const runs = rle(bytes), packed = Buffer.from(bytes).toString('base64');
  return JSON.stringify(runs).length < packed.length + 2 ? runs : packed;
}
function locationKind(type) {
  if (type === LOCATION_TYPES.TownCity) return 'city';
  if (type === LOCATION_TYPES.TownHamlet) return 'hamlet';
  if (type === LOCATION_TYPES.TownVillage) return 'village';
  return ({ [LOCATION_TYPES.ReligionTemple]: 'temple', [LOCATION_TYPES.Tavern]: 'tavern', [LOCATION_TYPES.HomeWealthy]: 'wealthyHome', [LOCATION_TYPES.HomePoor]: 'home' })[type] ?? locTypes.get(type) ?? 'unknown';
}

const files = [], checks = [], indexLocations = [];
const allLocations = [];
for (let ri = 0; ri < maps.regionCount; ri++) {
  const region = maps.getRegion(ri);
  if (!region) continue;
  const locations = [];
  for (let li = 0; li < region.locationCount; li++) {
    const table = region.mapTable[li];
    if (!settlementTypes.has(table.locationType) && !standaloneTypes.has(table.locationType)) continue;
    const loc = maps.getLocation(ri, li);
    if (!loc?.exterior?.exteriorData) continue;
    const layout = layoutLocation(loc, maps, blocks);
    const merged = talk.mergeNamedBuildings(loc.exterior.buildings ?? [], layout.blocks, { locationIndex: li });
    const buildings = [];
    for (const block of layout.blocks) {
      const list = merged.get(block) ?? [];
      const subs = block.dfBlock?.rmbBlock?.subRecords ?? [];
      const count = Math.min(list.length, block.dfBlock?.rmbBlock?.fldHeader?.numBlockDataRecords ?? list.length);
      for (let i = 0; i < count; i++) {
        const b = list[i], sub = subs[i];
        if (!b || !sub) continue;
        const [px, pz] = nameplateAnchor(block.x, block.y, buildingPosition(sub));
        const entry = {
          p: [px, pz], r: buildingRotationY(sub),
          t: b.buildingType, type: typeLabel(b.buildingType), faction: b.factionId ?? 0,
          factionName: factionLabel(b),
          q: b.quality ?? 0, seed: b.nameSeed ?? 0,
          name: namesOf(b, loc, maps.getRegionName(ri), ri), block: [block.x, block.y], record: i,
        };
        buildings.push(entry);
      }
    }
    const blockRows = layout.blocks.map(block => {
      const auto = BlocksFile.getBlockAutoMap(block.dfBlock, false).data;
      // GroundTiles[x][15-y] (rmbLayout.buildGroundTilemap), then sheetY's flip.
      // Sample the enhanced water pass's own coverage. No texture or picture is decoded.
      const ground = block.dfBlock.rmbBlock.fldHeader.groundData.groundTiles;
      const water = new Uint8Array(4096);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const tile = ground[x][y]; // sheet rows already invert the layout's +Z rows
        const raw = tile.textureRecord >= 56 ? 2 : tile.textureRecord | (tile.isRotated ? 64 : 0) | (tile.isFlipped ? 128 : 0);
        const mask = WATER_DRAW_MASK_TABLE[convertTile(raw)];
        for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
          // Coverage's second axis grows with +Z; the displayed sub-row grows south.
          water[(y * 4 + sy) * 64 + x * 4 + sx] = waterCoverage(mask, (sx + .5) / 4, 1 - (sy + .5) / 4) >= .5 ? 1 : 0;
        }
      }
      return { p: [block.x, block.y], n: block.blockName, map: compactMap(auto), water: compactMap(water) };
    });
    const data = {
      name: loc.name, region: maps.getRegionName(ri), regionIndex: ri, mapId: table.mapId >>> 0,
      type: locationKind(table.locationType), grid: [layout.width, layout.height], blocks: blockRows,
      buildings,
      flags: {
        carriage: carriage.hasCarriageGate(loc), port: portApi.hasPort(table.mapId),
        merchantYard: merchantYards.isYardTown(loc), seat: null,
      },
    };
    indexLocations.push({ mapId: data.mapId, name: data.name, regionIndex: ri, file: `${ri}.json`, bytes: 0 });
    locations.push(data);
    allLocations.push({ ...loc, mapTableData: table });
    if (['Gothway Garden', 'Chesterwark', 'Daggerfall', 'Wayrest', 'Sentinel'].includes(loc.name)) {
      checks.push({ name: loc.name, region: data.region, mapId: data.mapId, type: data.type,
        buildingCount: buildings.length, namedPoolRecords: loc.exterior.buildings?.length ?? 0,
        renderedSummaryRecords: buildings.length,
        typeCounts: Object.fromEntries([...new Set(buildings.map(b => b.type))].sort().map(t => [t, buildings.filter(b => b.type === t).length])),
        names: buildings.map(b => ({ type: b.type, faction: b.factionName, name: b.name, block: b.block, record: b.record })),
        method: 'BUILDING_DATA pool merge from talkTopics.mergeNamedBuildings; display strings from buildingNames.generateBuildingName with DFO region bank and default source text. See README for browser locale/state limits.' });
    }
  }
  if (!locations.length) continue;
  const path = join(OUT, `${ri}.json`), json = JSON.stringify({ region: maps.getRegionName(ri), regionIndex: ri, locations });
  writeFileSync(path, json);
  files.push({ regionIndex: ri, region: maps.getRegionName(ri), file: `${ri}.json`, bytes: Buffer.byteLength(json), locations: locations.length });
}
const seats = deriveTownSeats(allLocations, { regionNameOf: r => maps.getRegionName(r) });
// Recompute seat flags after collecting all locations and patch the per-region JSON before index sizing.
for (const f of files) {
  const path = join(OUT, f.file), data = JSON.parse(readFileSync(path, 'utf8'));
  for (const loc of data.locations) {
    loc.flags.seat = seatAtMapId(seats, loc.mapId)?.tier ?? null;
    const entry = indexLocations.find(v => v.mapId === loc.mapId && v.regionIndex === f.regionIndex);
    if (entry) entry.bytes = Buffer.byteLength(JSON.stringify(loc));
  }
  const json = JSON.stringify(data); writeFileSync(path, json); f.bytes = Buffer.byteLength(json);
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify({ files, locations: indexLocations }));
writeFileSync(join(OUT, 'checks.json'), JSON.stringify({ checks, caveat: 'Building name strings use DFO generateBuildingName with the player FACTION.TXT and default source text tables. Player-selected locale and localization overrides, quest residence renames, discovery state, and player custom names require browser state and are not in this extraction.' }));
console.log(JSON.stringify({ regions: files.length, locations: files.reduce((n, f) => n + f.locations, 0), totalBytes: files.reduce((n, f) => n + f.bytes, 0), largest: files.reduce((a, b) => b.bytes > (a?.bytes ?? -1) ? b : a, null), checks: checks.length }));
