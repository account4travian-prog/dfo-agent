// The online play guide: every number docs/23-playing-online.md states, pinned against the DFO Online code it was read
// from, so a sync that moves one fails here and the guide gets corrected. Pure modules are imported and asked;
// constants in modules that pull in the browser's world are read from their source text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dfo, DFO_ROOT, SKIP_DFO } from './dfo.mjs';

/** The source of src/<path>. */
const source = (path) => readFileSync(join(DFO_ROOT, 'src', path), 'utf8');
/** The number an `export const NAME = <number>;` line gives (underscores allowed, `a * b` products too). */
function constant(path, name) {
  const m = source(path).match(new RegExp(`export const ${name} = ([0-9_ *.]+);`));
  assert.ok(m, `${name} is no longer a plain number in src/${path}`);
  return m[1].split('*').reduce((p, f) => p * Number(f.trim().replaceAll('_', '')), 1);
}

test('public dungeons respawn on a real clock: 20 minutes, an elite 40', { skip: SKIP_DFO }, async () => {
  const r = await dfo('systems/dungeon/dungeonRespawn.js');
  assert.equal(r.DUNGEON_RESPAWN_MS, 20 * 60_000);
  assert.equal(r.ELITE_DUNGEON_RESPAWN_MS, 40 * 60_000);
});

test('spawned dungeons: 30% normal, 10% elite, off the roads, 300 m clear of a town', { skip: SKIP_DFO }, async () => {
  const s = await dfo('world/spawnedDungeons.js');
  assert.equal(s.SPAWN_CHANCE, 0.30);
  assert.equal(s.ELITE_CHANCE, 0.10);
  assert.equal(s.SPAWN_CLEARANCE_M, 300);
  // an elite dungeon: three foes a marker, double health and damage, +20% drops and rarity
  assert.equal(s.ELITE_FOE_MULTIPLIER, 3);
  assert.equal(s.ELITE_HEALTH_SCALE, 2);
  assert.equal(s.ELITE_DAMAGE_SCALE, 2);
  assert.equal(s.ELITE_LOOT_DROP_MULT, 1.2);
  assert.equal(s.ELITE_LOOT_QUALITY_MULT, 1.2);
  assert.match(source('world/spawnedDungeons.js'), /SPAWN-ROADS/, 'spawns still keep off the roads');
});

test('the danger table: the place sets the threat, the wilds tier 5 by day and 7 at night', { skip: SKIP_DFO }, async () => {
  const s = await dfo('systems/skillSoftcap.js');
  assert.deepEqual({ ...s.PLACE_THREAT, wilderness: { ...s.PLACE_THREAT.wilderness } },
    { from: 4, full: 18, wilderness: { day: 5, night: 7 } });
});

test('Renown: kills, quests, raids, the party bonus, the ceiling and the hourly cap', { skip: SKIP_DFO }, async () => {
  const r = await dfo('net/renown.js');
  assert.equal(r.renownRate(10), 7, 'a level-1 foe: 7.5 floored');
  assert.equal(r.renownKillXp(30, 50), 225, '7.5 a foe level');
  assert.equal(r.renownKillXp(30, 1), r.renownKillXp(4, 1), 'a foe counts at most 3 levels over the Renown');
  assert.equal(r.RENOWN_OVER_MAX, 3);
  assert.equal(r.renownQuestXp(1, 50), 75 + 30);
  assert.equal(r.renownQuestXp(10, 50), 75 + 30 * 10);
  assert.equal(r.renownRaidXp(1), 585);
  assert.equal(r.renownRaidXp(27), 2925);
  assert.equal(r.renownSerpentXp(27), 2 * r.renownRaidXp(27), 'the serpent: six quests to a raid\'s three');
  assert.equal(r.renownPartyXp(100, 4), 130, 'each of four earns the whole kill +30%');
  assert.equal(r.RENOWN_XP_HOUR_MAX, 15_000);
  assert.deepEqual(r.renownBonus(2), { hp: 3, mp: 2 });
});

test('the hero\'s threat (BAL11) starts past level 10 and Renown 15', { skip: SKIP_DFO }, () => {
  const src = source('systems/heroThreat.js');
  assert.match(src, /level: Object\.freeze\(\{ from: 10, to: 30, damage: 1\.07, health: 1\.04 \}\)/);
  assert.match(src, /renown: Object\.freeze\(\{ from: 15, to: 50, damage: 1\.01, health: 1\.005 \}\)/);
  // the guide's "2.3x as hard at level 20 / Renown 30"
  assert.equal((1.07 ** 10 * 1.01 ** 15).toFixed(2), '2.28');
});

test('what Renown wakes: elites at 5, revenants at 10, at most three, back in 2-4 game days', { skip: SKIP_DFO }, () => {
  assert.equal(constant('systems/eliteFoes.js', 'ELITE_FOE_MIN_RENOWN'), 5);
  assert.equal(constant('systems/revenant/revenant.js', 'REVENANT_MIN_RENOWN'), 10);
  assert.equal(constant('systems/revenant/revenant.js', 'REVENANT_MAX'), 3);
  assert.equal(constant('systems/revenant/revenant.js', 'REVENANT_RETURN_MIN_MINUTES'), 2 * 1440);
  assert.equal(constant('systems/revenant/revenant.js', 'REVENANT_RETURN_MAX_MINUTES'), 4 * 1440);
});

test('a death costs a tenth of the gold carried', { skip: SKIP_DFO }, () => {
  assert.equal(constant('systems/deathPenalty.js', 'DEATH_GOLD_DIVISOR'), 10);
});

test('the questlines open at the levels the guide\'s table says', { skip: SKIP_DFO }, () => {
  const src = source('systems/questlines/qlLines.js');
  const opens = {};
  for (const m of src.matchAll(/id: '(\w+)'[\s\S]*?opens: \{ ([^}]*)\}/g)) opens[m[1]] = m[2];
  const level = (id) => Number(opens[id]?.match(/level: (\d+)/)?.[1]);
  assert.deepEqual(
    Object.fromEntries(['introCrafts', 'introTables', 'introFirmament', 'introRoad', 'introGear', 'introSea',
      'introArena', 'introBay', 'oldCoil', 'burningDoors', 'hourThatWasNot'].map((id) => [id, level(id)])),
    { introCrafts: 2, introTables: 2, introFirmament: 3, introRoad: 3, introGear: 4, introSea: 5,
      introArena: 6, introBay: 6, oldCoil: 8, burningDoors: 10, hourThatWasNot: 12 });
  assert.match(opens.covensHoard, /after: 'burningDoors'/);
  assert.match(opens.weirRoad, /after: 'covensHoard'/);
  assert.match(opens.thirteenthFrostfall, /event: 'starfall'/);
});

test('the professions: ranks, two crafts past Journeyman, quality odds', { skip: SKIP_DFO }, async () => {
  const p = await dfo('net/professionLaw.js');
  assert.equal(p.xpForRank(100), 100_000);
  assert.equal(p.CRAFTS_ABOVE_JOURNEYMAN, 2);
  assert.equal(p.JOURNEYMAN_RANK, 50);
  assert.deepEqual([...p.SPEC_RANKS], [50, 100]);
  assert.deepEqual({ ...p.RESPEC }, { marks: 1000, days: 7 });
  assert.equal(p.PROFESSIONS.length, 10, 'five gathering, five crafts');
  assert.equal(p.PROFESSIONS.filter((x) => x.kind === 'gathering').length, 5);
  const q = await dfo('net/recipeLaw.js');
  assert.deepEqual([...q.qualityOdds(45)], [0, 0, 40, 52, 8], 'Superior 52%, Masterwork 8% at a 45+ margin');
  assert.equal(q.QUALITY_NAMES.at(-1), 'Masterwork', 'nothing crafted passes Masterwork');
  assert.equal(q.QUALITY_EFFECTS[3].rarity, 'magic');
  assert.equal(q.QUALITY_EFFECTS[4].rarity, 'rare');
});

test('growth: five masteries (2/2/1), a skill swap 100,000 gold, a path reset 200,000', { skip: SKIP_DFO }, async () => {
  const m = await dfo('systems/masterSkills.js');
  assert.deepEqual({ ...m.MASTERY_SLOTS }, { primary: 2, major: 2, minor: 1 });
  assert.equal(constant('systems/skillSwap.js', 'SKILL_SWAP_GOLD'), 100_000);
  assert.equal(constant('systems/arcanePaths.js', 'SPEC_RESET_GOLD'), 200_000);
});

/** The number an `export const NAME = <number>;` line gives in the account service's source (server-account/src/<path>). */
function serviceConstant(path, name) {
  const m = readFileSync(join(DFO_ROOT, 'server-account', 'src', path), 'utf8').match(new RegExp(`export const ${name} = ([0-9_]+);`));
  assert.ok(m, `${name} is no longer a plain number in server-account/src/${path}`);
  return Number(m[1].replaceAll('_', ''));
}
const HAVE_SERVICE = (() => { try { readFileSync(join(DFO_ROOT, 'server-account', 'src', 'stars.js')); return true; } catch { return false; } })();

test('catching up: a star or a raid pays three top quests, worth 16-31 level-8 kills', { skip: SKIP_DFO }, async () => {
  const r = await dfo('net/renown.js');
  const rows = [1, 5, 10, 15].map((n) => [n, r.renownRaidXp(n), r.renownKillXp(8, n)]);
  assert.deepEqual(rows, [[1, 585, 30], [5, 945, 60], [10, 1395, 60], [15, 1845, 60]]);
  assert.equal(r.renownXpFor(10), 5510);
  assert.equal(r.renownXpFor(15), 23350);
  assert.match(source('net/renown.js'), /export const RENOWN_SERPENT_QUESTS = 6;/, 'the serpent pays double a raid');
});

test('catching up: the daily caps in the checklist', { skip: SKIP_DFO }, async () => {
  const m = await dfo('net/marksLaw.js');
  assert.equal(m.MARKS_COMBAT.perDay, 150);
  assert.deepEqual([...m.MARKS_COMBAT.kinds].sort(), ['eg', 'gate', 'raid', 'serpent', 'star']);
  const p = await dfo('net/professionLaw.js');
  assert.equal(p.COURT_WRITS_PER_DAY, 3);
  assert.equal(p.HIGH_HIDES_PER_DAY, 3);
  assert.equal(constant('net/motherlodeLaw.js', 'MOTHERLODES_A_DAY'), 3);
  assert.equal(constant('net/festivalLaw.js', 'FIND_CAKES_PER_DAY'), 120);
  assert.equal(constant('net/townSeatLaw.js', 'WATCH_DAY_CAP'), 60);
  assert.equal(constant('systems/mentorMode.js', 'MENTOR_MIN_GAP'), 3);
  assert.equal(constant('net/gate/gateLaw.js', 'GATE_EVERY_DAYS'), 1);
});

test('catching up: nine star claims a day, paid like a raid', { skip: SKIP_DFO || (!HAVE_SERVICE && 'no server-account source') }, () => {
  assert.equal(serviceConstant('stars.js', 'STAR_CLAIMS_DAY_MAX'), 9);
  assert.match(readFileSync(join(DFO_ROOT, 'server-account', 'src', 'stars.js'), 'utf8'), /renownRaidXp/);
});

test('gauntlet techniques: Haymaker and Flying Kick, the chance of a line, the key', { skip: SKIP_DFO }, () => {
  // the roster pulls in game assets through its imports, so its two bare-hand rows are read from the source text
  const src = source('combat/technique/techniqueRoster.js');
  const row = (key) => src.match(new RegExp(String.raw`\n  ${key}: Object\.freeze\(\{[\s\S]*?\}\),`))?.[0] ?? '';
  const num = (text, field) => Number(text.match(new RegExp(String.raw`\b${field}: ([0-9.]+)`))?.[1]);
  const haymaker = row('haymaker'), kick = row('kick');
  assert.match(haymaker, /name: 'Haymaker'/);
  assert.match(kick, /name: 'Flying Kick'/);
  assert.deepEqual(['base', 'toHit', 'fatigue', 'cooldown', 'reach'].map((f) => num(haymaker, f)), [1.8, 30, 4, 9, 2.5]);
  assert.deepEqual(['base', 'toHit', 'fatigue', 'cooldown', 'radius'].map((f) => num(kick, f)), [1.3, 20, 4, 10, 2]);
  assert.match(kick, /range: Object\.freeze\(\[2, 6\]\)/);
  assert.match(src, /TECHNIQUE_PER_MILLE = Object\.freeze\(\{ magic: 120, rare: 300, legendary: 450 \}\)/);
  assert.match(src, /TECHNIQUE_BANDS = Object\.freeze\(\{ magic: Object\.freeze\(\[5, 15\]\), rare: Object\.freeze\(\[15, 30\]\), legendary: Object\.freeze\(\[30, 50\]\) \}\)/);
  assert.match(source('systems/inputActions.js'), /\['Mouse3', 'WeaponTechnique'\]/, 'the default key is the mouse back button');
});

test('travel: the carriage fare, the Portal Stone, ship prices and the Open Zone fees', { skip: SKIP_DFO }, () => {
  assert.match(source('systems/modSettings.js'), /'General\.DailyCarriageFee': Object\.freeze\(\{ default: 1,/);
  assert.match(source('systems/immersiveTravel.js'), /fee \* Math\.trunc\(\(hours - ocean\) \/ 24\) \+ fee/, 'a day\'s fee per whole land day, plus one');
  assert.equal(constant('systems/gate/gateSpoils.js', 'PORTAL_STONE_SHARDS'), 5);
  assert.equal(constant('systems/portalStone.js', 'PORTAL_OPEN_MS'), 30_000);
  assert.match(source('systems/comeSailAway/comeSailAwayHulls.js'), /HULL_PRICES = Object\.freeze\(\[4000, 8000, 100000, 200000, 150000\]\)/);
  assert.match(source('systems/wild/wildZone.js'), /WILD_TRAVEL_FEES = Object\.freeze\(\[2500, 5000, 10000, 15000\]\)/);
  assert.equal(constant('systems/wild/wildZone.js', 'WILD_TRAVEL_COOLDOWN_MS'), 10 * 60_000);
});

test('fighting, money and people: the numbers the new guides quote', { skip: SKIP_DFO }, () => {
  const weapon = source('combat/playerWeapon.js');
  assert.match(weapon, /StrikeUp: \{ damage: -4, toHit: 10 \}/);
  assert.match(weapon, /StrikeDown: \{ damage: 4, toHit: -10 \}/);
  assert.match(weapon, /StrikeLeft: \{ damage: 0, toHit: 0 \}/);
  assert.equal(constant('systems/rest/rest.js', 'EXHAUSTED_SPENT_SHARE'), 0.1);
  assert.match(source('ai/tells.js'), /PUNISH_TAKEN: 1\.3,/, 'an overreached foe takes 30% more');
  assert.match(source('systems/reforge.js'), /SALVAGE_SHARDS = Object\.freeze\(\{ magic: 1, rare: 3, legendary: 8, exalted: 15 \}\)/);
  assert.equal(constant('systems/banking.js', 'EMPIRE_LOAN_DIVISOR'), 10);
  assert.match(source('systems/roleplayRealism/rrRealism.js'), /LOAN_VALUES = Object\.freeze\(\[2000, 4000, 6000, 8000, 10000,/);
  assert.match(source('systems/roleplayRealism/rrRealism.js'), /rrSetting\('loanAmountPerLevel'\) \?\? 4\]/, 'default 10,000 a level, a tenth online');
  assert.match(source('systems/bounty/bountyBoard.js'), /BOUNTY_FULL_PURSE = Object\.freeze\(\[50, 75, 90, 100\]\)/);
  assert.equal(constant('net/homeLaw.js', 'HOME_PRICE_MIN'), 5000);
  assert.equal(constant('net/homeLaw.js', 'HOME_PRICE_MAX'), 250000);
  assert.equal(constant('net/wire.js', 'PARTY_MAX'), 8);
});
