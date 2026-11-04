#!/usr/bin/env node
// Reads the 18 classes (CLASS00..17.CFG) and their biography questionnaires (BIOG00T0..17T0.TXT)
// from YOUR copy of Daggerfall, through DFO Online's own file readers, and writes
// planner/data/game-data.json.
//
//   node planner/tools/extract-game-data.mjs [ARENA2 folder]
//
// The ARENA2 folder defaults to $ARENA2_PATH, then the Steam install. The output is gitignored:
// original game data is not redistributable (the same rule DFO keeps - Port-Doctrine.md).
//
// Why DFO's readers and not our own: the planner must see exactly what the game sees. The readers
// are imported straight from the clone in upstream/, so a fix there is a fix here.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKSPACE = resolve(HERE, '..', '..');
const DFO = join(WORKSPACE, 'upstream', 'daggerfall-js-source');
const STEAM = 'C:/Program Files (x86)/Steam/steamapps/common/The Elder Scrolls Daggerfall/DF/DAGGER/ARENA2';

const arena2 = process.argv[2] ?? process.env.ARENA2_PATH ?? STEAM;
if (!existsSync(join(arena2, 'CLASS00.CFG'))) {
  console.error(`No CLASS00.CFG in "${arena2}". Pass your ARENA2 folder as the first argument.`);
  process.exit(1);
}
if (!existsSync(join(DFO, 'src'))) {
  console.error(`DFO Online's source is not at ${DFO}. Run: bash scripts/setup-upstream.sh`);
  process.exit(1);
}

const dfo = (p) => import(pathToFileURL(join(DFO, 'src', p)).href);
const { ClassFile } = await dfo('formats/classFile.js');
const { parseBiog, biogFileName } = await dfo('formats/biogFile.js');
const { CLASS_CAREERS } = await dfo('systems/chargen.js');

const read = (name) => new Uint8Array(readFileSync(join(arena2, name)));

const classes = CLASS_CAREERS.map((fallbackName, index) => {
  const cf = new ClassFile();
  cf.load(read(`CLASS${String(index).padStart(2, '0')}.CFG`));
  const c = cf.career;
  return { index, ...c, name: c.name || fallbackName };
});

const biographies = CLASS_CAREERS.map((_, index) => {
  const name = biogFileName(index);
  try {
    const text = new TextDecoder('latin1').decode(read(name));
    const { questions } = parseBiog(text, index);
    // Only what a planner can use: the question, each answer, and its effect lines. The
    // backstory text commands (#, !, ?) only pick narrative text, so they are dropped.
    return questions.map((q) => ({
      text: q.text.filter(Boolean).join(' '),
      answers: q.answers.map((a) => ({
        text: a.text,
        effects: a.effects.filter((e) => !/^[#!?]/.test(e)),
      })),
    }));
  } catch (e) {
    console.warn(`${name}: ${e.message} - this class will have no biography in the planner`);
    return null;
  }
});

const sh = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8' }).trim(); } catch { return null; } };
const out = {
  generatedFrom: {
    arena2,
    dfoCommit: sh('git', ['-C', DFO, 'rev-parse', 'HEAD']),
    at: new Date().toISOString(),
  },
  classes,
  biographies,
};

mkdirSync(join(HERE, '..', 'data'), { recursive: true });
const target = join(HERE, '..', 'data', 'game-data.json');
writeFileSync(target, JSON.stringify(out, null, 1));
console.log(`Wrote ${classes.length} classes and ${biographies.filter(Boolean).length} biographies to ${target}`);
for (const c of classes) console.log(`  ${String(c.index).padStart(2)} ${c.name.padEnd(12)} HP/lvl ${String(c.hitPointsPerLevel).padStart(2)}  adv x${c.advancementMultiplier}`);
