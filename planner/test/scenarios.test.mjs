// Scenarios: the specific questions the planner exists to answer, pinned so the answers in
// docs/03-rule-interactions.md cannot drift from what the code says.
import test from 'node:test';
import assert from 'node:assert/strict';
import { gameData, SKIP_DATA } from './dfo.mjs';
import { defaultBuild, compute } from '../src/rules/build.js';

/** A custom class with these picks, everything else at its defaults, Willpower 50 + rolls. */
function custom(race, { advantages = [], disadvantages = [] } = {}, tweak = (b) => b) {
  const b = defaultBuild();
  b.race = race;
  b.classMode = 'custom';
  b.custom.advantages = advantages;
  b.custom.disadvantages = disadvantages;
  // flat rolls so the numbers are easy to read: Willpower lands on exactly 50
  b.rolls = { preset: 'worst', stats: Object.fromEntries(Object.keys(b.rolls.stats).map((k) => [k, 0])), pool: 6, skills: {} };
  return compute(tweak(b), gameData);
}
const threat = (sheet, key) => sheet.resistances.find((r) => r.key === key);

test('High Elf: immune to paralysis with no weakness', { skip: SKIP_DATA }, () => {
  const s = custom('HighElf');
  const p = threat(s, 'paralysis');
  assert.equal(p.gate.immune, true);
  assert.equal(p.stopChance, 100);
});

test('High Elf + Critical Weakness to Paralysis: the classic exploit is closed', { skip: SKIP_DATA }, () => {
  const s = custom('HighElf', { disadvantages: [{ primary: 'criticalWeakness', secondary: 'toParalysis' }] });
  const p = threat(s, 'paralysis');
  assert.equal(p.gate.immune, false, 'the weakness overrides the racial immunity');
  assert.equal(p.saving.chance, 55, '100 (racial) - 50 (weakness) + 5 (WIL 50)');
  assert.equal(p.stopChance, 35, 'only a full save stops paralysis: chance - 20');
  // ...which is exactly an ordinary race with no flags
  const plain = threat(custom('Redguard'), 'paralysis');
  assert.equal(plain.saving.chance, 55);
  assert.ok(s.notes.some((n) => n.id === 'racial-immunity-overridden-toParalysis' && n.kind === 'trap'));
});

test('High Elf + Low Tolerance to Paralysis: no immunity, still better than average', { skip: SKIP_DATA }, () => {
  const p = threat(custom('HighElf', { disadvantages: [{ primary: 'lowTolerance', secondary: 'toParalysis' }] }), 'paralysis');
  assert.equal(p.gate.immune, false);
  assert.equal(p.saving.chance, 80);
  assert.equal(p.stopChance, 60);
});

test('the "ordinary race" column of the High Elf table in docs/03', { skip: SKIP_DATA }, () => {
  const row = (dis) => threat(custom('Redguard', { disadvantages: dis ? [{ primary: dis, secondary: 'toParalysis' }] : [] }), 'paralysis');
  assert.deepEqual([row(null).saving.chance, row(null).stopChance], [55, 35]);
  assert.deepEqual([row('lowTolerance').saving.chance, row('lowTolerance').stopChance], [30, 10]);
  assert.deepEqual([row('criticalWeakness').saving.chance, row('criticalWeakness').stopChance], [5, 0]);
});

test('every standard class has base Luck 44-51 (the starting-kit cliff at 56 never reaches them)', { skip: SKIP_DATA }, () => {
  const lucks = gameData.classes.map((c) => c.luck);
  assert.equal(Math.min(...lucks), 44);
  assert.equal(Math.max(...lucks), 51);
});

test('High Elf + Resistance to Paralysis: points spent for nothing', { skip: SKIP_DATA }, () => {
  const s = custom('HighElf', { advantages: [{ primary: 'resistance', secondary: 'toParalysis' }] });
  assert.equal(threat(s, 'paralysis').stopChance, 100);
  assert.ok(s.notes.some((n) => n.id === 'racial-immunity-redundant-toParalysis'));
});

test('Breton + Resistance to Magic: immune to every paralysis spell through the throw', { skip: SKIP_DATA }, () => {
  const s = custom('Breton', { advantages: [{ primary: 'resistance', secondary: 'toMagic' }] });
  const p = threat(s, 'paralysis');
  assert.equal(p.gate.immune, false, 'no immunity flag anywhere...');
  assert.equal(p.saving.immune, true, '...but 50 + 30 (Breton) + 25 (Resistant) reaches 100');
  assert.equal(threat(s, 'magic').damageTaken, 0, 'and Magic-element damage spells land nothing');
  assert.ok(s.notes.some((n) => n.id === 'save-immune-paralysis' && n.kind === 'exploit'));
});

test('Nord + Resistance to Frost: immune to frost spells', { skip: SKIP_DATA }, () => {
  assert.equal(threat(custom('Nord', { advantages: [{ primary: 'resistance', secondary: 'toFrost' }] }), 'frost').saving.immune, true);
});

test('Resistance to Paralysis and to Magic count once against a paralysis spell', { skip: SKIP_DATA }, () => {
  const both = custom('Redguard', { advantages: [{ primary: 'resistance', secondary: 'toParalysis' }, { primary: 'resistance', secondary: 'toMagic' }] });
  const one = custom('Redguard', { advantages: [{ primary: 'resistance', secondary: 'toParalysis' }] });
  assert.equal(threat(both, 'paralysis').saving.chance, threat(one, 'paralysis').saving.chance);
  assert.ok(both.notes.some((n) => n.id === 'tolerance-counted-once'));
});

test('Inability to Regen: offline no magicka from rest, online rest still restores it', { skip: SKIP_DATA }, () => {
  const picks = { disadvantages: [{ primary: 'inabilityToRegen', secondary: '' }] };
  const offline = custom('Breton', picks, (b) => { b.settings.online = false; return b; });
  const online = custom('Breton', picks, (b) => { b.settings.online = true; return b; });
  assert.equal(offline.derived.magickaPerRestHour, 0);
  assert.ok(online.derived.magickaPerRestHour > 0);
  assert.ok(online.notes.some((n) => n.id === 'noregen-online' && n.kind === 'exploit'));
});

test('the game\'s refusals: an unbalanced class is flagged, not silently accepted', { skip: SKIP_DATA }, () => {
  const s = custom('Breton', {}, (b) => { b.custom.stats.strength = 75; return b; });
  assert.ok(s.problems.some((p) => /Attributes must total 400/.test(p)));
  const t = custom('Breton', {}, (b) => { b.custom.disadvantages = [{ primary: 'criticalWeakness', secondary: 'toFire' }]; return b; });
  assert.ok(t.problems.some((p) => /Difficulty must be -12/.test(p)), '8 HP and -14 is -14, below the floor');
});

test('Sorcerer (standard class): absorption, no regen, 3x magery decoded from CLASS03.CFG', { skip: SKIP_DATA }, () => {
  const b = defaultBuild();
  b.classIndex = 3;
  const s = compute(b, gameData);
  assert.equal(s.decoded.absorption, 'general');
  assert.equal(s.decoded.noRegenSpellPoints, true);
  assert.equal(s.decoded.magery.multiplier, 3);
  assert.equal(s.derived.magicka, s.stats.intelligence * 3);
});
