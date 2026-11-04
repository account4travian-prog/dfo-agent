// A class ("career") as the game stores it, and the custom-class builder's laws.
// Restated from src/systems/customClass.js and src/systems/specialAdvantages.js (DFO Online),
// which restate CreateCharCustomClass.cs / CreateCharSpecialAdvantageWindow.cs (DFU).
import {
  STAT_KEYS, ADVANTAGE_KEYS, DISADVANTAGE_KEYS, ONLY_ONE_KEYS, MAX_ITEMS, EXCLUSIVE_PAIRS,
  secondaryListFor, advDisAdjustment, EFFECT_BITS, PROFICIENCY_BITS, ARMOR_BITS, SHIELD_BITS,
  MATERIAL_BITS, SPECIAL_ABILITY_BITS, ABSORPTION_FLAGS, REGENERATION_FLAGS, RAPID_HEALING_FLAGS,
  ATTACK_BITS, MAGERY_MULT_BITS, SPELL_POINT_MULTIPLIERS, DEFAULT_MAGERY_BITS, labelOf,
} from './tables.js';

// ---- the builder's limits (CreateCharCustomClass.cs) ----
export const HP_MIN = 4;
export const HP_MAX = 30;
export const HP_DEFAULT = 8;
export const DIFFICULTY_MIN = -12;
export const DIFFICULTY_MAX = 40;
export const STAT_MIN = 10;
export const STAT_MAX = 75;
export const STAT_DEFAULT = 50;
/** The attribute ledger is zero-sum: eight attributes at 50 = 400 points to move around. */
export const STAT_BUDGET = STAT_DEFAULT * STAT_KEYS.length;
export const REP_MAX = 10;

/** UpdateDifficulty: +1 per HP/level above 8, -2 per HP/level below it, plus both windows' totals. */
export function difficultyPoints(hp, advantageAdjust = 0, disadvantageAdjust = 0) {
  const base = hp >= HP_DEFAULT ? hp - HP_DEFAULT : -(2 * (HP_DEFAULT - hp));
  return base + advantageAdjust + disadvantageAdjust;
}

/** The advancement multiplier a custom class gets: 0.3 at -12 points, 3.0 at +40. Every skill raise
 *  costs this many times the uses (skillUsesForAdvancement), so LOWER is FASTER. */
export const advancementMultiplier = (points) => 0.3 + (2.7 * (points + 12)) / 52;

export const totalAdjust = (list) => list.reduce((a, s) => a + advDisAdjustment(s.primary, s.secondary), 0);

/** IsMatchingAdvPair: the named pair in either order, with EQUAL secondaries. */
function matchingPair(a, b, candidate, incumbent) {
  return ((candidate.primary === a && incumbent.primary === b) || (candidate.primary === b && incumbent.primary === a))
    && candidate.secondary === incumbent.secondary;
}

/** CannotAddAdvantage: an exact duplicate, or an incompatible pair, in EITHER window. Returns the
 *  blocking entry (truthy) or null. */
export function blockingPick(candidate, list, otherList = []) {
  for (const incumbent of [...list, ...otherList]) {
    if (candidate.primary === incumbent.primary && candidate.secondary === incumbent.secondary) return incumbent;
    for (const [a, b] of EXCLUSIVE_PAIRS) if (matchingPair(a, b, candidate, incumbent)) return incumbent;
  }
  return null;
}

/** Why the game's window would refuse `candidate` in the `kind` list, or null if it accepts it.
 *  The checks run in the window's own order. */
export function refusalFor(candidate, kind, advantages, disadvantages) {
  const list = kind === 'advantage' ? advantages : disadvantages;
  const other = kind === 'advantage' ? disadvantages : advantages;
  const keys = kind === 'advantage' ? ADVANTAGE_KEYS : DISADVANTAGE_KEYS;
  if (!keys.includes(candidate.primary)) return `${labelOf(candidate.primary)} is not a special ${kind}.`;
  const second = secondaryListFor(candidate.primary);
  if (second ? !second.includes(candidate.secondary) : candidate.secondary) return 'That option does not go with it.';
  if (list.length >= MAX_ITEMS) return `The window holds at most ${MAX_ITEMS} ${kind}s.`;
  if (ONLY_ONE_KEYS.includes(candidate.primary) && list.some((x) => x.primary === candidate.primary)) {
    return `Only one ${labelOf(candidate.primary)} per class.`;
  }
  const blocker = blockingPick(candidate, list, other);
  if (blocker) {
    const same = blocker.primary === candidate.primary;
    return same ? 'Already taken.' : `Conflicts with ${labelOf(blocker.primary)} ${labelOf(blocker.secondary)}.`;
  }
  return null;
}

/** A fresh custom career: the HP default, x0.50 magery, nothing else (buildCustomCareer). */
export function buildCustomCareer({ name, hp, skills, stats, points }) {
  return {
    name,
    resistanceFlags: 0, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0,
    abilityFlagsAndSpellPointsBitfield: DEFAULT_MAGERY_BITS << 8,
    rapidHealing: 0, regeneration: 0, unknown1: 0, spellAbsorptionFlags: 0, attackModifierFlags: 0,
    forbiddenMaterialsFlags: 0, weaponArmorShieldsBitfield: 0,
    primarySkills: skills.slice(0, 3), majorSkills: skills.slice(3, 6), minorSkills: skills.slice(6, 12),
    hitPointsPerLevel: hp,
    advancementMultiplier: advancementMultiplier(points),
    ...Object.fromEntries(STAT_KEYS.map((k) => [k, stats[k]])),
  };
}

/** ParseCareerData: fold the pick lists onto a career, in place (the same bit layout as the port). */
export function applyPicks(career, list) {
  const setAbility = (bit) => { career.abilityFlagsAndSpellPointsBitfield |= bit; };
  for (const { primary, secondary } of list) {
    switch (primary) {
      case 'bonusToHit': career.attackModifierFlags |= ATTACK_BITS[secondary]?.[0] ?? 0; break;
      case 'phobia': career.attackModifierFlags |= ATTACK_BITS[secondary]?.[1] ?? 0; break;
      case 'expertiseIn': career.weaponArmorShieldsBitfield |= (PROFICIENCY_BITS[secondary] ?? 0) << 16; break;
      case 'forbiddenWeaponry': career.weaponArmorShieldsBitfield |= PROFICIENCY_BITS[secondary] ?? 0; break;
      case 'immunity': career.immunityFlags |= EFFECT_BITS[secondary] ?? 0; break;
      case 'resistance': career.resistanceFlags |= EFFECT_BITS[secondary] ?? 0; break;
      case 'criticalWeakness': career.criticalWeaknessFlags |= EFFECT_BITS[secondary] ?? 0; break;
      case 'lowTolerance': career.lowToleranceFlags |= EFFECT_BITS[secondary] ?? 0; break;
      case 'increasedMagery': {
        const bits = MAGERY_MULT_BITS[secondary];
        if (bits != null) career.abilityFlagsAndSpellPointsBitfield = (career.abilityFlagsAndSpellPointsBitfield & ~0x1C00) | (bits << 8);
        break;
      }
      case 'rapidHealing': career.rapidHealing = RAPID_HEALING_FLAGS[secondary] ?? 0; break;
      case 'spellAbsorption': career.spellAbsorptionFlags = ABSORPTION_FLAGS[secondary] ?? 0; break;
      case 'regenerateHealth': career.regeneration = REGENERATION_FLAGS[secondary] ?? 0; break;
      case 'damage': setAbility(secondary === 'fromSunlight' ? SPECIAL_ABILITY_BITS.sunDamage : SPECIAL_ABILITY_BITS.holyDamage); break;
      case 'darknessPoweredMagery': {
        const v = secondary === 'unableToUseMagicInDaylight' ? 1 : 2;
        career.abilityFlagsAndSpellPointsBitfield = (career.abilityFlagsAndSpellPointsBitfield & ~0x300) | (v << 8);
        break;
      }
      case 'lightPoweredMagery': {
        const v = secondary === 'unableToUseMagicInDarkness' ? 1 : 2;
        career.abilityFlagsAndSpellPointsBitfield = (career.abilityFlagsAndSpellPointsBitfield & ~0x00C0) | (v << 6);
        break;
      }
      case 'forbiddenArmorType': career.weaponArmorShieldsBitfield |= (ARMOR_BITS[secondary] ?? 0) << 6; break;
      case 'forbiddenShieldTypes': career.weaponArmorShieldsBitfield |= (SHIELD_BITS[secondary] ?? 0) << 9; break;
      case 'forbiddenMaterial': career.forbiddenMaterialsFlags |= MATERIAL_BITS[secondary] ?? 0; break;
      case 'inabilityToRegen': setAbility(SPECIAL_ABILITY_BITS.noRegenSpellPoints); break;
      case 'acuteHearing': setAbility(SPECIAL_ABILITY_BITS.acuteHearing); break;
      case 'athleticism': setAbility(SPECIAL_ABILITY_BITS.athleticism); break;
      case 'adrenalineRush': setAbility(SPECIAL_ABILITY_BITS.adrenalineRush); break;
      default: break;
    }
  }
  career.weaponArmorShieldsBitfield >>>= 0;
  career.abilityFlagsAndSpellPointsBitfield >>>= 0;
  return career;
}

// ---- reading a career back ----

export const spellPointMultiplier = (career) =>
  SPELL_POINT_MULTIPLIERS[((career.abilityFlagsAndSpellPointsBitfield ?? 0x1000) & 0x1C00) >> 8] ?? 1.0;
export const hasAbility = (career, key) =>
  ((career.abilityFlagsAndSpellPointsBitfield ?? 0) & SPECIAL_ABILITY_BITS[key]) === SPECIAL_ABILITY_BITS[key];

/** DFCareer.GetTolerance: resistance, then immunity, then low tolerance, then critical weakness -
 *  the first that holds wins. */
export function careerTolerance(career, flag) {
  const has = (byte) => ((byte ?? 0) & flag) === flag;
  if (has(career.resistanceFlags)) return 'Resistant';
  if (has(career.immunityFlags)) return 'Immune';
  if (has(career.lowToleranceFlags)) return 'LowTolerance';
  if (has(career.criticalWeaknessFlags)) return 'CriticalWeakness';
  return 'Normal';
}

const keyFor = (table, value) => Object.keys(table).find((k) => table[k] === value) ?? null;

/** Everything a career grants or forbids, decoded for display. Mirrors GetClassSpecials' reading
 *  (src/systems/specialAdvantages.js classSpecials) but returns structure, not strings. */
export function decodeCareer(career) {
  const c = career;
  const wasb = c.weaponArmorShieldsBitfield ?? 0;
  const ability = c.abilityFlagsAndSpellPointsBitfield ?? 0;
  const tolerances = Object.fromEntries(Object.entries(EFFECT_BITS).map(([k, bit]) => [k, careerTolerance(c, bit)]));
  const forbiddenWeapons = Object.keys(PROFICIENCY_BITS).filter((k) => (wasb & PROFICIENCY_BITS[k]) !== 0);
  const expertWeapons = Object.keys(PROFICIENCY_BITS).filter((k) => !forbiddenWeapons.includes(k) && ((wasb >>> 16) & PROFICIENCY_BITS[k]) !== 0);
  const attack = {};
  for (const [group, [bonus, phobia]] of Object.entries(ATTACK_BITS)) {
    const f = c.attackModifierFlags ?? 0;
    attack[group] = (f & bonus) === bonus ? 'bonus' : (f & phobia) === phobia ? 'phobia' : 'normal';
  }
  const dark = (ability >>> 8) & 0x3;
  const light = (ability >>> 6) & 0x3;
  const mageryBits = (ability & 0x1C00) >> 8;
  return {
    tolerances,
    forbiddenWeapons,
    expertWeapons,
    attack,
    forbiddenArmor: Object.keys(ARMOR_BITS).filter((k) => (((wasb >>> 6) & 0x7) & ARMOR_BITS[k]) !== 0),
    forbiddenShields: Object.keys(SHIELD_BITS).filter((k) => (((wasb >>> 9) & 0xf) & SHIELD_BITS[k]) !== 0),
    forbiddenMaterials: Object.keys(MATERIAL_BITS).filter((k) => ((c.forbiddenMaterialsFlags ?? 0) & MATERIAL_BITS[k]) !== 0),
    magery: { bits: mageryBits, multiplier: SPELL_POINT_MULTIPLIERS[mageryBits] ?? 1, key: keyFor(MAGERY_MULT_BITS, mageryBits) },
    darknessMagery: dark & 1 ? 'unable' : dark & 2 ? 'lower' : null,   // in daylight
    lightMagery: light & 1 ? 'unable' : light & 2 ? 'lower' : null,    // in darkness
    absorption: keyFor(ABSORPTION_FLAGS, c.spellAbsorptionFlags ?? 0),
    regeneration: keyFor(REGENERATION_FLAGS, c.regeneration ?? 0),
    rapidHealing: keyFor(RAPID_HEALING_FLAGS, c.rapidHealing ?? 0),
    acuteHearing: hasAbility(c, 'acuteHearing'),
    athleticism: hasAbility(c, 'athleticism'),
    adrenalineRush: hasAbility(c, 'adrenalineRush'),
    noRegenSpellPoints: hasAbility(c, 'noRegenSpellPoints'),
    sunDamage: hasAbility(c, 'sunDamage'),
    holyDamage: hasAbility(c, 'holyDamage'),
  };
}

/** The pick list a career implies (for a standard class: what it ships with). The reverse of
 *  applyPicks, so a standard class can be opened in the custom builder as a starting point. */
export function picksFromCareer(career) {
  const d = decodeCareer(career);
  const adv = [];
  const dis = [];
  const tolKey = { Resistant: 'resistance', Immune: 'immunity', LowTolerance: 'lowTolerance', CriticalWeakness: 'criticalWeakness' };
  for (const [effect, t] of Object.entries(d.tolerances)) {
    if (t === 'Normal') continue;
    const p = { primary: tolKey[t], secondary: effect };
    (ADVANTAGE_KEYS.includes(p.primary) ? adv : dis).push(p);
  }
  for (const w of d.expertWeapons) adv.push({ primary: 'expertiseIn', secondary: w });
  for (const w of d.forbiddenWeapons) dis.push({ primary: 'forbiddenWeaponry', secondary: w });
  for (const [g, m] of Object.entries(d.attack)) {
    if (m === 'bonus') adv.push({ primary: 'bonusToHit', secondary: g });
    if (m === 'phobia') dis.push({ primary: 'phobia', secondary: g });
  }
  if (d.magery.bits !== DEFAULT_MAGERY_BITS && d.magery.key) adv.push({ primary: 'increasedMagery', secondary: d.magery.key });
  if (d.darknessMagery) dis.push({ primary: 'darknessPoweredMagery', secondary: d.darknessMagery === 'unable' ? 'unableToUseMagicInDaylight' : 'lowerMagicAbilityDaylight' });
  if (d.lightMagery) dis.push({ primary: 'lightPoweredMagery', secondary: d.lightMagery === 'unable' ? 'unableToUseMagicInDarkness' : 'lowerMagicAbilityDarkness' });
  for (const m of d.forbiddenMaterials) dis.push({ primary: 'forbiddenMaterial', secondary: m });
  for (const s of d.forbiddenShields) dis.push({ primary: 'forbiddenShieldTypes', secondary: s });
  for (const a of d.forbiddenArmor) dis.push({ primary: 'forbiddenArmorType', secondary: a });
  if (d.absorption) adv.push({ primary: 'spellAbsorption', secondary: d.absorption });
  if (d.noRegenSpellPoints) dis.push({ primary: 'inabilityToRegen', secondary: '' });
  if (d.acuteHearing) adv.push({ primary: 'acuteHearing', secondary: '' });
  if (d.athleticism) adv.push({ primary: 'athleticism', secondary: '' });
  if (d.adrenalineRush) adv.push({ primary: 'adrenalineRush', secondary: '' });
  if (d.regeneration) adv.push({ primary: 'regenerateHealth', secondary: d.regeneration });
  if (d.rapidHealing) adv.push({ primary: 'rapidHealing', secondary: d.rapidHealing });
  if (d.sunDamage) dis.push({ primary: 'damage', secondary: 'fromSunlight' });
  if (d.holyDamage) dis.push({ primary: 'damage', secondary: 'fromHolyPlaces' });
  return { advantages: adv, disadvantages: dis };
}

/** The four refusals the builder's exit button gives, in its order, plus the planner's own
 *  checks (skills chosen twice). Empty when the game would accept the class. */
export function customClassProblems(custom) {
  const out = [];
  if (!custom.name?.trim()) out.push('The class needs a name.');
  if (custom.skills.some((s) => s == null)) out.push('All 12 skills (3 primary, 3 major, 6 minor) must be chosen.');
  const chosen = custom.skills.filter((s) => s != null);
  if (new Set(chosen).size !== chosen.length) out.push('A skill can only be chosen once.');
  const spent = STAT_KEYS.reduce((n, k) => n + custom.stats[k], 0);
  if (spent !== STAT_BUDGET) out.push(`Attributes must total ${STAT_BUDGET} (now ${spent}: ${spent > STAT_BUDGET ? `${spent - STAT_BUDGET} too many` : `${STAT_BUDGET - spent} left to place`}).`);
  const dp = difficultyPoints(custom.hp, totalAdjust(custom.advantages), totalAdjust(custom.disadvantages));
  if (dp < DIFFICULTY_MIN || dp > DIFFICULTY_MAX) out.push(`Difficulty must be ${DIFFICULTY_MIN} to +${DIFFICULTY_MAX} (now ${dp > 0 ? '+' : ''}${dp}).`);
  // The reputation window's own exit gate: the five sliders must balance to exactly zero.
  const repSum = Object.values(custom.reps ?? {}).reduce((a, b) => a + b, 0);
  if (repSum !== 0) out.push(`Reputations must balance to 0 (now ${repSum > 0 ? '+' : ''}${repSum}): every point raised is a point lowered elsewhere.`);
  return out;
}
