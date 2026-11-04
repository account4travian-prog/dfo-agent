import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {ROOT, ENGINE, ENGINE_COMMIT} from './config.mjs';

const defaultVendor = path.join(ROOT, 'vendor', 'native-agent');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function replaceOnce(text, before, after, label) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  before = before.replace(/\r?\n/g, eol); after = after.replace(/\r?\n/g, eol);
  if (text.includes(after)) return text;
  const first = text.indexOf(before);
  if (first < 0 || text.indexOf(before, first + before.length) >= 0) throw Error(`Native port incompatible seam: ${label}`);
  return text.slice(0, first) + after + text.slice(first + before.length);
}
export function ensureNativePort({engine = ENGINE, vendor = defaultVendor, engineCommit = ENGINE_COMMIT} = {}) {
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: engine, encoding: 'utf8'}).trim();
  if (commit !== engineCommit) throw Error(`Native port requires engine ${engineCommit}, got ${commit}`);
  const receiptPath = path.join(engine, '.rowan-native-manifest.json');
  let prior = {},priorPatches={};
  if (fs.existsSync(receiptPath)) {
    const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    if (receipt.version !== 1 || receipt.engineCommit !== commit || !receipt.sources || typeof receipt.sources !== 'object' || Array.isArray(receipt.sources) || Object.entries(receipt.sources).some(([name, hash]) => !/^[\w.-]+\.js$/.test(name) || !/^[a-f0-9]{64}$/.test(hash))) throw Error('Invalid native port installation receipt');
    prior = receipt.sources;
    priorPatches=receipt.patches??{};
    if(!priorPatches||typeof priorPatches!=='object'||Array.isArray(priorPatches)||Object.values(priorPatches).some(x=>typeof x!=='string'||x.length>100000))throw Error('Invalid host patch receipt');
  }
  const entries = fs.readdirSync(vendor).filter(n => n.endsWith('.js')).sort();
  const writes = [];
  const managed = {};
  for (const name of entries) {
    const source = fs.readFileSync(path.join(vendor, name));
    const target = path.join(engine, 'src', 'agent', name);
    const desired = sha256(source);
    managed[name] = desired;
    if (fs.existsSync(target)) {
      const actual = sha256(fs.readFileSync(target));
      if (actual !== desired && actual !== prior[name]) throw Error(`Native port target differs: ${target}`);
      if (actual !== desired) writes.push([target, source]);
    } else writes.push([target, source]);
  }
  const install = fs.readFileSync(path.join(vendor, 'world-install.txt'), 'utf8').trimEnd();
  const changes = [
    ['src/scenes/world.js', [
      ["import { attachGamepad, GLASS_PAD_ZOOM }", "import { journeyEvent } from '../agent/agentJourneyEvents.js'; // native port\nimport { attachGamepad, GLASS_PAD_ZOOM }", 'world import'],
      ["    cameraRecoiler.reset();\n    climbFeel.reset();   // AUDIT CLIMB-ARC", "    cameraRecoiler.reset(); journeyEvent('frame'); // native port\n    climbFeel.reset();   // AUDIT CLIMB-ARC", 'world teleport'],
      ["  // Shot-mode hooks: __move displaces the camera;", `${install}\n  // Shot-mode hooks: __move displaces the camera;`, 'world bridge']]],
    ['src/player/motor.js', [
      ["import { ClimbingState,", "import { journeyEvent } from '../agent/agentJourneyEvents.js'; // native port\nimport { ClimbingState,", 'motor import'],
      ["  spawn(x, y, z) {\n", "  spawn(x, y, z) {\n    journeyEvent('frame'); // native port: ladder, load, recall and rescue placement\n", 'motor placement']]],
    ['src/scenes/worldModes.js', [
      ["import { DecisionBoxWindow }", "import { journeyEvent, journeyMode } from '../agent/agentJourneyEvents.js'; // native port\nimport { DecisionBoxWindow }", 'modes import'],
      ["mode = next; if (next !== 'interior') { privateVisitRoom", "journeyMode(mode, next); mode = next; if (next !== 'interior') { privateVisitRoom", 'mode change'],
      ["      ctx.actions.onTeleport = ({ pos }) => {\n", "      ctx.actions.onTeleport = ({ pos }) => { journeyEvent('frame'); // native port\n", 'dungeon teleport']]]
  ];
  const managedPatches={};
  for (const [file, patches] of changes) {
    const target = path.join(engine, file);
    const original = fs.readFileSync(target, 'utf8');
    let result = original;
    for (const [before, after, label] of patches) {
      managedPatches[label]=after;
      const old=priorPatches[label];
      if(old&&old!==after)result=replaceOnce(result,old,after,label);
      else {if(label==='world bridge'&&!old&&result.includes("if (params.has('agent')) import('../agent/agentBridge.js')")&&!result.replaceAll('\r\n','\n').includes(after.replaceAll('\r\n','\n')))throw Error('Unrecognized installed world bridge; refusing duplicate installation');result=replaceOnce(result,before,after,label);}
    }
    if (result !== original) writes.push([target, Buffer.from(result)]);
  }
  const receipt = Buffer.from(JSON.stringify({version:1, engineCommit:commit, sources:managed,patches:managedPatches}, null, 2) + '\n');
  if (!fs.existsSync(receiptPath) || !fs.readFileSync(receiptPath).equals(receipt)) writes.push([receiptPath, receipt]);
  // All incompatibilities are checked before any write.
  for (const [target, content] of writes) { fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, content); }
  return {engineCommit: commit, sources: entries, patchedFiles: changes.map(([file]) => file)};
}
export async function readNative(page, after = 0) {
  try {
    return await page.evaluate((seq) => {
      const a = globalThis.__agent;
      if (!a || ['state','view','events','press','release','releaseAll','look','swing','_scan'].some(k => typeof a[k] !== 'function')) return {ready:false, reason:'native bridge unavailable', state:null, view:null, window:null, events:{lines:[], dropped:0}, targets:[]};
      // Idle scan cadence exceeds target TTL. Ask for a current camera sample,
      // then collect state/view in the same page evaluation without yielding.
      a._scan({fresh:true});
      const state = a.state(), view = a.view();
      const scan = view?.scan;
      const fresh = state?.scan?.fresh && state.frame === state.scan.frame && state.scan.frame === scan?.frame && state.scan.id === scan?.id && state.scan.page === scan?.page;
      const targets = fresh ? [...(state.foes ?? []).map(target => ({kind:'foe', target})), ...(view.things ?? []).map(target => ({kind:'thing', target}))] : [];
      let inventory=null;try{if(typeof a.inventory==='function')inventory=a.inventory();}catch{}
      return {ready:true, state, view, window:a.windowObservation?.() ?? null, inventory, events:a.events(seq), targets};
    }, after);
  } catch (err) { return {ready:false, reason:`native bridge read failed: ${err.message}`, state:null, view:null, window:null, events:{lines:[], dropped:0}, targets:[]}; }
}
