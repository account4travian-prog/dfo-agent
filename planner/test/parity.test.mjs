// Parity: the planner's restated rules against DFO Online's own code, on thousands of generated
// characters. If DFO changes a rule, these fail and say which one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dfo, SKIP_DFO, seeded, pickOne, between } from './dfo.mjs';
import * as T from '../src/rules/tables.js';
import * as C from '../src/rules/career.js';
import * as R from '../src/rules/resist.js';
import * as D from '../src/rules/derived.js';

const opts = { skip: SKIP_DFO };

/** A random, window-legal pick list pair, built through the planner's own refusal rules. */
function randomPicks(rnd, n = 8) {
  const advantages = [];
  const disadvantages = [];
  for (let i = 0; i < n * 3 && advantages.length + disadvantages.length < n; i++) {
    const kind = rnd() < 0.5 ? 'advantage' : 'disadvantage';
    const primary = pickOne(rnd, kind === 'advantage' ? T.ADVANTAGE_KEYS : T.DISADVANTAGE_KEYS);
    const second = T.secondaryListFor(primary);
    const pick = { primary, secondary: second ? pickOne(rnd, second) : '' };
    if (!C.refusalFor(pick, kind, advantages, disadvantages)) (kind === 'advantage' ? advantages : disadvantages).push(pick);
  }
  return { advantages, disadvantages };
}
const randomStats = (rnd) => Object.fromEntries(T.STAT_KEYS.map((k) => [k, between(rnd, 10, 100)]));
const twelveSkills = (rnd) => { const ids = [...Array(35).keys()]; for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; } return ids.slice(0, 12); };

test('tables match DFO: skills, advancement multipliers, magic skills', opts, async () => {
  const { SKILLS, SKILL_COUNT, MAGIC_SKILLS } = await dfo('systems/skills.js');
  const { SKILL_ADVANCEMENT_MULTIPLIER } = await dfo('systems/advancement.js');
  assert.equal(T.SKILLS.length, SKILL_COUNT);
  for (const s of T.SKILLS) {
    assert.equal(SKILLS[s.key], s.id, `${s.key} id`);
    assert.equal(SKILL_ADVANCEMENT_MULTIPLIER[s.id], s.mult, `${s.key} advancement multiplier`);
  }
  assert.deepEqual([...T.MAGIC_SKILLS], [...MAGIC_SKILLS]);
});

test('tables match DFO: races and their tolerance flags', opts, async () => {
  const { RACE_TEMPLATES, RACES } = await dfo('systems/races.js');
  const templates = Object.values(RACE_TEMPLATES);
  for (const r of T.RACES) {
    assert.equal(RACES[r.key], r.id, `${r.key} id`);
    const t = templates.find((x) => x.key === r.key);
    for (const f of ['resistanceFlags', 'immunityFlags', 'lowToleranceFlags', 'criticalWeaknessFlags']) assert.equal(t[f], r[f], `${r.key} ${f}`);
  }
  const { RACE_TEMP } = await dfo('systems/survival/temperature.js');
  for (const r of T.RACES) assert.equal(RACE_TEMP[r.id], r.temp, `${r.key} warmth`);
});

test('tables match DFO: the advantage catalogue and its costs', opts, async () => {
  const A = await dfo('systems/specialAdvantages.js');
  assert.deepEqual([...T.ADVANTAGE_KEYS], [...A.ADVANTAGE_KEYS]);
  assert.deepEqual([...T.DISADVANTAGE_KEYS], [...A.DISADVANTAGE_KEYS]);
  assert.deepEqual({ ...T.DIFFICULTY }, { ...A.DIFFICULTY });
  assert.deepEqual([...T.ONLY_ONE_KEYS], [...A.ONLY_ONE_KEYS]);
  assert.equal(T.MAX_ITEMS, A.MAX_ITEMS);
  for (const k of [...T.ADVANTAGE_KEYS, ...T.DISADVANTAGE_KEYS]) {
    assert.deepEqual(T.secondaryListFor(k) ? [...T.secondaryListFor(k)] : null, A.secondaryListFor(k) ? [...A.secondaryListFor(k)] : null, k);
    for (const s of T.secondaryListFor(k) ?? ['']) {
      assert.equal(T.advDisAdjustment(k, s), A.advDisAdjustment(k, s), `${k} ${s}`);
      assert.equal(T.pickLabel({ primary: k, secondary: s }), s ? `${A.labelFor(k)} ${A.labelFor(s)}` : A.labelFor(k));
    }
  }
});

test('the window\'s refusals match DFO\'s cannotAdd', opts, async () => {
  const A = await dfo('systems/specialAdvantages.js');
  const rnd = seeded(7);
  for (let i = 0; i < 3000; i++) {
    const { advantages, disadvantages } = randomPicks(rnd, between(rnd, 0, 8));
    const kind = rnd() < 0.5 ? 'advantage' : 'disadvantage';
    const primary = pickOne(rnd, kind === 'advantage' ? T.ADVANTAGE_KEYS : T.DISADVANTAGE_KEYS);
    const second = T.secondaryListFor(primary);
    const cand = { primary, secondary: second ? pickOne(rnd, second) : '' };
    const list = kind === 'advantage' ? advantages : disadvantages;
    const other = kind === 'advantage' ? disadvantages : advantages;
    assert.equal(!!C.blockingPick(cand, list, other), A.cannotAdd(cand, list, other), JSON.stringify({ cand, list, other }));
  }
});

test('custom careers: difficulty, multiplier and every bit match DFO', opts, async () => {
  const A = await dfo('systems/specialAdvantages.js');
  const CC = await dfo('systems/customClass.js');
  const rnd = seeded(11);
  for (let i = 0; i < 2000; i++) {
    const hp = between(rnd, C.HP_MIN, C.HP_MAX);
    const { advantages, disadvantages } = randomPicks(rnd);
    const adv = C.totalAdjust(advantages);
    const dis = C.totalAdjust(disadvantages);
    assert.equal(adv, A.totalAdjust(advantages.map((p) => ({ ...p, difficulty: A.advDisAdjustment(p.primary, p.secondary) }))));
    const points = C.difficultyPoints(hp, adv, dis);
    assert.equal(points, CC.difficultyPoints(hp, adv, dis));
    assert.equal(C.advancementMultiplier(points), CC.advancementMultiplier(points));
    const skills = twelveSkills(rnd);
    const stats = randomStats(rnd);
    const ours = C.applyPicks(C.buildCustomCareer({ name: 'X', hp, skills, stats, points }), [...advantages, ...disadvantages]);
    const theirs = A.parseCareerData(CC.buildCustomCareer({ name: 'X', hp, skills, stats, points }), [...advantages, ...disadvantages]);
    assert.deepEqual(ours, theirs);
    // and reading it back lists the same specials DFO's character sheet lists
    const back = C.picksFromCareer(ours);
    const sheet = A.classSpecials(ours).map((r) => `${r.primary}|${r.secondary}`).sort();
    assert.deepEqual([...back.advantages, ...back.disadvantages].map((p) => `${p.primary}|${p.secondary}`).sort(), sheet);
  }
});

test('saving throws and hard immunities match DFO for every race and random classes', opts, async () => {
  const S = await dfo('systems/spellcast.js');
  const E = await dfo('systems/effects.js');
  const A = await dfo('systems/specialAdvantages.js');
  const CC = await dfo('systems/customClass.js');
  const { RACE_TEMPLATES } = await dfo('systems/races.js');
  const rnd = seeded(23);
  for (let i = 0; i < 1500; i++) {
    const race = pickOne(rnd, T.RACES);
    const { advantages, disadvantages } = randomPicks(rnd, between(rnd, 0, 6));
    const career = A.parseCareerData(CC.buildCustomCareer({ name: 'X', hp: 8, skills: twelveSkills(rnd), stats: randomStats(rnd), points: 0 }), [...advantages, ...disadvantages]);
    const willpower = between(rnd, 10, 100);
    const bio = { magic: rnd() < 0.2 ? between(rnd, -10, 10) : 0, poison: rnd() < 0.2 ? between(rnd, -10, 10) : 0, disease: rnd() < 0.2 ? between(rnd, -10, 10) : 0 };
    const rt = Object.values(RACE_TEMPLATES).find((t) => t.key === race.key);
    const entity = {
      isPlayer: true, race: race.key, raceId: race.id, raceTemplate: rt, career, level: 5, stats: { willpower },
      biographyResistMagicMod: bio.magic, biographyResistPoisonMod: bio.poison, biographyResistDiseaseMod: bio.disease,
    };
    const who = { race, career, willpower, bio };
    for (const t of R.THREATS) {
      const theirs = S.savingChance(t.element, t.flags, entity);
      const ours = R.savingChance(t.element, t.flags, who);
      assert.equal(ours.immune, theirs.immune, `${race.key} ${t.key} immune ${JSON.stringify([advantages, disadvantages])}`);
      assert.equal(ours.chance, theirs.chance, `${race.key} ${t.key} chance`);
    }
    assert.equal(R.hardImmunity(T.EFFECT_FLAGS.Paralysis, who).immune, E.isEntityImmuneToParalysis(entity), `${race.key} paralysis gate`);
    assert.equal(R.hardImmunity(T.EFFECT_FLAGS.Disease, who).immune, E.isEntityImmuneToDisease(entity), `${race.key} disease gate`);
  }
});

test('the throw\'s dice: full saves and damage share match DFO\'s savingThrow, roll by roll', opts, async () => {
  const S = await dfo('systems/spellcast.js');
  for (const chance of [5, 20, 21, 40, 55, 80, 95]) {
    const target = { isPlayer: false, career: {}, stats: { willpower: 0 } };
    // drive DFO's throw to exactly `chance` with the modifier, then enumerate its d100
    const mod = chance - 50;
    const outcomes = [];
    for (let roll = 1; roll <= 100; roll++) {
      let calls = 0;
      // (roll - 0.5) / 100: the middle of the roll's slot, so float rounding cannot land on its neighbour
      outcomes.push(S.savingThrow(S.ELEMENTS.Fire, S.EFFECT_FLAGS.Fire, target, mod, () => (calls++ === 0 ? (roll - 0.5) / 100 : 0)));
    }
    assert.deepEqual(R.throwOutcomes(chance, false), outcomes, `chance ${chance}`);
  }
});

test('weapon bonuses match DFO: both rule sets, every race and weapon skill', opts, async () => {
  const F = await dfo('combat/formulas.js');
  const P = await dfo('combat/pcaao.js');
  const { WEAPONS } = await dfo('characters/weapons.js');
  const weaponFor = { 28: WEAPONS.Shortsword, 29: WEAPONS.Longsword, 31: WEAPONS.Battle_Axe, 32: WEAPONS.Mace, 33: WEAPONS.Long_Bow };
  const A = await dfo('systems/specialAdvantages.js');
  const CC = await dfo('systems/customClass.js');
  const rnd = seeded(31);
  for (let i = 0; i < 400; i++) {
    const race = pickOne(rnd, T.RACES);
    const stats = randomStats(rnd);
    const level = between(rnd, 1, 40);
    const experts = T.WEAPON_SKILLS.filter(() => rnd() < 0.4).map((id) => ({ primary: 'expertiseIn', secondary: T.WEAPON_SKILL_PROFICIENCY[id] }));
    const career = A.parseCareerData(CC.buildCustomCareer({ name: 'X', hp: 8, skills: twelveSkills(rnd), stats, points: 0 }), experts);
    const entity = { isPlayer: true, raceId: race.id, level, career, stats };
    for (const id of T.WEAPON_SKILLS) {
      const weapon = id === 30 ? null : { templateIndex: weaponFor[id], material: 0 };
      const dr = F.racialModifiers(entity, weapon);
      assert.deepEqual(D.racialModifiersDFU(race.key, id, level), { damage: dr.damageMod, toHit: dr.toHitMod }, `DFU racial ${race.key} ${id}`);
      const pr = P.pcaaoRacialModifiers(entity, weapon, entity);
      assert.deepEqual(D.racialModifiersPCAAO(race.key, id, stats), { damage: pr.damageMod, toHit: pr.toHitMod }, `PCAAO racial ${race.key} ${id}`);
      const de = F.proficiencyModifiers(entity, weapon);
      assert.deepEqual(D.expertiseDFU(career, id, level), { damage: de.damageMod, toHit: de.toHitMod }, `DFU expertise ${id}`);
      const pe = P.pcaaoProficiencyModifiers(entity, weapon);
      assert.deepEqual(D.expertisePCAAO(career, id, stats), { damage: pe.damageMod, toHit: pe.toHitMod }, `PCAAO expertise ${id}`);
    }
  }
});

test('derived stats and leveling laws match DFO', opts, async () => {
  const F = await dfo('combat/formulas.js');
  const P = await dfo('combat/pcaao.js');
  const CH = await dfo('systems/chargen.js');
  const ADV = await dfo('systems/advancement.js');
  const SK = await dfo('systems/skills.js');
  const M = await dfo('player/motor.js');
  const rnd = seeded(41);
  for (let i = 0; i < 500; i++) {
    const v = between(rnd, 0, 100);
    assert.equal(D.maxEncumbrance(v), F.maxEncumbrance(v));
    assert.equal(D.magicResist(v), F.magicResist(v));
    assert.equal(D.toHitModifier(v), F.toHitModifier(v));
    assert.equal(D.enduranceHpModifier(v), F.hitPointsModifier(v));
    assert.equal(D.healingRateModifier(v), F.healingRateModifier(v));
    assert.equal(D.damageModifier(v, true), P.pcaaoDamageModifier(v));
    assert.ok(Math.abs(D.walkSpeed(v) - M.walkSpeed(v)) < 1e-9);
    const running = between(rnd, 0, 100);
    assert.ok(Math.abs(D.runSpeed(v, running) - M.runSpeed(v, running)) < 1e-9);
    const bits = pickOne(rnd, [0, 4, 8, 12, 16, 20]) << 8;
    assert.equal(D.maxMagicka({ abilityFlagsAndSpellPointsBitfield: bits }, v), CH.spellPoints(v, CH.spellPointMultiplier(bits)));
    const hp = between(rnd, 4, 30);
    const range = D.hpPerLevelRange({ hitPointsPerLevel: hp }, v);
    assert.equal(range.min, CH.hitPointsPerLevelUp({ hitPointsPerLevel: hp }, v, () => 0));
    assert.equal(range.max, CH.hitPointsPerLevelUp({ hitPointsPerLevel: hp }, v, () => 0.999999));
    const skill = between(rnd, 1, 100);
    const mult = pickOne(rnd, T.SKILLS).mult;
    const adv = 0.3 + rnd() * 2.7;
    const level = between(rnd, 1, 40);
    assert.equal(D.usesToRaise(skill, mult, adv, level), ADV.skillUsesForAdvancement(skill, mult, adv, level));
    const a = between(rnd, 0, 400);
    const b = a + between(rnd, 0, 400);
    assert.equal(D.levelFromSums(a, b), ADV.calculatePlayerLevel(a, b));
    const skills = Array.from({ length: 35 }, () => between(rnd, 3, 100));
    const career = { primarySkills: twelveSkills(rnd).slice(0, 3), majorSkills: [], minorSkills: [] };
    const twelve = twelveSkills(rnd);
    Object.assign(career, { primarySkills: twelve.slice(0, 3), majorSkills: twelve.slice(3, 6), minorSkills: twelve.slice(6, 12) });
    assert.equal(D.levelUpSkillSum(career, skills), SK.levelUpSkillSum({ career, skills }));
  }
  assert.equal(D.LEVELUP_SKILL_SUM_PER_LEVEL, ADV.LEVELUP_SKILL_SUM_PER_LEVEL);
});

test('a planned custom class exports a file DFO Online imports unchanged', opts, async () => {
  const CC = await dfo('systems/customClass.js');
  const { classDocument } = await import('../src/rules/share.js');
  const rnd = seeded(53);
  for (let i = 0; i < 300; i++) {
    const { advantages, disadvantages } = randomPicks(rnd);
    const custom = { name: `Plan ${i}`, hp: between(rnd, 4, 30), skills: twelveSkills(rnd), stats: Object.fromEntries(T.STAT_KEYS.map((k) => [k, between(rnd, 10, 75)])), advantages, disadvantages,
      reps: { merchants: between(rnd, -10, 10), peasants: between(rnd, -10, 10), scholars: 0, nobility: 0, underworld: 0 } };
    const doc = classDocument(custom);
    const parsed = CC.parseCustomClassDoc(JSON.stringify(doc));
    assert.equal(parsed.ok, true, parsed.error);
    assert.deepEqual(parsed.skipped, []);
    assert.equal(parsed.value.hp, custom.hp);
    assert.deepEqual(parsed.value.skills, custom.skills);
    assert.deepEqual(parsed.value.stats, custom.stats);
    assert.deepEqual(parsed.value.advantages.map(({ primary, secondary }) => ({ primary, secondary })), advantages);
    assert.deepEqual(parsed.value.disadvantages.map(({ primary, secondary }) => ({ primary, secondary })), disadvantages);
  }
});
