#!/usr/bin/env node
// Writes the planner's preset builds (planner/presets/) as a DFO class file (import it in DFO's custom-class
// builder) and a planner plan (open it with "Open plan or class file"). The reasoning is docs/05-strongest-melee.md.
//   node planner/tools/write-presets.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultBuild, compute } from '../src/rules/build.js';
import { classDocument } from '../src/rules/share.js';
import { SKILLS } from '../src/rules/tables.js';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'presets');
const gameData = JSON.parse(readFileSync(resolve(OUT, '..', 'data', 'game-data.json'), 'utf8'));

/** Typical dice; the bonus pool into the melee attributes in turn, each skill group's 6 points into its first skill. */
function fillLowest(build, sheet) {
  const order = ['speed', 'strength', 'luck', 'agility', 'endurance'];
  for (let i = 0; i < sheet.statPoolLeft; i++) build.statSpend[order[i % order.length]] = (build.statSpend[order[i % order.length]] ?? 0) + 1;
  for (const ids of [sheet.career.primarySkills, sheet.career.majorSkills, sheet.career.minorSkills]) build.skillSpend[ids[0]] = 6;
}
const id = (name) => SKILLS.find((s) => s.name === name).id;
const pick = ([primary, secondary = '']) => ({ primary, secondary });
const NO_MAGIC = [['darknessPoweredMagery', 'unableToUseMagicInDaylight'], ['lightPoweredMagery', 'unableToUseMagicInDarkness'], ['inabilityToRegen']];
const MELEE_STATS = { strength: 75, intelligence: 10, willpower: 10, agility: 75, endurance: 70, personality: 10, speed: 75, luck: 75 };
const UTILITY = ['Medical', 'Running', 'Stealth', 'Jumping', 'Climbing', 'Swimming', 'Backstabbing', 'Streetwise', 'Etiquette'];

const PRESETS = [
  {
    file: 'tiger-fist', race: 'Khajiit', name: 'Tiger Fist',
    skills: ['Hand-to-Hand', 'Critical Strike', 'Dodging', ...UTILITY],
    advantages: [['expertiseIn', 'handToHand'], ['immunity', 'toParalysis'], ['immunity', 'toDisease'], ['athleticism'], ['adrenalineRush']],
    disadvantages: [...NO_MAGIC, ['forbiddenMaterial', 'steel'], ['forbiddenMaterial', 'elven'], ['forbiddenMaterial', 'dwarven']],
    // the Acrobat questionnaire (this class's affinity): three answers of +6 Hand-to-Hand, one +6 Critical Strike, one +6 Dodging
    bio: { 0: 'Hand-to-hand combat', 1: 'Critical-Striking', 6: 'a better brawler', 8: 'Dodging', 9: 'Scrapper' },
  },
  {
    file: 'ashen-blade', race: 'DarkElf', name: 'Ashen Blade',
    skills: ['Long Blade', 'Critical Strike', 'Dodging', ...UTILITY],
    advantages: [['expertiseIn', 'longBlade'], ['immunity', 'toParalysis'], ['immunity', 'toDisease'], ['athleticism'], ['adrenalineRush']],
    // the weapon ladder left open: iron, steel, dwarven, ebony, orcish, daedric
    disadvantages: [...NO_MAGIC, ['forbiddenMaterial', 'elven'], ['forbiddenMaterial', 'adamantium'], ['forbiddenMaterial', 'mithril'], ['forbiddenMaterial', 'silver']],
    bio: {},
  },
];

mkdirSync(OUT, { recursive: true });
for (const p of PRESETS) {
  const custom = {
    name: p.name, hp: 30, skills: p.skills.map(id), stats: { ...MELEE_STATS },
    advantages: p.advantages.map(pick), disadvantages: p.disadvantages.map(pick),
    reps: { merchants: 0, peasants: 0, scholars: 0, nobility: 0, underworld: 0 },
  };
  writeFileSync(join(OUT, `${p.file}.dfo-class.json`), JSON.stringify(classDocument(custom), null, 2) + '\n');
  const build = { ...defaultBuild(), race: p.race, classMode: 'custom', custom, bio: {} };
  // The plan stores answer NUMBERS only; the answer text is matched here against your own game data.
  const questions = compute(build, gameData).bio.questions ?? [];
  for (const [q, text] of Object.entries(p.bio)) {
    const a = questions[q]?.answers.findIndex((x) => x.text === text) ?? -1;
    if (a < 0) throw new Error(`${p.name}: question ${Number(q) + 1} has no answer "${text}"`);
    build.bio[q] = a;
  }
  const placed = compute(build, gameData);
  fillLowest(build, placed);
  writeFileSync(join(OUT, `${p.file}.dfo-plan.json`), JSON.stringify({ format: 'dfo-planner/build', build }, null, 2) + '\n');
  console.log(`wrote presets/${p.file}.dfo-class.json and .dfo-plan.json`);
}
