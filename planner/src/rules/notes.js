// The planner's explanations: every rule interaction a build actually touches, said plainly, with
// where in DFO Online's source it lives. Each note is { id, kind, title, body, source }, where kind is
//   'exploit'  - the rules hand this build more than its price suggests
//   'trap'     - the build pays for something it does not get, or loses something it expects
//   'online'   - DFO's online rules differ from Daggerfall here
//   'info'     - worth knowing
import { RACES, EFFECT_FLAGS, SKILLS, labelOf, advDisAdjustment } from './tables.js';
import { careerTolerance } from './career.js';
import { savingChance, fullSaveChance } from './resist.js';

const EFFECT_NAME = { toParalysis: 'Paralysis', toMagic: 'Magic', toPoison: 'Poison', toFire: 'Fire', toFrost: 'Frost', toShock: 'Shock', toDisease: 'Disease' };
const TOL_WORD = { Resistant: 'Resistance', Immune: 'Immunity', LowTolerance: 'Low Tolerance', CriticalWeakness: 'Critical Weakness' };
const pct = (n) => `${Math.round(n)}%`;

export function interactionNotes(sheet) {
  const notes = [];
  const add = (n) => notes.push(n);
  const { race, career, decoded, stats, online, overhaul, resistances, classInfo } = sheet;
  const tolerances = decoded.tolerances;
  const isCustom = classInfo.isCustom;
  const who = { race, career, willpower: stats.willpower, bio: sheet.bio.mods };

  // ---- 1. a racial immunity meets a class weakness (the High Elf question) ----
  for (const [effect, bit] of [['toParalysis', EFFECT_FLAGS.Paralysis], ['toDisease', EFFECT_FLAGS.Disease]]) {
    if (!((race.immunityFlags ?? 0) & bit)) continue;
    const t = tolerances[effect];
    const threat = resistances.find((r) => r.key === (effect === 'toParalysis' ? 'paralysis' : 'disease'));
    if (t === 'LowTolerance' || t === 'CriticalWeakness') {
      const cost = advDisAdjustment(t === 'LowTolerance' ? 'lowTolerance' : 'criticalWeakness');
      // What an ordinary race with neither flag would have: the yardstick for "is it worth it".
      const plain = RACES.find((r) => !r.resistanceFlags && !r.immunityFlags);
      const base = savingChance(threat.element, threat.flags, { race: plain, career: { ...career, lowToleranceFlags: (career.lowToleranceFlags ?? 0) & ~bit, criticalWeaknessFlags: (career.criticalWeaknessFlags ?? 0) & ~bit }, willpower: stats.willpower, bio: who.bio });
      const baseStop = fullSaveChance(base.chance, base.immune);
      add({
        id: `racial-immunity-overridden-${effect}`,
        kind: 'trap',   // the classic trick no longer works: the immunity is what you pay with
        title: `${TOL_WORD[t]} ${EFFECT_NAME[effect]} cancels the ${race.name} immunity`,
        body: `In classic Daggerfall the ${race.name}'s immunity beat the class's weakness, so the weakness was free difficulty points. `
          + `Daggerfall Unity closed that, and DFO keeps the fix: a class with ${TOL_WORD[t]} to ${EFFECT_NAME[effect]} is no longer hard-immune. `
          + `What is left is the throw: the racial immunity still SETS it to 100 before the class's ${t === 'LowTolerance' ? '-25' : '-50'} is taken off, `
          + `so this character resists at ${pct(threat.saving.chance)} and fully stops ${pct(threat.stopChance)} of ${EFFECT_NAME[effect].toLowerCase()} attempts. `
          + `An ordinary race with no flag either way stops ${pct(baseStop)}. `
          + (t === 'CriticalWeakness'
            ? `So the ${cost} difficulty points buy faster leveling and leave you exactly as resistant as an average character: no immunity, but no real weakness either.`
            : `So the ${cost} points cost the immunity and still leave you better off than an average character.`),
        source: 'src/systems/effects.js isEntityImmuneToParalysis / isEntityImmuneToDisease; src/systems/spellcast.js savingChance',
      });
    } else if (t === 'Immune' || t === 'Resistant') {
      add({
        id: `racial-immunity-redundant-${effect}`,
        kind: 'trap',
        title: `${TOL_WORD[t]} ${EFFECT_NAME[effect]} does nothing for a ${race.name}`,
        body: `${race.name}s are already immune to ${EFFECT_NAME[effect].toLowerCase()}. The class's ${TOL_WORD[t]} costs ${advDisAdjustment(t === 'Immune' ? 'immunity' : 'resistance')} difficulty points (slower leveling) and changes nothing.`,
        source: 'src/systems/effects.js isEntityImmuneToParalysis',
      });
    }
  }

  // ---- 2. immunity reached through the saving throw, not a flag ----
  for (const r of resistances) {
    if (!r.saving.immune || r.gate.immune) continue;
    const classImmune = r.saving.steps.some((s) => /Class: immunity/.test(s.label));
    const raceImmune = r.saving.steps.some((s) => /racial immunity/.test(s.label));
    if (classImmune || raceImmune) continue;
    add({
      id: `save-immune-${r.key}`,
      kind: 'exploit',
      title: `Immune to ${r.name.toLowerCase()} without paying for Immunity`,
      body: `The throw against ${r.example} adds up to 100 or more (${r.saving.steps.filter((s) => s.delta).map((s) => `${s.label} ${s.delta > 0 ? '+' : ''}${s.delta}`).join(', ')}), `
        + 'and a throw at 100 always succeeds - before Willpower and before the 95% cap. '
        + (r.key === 'paralysis' ? 'Every classic paralysis spell is Magic-element, so a Magic resistance counts against all of them. ' : '')
        + 'A real Immunity would have cost 10 difficulty points.',
      source: 'src/systems/spellcast.js savingChance ("if (saving >= 100) return { immune: true }")',
    });
  }

  // ---- 3. two class tolerances on one spell count once ----
  const para = resistances.find((r) => r.key === 'paralysis');
  const paraKinds = [careerTolerance(career, EFFECT_FLAGS.Paralysis), careerTolerance(career, EFFECT_FLAGS.Magic)];
  if (paraKinds[0] !== 'Normal' && paraKinds[0] === paraKinds[1]) {
    add({
      id: 'tolerance-counted-once',
      kind: 'trap',
      title: `${TOL_WORD[paraKinds[0]]} to Paralysis and to Magic count once against paralysis`,
      body: 'A paralysis spell is tested with both the Paralysis and the Magic flag, but the class\'s tolerances are gathered into a set: '
        + `${TOL_WORD[paraKinds[0]]} applies ${paraKinds[0] === 'Resistant' ? '+25' : paraKinds[0] === 'Immune' ? '+50' : paraKinds[0] === 'LowTolerance' ? '-25' : '-50'} once, not twice.`
        + (para ? ` (Paralysis throw: ${para.saving.immune ? 'immune' : pct(para.saving.chance)}.)` : ''),
      source: 'src/systems/spellcast.js savingChance (the tolerance fold)',
    });
  } else if (paraKinds[0] !== 'Normal' && paraKinds[1] !== 'Normal') {
    add({
      id: 'tolerance-mixed',
      kind: 'info',
      title: 'Paralysis spells read both your Paralysis and your Magic tolerance',
      body: `Every paralysis spell is Magic-element, so ${TOL_WORD[paraKinds[0]]} to Paralysis and ${TOL_WORD[paraKinds[1]]} to Magic both apply to it.`,
      source: 'src/systems/effects.js (the Paralyze arm: Paralysis | the spell element\'s flag)',
    });
  }

  // ---- 4. biography modifiers overwrite ----
  for (const o of sheet.bio.overwritten ?? []) {
    add({
      id: `bio-overwrite-${o.label}`,
      kind: 'trap',
      title: `${o.label}: only one biography answer counts`,
      body: `Biography modifiers are set, not added. Question ${o.question + 1}'s answer replaces an earlier ${o.lost > 0 ? '+' : ''}${o.lost} with ${o.kept > 0 ? '+' : ''}${o.kept}.`,
      source: 'src/systems/biography.js applyBiographyEffect ("entity[field] = v")',
    });
  }
  if (sheet.bio.questions && Object.keys(sheet.build.bio ?? {}).length < sheet.bio.questions.length) {
    add({
      id: 'bio-skip-random',
      kind: 'info',
      title: 'Skipping the biography picks random answers',
      body: 'Choosing not to answer does not mean "no effects": the game picks a random answer to every question. Plan the answers you want and give them yourself.',
      source: 'DaggerfallStartNewGameWizard.cs ("Choose answers at random")',
    });
  }

  // ---- 5. magicka ----
  if (decoded.noRegenSpellPoints) {
    add(online ? {
      id: 'noregen-online',
      kind: 'exploit',
      title: 'Online, Inability To Regen Spell Points still lets rest restore magicka',
      body: 'DFO changed this for online play: resting restores magicka for every class (REST-MANA1). The disadvantage still pays its full -14 '
        + 'difficulty points, but online it only stops the slow trickle a class gets outside of rest. Offline it is Daggerfall\'s full penalty.',
      source: 'src/systems/rest.js restIgnoresNoRegen / spellPointRecoveryRate',
    } : {
      id: 'noregen-offline',
      kind: 'trap',
      title: 'No magicka from rest (offline)',
      body: 'Offline, this character recovers magicka only from potions, items and Spell Absorption. ' + (decoded.absorption ? '' : 'It has no Spell Absorption.'),
      source: 'src/systems/rest.js spellPointRecoveryRate',
    });
  }
  if (decoded.absorption) {
    add({
      id: 'absorption-rules',
      kind: 'info',
      title: `Spell Absorption (${labelOf(decoded.absorption)}): what it really does in DFO`,
      body: 'Only Destruction spells are absorbed, and only when your magicka has room for the spell\'s cost - at full magicka nothing is absorbed. '
        + 'The class version always absorbs, but DFO halves the magicka it gives back (ABSORB-NERF): you get half the spell\'s cost, rounded down.',
      source: 'src/systems/absorption.js (careerAbsorbs, absorbRefund)',
    });
  }
  if (decoded.darknessMagery || decoded.lightMagery) {
    const w = sheet.derived.mageryWindows;
    add({
      id: 'powered-magery',
      kind: 'info',
      title: 'Magicka that depends on the light',
      body: `Magicka ${w.raw} at full strength; ${w.inSunlight} in sunlight and ${w.outOfSunlight} out of it. `
        + '"Sunlight" is daytime outdoors; buildings, dungeons and night count as darkness.',
      source: 'src/systems/passiveSpecials.js (the magery pass)',
    });
  }

  // ---- 6. combat rules: the overhaul rewrites race and class bonuses ----
  if (overhaul) {
    const changed = { DarkElf: 'all weapons by level/4', Redguard: 'every non-bow weapon by level/3', WoodElf: 'bows by level/3' };
    const now = { Breton: 'nothing', HighElf: 'nothing', DarkElf: 'long and short blades', Redguard: 'long blades, blunt, axes and bows', WoodElf: 'short blades and bows', Khajiit: 'short blades and bare hands', Nord: 'axes, blunt weapons and bare-hand damage', Argonian: 'short blades' };
    add({
      id: 'overhaul-racial',
      kind: online ? 'online' : 'info',
      title: `${race.name} weapon bonus: ${now[race.key]}${changed[race.key] ? ` (Daggerfall Unity: ${changed[race.key]})` : ''}`,
      body: 'DFO turns on the Physical Combat And Armor Overhaul by default (always, online). It replaces Daggerfall\'s level-based racial bonuses '
        + 'with bonuses driven by your attributes, weapon by weapon - see the Weapons table. Armour also stops lowering your chance to be hit and reduces damage instead.',
      source: 'src/combat/pcaao.js pcaaoRacialModifiers; src/systems/modSettings.js (pcaao Enabled: default true)',
    });
    if (decoded.expertWeapons.length) {
      add({
        id: 'overhaul-expertise',
        kind: 'info',
        title: 'Expertise is attribute-based under the overhaul',
        body: 'Daggerfall Unity gives +level to hit and +(level/3 + 1) damage. The overhaul gives a fixed bonus from your attributes instead '
          + '(for example Long Blade: Agility/8 + Speed/20 + Luck/20 to hit), which is stronger early and does not grow with level.',
        source: 'src/combat/pcaao.js pcaaoProficiencyModifiers',
      });
    }
    if (decoded.adrenalineRush) {
      add({
        id: 'overhaul-adrenaline',
        kind: 'info',
        title: 'Adrenaline Rush starts below a sixth of your health (+8 to hit)',
        body: 'Under the overhaul it triggers below 1/6 of maximum health for +8 to hit (Daggerfall Unity: below 1/8, +5).',
        source: 'src/combat/pcaao.js pcaaoAdrenalineRushToHit',
      });
    }
    const atk = Object.entries(decoded.attack).filter(([, m]) => m !== 'normal');
    if (atk.length) {
      const will = Math.trunc((stats.willpower - 50) / 5);
      add({
        id: 'overhaul-bonus-phobia',
        kind: 'info',
        title: '"Bonus to hit" adds damage, and Willpower sizes it',
        body: `Despite its name, Bonus to hit adds DAMAGE against that kind of enemy. Under the overhaul each blow adds a random 0 to ${Math.max(10 + will, 0) - 1} `
          + '(10 + (WIL-50)/5, less half the foe\'s level), and a Phobia takes off half the foe\'s level less the same Willpower term. Daggerfall Unity uses your level for both.',
        source: 'src/combat/pcaao.js pcaaoBonusOrPenaltyByEnemyType; src/combat/formulas.js bonusOrPenaltyByEnemyType',
      });
    }
  }

  // ---- 7. specials worth explaining ----
  if (decoded.regeneration) add({ id: 'regen', kind: 'info', title: `Regenerate Health (${labelOf(decoded.regeneration)}): 1 health every 4 game minutes`,
    body: 'That is 15 health an hour wherever the condition holds, on top of resting.', source: 'src/systems/passiveSpecials.js (REGENERATE_AMOUNT, REGENERATE_PER_ROUNDS)' });
  if (decoded.sunDamage || decoded.holyDamage) add({ id: 'sun-holy', kind: 'trap', title: 'Damage from sunlight or holy places: 12 health every 4 minutes',
    body: `${decoded.sunDamage ? 'Outdoors by day' : ''}${decoded.sunDamage && decoded.holyDamage ? ', and ' : ''}${decoded.holyDamage ? 'inside temples (and the Fighters Guild trainers\' halls, a Daggerfall Unity quirk)' : ''} this burns 180 health an hour.`,
    source: 'src/systems/passiveSpecials.js (SUN_DAMAGE_AMOUNT, IsPlayerInHolyPlace)' });
  if (decoded.athleticism) add({ id: 'athleticism', kind: 'info', title: 'Athleticism: fatigue drains 10% slower', body: 'Running, jumping and swimming tire you at 90% of the normal rate (80% with the Improved Athleticism enchantment).', source: 'src/scenes/shared.js (PlayerEntity fatigueLossMultiplier)' });
  if (decoded.acuteHearing) add({ id: 'acute-hearing', kind: 'info', title: 'Acute Hearing: enemies sound 25% louder', body: 'Enemy sounds play at x1.25 volume (x1.5 with the Improved Acute Hearing enchantment), so you hear them coming sooner.', source: 'src/characters/enemySounds.js acuteHearingMultiplier' });

  // ---- 8. leveling ----
  if (isCustom && classInfo.difficulty >= -12 && classInfo.difficulty <= 40) {
    const m = classInfo.advancementMultiplier;
    add({
      id: 'difficulty',
      kind: classInfo.difficulty <= -6 ? 'exploit' : 'info',
      title: `Difficulty ${classInfo.difficulty > 0 ? '+' : ''}${classInfo.difficulty}: skills need x${m.toFixed(2)} the uses`,
      body: 'Every skill raise costs uses x this multiplier, so a lower difficulty means faster skills and faster levels. '
        + `It runs from x0.30 (difficulty -12) to x3.00 (+40). The Warrior's is x0.75; this class's skills rise ${m < 0.75 ? `${Math.round((0.75 / m - 1) * 100)}% faster` : m > 0.75 ? `${Math.round((1 - 0.75 / m) * 100)}% slower` : 'at the same pace'}.`,
      source: 'src/systems/customClass.js advancementMultiplier; src/systems/advancement.js skillUsesForAdvancement',
    });
  }
  add({
    id: 'first-level',
    kind: 'info',
    title: 'The first level comes almost at once',
    body: 'Level = floor((skill sum gained + 28) / 15), so two points in the leveling skills make level 2; after that, every 15. '
      + 'The leveling skills are your 3 primary, your 3 major less the lowest, and your single highest minor. Biography skill bonuses are counted into the starting sum, so they give no free level.',
    source: 'src/systems/advancement.js calculatePlayerLevel; src/systems/chargenSession.js finishChargen',
  });
  add({
    id: 'level-one-safety',
    kind: 'info',
    title: 'Nothing can poison you or give you a disease at level 1',
    body: 'Poisons and diseases both check that the target is past level 1 - a quirk kept from Daggerfall.',
    source: 'src/systems/poisons.js inflictPoison; src/systems/diseases.js inflictDisease',
  });
  if (online) {
    add({
      id: 'master-skills',
      kind: 'online',
      title: 'Online: Master Skills is always on',
      body: 'Every skill can reach 100 (Daggerfall\'s 95 lock is lifted). Five may go past 100, up to 200: you choose 2 primary, 2 major and 1 minor when they reach 100, '
        + 'and the choice is permanent. Points past 100 are 4x-16x slower and worth a quarter of a point in every formula, with milestone bonuses at 125/150/175/200.',
      source: 'src/systems/masterSkills.js; src/systems/skillSoftcap.js',
    });
  }

  // ---- 9. starting kit (Roleplay & Realism: Items, on by default) ----
  const luck = career.luck ?? 50;
  const upgrade = luck < 56 ? Math.trunc(luck / 2) : luck;
  add({
    id: 'starting-kit',
    kind: 'info',
    title: `Starting gear comes from your skills (${upgrade}% chance of steel and chain)`,
    body: 'DFO enables Roleplay & Realism: Items\' skill-based kit. Each primary and major skill hands out one item (a weapon for weapon skills, '
      + 'armour pieces for others, bandages for Medical...). The chance to get steel weapons and chain armour instead of iron and leather is read from the CLASS\'s '
      + `base Luck (${luck}), not your rolled Luck: half of it below 56, all of it from 56 up. Forbidden materials and armour steer the pick.`
      + (isCustom && luck >= 50 && luck < 56 ? ` Raising this class's base Luck to 56 would make it ${56}%.` : ''),
    source: 'src/systems/rriKits.js assignSkillItems / assignSkillEquipment',
  });
  if (sheet.startingSpellSkills.length) {
    add({
      id: 'starting-spells',
      kind: 'info',
      title: 'Starting spells come from your magic skills',
      body: `With Roleplay & Realism's skill-based spellbook (on by default) each primary or major magic school gives spells - a primary one gives more: ${sheet.startingSpellSkills.map((id) => SKILLS[id].name).join(', ')}.`,
      source: 'src/systems/rriKits.js assignSkillSpellbook',
    });
  }
  return notes;
}
