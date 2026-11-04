import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMindConfig } from '../src/mind/config.mjs';
import { createControlClient } from '../src/mind/control-client.mjs';
import { createMindRuntime } from '../src/mind/runtime.mjs';
import { createMemory } from '../src/memory.mjs';
import { createFakePlayerService, makePlayerHealth, makePlayerSnapshot, WORKFLOWS } from './support/round2-mind/fake-player.mjs';
import { fakeModels } from './support/fake-control.mjs';

function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-r2-player-')); }
function config(overrides = {}) {
  return resolveMindConfig({
    roles: { luna: { enabled: false, model: null, cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, sol: { enabled: false, model: null } },
    scheduler: { pollIntervalMs: 1, snapshotRetries: 0, snapshotRetryDelayMs: 1, localRetries: 1, failureThreshold: 2, planTtlMs: 600000, maxCycles: 50, continueAfterPlan: false, requestSolReviewOnComplete: false, reviewAtSessionEnd: false, maxEmptyPlanBoundaries: 2 },
    budget: { maxInputTokens: null, maxCalls: null },
    models: { allowlist: ['fake-luna', 'gpt-6.1-terra', 'gpt-6.1-sol'] },
    ...overrides,
  });
}
function taskPlan(steps, goal = 'Operate the normal interface') {
  return { schemaVersion: 'dfo-mind.v1', goal, memory: '', handbookQuery: '', baseVersion: 0, complete: false, sessionComplete: false, reason: '', ttlMs: 600000, reassessOn: [], steps };
}
function workflowStep(id, workflowId, args, phaseVersion = 1) {
  return { id, task: { kind: 'workflow', payload: { workflowId, version: phaseVersion, args, maxMs: null } } };
}
function uiStep(id, keys = ['Escape']) {
  return { id, task: { kind: 'ui', payload: { action: { kind: 'key', keys }, uiObservationId: null } } };
}
function makeRuntime({ driver, models, cfg = config() }) {
  const dir = temp();
  const memory = createMemory(dir);
  const events = [];
  const runtime = createMindRuntime({ config: cfg, memory, logger: { event: (kind, data = {}) => events.push({ kind, ...data }), flush() {} }, request: driver.request, askModel: models.askModel, searchHandbook: () => [] });
  return { runtime, memory, events, dir, cleanup: () => { try { memory.close(); } catch {} fs.rmSync(dir, { recursive: true, force: true }); } };
}

test('control client negotiates player capabilities, workflows and request-fenced tasks', async () => {
  const driver = createFakePlayerService({ snapshots: [{ phase: 'frontdoor', nativeReady: false }], tasks: [{ polls: 1, outcome: 'completed' }] });
  const client = createControlClient({ request: driver.request });
  const caps = await client.ensureAvailable();
  assert.equal(caps.playerReady, true);
  assert.equal(caps.playerContractVersion, 'dfo-player.v1');
  const catalogue = await client.workflowCatalogue({ refresh: true });
  assert.equal(catalogue.workflows.length, WORKFLOWS.length);
  const basis = { observationId: 'obs-1', pageId: 'page-1', generation: 1, frame: 1 };
  const accepted = await client.startTask({ requestId: 'r1', basis, authority: { planId: 'p', planVersion: 1, stepId: 's' }, task: { kind: 'workflow', payload: { workflowId: 'ui.enter', version: 1, args: { mode: 'offline' }, maxMs: null } } });
  assert.equal(accepted.task.requestId, 'r1');
  await assert.rejects(client.startTask({ requestId: 'r1', basis, authority: {}, task: { kind: 'ui', payload: { action: { kind: 'key', keys: ['Escape'] } } } }), /already used/);
  assert.equal((await client.pollTask('r1')).task.outcome, 'completed');
});

test('startup workflow does not reuse UI decisions after later observations', async () => {
  const driver = createFakePlayerService({
    snapshots: [{ phase: 'frontdoor', nativeReady: false }, { phase: 'world' }, { phase: 'modal' }, { phase: 'world' }],
    tasks: [{ polls: 1, outcome: 'completed' }, { polls: 1, outcome: 'completed' }, { polls: 1, outcome: 'completed' }],
  });
  const models = fakeModels([{ json: taskPlan([workflowStep('enter', 'ui.enter', { mode: 'offline' }), uiStep('close-modal'), uiStep('resume')]) }]);
  const { runtime, events, cleanup } = makeRuntime({ driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.match(result.pauseReason, /unresolved-step-failure/);
    assert.deepEqual(driver.taskKinds(), ['workflow']);
    assert.equal(driver.counts().intents, 0);
    assert.equal(driver.counts().tasks, 1);
    assert.ok(events.some(event => event.kind === 'task-dispatch' && event.taskKind === 'workflow'));
  } finally { cleanup(); }
});

test('an unavailable workflow becomes a bounded Terra reassessment rather than a fatal reply', async () => {
  const driver = createFakePlayerService({
    snapshots: [{ phase: 'frontdoor', nativeReady: false }, { phase: 'frontdoor', nativeReady: false }],
    tasks: [{ polls: 1, outcome: 'completed' }],
  });
  const models = fakeModels([
    { json: taskPlan([workflowStep('bad', 'not.advertised', {})]) },
    { json: { ...taskPlan([workflowStep('good', 'ui.enter', { mode: 'offline' })]), baseVersion: 1 } },
  ]);
  const { runtime, events, cleanup } = makeRuntime({ driver, models });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 2);
    assert.deepEqual(driver.taskKinds(), ['workflow']);
    assert.ok(events.some(event => event.kind === 'task-selection-error' && /not\.advertised|unsupported/i.test(event.reason ?? '')));
  } finally { cleanup(); }
});

test('Luna delegates a modal UI task inside a tactical world step', async () => {
  const driver = createFakePlayerService({
    snapshots: [{ phase: 'modal', nativeReady: false }],
    tasks: [{ polls: 1, outcome: 'completed', evidence: { schemaVersion: 'dfo-player-evidence.v1', evidenceId: 'e1', eventType: 'inventory-changed', status: 'observed' } }],
  });
  const cfg = config({ roles: { luna: { enabled: true, model: 'fake-luna', cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, sol: { enabled: false, model: null } } });
  const models = fakeModels([
    { json: taskPlan([{ id: 't1', skill: 'tactical', objective: 'close the modal', allowedSkills: [], allowedTasks: ['ui'], allowedWorkflows: null, fallbackIntent: null, fallbackTask: null, maxMs: null, onFailure: null }]) },
    { json: { schemaVersion: 'dfo-mind.v1', note: 'close modal', memory: '', handbookQuery: '', confidence: 0.8, escalate: false, intent: null, task: { kind: 'ui', payload: { action: { kind: 'key', keys: ['Escape'] }, uiObservationId: null } } } },
  ]);
  const { runtime, cleanup } = makeRuntime({ driver, models, cfg });
  try {
    const result = await runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(models.calls.length, 2);
    assert.deepEqual(driver.taskKinds(), ['ui']);
    assert.equal(runtime.scheduler.stats().modelCalls.luna, 1);
  } finally { cleanup(); }
});
