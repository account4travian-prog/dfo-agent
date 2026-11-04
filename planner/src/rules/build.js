// A planned character, and everything the planner works out from it.
//
// A build is plain JSON (so it can live in a URL or a file). `compute(build, gameData)` is pure:
// the same build always gives the same sheet.
import { STAT_KEYS, SKILLS, RACES, raceByKey, CLASS_NAMES, MAGIC_SKILLS } from './tables.js';
import {
  buildCustomCareer, applyPicks, decodeCareer, difficultyPoints, advancementMultiplier, totalAdjust,
  customClassProblems, HP_DEFAULT, STAT_DEFAULT,
} from './career.js';
import { resistanceSheet } from './resist.js';
import {
  maxHealthAtLevel1, hpPerLevelRange, expectedHealthAt, maxMagicka, mageryWindows, fatigue, maxEncumbrance,
  magicResist, toHitModifier, damageModifier, healthPerRestHour, magickaPerRestHour, walkSpeed, runSpeed,
  weaponTable, levelUpSkillSum, usesToRaise, LEVELUP_SKILL_SUM_PER_LEVEL,
} from './derived.js';
import { foldBiography } from './biography.js';
import { interactionNotes } from './notes.js';

export const BUILD_VERSION = 1;

/** The dice the game rolls at creation, and what the planner assumes for each preset. */
export const ROLL_LIMITS = Object.freeze({
  stat: [0, 10],          // each attribute: class base + Range(0, 10)
  pool: [6, 14],          // free attribute points
  tier: [0, 3],           // primary 28 / major 18 / minor 13 + Range(0, 3)
  misc: [3, 6],           // every other skill: Range(3, 6)
  groupPool: 6,           // free points per skill group, which only that group's skills may take
});
export const ROLL_PRESETS = Object.freeze({
  worst: { stat: 0, pool: 6, tier: 0, misc: 3 },
  typical: { stat: 5, pool: 10, tier: 2, misc: 5 },
  best: { stat: 10, pool: 14, tier: 3, misc: 6 },
});
export const TIER_BASE = Object.freeze({ primary: 28, major: 18, minor: 13 });
export const MAX_STAT_VALUE = 100;

const emptyStats = (v) => Object.fromEntries(STAT_KEYS.map((k) => [k, v]));

export function defaultCustom() {
  return {
    name: 'Adventurer',
    hp: HP_DEFAULT,
    skills: [29, 20, 23, 34, 16, 0, 13, 19, 17, 18, 3, 1],
    stats: emptyStats(STAT_DEFAULT),
    advantages: [],
    disadvantages: [],
    reps: { merchants: 0, peasants: 0, scholars: 0, nobility: 0, underworld: 0 },
  };
}

export function defaultBuild() {
  return {
    v: BUILD_VERSION,
    name: '',
    race: 'Breton',
    gender: 'female',
    classMode: 'standard',
    classIndex: 16,
    custom: defaultCustom(),
    rolls: { preset: 'typical', stats: emptyStats(ROLL_PRESETS.typical.stat), pool: ROLL_PRESETS.typical.pool, skills: {} },
    statSpend: emptyStats(0),
    skillSpend: {},
    bio: {},
    reflexes: 2,
    settings: { online: true, overhaul: true, leveling: 'classic', planLevel: 10 },
  };
}

/** Apply a dice preset to a build's rolls (in place). */
export function applyRollPreset(build, presetKey) {
  const p = ROLL_PRESETS[presetKey];
  if (!p) return build;
  build.rolls = { preset: presetKey, stats: emptyStats(p.stat), pool: p.pool, skills: {} };
  return build;
}

/** The career the build plays: a standard class from the game data, or the custom builder's. */
export function careerOf(build, gameData) {
  if (build.classMode === 'custom') {
    const c = build.custom;
    const points = difficultyPoints(c.hp, totalAdjust(c.advantages), totalAdjust(c.disadvantages));
    const career = buildCustomCareer({ name: c.name, hp: c.hp, skills: c.skills.map((s) => s ?? -1), stats: c.stats, points });
    applyPicks(career, [...c.advantages, ...c.disadvantages]);
    return { career, points, isCustom: true };
  }
  const career = gameData?.classes?.[build.classIndex];
  return career ? { career: { ...career }, points: null, isCustom: false } : null;
}

/** BiogFile.GetClassAffinityIndex: a custom class answers the questionnaire of the standard class
 *  sharing the most of its 12 skills (the first such class on a tie). */
export function affinityIndex(skills, gameData) {
  let best = 0;
  let bestIndex = 0;
  (gameData?.classes ?? []).forEach((c, i) => {
    const set = new Set([...c.primarySkills, ...c.majorSkills, ...c.minorSkills]);
    const n = skills.filter((s) => set.has(s)).length;
    if (n > best) { best = n; bestIndex = i; }
  });
  return bestIndex;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function compute(build, gameData) {
  const problems = [];
  const race = raceByKey(build.race) ?? RACES[0];
  const resolved = careerOf(build, gameData);
  if (!resolved) return { ok: false, problems: ['No class data. Run: node planner/tools/extract-game-data.mjs'] };
  const { career, points, isCustom } = resolved;
  const decoded = decodeCareer(career);
  const online = !!build.settings.online;
  const overhaul = online ? true : !!build.settings.overhaul;   // online, every vendored mod is forced on

  // ---- class ----
  const classInfo = {
    name: isCustom ? build.custom.name : (career.name ?? CLASS_NAMES[build.classIndex]),
    isCustom,
    hpPerLevel: career.hitPointsPerLevel,
    advancementMultiplier: isCustom ? advancementMultiplier(points) : career.advancementMultiplier,
    difficulty: points,
  };
  if (isCustom) problems.push(...customClassProblems(build.custom));

  // ---- attributes: class base + roll + spent points ----
  const rolls = build.rolls ?? {};
  const pool = clamp(rolls.pool ?? 10, ...ROLL_LIMITS.pool);
  const stats = {};
  const statRows = [];
  let spent = 0;
  for (const k of STAT_KEYS) {
    const base = career[k];
    const roll = clamp(rolls.stats?.[k] ?? 0, ...ROLL_LIMITS.stat);
    const add = Math.max(0, build.statSpend?.[k] ?? 0);
    spent += add;
    const value = base + roll + add;
    stats[k] = Math.min(MAX_STAT_VALUE, value);
    statRows.push({ key: k, base, roll, add, value: stats[k], capped: value > MAX_STAT_VALUE });
    if (value > MAX_STAT_VALUE) problems.push(`${k[0].toUpperCase()}${k.slice(1)} cannot go above ${MAX_STAT_VALUE}.`);
  }
  const statPoolLeft = pool - spent;
  if (statPoolLeft > 0) problems.push(`${statPoolLeft} attribute point${statPoolLeft === 1 ? '' : 's'} left to place (the game makes you spend them all).`);
  if (statPoolLeft < 0) problems.push(`${-statPoolLeft} attribute point${statPoolLeft === -1 ? '' : 's'} more than the ${pool} rolled.`);

  // ---- biography ----
  const bioIndex = isCustom ? affinityIndex(build.custom.skills.filter((s) => s != null), gameData) : build.classIndex;
  const questions = gameData?.biographies?.[bioIndex] ?? null;
  const bio = foldBiography(questions, build.bio);

  // ---- skills: tier base + roll + spent + biography ----
  const tierOf = (id) => (career.primarySkills.includes(id) ? 'primary' : career.majorSkills.includes(id) ? 'major' : career.minorSkills.includes(id) ? 'minor' : 'misc');
  const skills = new Array(SKILLS.length).fill(0);
  const skillRows = [];
  const groupSpent = { primary: 0, major: 0, minor: 0 };
  for (const s of SKILLS) {
    const tier = tierOf(s.id);
    const rolled = tier === 'misc'
      ? clamp(rolls.skills?.[s.id] ?? ROLL_PRESETS[rolls.preset ?? 'typical']?.misc ?? 5, ...ROLL_LIMITS.misc)
      : TIER_BASE[tier] + clamp(rolls.skills?.[s.id] ?? ROLL_PRESETS[rolls.preset ?? 'typical']?.tier ?? 2, ...ROLL_LIMITS.tier);
    const add = tier === 'misc' ? 0 : Math.max(0, build.skillSpend?.[s.id] ?? 0);
    if (tier !== 'misc') groupSpent[tier] += add;
    const fromBio = bio.skills[s.id] ?? 0;
    skills[s.id] = rolled + add + fromBio;
    skillRows.push({ ...s, tier, rolled, add, bio: fromBio, value: skills[s.id] });
  }
  const groupLeft = Object.fromEntries(Object.entries(groupSpent).map(([g, n]) => [g, ROLL_LIMITS.groupPool - n]));
  for (const [g, left] of Object.entries(groupLeft)) {
    if (left > 0) problems.push(`${left} ${g} skill point${left === 1 ? '' : 's'} left to place.`);
    if (left < 0) problems.push(`${-left} ${g} skill point${left === -1 ? '' : 's'} over the 6 the group gets.`);
  }

  // ---- derived ----
  const who = { race, career, willpower: stats.willpower, bio: bio.mods };
  const level = clamp(build.settings.planLevel ?? 10, 1, 100);
  const hpRange = hpPerLevelRange(career, stats.endurance);
  const magic = mageryWindows(career, stats.intelligence);
  const derived = {
    health: maxHealthAtLevel1(career),
    hpPerLevel: hpRange,
    healthAtPlanLevel: Math.round(expectedHealthAt(career, stats.endurance, level)),
    magicka: maxMagicka(career, stats.intelligence),
    magickaMultiplier: decoded.magery.multiplier,
    mageryWindows: magic,
    fatigue: fatigue(stats.strength, stats.endurance),
    encumbrance: maxEncumbrance(stats.strength),
    magicResist: magicResist(stats.willpower),
    toHit: toHitModifier(stats.agility),
    damage: damageModifier(stats.strength, overhaul),
    damageOtherRules: damageModifier(stats.strength, !overhaul),
    healthPerRestHour: healthPerRestHour({ endurance: stats.endurance, medical: skills[0], maxHealth: maxHealthAtLevel1(career), rapid: decoded.rapidHealing === 'general' }),
    magickaPerRestHour: magickaPerRestHour(career, maxMagicka(career, stats.intelligence), { online }),
    walk: walkSpeed(stats.speed),
    run: runSpeed(stats.speed, skills[21]),
  };

  // ---- leveling ----
  const startSum = levelUpSkillSum(career, skills);
  const leveling = {
    startSum,
    perLevel: LEVELUP_SKILL_SUM_PER_LEVEL,
    firstLevelAfter: 2,   // floor((0 + 28) / 15) = 1, so two points of the sum make level 2
    usesTable: [...career.primarySkills, ...career.majorSkills].map((id) => ({
      id, name: SKILLS[id].name, value: skills[id],
      uses: usesToRaise(Math.min(skills[id], 100), SKILLS[id].mult, classInfo.advancementMultiplier, 1),
      usesAtPlan: usesToRaise(Math.min(skills[id], 100), SKILLS[id].mult, classInfo.advancementMultiplier, level),
    })),
  };

  const sheet = {
    ok: true,
    build,
    race,
    career,
    decoded,
    classInfo,
    online,
    overhaul,
    stats,
    statRows,
    statPool: pool,
    statPoolLeft,
    skills,
    skillRows,
    groupLeft,
    bio: { ...bio, classIndex: bioIndex, questions },
    derived,
    resistances: resistanceSheet(who),
    weapons: weaponTable({ raceKey: race.key, career, stats, level }),
    leveling,
    level,
    startingSpellSkills: [...career.primarySkills, ...career.majorSkills].filter((id) => MAGIC_SKILLS.includes(id)),
    problems,
  };
  sheet.notes = interactionNotes(sheet);
  return sheet;
}
