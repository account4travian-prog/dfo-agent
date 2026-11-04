// Numbers that follow from a finished character: health, magicka, fatigue, carrying, movement,
// healing, the weapon bonuses race and class give, and how fast the character levels.
//
// Sources (upstream/daggerfall-js-source):
//   src/systems/chargen.js       rollMaxHealthLevel1, hitPointsPerLevelUp, spellPointMultiplier
//   src/combat/formulas.js       damageModifier, maxEncumbrance, toHitModifier, racialModifiers, proficiencyModifiers
//   src/combat/pcaao.js          pcaaoDamageModifier, pcaaoRacialModifiers, pcaaoProficiencyModifiers
//   src/systems/rest.js          healthRecoveryRate, spellPointRecoveryRate (and its online exception)
//   src/systems/passiveSpecials.js  sun/holy damage, regeneration, light/darkness magery
//   src/player/motor.js          walkSpeed, runSpeed
//   src/systems/advancement.js   skillUsesForAdvancement, calculatePlayerLevel, levelUpSkillSum
import { SKILLS, WEAPON_SKILL_PROFICIENCY } from './tables.js';
import { spellPointMultiplier, decodeCareer } from './career.js';

const int = Math.trunc;

// ---- health ----
export const maxHealthAtLevel1 = (career) => 25 + career.hitPointsPerLevel;
export const enduranceHpModifier = (endurance) => Math.floor(endurance / 10) - 5;
/** One level-up's health: Range(hp/2, hp) + the Endurance modifier, never below 1. */
export function hpPerLevelRange(career, endurance) {
  const mod = enduranceHpModifier(endurance);
  const lo = int(career.hitPointsPerLevel / 2);
  const hi = career.hitPointsPerLevel;
  let sum = 0;
  for (let r = lo; r <= hi; r++) sum += Math.max(1, r + mod);
  return { min: Math.max(1, lo + mod), max: Math.max(1, hi + mod), average: sum / (hi - lo + 1), modifier: mod };
}
/** The expected maximum health at `level`, if Endurance stays where it starts. */
export const expectedHealthAt = (career, endurance, level) =>
  maxHealthAtLevel1(career) + (level - 1) * hpPerLevelRange(career, endurance).average;

// ---- magicka ----
export const maxMagicka = (career, intelligence) => Math.floor(intelligence * spellPointMultiplier(career));
/** Light- and darkness-powered magery take a third (truncated) of the pool, or all of it. */
export function mageryWindows(career, intelligence) {
  const raw = maxMagicka(career, intelligence);
  const d = decodeCareer(career);
  const cut = (mode) => (mode === 'unable' ? 0 : raw + int(raw * -0.33));
  return {
    raw,
    inSunlight: d.darknessMagery ? cut(d.darknessMagery) : raw,
    outOfSunlight: d.lightMagery ? cut(d.lightMagery) : raw,
  };
}

// ---- the other derived stats (FormulaHelper's block on the chargen bonus screen) ----
export const fatigue = (strength, endurance) => strength + endurance;   // shown; stored x64
export const maxEncumbrance = (strength) => Math.floor(strength * 1.5);
export const magicResist = (willpower) => Math.floor(willpower / 10);
export const toHitModifier = (agility) => Math.floor(agility / 10) - 5;
export const healingRateModifier = (endurance) => Math.floor(endurance / 10) - 5;
/** Damage per blow from Strength: Daggerfall Unity's (STR-50)/5, or the combat overhaul's
 *  "fixed" (STR-50)/10, which DFO uses by default. */
export const damageModifier = (strength, overhaul) => Math.floor((strength - 50) / (overhaul ? 10 : 5));

/** Health back per rested hour (CalculateHealthRecoveryRate). Rapid Healing adds 100 instead of 60
 *  where it applies. */
export function healthPerRestHour({ endurance, medical, maxHealth, rapid }) {
  return Math.max(Math.floor(healingRateModifier(endurance) + (medical + (rapid ? 100 : 60)) * maxHealth / 1000), 1);
}
/** Magicka back per rested hour; nothing for Inability To Regen - except ONLINE, where DFO lets
 *  every career's rest restore magicka (REST-MANA1, src/systems/rest.js restIgnoresNoRegen). */
export function magickaPerRestHour(career, magicka, { online }) {
  if (decodeCareer(career).noRegenSpellPoints && !online) return 0;
  return Math.max(Math.floor(magicka / 8), 1);
}

// ---- movement (PlayerSpeedChanger; Unity units per second) ----
const DF_WALK_BASE = 150;
const CLASSIC_TO_UNITY = 39.5;
export function walkSpeed(speed) {
  const drag = 0.5 * (100 - (speed >= 30 ? speed : 30));
  return (speed + DF_WALK_BASE - drag) / CLASSIC_TO_UNITY;
}
export const runSpeed = (speed, running) => ((speed + DF_WALK_BASE) / CLASSIC_TO_UNITY) * (1.35 + running / 200);

// ---- weapon bonuses from race and class ----

/** Daggerfall Unity's racial bonus (CalculateRacialModifiers): level-driven. */
export function racialModifiersDFU(raceKey, skillId, level) {
  const set = (n) => ({ damage: n, toHit: n });
  if (skillId === 30) return set(0);   // weaponless: nothing
  if (raceKey === 'DarkElf') return set(int(level / 4));
  if (skillId === 33) return raceKey === 'WoodElf' ? set(int(level / 3)) : set(0);
  if (raceKey === 'Redguard') return set(int(level / 3));
  return set(0);
}

/** The combat overhaul's racial bonus (pcaaoRacialModifiers): attribute-driven, per weapon. */
export function racialModifiersPCAAO(raceKey, skillId, s) {
  const r = { damage: 0, toHit: 0 };
  const set = (damage, toHit) => { r.damage = damage; r.toHit = toHit; };
  const S = (k) => s[k] ?? 50;
  if (skillId === 30) {
    if (raceKey === 'Khajiit') set(int(S('strength') / 33) + int(S('endurance') / 33) + int(S('agility') / 50) + int(S('speed') / 50),
      int(S('agility') / 25) + int(S('speed') / 50) + int(S('strength') / 50) + int(S('endurance') / 50) + int(S('luck') / 50));
    else if (raceKey === 'Nord') set(int(S('strength') / 33) + int(S('endurance') / 50), 0);
    return r;
  }
  switch (raceKey) {
    case 'Argonian':
      if (skillId === 28) set(int(S('agility') / 33) + int(S('speed') / 33), int(S('agility') / 16) + int(S('speed') / 33) + int(S('luck') / 33));
      break;
    case 'DarkElf':
      if (skillId === 29) set(int(S('agility') / 25) + int(S('strength') / 25), int(S('agility') / 25) + int(S('speed') / 33) + int(S('luck') / 33));
      else if (skillId === 28) set(int(S('agility') / 50) + int(S('speed') / 50), int(S('agility') / 33) + int(S('speed') / 33) + int(S('luck') / 33));
      break;
    case 'Khajiit':
      if (skillId === 28) set(int(S('agility') / 33) + int(S('speed') / 50), int(S('agility') / 20) + int(S('speed') / 33) + int(S('luck') / 50));
      break;
    case 'Nord':
      if (skillId === 31) set(int(S('strength') / 16) + int(S('agility') / 33), int(S('strength') / 33) + int(S('agility') / 33) + int(S('luck') / 33));
      else if (skillId === 32) set(int(S('strength') / 25) + int(S('endurance') / 25), int(S('strength') / 25) + int(S('agility') / 33) + int(S('luck') / 33));
      break;
    case 'Redguard':
      if (skillId === 29) set(int(S('agility') / 33) + int(S('strength') / 50), int(S('agility') / 10) + int(S('speed') / 25) + int(S('luck') / 25));
      else if (skillId === 32) set(int(S('strength') / 33) + int(S('endurance') / 33), int(S('strength') / 20) + int(S('agility') / 25) + int(S('luck') / 33));
      else if (skillId === 31) set(int(S('strength') / 16) + int(S('agility') / 33), int(S('strength') / 33) + int(S('agility') / 33) + int(S('luck') / 33));
      else if (skillId === 33) set(int(S('strength') / 50) + int(S('agility') / 50), int(S('agility') / 25) + int(S('speed') / 33) + int(S('luck') / 33));
      break;
    case 'WoodElf':
      if (skillId === 28) set(int(S('agility') / 33) + int(S('speed') / 50), int(S('agility') / 20) + int(S('speed') / 33) + int(S('luck') / 50));
      else if (skillId === 33) set(int(S('strength') / 25) + int(S('agility') / 25), int(S('agility') / 10) + int(S('speed') / 25) + int(S('luck') / 25));
      break;
    default: break;
  }
  return r;
}

const expertIn = (career, skillId) => decodeCareer(career).expertWeapons.includes(WEAPON_SKILL_PROFICIENCY[skillId]);

/** "Expertise In", Daggerfall Unity's way: +level to hit, +(level/3 + 1) damage. */
export function expertiseDFU(career, skillId, level) {
  return expertIn(career, skillId) ? { damage: int(level / 3) + 1, toHit: level } : { damage: 0, toHit: 0 };
}

/** "Expertise In", the combat overhaul's way: attribute-driven per weapon, no level at all. */
export function expertisePCAAO(career, skillId, s) {
  if (!expertIn(career, skillId)) return { damage: 0, toHit: 0 };
  const S = (k) => s[k] ?? 50;
  switch (skillId) {
    case 33: return { damage: int(S('strength') / 25) + int(S('agility') / 25) + 1, toHit: int(S('agility') / 8) + int(S('speed') / 20) + int(S('luck') / 20) };
    case 31: return { damage: int(S('strength') / 20) + int(S('agility') / 33) + 1, toHit: int(S('strength') / 11) + int(S('agility') / 11) + int(S('luck') / 22) };
    case 32: return { damage: int(S('strength') / 20) + int(S('endurance') / 33) + 1, toHit: int(S('strength') / 10) + int(S('agility') / 16) + int(S('luck') / 16) };
    case 29: return { damage: int(S('agility') / 20) + int(S('strength') / 33) + 1, toHit: int(S('agility') / 8) + int(S('speed') / 20) + int(S('luck') / 20) };
    case 28: return { damage: int(S('agility') / 25) + int(S('speed') / 25) + 1, toHit: int(S('agility') / 10) + int(S('speed') / 14) + int(S('luck') / 18) };
    case 30: return { damage: int(S('strength') / 50) + int(S('endurance') / 50) + int(S('agility') / 50) + int(S('speed') / 50) + 1,
      toHit: int(S('agility') / 22) + int(S('speed') / 22) + int(S('strength') / 22) + int(S('endurance') / 22) + int(S('luck') / 22) };
    default: return { damage: 0, toHit: 0 };
  }
}

/** Every weapon skill's bonuses for one character, at one level, both rule sets. */
export function weaponTable({ raceKey, career, stats, level }) {
  const forbidden = decodeCareer(career).forbiddenWeapons;
  return [28, 29, 30, 31, 32, 33].map((id) => ({
    skillId: id,
    name: SKILLS[id].name,
    forbidden: forbidden.includes(WEAPON_SKILL_PROFICIENCY[id]),
    expert: expertIn(career, id),
    dfu: { race: racialModifiersDFU(raceKey, id, level), expertise: expertiseDFU(career, id, level) },
    pcaao: { race: racialModifiersPCAAO(raceKey, id, stats), expertise: expertisePCAAO(career, id, stats) },
  }));
}

// ---- leveling (Daggerfall's classic system) ----
export const LEVELUP_SKILL_SUM_PER_LEVEL = 15;
/** sum(primary) + sum(major) - lowest major + highest minor. */
export function levelUpSkillSum(career, skills) {
  const v = (id) => skills[id] ?? 0;
  let sum = career.primarySkills.reduce((a, id) => a + v(id), 0);
  const majors = career.majorSkills.map(v);
  sum += majors.reduce((a, b) => a + b, 0) - Math.min(...majors);
  return sum + Math.max(...career.minorSkills.map(v));
}
export const levelFromSums = (startSum, currentSum) => Math.floor((currentSum - startSum + 28) / LEVELUP_SKILL_SUM_PER_LEVEL);
/** Uses of a skill needed to raise it from `value` (before Master Skills' x4/x8/x16 past 100). */
export const usesToRaise = (value, skillMult, careerAdvMult, level) =>
  Math.floor((value * skillMult * careerAdvMult * Math.pow(1.04, level) * 2) / 5) + 1;
