import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMindConfig } from '../src/mind/config.mjs';
import { createMindRuntime } from '../src/mind/runtime.mjs';
import { createMemory } from '../src/memory.mjs';
import { createPlanStore } from '../src/mind/plan.mjs';
import { createFakeDriver, fakeModels, terraPlan, fakeSnapshot } from './support/fake-control.mjs';

function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-r2-continuity-')); }
function config(overrides = {}) {
  return resolveMindConfig({
    roles: { luna: { enabled: false, model: null }, terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, sol: { enabled: false, model: null } },
    scheduler: { pollIntervalMs: 1, snapshotRetries: 0, snapshotRetryDelayMs: 1, localRetries: 1, failureThreshold: 2, planTtlMs: 600000, maxCycles: 80, continueAfterPlan: true, maxEmptyPlanBoundaries: 2, reviewAtSessionEnd: false, requestSolReviewOnComplete: false },
    budget: { maxInputTokens: null, maxCalls: null },
    models: { allowlist: ['fake-luna', 'gpt-6.1-terra', 'gpt-6.1-sol'] },
    ...overrides,
  });
}
function harness({ driver, models, cfg, plan = null, planHistory = [] }) {
  const dir = temp();
  const memory = createMemory(dir);
  const events = [];
  const runtime = createMindRuntime({ config: cfg, memory, logger: { event: (kind, data = {}) => events.push({ kind, ...data }), flush() {} }, request: driver.request, askModel: models.askModel, searchHandbook: () => [], plan, planHistory });
  return { runtime, memory, events, cleanup: () => { try { memory.close(); } catch {} fs.rmSync(dir, { recursive: true, force: true }); } };
}
const plan = (baseVersion, goal) => terraPlan({ baseVersion, goal, steps: [{ id: `s${baseVersion + 1}`, skill: 'look', args: {} }] });
const finish = baseVersion => ({ schemaVersion: 'dfo-mind.v1', goal: 'Session complete', memory: '', handbookQuery: '', confidence: 0.9, baseVersion, complete: true, sessionComplete: true, reason: 'intended finish', ttlMs: 600000, reassessOn: [], steps: [] });

test('three successive Terra plans continue without ending the session', async () => {
  const models = fakeModels([{ json: plan(0, 'Find the exit') }, { json: plan(1, 'Gather supplies') }, { json: plan(2, 'Return to the gate') }, { json: finish(3) }]);
  const driver = createFakeDriver({ snapshots: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}], intents: [{ polls: 1, outcome: 'completed' }, { polls: 1, outcome: 'completed' }, { polls: 1, outcome: 'completed' }] });
  const { runtime, cleanup } = harness({ driver, models, cfg: config() });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-finished');
    assert.equal(models.calls.length, 4);
    assert.equal(driver.counts().starts, 3);
    assert.equal(result.planHistory.length, 3);
    assert.deepEqual(result.planHistory.map(entry => entry.goal), ['Find the exit', 'Gather supplies', 'Return to the gate']);
    assert.equal(runtime.scheduler.stats().plans, 3);
  } finally { cleanup(); }
});

test('an intended session finish requests the Sol session review', async () => {
  const cfg = config({
    roles: { luna: { enabled: false, model: null }, terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, sol: { enabled: true, model: 'gpt-6.1-sol', cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 } },
    scheduler: { pollIntervalMs: 1, snapshotRetries: 0, snapshotRetryDelayMs: 1, localRetries: 1, failureThreshold: 2, planTtlMs: 600000, maxCycles: 30, continueAfterPlan: true, maxEmptyPlanBoundaries: 2, reviewAtSessionEnd: true, requestSolReviewOnComplete: false },
  });
  const models = fakeModels([
    { json: plan(0, 'One objective') },
    { json: finish(1) },
    { json: { schemaVersion: 'dfo-mind.v1', goal: 'Complete', memory: '', handbookQuery: '', confidence: 0.7, strategyNote: 'review', review: { summary: 'reviewed', confidence: 'high', findings: [], recommendations: [] }, engineering: null } },
  ]);
  const driver = createFakeDriver({ snapshots: [{}, {}, {}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const { runtime, cleanup } = harness({ driver, models, cfg });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-finished');
    assert.equal(models.calls.length, 3);
    assert.equal(runtime.scheduler.stats().modelCalls.sol, 1);
  } finally { cleanup(); }
});

test('a saved plan and full plan history survive a worker replacement', async () => {
  const store = createPlanStore({ now: () => Date.now() });
  store.apply({ baseVersion: 0, goal: 'Resume the saved task', steps: [{ id: 'resume', skill: 'look', args: {} }] }, { snapshot: fakeSnapshot() });
  const history = [{ planId: 'old', version: 1, goal: 'Earlier objective', status: 'complete', completedAt: '2026-01-01T00:00:00Z', steps: [{ id: 'old1', skill: 'explore', taskKind: 'intent', state: 'completed', args: {}, maxMs: 60000 }] }];
  const models = fakeModels([]);
  const driver = createFakeDriver({ snapshots: [{}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const { runtime, cleanup } = harness({ driver, models, cfg: config({ scheduler: { continueAfterPlan: false, maxCycles: 20 } }), plan: store.snapshot(), planHistory: history });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 0);
    assert.equal(result.planHistory.length, 2);
    assert.equal(result.planHistory[0].goal, 'Earlier objective');
    assert.equal(result.planHistory[1].goal, 'Resume the saved task');
  } finally { cleanup(); }
});
