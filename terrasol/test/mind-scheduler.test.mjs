import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMindConfig } from '../src/mind/config.mjs';
import { createMindRuntime, runMindRuntime } from '../src/mind/runtime.mjs';
import { createMemory } from '../src/memory.mjs';
import { replyStatus } from '../src/mind/scheduler.mjs';
import { createPlanStore } from '../src/mind/plan.mjs';
import { createFakeDriver, fakeModels, terraPlan, completePlan, lunaLook, solReview, fakeHealth, fakeSnapshot } from './support/fake-control.mjs';

function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-mind-')); }
function makeConfig(overrides = {}) {
  return resolveMindConfig({
    roles: {
      luna: { enabled: false, model: null, cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 },
      terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 },
      sol: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 },
    },
    scheduler: { pollIntervalMs: 1, snapshotRetries: 0, snapshotRetryDelayMs: 1, localRetries: 1, failureThreshold: 2, planTtlMs: 600000, maxCycles: 60, requestSolReviewOnComplete: false, continueAfterPlan: false },
    budget: { maxInputTokens: null, maxCalls: null },
    models: { allowlist: ['fake-luna', 'gpt-6.1-terra', 'gpt-6.1-sol'] },
    ...overrides,
  });
}
function harness({ config = makeConfig(), driver, models, plan = null } = {}) {
  const dir = temp();
  const memory = createMemory(dir);
  const events = [];
  const logger = { event: (kind, data = {}) => events.push({ kind, ...data }), flush() {} };
  const runtime = createMindRuntime({ config, memory, logger, request: driver.request, askModel: models.askModel, searchHandbook: () => [{ title: 'stub' }], plan, session: { run: 'test', epoch: 1 } });
  return { runtime, memory, events, dir, cleanup: () => { try { memory.close(); } catch {} fs.rmSync(dir, { recursive: true, force: true }); } };
}

test('one Terra decision executes local steps across polls without another model call', async () => {
  const driver = createFakeDriver({
    snapshots: [{}, {}, {}, {}, {}],
    intents: [
      { polls: 2, outcome: 'completed', progress: { displacement: 3, remaining: 0 } },
      { polls: 1, outcome: 'completed' },
    ],
  });
  const models = fakeModels([{ json: terraPlan({ steps: [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }, { id: 's2', skill: 'stop', args: {} }] }) }]);
  const { runtime, events, cleanup } = harness({ driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.status, 'paused');
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 1, 'only the initial Terra decision');
    assert.equal(driver.counts().starts, 2);
    assert.equal(driver.counts().polls, 3);
    assert.equal(runtime.scheduler.stats().modelCalls.terra, 1);
    assert.equal(runtime.scheduler.stats().modelCalls.luna, 0);
    const starts = driver.calls.filter(call => call.path === '/intent');
    assert.deepEqual(starts[0].body.authority, { planId: starts[0].body.authority.planId, planVersion: 1, stepId: 's1' });
    assert.equal(starts[1].body.authority.stepId, 's2');
    const requestModelEvents = events.filter(event => event.kind === 'model-request').length;
    assert.equal(requestModelEvents, 1);
    assert.ok(events.some(event => event.kind === 'intent-outcome'));
    assert.equal(result.plan.status, 'complete');
  } finally { cleanup(); }
});

test('Luna chooses inside a tactical step only when Terra delegates it', async () => {
  const driver = createFakeDriver({ snapshots: [{}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const models = fakeModels([
    { json: terraPlan({ steps: [{ id: 't1', skill: 'tactical', objective: 'choose a look', allowedSkills: ['look'], fallbackIntent: { kind: 'look' }, args: {}, maxMs: null }] }) },
    { json: lunaLook('check the room') },
  ]);
  const config = makeConfig({ roles: { luna: { enabled: true, model: 'fake-luna', cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, sol: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 } } });
  const { runtime, cleanup } = harness({ config, driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 2);
    assert.equal(runtime.scheduler.stats().modelCalls.luna, 1);
    assert.equal(runtime.scheduler.stats().fallbacks, 0);
    const start = driver.calls.find(call => call.path === '/intent');
    assert.equal(start.body.intent.kind, 'look');
    assert.equal(start.body.authority.stepId, 't1');
  } finally { cleanup(); }
});

test('unavailable Luna falls back to the plan fallback without a model call', async () => {
  const driver = createFakeDriver({ snapshots: [{}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const models = fakeModels([{ json: terraPlan({ steps: [{ id: 't1', skill: 'tactical', objective: 'fallback', allowedSkills: ['look'], fallbackIntent: { kind: 'look' }, args: {}, maxMs: null }] }) }]);
  const { runtime, cleanup } = harness({ driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 1);
    assert.equal(runtime.scheduler.stats().modelCalls.luna, 0);
    assert.equal(runtime.scheduler.stats().fallbacks, 1);
    assert.equal(driver.calls.find(call => call.path === '/intent').body.intent.kind, 'look');
  } finally { cleanup(); }
});

test('a plan-complete review is delegated to Sol instead of a periodic Terra call', async () => {
  const config = makeConfig({ scheduler: { requestSolReviewOnComplete: true, continueAfterPlan: false } });
  const driver = createFakeDriver({ snapshots: [{}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const models = fakeModels([
    { json: terraPlan({ steps: [{ id: 's1', skill: 'look', args: {} }] }) },
    { json: solReview('session review') },
  ]);
  const { runtime, cleanup } = harness({ config, driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 2);
    assert.equal(runtime.scheduler.stats().modelCalls.terra, 1);
    assert.equal(runtime.scheduler.stats().modelCalls.sol, 1);
  } finally { cleanup(); }
});

test('budget exhaustion pauses and never auto-resumes', async () => {
  const config = makeConfig({ budget: { maxInputTokens: 150, maxCalls: null } });
  const driver = createFakeDriver({ snapshots: [{}, {}, {}], intents: [{ polls: 1, outcome: 'failed' }, { polls: 1, outcome: 'failed' }] });
  const models = fakeModels([
    { json: terraPlan({ steps: [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }] }) },
    { json: terraPlan({ baseVersion: 1, steps: [{ id: 's2', skill: 'look', args: {} }] }) },
  ]);
  const { runtime, cleanup } = harness({ config, driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.match(result.pauseReason, /budget/);
    assert.equal(runtime.budget.paused(), true);
    assert.equal(models.calls.length, 2);
    assert.equal(driver.counts().starts, 2);
    assert.equal(runtime.scheduler.resume({ operator: false }).ok, false);
    assert.equal(runtime.scheduler.resume({ operator: true }).ok, true);
  } finally { cleanup(); }
});

test('operator stop cancels the local task and cannot be auto-resumed', async () => {
  const driver = createFakeDriver({ snapshots: [{}, {}], intents: [{ polls: 1000, outcome: 'completed' }] });
  const models = fakeModels([{ json: terraPlan({ steps: [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }] }) }]);
  const { runtime, cleanup } = harness({ driver, models });
  try {
    const running = runtime.scheduler.run();
    for (let i = 0; i < 200 && driver.counts().starts === 0; i++) await new Promise(resolve => setTimeout(resolve, 2));
    assert.equal(driver.counts().starts, 1);
    runtime.scheduler.requestStop('operator-stop', { operator: true });
    const result = await running;
    assert.equal(result.pauseReason, 'operator-stop');
    assert.ok(driver.counts().cancels >= 1);
    assert.equal(runtime.scheduler.resume({ operator: false }).ok, false);
  } finally { cleanup(); }
});

test('an unverified cleanup pauses and blocks new execution', async () => {
  const driver = createFakeDriver({ snapshots: [{}, {}], intents: [{ polls: 1, outcome: 'failed', cleanupPending: true }] });
  const models = fakeModels([{ json: terraPlan({ steps: [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }] }) }]);
  const { runtime, cleanup } = harness({ driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'cleanup-pending');
    assert.equal(driver.counts().starts, 1);
    assert.equal(models.calls.length, 1);
  } finally { cleanup(); }
});

test('baseline driver fails closed before any model call', async () => {
  const dir = temp(); const memory = createMemory(dir); const events = [];
  const logger = { event: (kind, data = {}) => events.push({ kind, ...data }), flush() {} };
  const driver = createFakeDriver({ health: { ok: true, generation: 7, capabilities: { intents: ['look'] } } });
  const models = fakeModels([{ json: terraPlan({}) }]);
  try {
    const result = await runMindRuntime({ config: makeConfig(), memory, logger, request: driver.request, askModel: models.askModel });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'control-unavailable');
    assert.equal(models.calls.length, 0);
    assert.ok(events.some(event => event.kind === 'mind-control-unavailable'));
  } finally { memory.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('damage events are coalesced into one deferred Terra escalation', async () => {
  const driver = createFakeDriver({
    snapshots: [{}, {}, {}],
    intents: [{ polls: 2, outcome: 'completed', eventsByPoll: [[{ kind: 'damage', data: { amount: 1 } }], [{ kind: 'damage', data: { amount: 1 } }]] }],
  });
  const models = fakeModels([
    { json: terraPlan({ steps: [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }], reassessOn: ['damage'] }) },
    { json: completePlan({ baseVersion: 1 }) },
  ]);
  const { runtime, events, cleanup } = harness({ driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 2);
    assert.equal(runtime.scheduler.stats().coalesced, 1);
    assert.equal(events.filter(event => event.kind === 'escalation-queued').length, 1);
    assert.ok(events.some(event => event.kind === 'escalation-drain'));
  } finally { cleanup(); }
});

test('a saved plan continues across a worker epoch without an initial Terra call', async () => {
  const store = createPlanStore({ now: () => Date.now() });
  store.apply({ baseVersion: 0, goal: 'Resume the saved plan', steps: [{ id: 's1', skill: 'look' }] }, { snapshot: fakeSnapshot() });
  const driver = createFakeDriver({ snapshots: [{}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const models = fakeModels([]);
  const { runtime, cleanup } = harness({ driver, models, plan: store.snapshot() });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 0);
    assert.equal(driver.counts().starts, 1);
    assert.equal(driver.calls.find(call => call.path === '/intent').body.intent.kind, 'look');
  } finally { cleanup(); }
});

test('bounded failure recovery retries locally before buying a new decision', async () => {
  const driver = createFakeDriver({ snapshots: [{}, {}, {}], intents: [{ polls: 1, outcome: 'failed' }, { polls: 1, outcome: 'completed' }] });
  const models = fakeModels([{ json: terraPlan({ steps: [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }] }) }]);
  const { runtime, cleanup } = harness({ driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 1);
    assert.equal(driver.counts().starts, 2);
    assert.equal(runtime.scheduler.stats().modelCalls.terra, 1);
  } finally { cleanup(); }
});

test('an aborted signal pauses without starting model work', async () => {
  const driver = createFakeDriver({ snapshots: [{}], intents: [] });
  const models = fakeModels([{ json: terraPlan({}) }]);
  const { runtime, cleanup } = harness({ driver, models });
  try {
    const controller = new AbortController();
    controller.abort();
    const result = await runtime.scheduler.run({ signal: controller.signal });
    assert.equal(result.pauseReason, 'aborted');
    assert.equal(models.calls.length, 0);
    assert.equal(driver.counts().starts, 0);
  } finally { cleanup(); }
});

test('reply staleness rejects older plan versions, generations and observations', () => {
  const request = { role: 'terra', basis: { observationId: 'o1', pageId: 'page-1', generation: 1, frame: 1 }, planVersion: 1, startedAt: 100, decisionTtlMs: 10000 };
  const snapshot = fakeSnapshot({ observationId: 'o1', basis: { pageId: 'page-1', generation: 2, frame: 1 } });
  assert.equal(replyStatus({ role: 'terra', request, snapshot, planVersion: 1, now: 200 }).fresh, false);
  assert.equal(replyStatus({ role: 'terra', request, snapshot: fakeSnapshot({ observationId: 'o1', basis: { pageId: 'page-1', generation: 1, frame: 1 } }), planVersion: 2, now: 200 }).reason, 'plan-version-changed');
  assert.equal(replyStatus({ role: 'luna', request: { ...request, role: 'luna' }, snapshot: fakeSnapshot({ observationId: 'o2', basis: { pageId: 'page-1', generation: 1, frame: 1 } }), planVersion: 1, now: 200 }).reason, 'observation-changed');
  assert.equal(replyStatus({ role: 'terra', request, snapshot: fakeSnapshot(), planVersion: 1, now: 20000 }).reason, 'reply-expired');
});

test('a refused reply is asked once more with the reason, and a look gets at least 20 s', async () => {
  const driver = createFakeDriver({ snapshots: [{}, {}, {}, {}], intents: [{ polls: 1, outcome: 'completed' }, { polls: 1, outcome: 'completed' }] });
  const models = fakeModels([
    { json: { ...terraPlan({ steps: [{ id: 's1', skill: 'look', args: { maxMs: 3000 } }] }), schemaVersion: '1' } },
    { json: terraPlan({ steps: [{ id: 's1', skill: 'look', args: { maxMs: 3000 } }, { id: 's2', skill: 'stop', args: {} }] }) },
  ]);
  const { runtime, events, cleanup } = harness({ driver, models });
  try {
    await runtime.scheduler.run();
    assert.equal(models.calls.length, 2, 'the refused plan and one retry');
    assert.ok(events.some(event => event.kind === 'tier-reply-retry'));
    const look = driver.calls.find(call => call.path === '/intent' && call.body.intent?.kind === 'look');
    assert.equal(look.body.intent.maxMs, 20000);
  } finally { cleanup(); }
});

test('a Luna that answers without a usable choice fails the step for Terra instead of holding', async () => {
  const driver = createFakeDriver({ snapshots: [{}, {}, {}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const empty = { ...lunaLook('nothing to do'), intent: null, task: null };
  const models = fakeModels([
    { json: terraPlan({ steps: [{ id: 't1', skill: 'tactical', objective: 'choose a look', allowedSkills: ['look'], args: {}, maxMs: null }] }) },
    { json: empty }, { json: empty },
    { json: terraPlan({ baseVersion: 1, steps: [{ id: 's2', skill: 'stop', args: {} }] }) },
  ]);
  const config = makeConfig({ roles: { luna: { enabled: true, model: 'fake-luna', cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, sol: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 } } });
  const { runtime, events, cleanup } = harness({ config, driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.notEqual(result.pauseReason, 'tier-unavailable:luna');
    assert.ok(events.some(event => event.kind === 'model-request' && event.role === 'terra' && /step-failure:t1:/.test(event.reason ?? '')), 'Terra replans the failed step');
  } finally { cleanup(); }
});
