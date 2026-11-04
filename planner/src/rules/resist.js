// How hard a character is to paralyse, poison, sicken or burn: the saving throw and the two
// hard-immunity gates, for the PLAYER, as DFO Online computes them.
//
// Sources (upstream/daggerfall-js-source):
//   src/systems/spellcast.js  savingChance / savingThrow / spellHasFlags   (FormulaHelper.SavingThrow)
//   src/systems/effects.js    isEntityImmuneToParalysis / isEntityImmuneToDisease
//                             and the Paralyze arm of applySpell (the gate order)
// What the planner leaves out, because a fresh character has none of it: spell-effect resistances
// (Resist Fire etc., rolled before the throw), worn resistance affixes, curses, and fortified Willpower.
import { EFFECT_FLAGS, ELEMENTS } from './tables.js';
import { careerTolerance } from './career.js';

/** FormulaHelper.SpellHasFlags. The last clause is element-blind: ANY paralysis spell matches a
 *  paralysis flag, whatever its element. */
export function spellHasFlags(element, checkFlags, spellEffectFlags) {
  return (element === ELEMENTS.Fire && (checkFlags & EFFECT_FLAGS.Fire) !== 0)
    || (element === ELEMENTS.Frost && (checkFlags & EFFECT_FLAGS.Frost) !== 0)
    || (element === ELEMENTS.DiseaseOrPoison && (checkFlags & spellEffectFlags & (EFFECT_FLAGS.Disease | EFFECT_FLAGS.Poison)) !== 0)
    || (element === ELEMENTS.Shock && (checkFlags & EFFECT_FLAGS.Shock) !== 0)
    || (element === ELEMENTS.Magic && (checkFlags & EFFECT_FLAGS.Magic) !== 0)
    || ((spellEffectFlags & EFFECT_FLAGS.Paralysis) !== 0 && (checkFlags & EFFECT_FLAGS.Paralysis) !== 0);
}

/**
 * The saving throw's chance before the roll, with every term kept so the planner can show its
 * working. `who` = { race, career, willpower, bio: { magic, poison, disease } }.
 * Answers { immune, chance, steps: [{ label, delta|set }] }.
 */
export function savingChance(element, effectFlags, who) {
  const steps = [];
  let saving = 50;
  steps.push({ label: 'Base', value: 50 });
  const rt = who.race ?? {};
  // The player's racial flags - note an immunity ASSIGNS 100 rather than adding.
  if (spellHasFlags(element, rt.resistanceFlags ?? 0, effectFlags)) { saving += 30; steps.push({ label: `${rt.name}: racial resistance`, delta: +30 }); }
  if (spellHasFlags(element, rt.immunityFlags ?? 0, effectFlags)) { saving = 100; steps.push({ label: `${rt.name}: racial immunity (sets the throw to 100)`, set: 100 }); }
  if (spellHasFlags(element, rt.lowToleranceFlags ?? 0, effectFlags)) { saving -= 25; steps.push({ label: `${rt.name}: racial low tolerance`, delta: -25 }); }
  if (spellHasFlags(element, rt.criticalWeaknessFlags ?? 0, effectFlags)) { saving -= 50; steps.push({ label: `${rt.name}: racial critical weakness`, delta: -50 }); }

  // The class's tolerances are folded into a SET: Resistance to Paralysis and Resistance to Magic on
  // one spell count as ONE "Resistant" (+25), not two.
  const career = who.career ?? {};
  const kinds = { Immune: [], CriticalWeakness: [], LowTolerance: [], Resistant: [] };
  let bio = 0;
  const bioSteps = [];
  const fold = (flag, name) => { const t = careerTolerance(career, flag); if (t !== 'Normal') kinds[t].push(name); };
  if (effectFlags & EFFECT_FLAGS.Paralysis) fold(EFFECT_FLAGS.Paralysis, 'Paralysis');
  if (effectFlags & EFFECT_FLAGS.Magic) {
    fold(EFFECT_FLAGS.Magic, 'Magic');
    if (who.bio?.magic) { bio += who.bio.magic; bioSteps.push({ label: 'Biography: resist magic', delta: who.bio.magic }); }
  }
  if (effectFlags & EFFECT_FLAGS.Poison) {
    fold(EFFECT_FLAGS.Poison, 'Poison');
    if (who.bio?.poison) { bio += who.bio.poison; bioSteps.push({ label: 'Biography: resist poison', delta: who.bio.poison }); }
  }
  if (effectFlags & EFFECT_FLAGS.Fire) fold(EFFECT_FLAGS.Fire, 'Fire');
  if (effectFlags & EFFECT_FLAGS.Frost) fold(EFFECT_FLAGS.Frost, 'Frost');
  if (effectFlags & EFFECT_FLAGS.Shock) fold(EFFECT_FLAGS.Shock, 'Shock');
  if (effectFlags & EFFECT_FLAGS.Disease) {
    fold(EFFECT_FLAGS.Disease, 'Disease');
    if (who.bio?.disease) { bio += who.bio.disease; bioSteps.push({ label: 'Biography: resist disease', delta: who.bio.disease }); }
  }
  const tolSteps = [['Immune', +50, 'immunity'], ['CriticalWeakness', -50, 'critical weakness'], ['LowTolerance', -25, 'low tolerance'], ['Resistant', +25, 'resistance']];
  for (const [kind, delta, word] of tolSteps) {
    if (!kinds[kind].length) continue;
    saving += delta;
    const note = kinds[kind].length > 1 ? ` (${kinds[kind].join(' + ')} - counted once)` : ` to ${kinds[kind][0]}`;
    steps.push({ label: `Class: ${word}${note}`, delta });
  }
  saving += bio;
  steps.push(...bioSteps);
  if (saving >= 100) {
    steps.push({ label: 'At 100 or more the throw always succeeds (before Willpower is added)', set: 100 });
    return { immune: true, chance: 100, steps };
  }
  const wil = Math.floor((who.willpower ?? 50) / 10);
  saving += wil;
  steps.push({ label: `Willpower ${who.willpower ?? 50} / 10`, delta: wil });
  const clamped = Math.max(5, Math.min(95, saving));
  if (clamped !== saving) steps.push({ label: 'Clamped to 5..95', set: clamped });
  return { immune: false, chance: clamped, steps };
}

/** The throw's dice (savingThrow): a d100 at or under the chance saves, and within 20 under it the
 *  save is only PARTIAL - 100 - 5 x (chance - roll) per cent of the effect still lands. Answers the
 *  percent of the effect that lands for each of the 100 rolls. */
export function throwOutcomes(chance, immune) {
  const out = [];
  for (let roll = 1; roll <= 100; roll++) {
    if (immune) { out.push(0); continue; }
    let percent = 100;
    if (roll <= chance) percent = chance - 20 <= roll ? 100 - 5 * (chance - roll) : 0;
    out.push(Math.max(0, Math.min(100, percent)));
  }
  return out;
}

/** An all-or-nothing effect (paralysis, a poisoning, a disease) needs the throw to come back 0:
 *  only a FULL save stops it. Per cent of throws that stop it. */
export const fullSaveChance = (chance, immune) => (immune ? 100 : throwOutcomes(chance, false).filter((p) => p === 0).length);

/** A damage spell is scaled by the throw: the average share of its damage that lands. */
export const averageDamageTaken = (chance, immune) =>
  (immune ? 0 : throwOutcomes(chance, false).reduce((a, p) => a + p, 0) / 100);

/** IsEntityImmuneToParalysis / IsEntityImmuneToDisease for a player with no curse and no Free
 *  Action: the class's Immune, or the race's immunity UNLESS the class carries Low Tolerance or
 *  Critical Weakness to the same thing. Answers { immune, why }. */
export function hardImmunity(flag, who) {
  const t = careerTolerance(who.career ?? {}, flag);
  if (t === 'Immune') return { immune: true, why: 'class immunity' };
  const race = who.race ?? {};
  if (((race.immunityFlags ?? 0) & flag) !== 0) {
    if (t === 'LowTolerance' || t === 'CriticalWeakness') {
      return { immune: false, why: `the class's ${t === 'LowTolerance' ? 'Low Tolerance' : 'Critical Weakness'} overrides the ${race.name} immunity` };
    }
    return { immune: true, why: `${race.name} racial immunity` };
  }
  return { immune: false, why: null };
}

/** The threats the planner tests every build against. Each is a real thing in the game:
 *  every classic paralysis spell (Paralysis, Spider Touch, Medusa's Gaze, Wizard Rend, Force Bolt)
 *  is Magic-element, and its saving throw reads Paralysis | Magic. A monster's poison or disease is
 *  rolled against DiseaseOrPoison with the Poison or Disease flag. */
export const THREATS = Object.freeze([
  { key: 'paralysis', name: 'Paralysis', element: ELEMENTS.Magic, flags: EFFECT_FLAGS.Paralysis | EFFECT_FLAGS.Magic, allOrNothing: true, gate: EFFECT_FLAGS.Paralysis,
    example: 'Paralysis, Spider Touch, Medusa\'s Gaze (all Magic-element)' },
  { key: 'poison', name: 'Poison', element: ELEMENTS.DiseaseOrPoison, flags: EFFECT_FLAGS.Poison, allOrNothing: true, gate: EFFECT_FLAGS.Poison, classOnlyGate: true,
    example: 'a poisoned weapon or a spider\'s bite' },
  { key: 'disease', name: 'Disease', element: ELEMENTS.DiseaseOrPoison, flags: EFFECT_FLAGS.Disease, allOrNothing: true, gate: EFFECT_FLAGS.Disease,
    example: 'a rat\'s or a zombie\'s bite' },
  { key: 'magic', name: 'Magic damage', element: ELEMENTS.Magic, flags: EFFECT_FLAGS.Magic, allOrNothing: false, example: 'a Magic-element damage spell' },
  { key: 'fire', name: 'Fire damage', element: ELEMENTS.Fire, flags: EFFECT_FLAGS.Fire, allOrNothing: false, example: 'a fireball' },
  { key: 'frost', name: 'Frost damage', element: ELEMENTS.Frost, flags: EFFECT_FLAGS.Frost, allOrNothing: false, example: 'a frost bolt' },
  { key: 'shock', name: 'Shock damage', element: ELEMENTS.Shock, flags: EFFECT_FLAGS.Shock, allOrNothing: false, example: 'a shock spell' },
]);

/** The whole resistance sheet for one character. */
export function resistanceSheet(who) {
  return THREATS.map((t) => {
    // InflictPoison's gate is the class's Immune alone (src/systems/poisons.js); paralysis and disease
    // also read the race (IsEntityImmuneToParalysis / IsEntityImmuneToDisease).
    const gate = !t.gate ? { immune: false, why: null }
      : t.classOnlyGate ? (careerTolerance(who.career ?? {}, t.gate) === 'Immune' ? { immune: true, why: 'class immunity' } : { immune: false, why: null })
        : hardImmunity(t.gate, who);
    const sc = savingChance(t.element, t.flags, who);
    const immune = gate.immune || sc.immune;
    return {
      ...t,
      gate,
      saving: sc,
      immune,
      stopChance: gate.immune ? 100 : t.allOrNothing ? fullSaveChance(sc.chance, sc.immune) : null,
      damageTaken: t.allOrNothing ? null : averageDamageTaken(sc.chance, sc.immune),
    };
  });
}
