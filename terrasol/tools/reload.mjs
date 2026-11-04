import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { ROOT, DATA, CONTROL_URL, GAME_URL } from '../src/config.mjs';
import { renameWithRetry } from '../src/atomic.mjs';
import { collectRevision, rollbackInstructions } from '../src/mind/revision.mjs';

const args = process.argv.slice(2);
let reason = 'Hot repair', restartDriver = false, holdOnly = false, noResume = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--driver') restartDriver = true;
  else if(args[i] === '--hold-only') holdOnly = true;
  else if(args[i] === '--no-resume') noResume = true;
  else if (args[i] === '--reason' && args[i + 1] && !args[i + 1].startsWith('--')) reason = args[++i];
  else throw Error('Usage: node tools/reload.mjs [--reason "description"] [--driver]');
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const read = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const atomic = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), { flag: 'wx' });
  renameWithRetry(tmp, file);
};
async function request(url, body, timeout = 5000) {
  const response = await fetch(url, { ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), signal: AbortSignal.timeout(timeout) });
  if (!response.ok) throw Error(`${url}: HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return response.json();
}
const health = () => request(`${CONTROL_URL}/health`);
const statusFile = path.join(DATA, 'session-status.json');
const commandFile = path.join(DATA, 'command.json');
const command = name => {
  const at = Math.max(Date.now(), (read(commandFile)?.at ?? 0) + 1);
  atomic(commandFile, { command: name, at });
  return at;
};
async function until(fn, ms, label) {
  const end = Date.now() + ms;
  while (Date.now() < end) { const value = await fn(); if (value) return value; await sleep(250); }
  throw Error(`Timed out waiting for ${label}`);
}
function executeTests(files) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ['--test', ...files], { cwd: ROOT, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    for (const stream of [proc.stdout, proc.stderr]) stream.on('data', b => { output += b.toString(); });
    proc.once('error', reject);
    proc.once('close', (code, signal) => resolve({ code, signal, output }));
  });
}
async function targets() { return request('http://127.0.0.1:5392/json/list'); }
function gameTarget(list) { const matches = list.filter(x => x.type === 'page' && x.url.startsWith(GAME_URL)); if (matches.length !== 1) throw Error(`Expected one existing game page, found ${matches.length}`); return { id: matches[0].id, url: matches[0].url }; }
const id = randomUUID(), started = new Date().toISOString();
const receipt = { id, started, reason, restartDriver, outcome: 'started' };
let receiptPath = path.join(DATA, 'repairs', `${id}.json`);
function save() { receipt.updated = new Date().toISOString(); atomic(receiptPath, receipt); }
try {
  receipt.beforeStatus = read(statusFile);
  const run = receipt.beforeStatus?.run;
  if (typeof run === 'string' && path.resolve(run).startsWith(path.resolve(DATA, 'runs') + path.sep) && fs.existsSync(run)) receiptPath = path.join(run, 'repairs', `${id}.json`);
  receipt.beforeHealth = await health();
  if (!receipt.beforeHealth.busy) {
    try { receipt.beforeObservation = await request(`${CONTROL_URL}/observe`, undefined, 15000); }
    catch (e) { receipt.beforeObservationError = e.message; }
  } else receipt.beforeObservationError = 'Controller busy; observation skipped before hold.';
  if (restartDriver) {receipt.beforeTarget = gameTarget(await targets());try{receipt.beforeIdentity=await request(`${CONTROL_URL}/repair-identity`);}catch{receipt.beforeIdentity=null;}}
  save();
  receipt.originalHold = receipt.beforeStatus?.state==='held'?{state:'held',reason:receipt.beforeStatus.reason??receipt.beforeStatus.mind?.pauseReason??null}:null;
  if(!receipt.originalHold)receipt.holdCommandAt = command('hold');
  receipt.stop = await request(`${CONTROL_URL}/stop`, {}, 15000);
  if(receipt.stop?.cleanupPending!==false)throw Error('Input release was not verified');
  const before = receipt.beforeStatus;
  if (before && ['playing', 'ending'].includes(before.state)) {
    receipt.heldStatus = await until(() => { const s = read(statusFile); return s?.run === before.run && s.epoch === before.epoch && s.state === 'held' ? s : null; }, 30000, 'the active epoch to enter held state');
  } else if (before?.state === 'held') receipt.heldStatus = before;
  else receipt.noActiveSupervisor = true;
  save();
  if(holdOnly){receipt.outcome='held';save();console.log(JSON.stringify({outcome:receipt.outcome,receipt:receiptPath}));}
  else {
  const testFiles = fs.readdirSync(path.join(ROOT, 'test')).filter(x => x.endsWith('.test.mjs')).sort().map(x => path.join(ROOT, 'test', x));
  if (!testFiles.length) throw Error('No test files found');
  receipt.tests = await executeTests(testFiles);
  if (receipt.tests.code !== 0) throw Error('Tests failed; session remains held');
  const revision = path.join(DATA, 'revisions', id);
  fs.mkdirSync(revision, { recursive: true });
  receipt.revision = revision;
  const revisionManifest = collectRevision({ root: ROOT, dirs: ['src', 'test', 'vendor', 'tools'], revisionDir: revision, copy: true });
  receipt.files = revisionManifest.files.map(file => ({ path: file.path, sha256: file.sha256 }));
  receipt.classes = revisionManifest.classes;
  receipt.hotSwap = revisionManifest.hotSwap;
  if (receipt.beforeObservation?.screen && fs.existsSync(receipt.beforeObservation.screen)) {
    fs.copyFileSync(receipt.beforeObservation.screen, path.join(revision, 'before.png'), fs.constants.COPYFILE_EXCL);
    receipt.beforeScreenshot = path.join(revision, 'before.png');
  }
  atomic(path.join(revision, 'manifest.json'), { ...revisionManifest, id, started, reason, files: receipt.files, beforeStatus: receipt.beforeStatus, beforeHealth: receipt.beforeHealth, beforeObservation: receipt.beforeObservation, beforeTarget: receipt.beforeTarget, rollback: rollbackInstructions(id) });
  save();
  if (restartDriver) {
    const current = await health();
    if (current.pid !== receipt.beforeHealth.pid) throw Error('Driver changed while holding; refusing to stop an unexpected process');
    if (gameTarget(await targets()).id !== receipt.beforeTarget.id) throw Error('Game page changed before driver restart');
    process.kill(current.pid);
    await until(async () => { try { await health(); return false; } catch { return true; } }, 10000, 'old driver to stop');
    const logs = path.join(DATA, 'driver-reloads'); fs.mkdirSync(logs, { recursive: true });
    const out = fs.openSync(path.join(logs, `${id}.out.log`), 'a'), err = fs.openSync(path.join(logs, `${id}.err.log`), 'a');
    try {
      const proc = spawn(process.execPath, [path.join(ROOT, 'src', 'browser.mjs'), '--headless'], { cwd: ROOT, detached: true, windowsHide: true, stdio: ['ignore', out, err] });
      proc.unref(); receipt.spawnedDriverPid = proc.pid;
    } finally { fs.closeSync(out); fs.closeSync(err); }
    receipt.afterHealth = await until(async () => { try { const h = await health(); return h.ok && h.pid !== current.pid ? h : null; } catch { return null; } }, 30000, 'replacement driver');
    receipt.afterTarget = gameTarget(await targets());
    try{receipt.afterIdentity=await request(`${CONTROL_URL}/repair-identity`);}catch{receipt.afterIdentity=null;}
    if(noResume){receipt.replacementStop=await request(`${CONTROL_URL}/stop`,{},15000);if(receipt.replacementStop?.cleanupPending!==false)throw Error('Replacement release was not verified');}
    if (receipt.afterHealth.pid !== receipt.spawnedDriverPid || receipt.afterHealth.url !== receipt.beforeHealth.url || receipt.afterHealth.generation === current.generation || receipt.afterTarget.id !== receipt.beforeTarget.id || receipt.afterTarget.url !== receipt.beforeTarget.url) throw Error('Driver reconnection did not preserve the expected game page');
  } else receipt.afterHealth = await health();
  receipt.afterObservation = await request(`${CONTROL_URL}/observe`, undefined, 15000);
  if (receipt.afterObservation.screen && fs.existsSync(receipt.afterObservation.screen)) {
    fs.copyFileSync(receipt.afterObservation.screen, path.join(revision, 'after.png'), fs.constants.COPYFILE_EXCL);
    receipt.afterScreenshot = path.join(revision, 'after.png');
  }
  if (!noResume && receipt.heldStatus && Date.parse(receipt.heldStatus.deadline) > Date.now() && !fs.existsSync(path.join(receipt.heldStatus.run,'summary.json'))) {
    receipt.resumeCommandAt = command('resume');
    try {
      receipt.resumedStatus = await until(() => { const s = read(statusFile); return s?.run === receipt.heldStatus.run && s.state === 'playing' && s.epoch > receipt.heldStatus.epoch ? s : null; }, 30000, 'a new playing epoch');
      receipt.outcome = 'resumed';
    } catch (e) { receipt.outcome = 'repair-complete-no-resumed-supervisor'; receipt.resumeError = e.message; }
  } else receipt.outcome = noResume?'replacement-held':'repair-complete-no-active-supervisor';
  save();
  console.log(JSON.stringify({ outcome: receipt.outcome, receipt: receiptPath, revision }, null, 2));
  }
} catch (e) {
  receipt.outcome = receipt.holdCommandAt ? 'failed-after-hold-request' : 'failed-before-hold'; receipt.error = e.message;
  try { save(); } catch (writeError) { console.error(`Could not write repair receipt: ${writeError.message}`); }
  console.error(JSON.stringify({ outcome: receipt.outcome, error: e.message, receipt: receiptPath }));
  process.exitCode = 1;
}
