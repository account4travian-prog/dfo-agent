import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMindConfig, roleAvailable, loadMindConfig, MIND_SCHEMA } from '../src/mind/config.mjs';
import { createPlanStore, createPlan, resolveIntent, planSummary, PlanError } from '../src/mind/plan.mjs';
import { createBudget } from '../src/mind/budget.mjs';
import { createContextBuilder } from '../src/mind/context.mjs';
import { createControlClient, ControlUnavailableError, SnapshotError } from '../src/mind/control-client.mjs';
import { createMemory } from '../src/memory.mjs';
import { normalizeTerraDecision, normalizeLunaDecision, normalizeSolDecision } from '../src/protocol.mjs';
import { classifySwap, collectRevision } from '../src/mind/revision.mjs';
import { fakeHealth, fakeSnapshot } from './support/fake-control.mjs';

const temp = prefix => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const planSteps = () => [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }];

test('config requires an explicit Luna model and never substitutes one', () => {
  const config = resolveMindConfig({ roles: { luna: { enabled: true, model: null } } });
  assert.equal(roleAvailable(config, 'luna', ['gpt-6.1-terra']).ok, false);
  assert.match(roleAvailable(config, 'luna', ['gpt-6.1-terra']).reason, /not configured/);
  const envConfig = resolveMindConfig({}, { env: { DFO_LUNA_MODEL: 'gpt-6.1-luna' } });
  assert.equal(envConfig.roles.luna.model, 'gpt-6.1-luna');
  assert.equal(roleAvailable(envConfig, 'luna', ['gpt-6.1-luna']).ok, true);
  assert.throws(() => resolveMindConfig({ roles: { terra: { timeoutMs: 10 } } }), /timeoutMs/);
  assert.throws(() => resolveMindConfig({ unexpected: true }), /unknown top-level/);
  assert.throws(() => loadMindConfig({ env: { DFO_MIND_CONFIG: 'missing.json' } }), /Cannot read/);
});

test('plan versions reject stale bases and invalidate on scene change', () => {
  const store = createPlanStore({ now: () => Date.parse('2026-01-01T00:00:00Z') });
  const created = store.apply({ baseVersion: 0, goal: 'Explore', steps: planSteps(), reassessOn: ['damage'], author: 'terra' }, { snapshot: fakeSnapshot() });
  assert.equal(created.ok, true);
  assert.equal(created.version, 1);
  assert.deepEqual(planSummary(store.snapshot()).steps[0], { id: 's1', skill: 'explore', taskKind: 'intent', state: 'pending', maxMs: 60000, onFailure: null, args: {} });
  const stale = store.apply({ baseVersion: 0, goal: 'Other', steps: planSteps() }, { snapshot: fakeSnapshot() });
  assert.equal(stale.ok, false);
  assert.equal(stale.code, 'stale-plan');
  assert.equal(store.version(), 1);
  store.markSceneChanged('teleported');
  assert.equal(store.snapshot().stale, true);
  assert.equal(store.needsReassessment({ event: 'damage' }).reason, 'plan-stale');
  assert.equal(store.nextStep(), null);
});

test('plan steps resolve only current observed targets', () => {
  const store = createPlanStore({ now: () => 1 });
  store.apply({ baseVersion: 0, goal: 'Go', steps: [{ id: 'g', skill: 'goto', args: { targetRef: { kind: 'thing', targetKind: 'door', x: 3, z: 4 } } }] }, { snapshot: fakeSnapshot() });
  const snapshot = fakeSnapshot({ native: { ...fakeSnapshot().native, targets: [{ kind: 'thing', target: { kind: 'door', x: 3, z: 4 } }] } });
  const resolved = resolveIntent(store.nextStep(), snapshot, store.snapshot());
  assert.deepEqual(resolved.intent.target, { kind: 'door', x: 3, z: 4 });
  assert.throws(() => resolveIntent({ skill: 'goto', args: { targetRef: { kind: 'foe', targetId: 'foe-x' } } }, snapshot, store.snapshot()), error => error instanceof PlanError && error.code === 'target-unavailable');
  const tactical = resolveIntent({ skill: 'tactical', fallbackIntent: { kind: 'look' } }, snapshot, store.snapshot());
  assert.deepEqual(tactical.intent, { kind: 'look' });
});

test('plan validation rejects duplicate ids and out-of-range arguments', () => {
  const store = createPlanStore();
  const duplicate = store.apply({ baseVersion: 0, goal: 'x', steps: [{ id: 's', skill: 'look' }, { id: 's', skill: 'look' }] }, { snapshot: fakeSnapshot() });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.reason, /duplicate/);
  const badTurn = store.apply({ baseVersion: 0, goal: 'x', steps: [{ id: 't', skill: 'turn', args: { degrees: 500 } }] }, { snapshot: fakeSnapshot() });
  assert.equal(badTurn.ok, false);
  assert.throws(() => createPlan({ goal: 'x', steps: [{ id: 's', skill: 'invented' }] }), /skill/);
});

test('budget counts cached input as a subset and pauses for an explicit operator', () => {
  const reasons = [];
  const budget = createBudget({ limits: { maxInputTokens: 100 }, onPause: reason => reasons.push(reason) });
  budget.record({ role: 'terra', usage: { input_tokens: 100, cached_input_tokens: 40, output_tokens: 10 } });
  const status = budget.status();
  assert.equal(status.totals.input_tokens, 100);
  assert.equal(status.totals.cached_input_tokens, 40);
  assert.equal(status.totals.total_tokens, 110);
  assert.equal(status.paused, true);
  assert.equal(budget.check('terra').ok, false);
  assert.equal(budget.resume({ operator: false }).ok, false);
  assert.equal(budget.resume({ operator: true }).ok, true);
  const tiered = createBudget({ limits: { tiers: { luna: { maxCalls: 1 } } } });
  tiered.record({ role: 'luna', usage: { input_tokens: 1 } });
  assert.equal(tiered.check('luna').ok, false);
  assert.equal(reasons[0], 'budget-exhausted:input-token-cap');
});

test('per-tier context is bounded, deduplicated and selective about images and handbook', () => {
  const dir = temp('rowan-context-');
  const memory = createMemory(dir);
  memory.setGoal('Find the bank');
  memory.remember({ text: 'Find the bank', kind: 'observation' });
  memory.remember({ text: 'the bank is near the gate', kind: 'observation' });
  let searched = 0;
  const config = resolveMindConfig({ roles: { terra: { contextBytes: 1400 } }, models: { allowlist: ['gpt-6.1-terra'] } });
  const builder = createContextBuilder({ memory, config, searchHandbook: () => { searched++; return [{ title: 'bank', text: 'A bank' }]; } });
  const snapshot = fakeSnapshot({ ui: { text: 'x'.repeat(3000), screen: 'screen.png', controls: [] } });
  const result = builder.build({ role: 'terra', snapshot, plan: storePlan(), memoryQuery: 'bank', includeImage: false });
  assert.ok(result.bytes <= 1400, `context ${result.bytes} exceeded 1400`);
  assert.equal(result.images.length, 0);
  assert.ok(result.payload.persona.name === 'Rowan');
  assert.equal(result.payload.plan.version, 2);
  const withImage = builder.build({ role: 'terra', snapshot, plan: storePlan(), includeImage: true });
  assert.deepEqual(withImage.images, ['screen.png']);
  assert.equal(searched, 0);
  builder.build({ role: 'terra', snapshot, plan: storePlan(), handbookQuery: 'bank' });
  assert.equal(searched, 1);
  memory.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

function storePlan() {
  const store = createPlanStore({ now: () => 1 });
  store.apply({ baseVersion: 0, goal: 'Find the bank', steps: planSteps() }, { snapshot: fakeSnapshot() });
  store.apply({ baseVersion: 1, goal: 'Find the bank', steps: [{ id: 's2', skill: 'look' }] }, { snapshot: fakeSnapshot() });
  return store.snapshot();
}

test('control client fails closed on a baseline driver and fences request IDs', async () => {
  const baseline = createControlClient({ request: async () => ({ ok: true, generation: 1, capabilities: { intents: ['look'] } }) });
  await assert.rejects(baseline.ensureAvailable(), error => error instanceof ControlUnavailableError && /dfo-control\.v1/.test(error.message));
  let active = null;
  const client = createControlClient({ request: async (route, body) => {
    if (route === '/health') return fakeHealth();
    if (route.startsWith('/snapshot')) return fakeSnapshot();
    if (route === '/intent') { active = { requestId: body.requestId }; return { task: { requestId: body.requestId, authority: body.authority, status: 'running', id: 't1' } }; }
    if (route.startsWith('/intent?')) return { task: { requestId: active.requestId, status: 'terminal', outcome: 'completed', id: 't1' }, events: [] };
    if (route === '/intent/cancel') return { ok: true };
    throw new Error('unexpected');
  } });
  const caps = await client.ensureAvailable();
  assert.equal(caps.ok, true);
  const basis = { observationId: 'o', pageId: 'p', generation: 1, frame: 1 };
  await client.startIntent({ requestId: 'req-1', basis, authority: { planId: 'p', planVersion: 1, stepId: 's' }, intent: { kind: 'look' } });
  await assert.rejects(client.startIntent({ requestId: 'req-1', basis, authority: {}, intent: { kind: 'look' } }), /already used/);
  const poll = await client.pollIntent('req-1');
  assert.equal(poll.task.outcome, 'completed');
  const incoherent = createControlClient({ request: async route => route === '/health' ? fakeHealth() : fakeSnapshot({ captured: { coherent: false } }) });
  await assert.rejects(incoherent.snapshot(), error => error instanceof SnapshotError && /coherent/.test(error.message));
});

test('protocol normalizers bind plan versions and reject stale updates', () => {
  const decision = normalizeTerraDecision({ schemaVersion: MIND_SCHEMA, goal: 'Explore', memory: '', handbookQuery: '', baseVersion: 0, complete: false, reason: '', ttlMs: 1000, reassessOn: ['damage'], steps: planSteps() }, { currentVersion: 0 });
  assert.equal(decision.update.goal, 'Explore');
  assert.equal(decision.update.steps[0].skill, 'explore');
  assert.throws(() => normalizeTerraDecision({ schemaVersion: MIND_SCHEMA, goal: 'x', memory: '', handbookQuery: '', baseVersion: 0, complete: false, reason: '', ttlMs: 1000, reassessOn: [], steps: planSteps() }, { currentVersion: 2 }), /stale/);
  const luna = normalizeLunaDecision({ schemaVersion: MIND_SCHEMA, note: 'look', memory: '', handbookQuery: '', escalate: false, intent: { kind: 'look', targetIndex: null, x: null, z: null, degrees: null, range: null, maxMs: null, stopHpPct: null } });
  assert.equal(luna.intent.kind, 'look');
  const sol = normalizeSolDecision({ schemaVersion: MIND_SCHEMA, goal: 'Done', memory: '', handbookQuery: '', strategyNote: 'review', review: { summary: 'ok', confidence: 'low', findings: [], recommendations: [] }, engineering: null });
  assert.equal(sol.review.summary, 'ok');
  assert.throws(() => normalizeSolDecision({ schemaVersion: 'wrong' }), /schemaVersion/);
});

test('revision archive is source/vendor aware and classifies hot swaps', () => {
  const dir = temp('rowan-revision-');
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'vendor', 'native-agent'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'main.mjs'), 'export const a=1;');
  fs.writeFileSync(path.join(dir, 'src', 'browser.mjs'), 'export const b=1;');
  fs.writeFileSync(path.join(dir, 'vendor', 'native-agent', 'bridge.js'), 'export const c=1;');
  const manifest = collectRevision({ root: dir, dirs: ['src', 'vendor'], copy: false });
  assert.equal(manifest.files.length, 3);
  assert.equal(manifest.classes.worker, 1);
  assert.equal(manifest.classes.driver, 1);
  assert.equal(manifest.classes.bridge, 1);
  assert.equal(classifySwap('vendor/legacy-agent/body/core.mjs'), 'body');
  assert.equal(classifySwap('src/native-bridge.mjs'), 'bridge');
  assert.match(manifest.hotSwap.bridge, /page\/session reload/);
  fs.rmSync(dir, { recursive: true, force: true });
});
