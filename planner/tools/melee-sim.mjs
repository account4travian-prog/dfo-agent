#!/usr/bin/env node
// Melee damage per second for every race x weapon, through DFO Online's OWN combat model
// (src/combat/combatStats.js computeCombatStats - the numbers behind the in-game stats card) and its own
// swing clock (src/systems/rriRealism.js rriMeleeWeaponAnimTime, the Roleplay & Realism: Items weaponBalance
// override that is on by default).
//
//   node planner/tools/melee-sim.mjs [--level N] [--stat N] [--skill N] [--material Daedric] [--foe tough|human|armoured|soft]
//
// What it does NOT model (say so whenever quoting it): the foe's armour reduction under the overhaul (applied after
// these figures, by the foe's materials and the blow's weight), weapon techniques, enchantments, loot powers and
// sigil sets, shields, and the Bonus to Hit damage roll (the reference foes belong to no enemy group).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'upstream', 'daggerfall-js-source', 'src');
const dfo = (p) => import(pathToFileURL(join(ROOT, p)).href);

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const LEVEL = Number(arg('level', 30));
const STAT = Number(arg('stat', 100));
const SKILL = Number(arg('skill', 100));
const MATERIAL = arg('material', 'Daedric');
const FOE = arg('foe', 'tough');
const JSON_OUT = process.argv.includes('--json');

const { installRoleplayRealismModules } = await dfo('systems/rriInstall.js');
installRoleplayRealismModules();
const { computeCombatStats, REFERENCE_FOES } = await dfo('combat/combatStats.js');
const { rriMeleeWeaponAnimTime } = await dfo('systems/rriRealism.js');
const { WEAPONS, WEAPON_MATERIALS } = await dfo('characters/weapons.js');
const { createWeapon } = await dfo('combat/enemyEquipment.js');
const { templateByIndex } = await dfo('systems/itemTemplates.js');
const { weaponTypeForItem } = await dfo('combat/fpsWeapon.js');
const { getItemHands, ITEM_HANDS } = await dfo('characters/equipTable.js');
const { RACES } = await dfo('systems/races.js');
const { SKILLS } = await dfo('systems/skills.js');
const { parseCareerData } = await dfo('systems/specialAdvantages.js');
const { buildCustomCareer } = await dfo('systems/customClass.js');
const { MELEE_NUM_FRAMES } = await dfo('characters/weaponStates.js');

const PROF = { [SKILLS.ShortBlade]: 'shortBlade', [SKILLS.LongBlade]: 'longBlade', [SKILLS.HandToHand]: 'handToHand', [SKILLS.Axe]: 'axe', [SKILLS.BluntWeapon]: 'bluntWeapon' };
const MELEE = ['Dagger', 'Tanto', 'Shortsword', 'Wakazashi', 'Broadsword', 'Saber', 'Longsword', 'Katana', 'Claymore', 'Dai_Katana', 'Staff', 'Mace', 'Flail', 'Warhammer', 'Battle_Axe', 'War_Axe'];
const FRAMES = MELEE_NUM_FRAMES.StrikeLeft;

/** A player at `level` with every attribute `stat`, every skill `skill`, expert in `expertSkill`. */
function player(raceKey, { expertSkill = null, level = LEVEL, stat = STAT, skill = SKILL, stats = null } = {}) {
  const s = stats ?? { strength: stat, intelligence: stat, willpower: stat, agility: stat, endurance: stat, personality: stat, speed: stat, luck: stat };
  const picks = expertSkill != null && PROF[expertSkill] ? [{ primary: 'expertiseIn', secondary: PROF[expertSkill] }] : [];
  const career = parseCareerData(buildCustomCareer({ name: 'Sim', hp: 30, skills: [29, 34, 20, 31, 32, 28, 30, 0, 1, 2, 3, 4], stats: s, points: 0 }), picks);
  return { isPlayer: true, raceId: RACES[raceKey], level, career, stats: { ...s }, skills: new Array(35).fill(skill), health: 300, maxHealth: 300 };
}

/** Damage per second of the best swing against reference foe `foeId`, with this weapon (null = bare hands). */
export function dps(entity, weapon, foeId = FOE) {
  const foeIndex = REFERENCE_FOES.findIndex((f) => f.id === foeId);
  const cs = computeCombatStats(entity, { core: 'overhaul', weapon });
  const type = weaponTypeForItem(weapon);
  const twoHanded = !!weapon && getItemHands(weapon) === ITEM_HANDS.Both;
  const frame = rriMeleeWeaponAnimTime({
    liveSpeed: entity.stats.speed, liveStrength: entity.stats.strength,
    weaponWeight: weapon ? (templateByIndex(weapon.templateIndex)?.baseWeight ?? 0) : null, melee: !weapon, weaponType: type, twoHanded,
  });
  const swingSeconds = frame * FRAMES;
  const best = cs.swings.map((s) => ({ key: s.key, per: s.byFoe[foeIndex].perSwing, hit: s.byFoe[foeIndex].hit, avg: s.byFoe[foeIndex].dmg.avg }))
    .sort((a, b) => b.per - a.per)[0];
  return { dps: best.per / swingSeconds, perSwing: best.per, hit: best.hit, avg: best.avg, swing: best.key, swingSeconds, twoHanded };
}

export const weaponOf = (name, material = MATERIAL) => {
  const w = createWeapon(WEAPONS[name], WEAPON_MATERIALS[material], () => 0.5);
  w.currentCondition = w.maxCondition;   // a fresh blade (the overhaul pays a little more for one over 92%)
  return w;
};
export const skillOfWeapon = (name) => {
  if (['Dagger', 'Tanto', 'Shortsword', 'Wakazashi'].includes(name)) return SKILLS.ShortBlade;
  if (['Broadsword', 'Saber', 'Longsword', 'Katana', 'Claymore', 'Dai_Katana'].includes(name)) return SKILLS.LongBlade;
  if (['Staff', 'Mace', 'Flail', 'Warhammer'].includes(name)) return SKILLS.BluntWeapon;
  if (['Battle_Axe', 'War_Axe'].includes(name)) return SKILLS.Axe;
  return SKILLS.HandToHand;
};

const races = Object.keys(RACES);
const rows = [];
for (const name of [...MELEE, 'Hands']) {
  const weapon = name === 'Hands' ? null : weaponOf(name);
  const sk = name === 'Hands' ? SKILLS.HandToHand : skillOfWeapon(name);
  for (const race of races) {
    const expert = dps(player(race, { expertSkill: sk }), weapon);
    const plain = dps(player(race), weapon);
    rows.push({ weapon: name, race, expertDps: expert.dps, plainDps: plain.dps, hit: expert.hit, perSwing: expert.perSwing, swingSeconds: expert.swingSeconds, twoHanded: expert.twoHanded });
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ level: LEVEL, stat: STAT, skill: SKILL, material: MATERIAL, foe: FOE, rows }, null, 1));
} else {
  console.log(`Melee DPS vs ${FOE} foe of level ${LEVEL}; all attributes ${STAT}, all skills ${SKILL}, ${MATERIAL} weapons, overhaul rules. Expertise in the weapon's skill.`);
  const byWeapon = MELEE.concat('Hands').map((w) => {
    const r = rows.filter((x) => x.weapon === w);
    const best = r.reduce((a, b) => (b.expertDps > a.expertDps ? b : a));
    return { w, best, r };
  }).sort((a, b) => b.best.expertDps - a.best.expertDps);
  console.log('\nweapon        2H  swing s  ' + races.map((r) => r.slice(0, 8).padStart(9)).join(''));
  for (const { w, r } of byWeapon) {
    console.log(`${w.padEnd(13)} ${r[0].twoHanded ? 'y ' : '  '}  ${r[0].swingSeconds.toFixed(2).padStart(6)}  ` + r.map((x) => x.expertDps.toFixed(1).padStart(9)).join(''));
  }
  console.log('\nWithout Expertise (best race per weapon):');
  for (const { w, r } of byWeapon.slice(0, 6)) {
    const b = r.reduce((a, c) => (c.plainDps > a.plainDps ? c : a));
    console.log(`  ${w.padEnd(12)} ${b.race.padEnd(9)} ${b.plainDps.toFixed(1)} dps (expert: ${b.expertDps.toFixed(1)})`);
  }
}
