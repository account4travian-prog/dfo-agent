import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evaluateRules } from '../src/watch/rules.mjs';
import { watchOnce } from '../src/watch/watcher.mjs';

test('watcher holds for repeated stop reasons and no useful progress, but does not act while held', () => {
  const now = 10 * 60_000;
  const history = [
    { at: new Date(now - 30_000).toISOString(), kind: 'intent-outcome', task: { status: 'terminal', outcome: 'blocked', reason: 'blocked closing on Rat' } },
    { at: new Date(now - 20_000).toISOString(), kind: 'intent-outcome', task: { status: 'terminal', outcome: 'blocked', reason: 'blocked closing on Rat' } },
  ];
  const result = evaluateRules({ now, history, lastUsefulAt: now - 10 * 60_000, held: false, health: { state: 'ok' }, previousHealth: { state: 'ok' }, movementAdvanced: false, inputHeld: false, activeTask: false, lease: null, config: { idleMs: 300_000, repeatCount: 2, windowMs: 60_000 } });
  assert.ok(result.actions.some(action => action.type === 'hold' && action.rule === 'repeated-stop-reason'));
  const held = evaluateRules({ now, history, lastUsefulAt: 0, held: true, health: {}, previousHealth: {}, movementAdvanced: false, inputHeld: false, activeTask: false, lease: null, config: { idleMs: 1, repeatCount: 2, windowMs: 60_000 } });
  assert.equal(held.actions.length, 0);
});

test('watcher stops on dangling input lease and holds when health drops without movement', () => {
  const now = 120_000;
  const result = evaluateRules({ now, history: [], lastUsefulAt: now, held: false, health: { score: 1 }, previousHealth: { score: 5 }, healthFallPolls: 3, movementAdvanced: false, inputHeld: true, activeTask: false, lease: { startedAt: now - 20_000 }, config: { idleMs: 300_000, repeatCount: 3, windowMs: 60_000, leaseTimeoutMs: 10_000 } });
  assert.ok(result.actions.some(action => action.type === 'stop' && action.rule === 'input-without-task'));
  assert.ok(result.actions.some(action => action.type === 'stop' && action.rule === 'lease-not-released'));
  assert.ok(result.actions.some(action => action.type === 'hold' && action.rule === 'health-falling'));
});

test('health-falling never holds during a fight; repeated stuck evidence still holds when bitten without a fight task', () => {
  const now = 180_000;
  const common = { now, history: [], lastUsefulAt: now, held: false, health: { score: 70 }, previousHealth: { score: 80 }, movementAdvanced: false, inputHeld: false, activeTask: false, lease: null, healthFallPolls: 3, config: {} };
  const fighting = evaluateRules({ ...common, activeTask: 'fight' });
  const beingBitten = evaluateRules({ ...common, history: [1, 2].map(offset => ({ at: new Date(now - offset * 1000).toISOString(), kind: 'intent-outcome', task: { outcome: 'blocked', reason: 'blocked while stuck' } })), hostileVisible: true, config: { repeatCount: 2 } });
  assert.equal(fighting.actions.some(action => action.rule === 'health-falling'), false);
  assert.equal(beingBitten.actions.some(action => action.rule === 'health-falling'), false);
  assert.ok(beingBitten.actions.some(action => action.type === 'hold' && action.rule === 'repeated-stop-reason'));
});

test('health-falling needs three consecutive drops and excludes a combat goal', () => {
  const args = { now: 180_000, history: [], lastUsefulAt: 180_000, held: false, health: { score: 70 }, previousHealth: { score: 80 }, movementAdvanced: false, inputHeld: false, activeTask: false, lease: null, config: {} };
  assert.equal(evaluateRules({ ...args, healthFallPolls: 2 }).actions.some(action => action.rule === 'health-falling'), false);
  assert.equal(evaluateRules({ ...args, healthFallPolls: 3, bodyGoal: { kind: 'fight' } }).actions.some(action => action.rule === 'health-falling'), false);
});

test('resume resets evidence before the next poll', async () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'round3-watch-resume-'));
  const now = Date.parse('2026-01-01T00:10:00.000Z');
  const control = { async health() { return {}; }, async snapshot() { return { native: { ready: true, state: { pos: [1, 1], vitals: { health: 100 } } } }; }, async stop() {} };
  try {
    fs.writeFileSync(path.join(runDir, 'trace.jsonl'), [
      { kind: 'session-start', mode: 'online', at: new Date(now - 600_000).toISOString() },
      { kind: 'operator-command', command: 'resume', at: new Date(now - 1000).toISOString() },
    ].map(row => JSON.stringify(row)).join('\n') + '\n');
    fs.writeFileSync(path.join(runDir, 'watch.jsonl'), JSON.stringify({ at: new Date(now - 2000).toISOString(), enforce: true, actions: [{ type: 'hold', enforced: true }] }) + '\n');
    const result = await watchOnce({ runDir, control, now: () => now, previous: { at: now - 15_000, inWorld: true, idleMs: 15_000, healthFallPolls: 0 } , config: { idleMs: 1 } });
    assert.equal(result.verdict.actions.length, 0);
    assert.equal(result.previous.idleMs, 0);
  } finally { fs.rmSync(runDir, { recursive: true, force: true }); }
});

test('time on the title screen does not accumulate as idle play', async () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'round3-watch-title-'));
  const now = Date.parse('2026-01-01T00:15:00.000Z');
  const control = { async health() { return {}; }, async snapshot() { return { player: { phase: 'title' }, native: { ready: false, state: { pos: [1, 1], vitals: { health: 100 } } } }; }, async stop() {} };
  try {
    fs.writeFileSync(path.join(runDir, 'trace.jsonl'), JSON.stringify({ kind: 'session-start', mode: 'online', at: new Date(now - 900_000).toISOString() }) + '\n');
    const result = await watchOnce({ runDir, control, now: () => now, config: { idleMs: 10_000 } });
    assert.equal(result.verdict.actions.some(action => action.rule === 'no-verified-useful-outcome'), false);
    assert.equal(result.previous.idleMs, 0);
  } finally { fs.rmSync(runDir, { recursive: true, force: true }); }
});

test('watcher defaults to a 15 second poll interval', async () => {
  const source = fs.readFileSync(new URL('../tools/watch.mjs', import.meta.url), 'utf8');
  assert.match(source, /number\('--interval-ms',\s*15_000\)/);
});

test('watchOnce polls a fake control API with an injected clock and writes a dry verdict', async () => {
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'round3-watch-'));
  const now = Date.parse('2026-01-01T00:10:00.000Z');
  let polls = 0;
  const control = {
    async health() { polls++; return { generation: 3, score: 5 }; },
    async snapshot() { polls++; return { basis: { frame: 9 }, native: { ready: true, state: { pos: [1, 2, 3], vitals: { health: 50 } } } }; },
    async stop() { throw new Error('dry mode must not stop'); },
  };
  try {
    fs.writeFileSync(path.join(runDir, 'trace.jsonl'), JSON.stringify({ kind: 'session-start', mode: 'online', at: new Date(now - 600_000).toISOString() }) + '\n');
    const result = await watchOnce({ runDir, control, now: () => now, previous: { at: now - 600_000, inWorld: true, idleMs: 600_000, resetAt: now - 600_000, health: { score: 50 } }, config: { idleMs: 1000 } });
    assert.equal(polls, 2);
    assert.equal(result.verdict.actions[0].rule, 'no-verified-useful-outcome');
    assert.equal(JSON.parse(fs.readFileSync(path.join(runDir, 'watch.jsonl'), 'utf8')).enforce, false);
  } finally { fs.rmSync(runDir, { recursive: true, force: true }); }
});

test('enforce mode writes the existing hold command and asks control to stop', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'round3-watch-enforce-'));
  const runDir = path.join(dataDir, 'runs', 'run');
  fs.mkdirSync(runDir, { recursive: true });
  const now = Date.parse('2026-01-01T00:10:00.000Z');
  let stops = 0;
  const control = {
    async health() { return {}; },
    async snapshot() { return { basis: { frame: 1 }, native: { ready: true, state: { pos: [0, 0, 0], vitals: { health: 100 } } } }; },
    async stop() { stops++; return { stopped: true }; },
  };
  try {
    fs.writeFileSync(path.join(runDir, 'trace.jsonl'), JSON.stringify({ kind: 'session-start', mode: 'online', at: new Date(now - 60_000).toISOString() }) + '\n');
    const result = await watchOnce({ runDir, control, now: () => now, previous: { at: now - 60_000, inWorld: true, idleMs: 60_000, resetAt: now - 60_000, health: { score: 100 } }, config: { idleMs: 1000 }, enforce: true });
    assert.equal(stops, 1);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir, 'command.json'), 'utf8')).command, 'hold');
    assert.equal(result.verdict.actions[0].enforced, true);
  } finally { fs.rmSync(dataDir, { recursive: true, force: true }); }
});
