// Test helper: import DFO Online's own modules straight from the clone in upstream/, so every
// parity test compares the planner against the code the game actually runs.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const WORKSPACE = resolve(HERE, '..', '..');
export const DFO_ROOT = process.env.DFO_ROOT ? resolve(process.env.DFO_ROOT) : join(WORKSPACE, 'upstream', 'daggerfall-js-source');
export const HAVE_DFO = existsSync(join(DFO_ROOT, 'src', 'systems', 'spellcast.js'));
export const SKIP_DFO = HAVE_DFO ? false : 'upstream/daggerfall-js-source is not cloned (bash scripts/setup-upstream.sh)';

const GAME_DATA = join(WORKSPACE, 'planner', 'data', 'game-data.json');
export const gameData = existsSync(GAME_DATA) ? JSON.parse(readFileSync(GAME_DATA, 'utf8')) : null;
export const SKIP_DATA = gameData ? false : 'planner/data/game-data.json is missing (node planner/tools/extract-game-data.mjs)';

/** import('src/<path>') from DFO Online. */
export const dfo = (path) => import(pathToFileURL(join(DFO_ROOT, 'src', path)).href);

/** A small seeded random source, so a failing case can be replayed. */
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pickOne = (rnd, list) => list[Math.floor(rnd() * list.length)];
export const between = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
