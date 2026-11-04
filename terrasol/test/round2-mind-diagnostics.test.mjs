import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMindRuntime } from '../src/mind/runtime.mjs';
import { resolveMindConfig } from '../src/mind/config.mjs';
import { createMemory } from '../src/memory.mjs';
import { createFakeDriver, fakeModels, terraPlan } from './support/fake-control.mjs';
import { makeDecisionPacket, createPacketStore, DECISION_PACKET_SCHEMA } from '../src/mind/packets.mjs';
import { buildReplayFixture, replayPlanDecisions, REPLAY_SCHEMA } from '../src/mind/replay.mjs';
import { createRepairProposal, validateRepairProposal, createRepairQueue, normalizeRepairStatus } from '../src/mind/repair.mjs';
import { measurementFromReport, compareMeasurements, runMatchedHarness, MEASUREMENT_SCHEMA } from '../src/mind/efficiency.mjs';
import { buildReport } from '../src/report.mjs';

function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-r2-diag-')); }
function config() {
  return resolveMindConfig({
    roles: { luna: { enabled: false, model: null }, terra: { cooldownMs: 0, maxCallsPerWindow: 100, timeoutMs: 1000, decisionTtlMs: 600000 }, sol: { enabled: false, model: null } },
    scheduler: { pollIntervalMs: 1, snapshotRetries: 0, snapshotRetryDelayMs: 1, localRetries: 1, failureThreshold: 2, planTtlMs: 600000, maxCycles: 30, continueAfterPlan: false, requestSolReviewOnComplete: false, reviewAtSessionEnd: false },
    budget: { maxInputTokens: null, maxCalls: null },
    models: { allowlist: ['fake-luna', 'gpt-6.1-terra', 'gpt-6.1-sol'] },
  });
}
function runOnce({ packets = [], sourceRevision = 'rev-abc', initialRepair = null } = {}) {
  const dir = temp();
  const memory = createMemory(dir);
  const driver = createFakeDriver({ snapshots: [{}, {}, {}], intents: [{ polls: 1, outcome: 'completed' }] });
  const models = fakeModels([{ json: terraPlan({ steps: [{ id: 's1', skill: 'look', args: {} }] }) }]);
  const runtime = createMindRuntime({ config: config(), memory, logger: { event() {}, flush() {} }, request: driver.request, askModel: models.askModel, searchHandbook: () => [], onDecisionPacket: packet => packets.push(packet), sourceRevision, initialRepair });
  return { runtime, memory, driver, models, packets, cleanup: () => { try { memory.close(); } catch {} fs.rmSync(dir, { recursive: true, force: true }); } };
}

test('decision packets capture exact bounded input/reply/usage and build a model-free replay fixture', async () => {
  const packets = [];
  const handle = runOnce({ packets });
  try {
    const result = await handle.runtime.scheduler.run();
    assert.equal(result.pauseReason, 'session-complete');
    assert.equal(packets.length, 1);
    const packet = packets[0];
    assert.equal(packet.schemaVersion, DECISION_PACKET_SCHEMA);
    assert.equal(packet.role, 'terra');
    assert.equal(packet.sourceRevision, 'rev-abc');
    assert.ok(packet.prompt.includes('Terra'));
    assert.ok(packet.reply && packet.reply.goal);
    assert.equal(packet.usageKnown, true);
    const fixture = buildReplayFixture({ scenarioId: 'replay-1', sourceRevision: 'rev-abc', packets, expected: { plans: 1 } });
    assert.equal(fixture.schemaVersion, REPLAY_SCHEMA);
    const replay = replayPlanDecisions(fixture);
    assert.equal(replay.applied.length, 1);
    assert.equal(replay.rejected.length, 0);
    assert.equal(replay.plan.version, 1);
    const storeDir = temp();
    try {
      const store = createPacketStore({ dir: storeDir });
      assert.equal(store.record(packet).packetId, packet.packetId);
      assert.equal(store.readAll().length, 1);
    } finally { fs.rmSync(storeDir, { recursive: true, force: true }); }
  } finally { handle.cleanup(); }
});

test('unknown usage is omitted, never converted to zero', () => {
  const packet = makeDecisionPacket({ packetId: 'p', role: 'terra', model: 'm', prompt: 'p', reply: null, usage: null });
  assert.equal(packet.usageKnown, false);
  assert.ok(packet.omitted.includes('usage'));
  assert.equal(packet.usage, null);
});

test('Sol repair proposals are typed, queue-only and carry no executable instructions', () => {
  const proposal = createRepairProposal({
    sourceRevision: 'rev-1', failurePacketRefs: ['p1', 'p2'],
    engineering: {
      diagnosis: 'The scheduler does not retry a stale basis.', affectedPaths: ['src/mind/plan.mjs'], changeClass: 'plan',
      changes: [{ path: 'src/mind/plan.mjs', description: 'reject stale plan update' }], tests: ['round2-mind-continuity'],
      risk: 'medium', rollback: 'restore previous revision', targetMetric: 'stale plan rejection rate', reproducer: 'fixture stale-base', verificationCriteria: ['test passes'], budget: 'bounded',
    },
  });
  assert.deepEqual(validateRepairProposal(proposal), []);
  assert.equal(proposal.failurePacketRefs.length, 2);
  assert.throws(() => createRepairProposal({ engineering: { diagnosis: 'x', changes: [], tests: [], risk: 'low', rollback: 'r', targetMetric: 'm', command: 'rm -rf /' }, sourceRevision: 'r', failurePacketRefs: ['p'] }), /executable/);
  const dir = temp();
  try {
    const queue = createRepairQueue({ dir });
    const item = queue.enqueue(proposal);
    assert.ok(fs.existsSync(item.file));
    assert.equal(queue.list()[0].proposalId, proposal.proposalId);
    const status = normalizeRepairStatus({ proposalId: proposal.proposalId, phase: 'applying' });
    assert.equal(status.phase, 'applying');
    assert.throws(() => normalizeRepairStatus({ proposalId: proposal.proposalId, phase: 'verified' }), /verified invariants/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('repair status holds the worker and a verified status only clears a repair hold', async () => {
  const handle = runOnce({initialRepair:{proposalId:'repair-1',hold:false}});
  try {
    const scheduler = handle.runtime.scheduler;
    const applying = await scheduler.receiveRepairStatus({ proposalId: 'repair-1', phase: 'applying' });
    assert.equal(applying.hold, true);
    assert.equal(scheduler.pauseReason(), null);
    assert.equal(scheduler.summary().repair.hold, true);
    const verified = await scheduler.receiveRepairStatus({ proposalId: 'repair-1', phase: 'verified', afterRevision: 'rev-2', invariants: { characterPreserved: true, pagePreserved: true, memoryPreserved: true, planPreserved: true } });
    assert.equal(verified.hold, false);
    assert.equal(scheduler.summary().repair.verified, true);
    await scheduler.pause('budget-exhausted', { operator: false });
    const again = await scheduler.receiveRepairStatus({ proposalId: 'repair-1', phase: 'verified', at: '2026-01-01T00:00:01Z', afterRevision: 'rev-2', invariants: { characterPreserved: true, pagePreserved: true, memoryPreserved:true, planPreserved:true } });
    assert.equal(again.ok, false);
    assert.equal(scheduler.paused(), true, 'repair status never clears a budget/operator hold');
  } finally { handle.cleanup(); }
});

test('report preserves player phases, task/evidence identity, packets, plans and repair events', () => {
  const dir = temp();
  const row = (kind, at, fields = {}) => JSON.stringify({ mode: 'online', kind, at, ...fields }) + '\n';
  try {
    fs.mkdirSync(path.join(dir, 'epoch-1'));
    fs.writeFileSync(path.join(dir, 'trace.jsonl'), row('session-start', '2026-01-01T00:00:00Z') + row('session-end', '2026-01-01T00:00:30Z'));
    fs.writeFileSync(path.join(dir, 'epoch-1', 'trace.jsonl'),
      row('epoch-start', '2026-01-01T00:00:01Z') +
      row('observation', '2026-01-01T00:00:02Z', { player: { phase: 'frontdoor', facts: [] } }) +
      row('model-request', '2026-01-01T00:00:03Z', { role: 'terra', schemaVersion: 'dfo-mind.v1', planVersion: 0 }) +
      row('model-response', '2026-01-01T00:00:04Z', { role: 'terra', schemaVersion: 'dfo-mind.v1', usage: { input_tokens: 100, cached_input_tokens: 0, output_tokens: 10 } }) +
      row('plan-update', '2026-01-01T00:00:05Z', { version: 1, baseVersion: 0, status: 'active', goal: 'enter' }) +
      row('task-dispatch', '2026-01-01T00:00:06Z', { taskKind: 'workflow' }) +
      row('task-outcome', '2026-01-01T00:00:07Z', { task: { id: 1, status: 'terminal', taskKind: 'workflow', outcome: 'completed', evidence: { schemaVersion: 'dfo-player-evidence.v1', evidenceId: 'e1', eventType: 'item-equipped', status: 'verified' } } }) +
      row('plan-completed', '2026-01-01T00:00:08Z', { version: 1, goal: 'enter', plansCompleted: 1 }) +
      row('decision-packet', '2026-01-01T00:00:09Z', { packet: { packetId: 'p1', role: 'terra', usageKnown: true } }) +
      row('repair-proposal', '2026-01-01T00:00:10Z', { proposal: { proposalId: 'repair-1' } }) +
      row('repair-status', '2026-01-01T00:00:11Z', { status: { proposalId: 'repair-1', phase: 'verified' } }) +
      row('mind-pause', '2026-01-01T00:00:12Z', { reason: 'repair-verified', operator: false })
    );
    const report = buildReport(dir);
    assert.equal(report.playerPhases.frontdoor, 1);
    assert.equal(report.counts.workflowTasks, 1);
    assert.equal(report.counts.taskOutcomes, 1);
    assert.equal(report.counts.decisionPackets, 1);
    assert.equal(report.counts.repairProposals, 1);
    assert.equal(report.counts.repairStatuses, 1);
    assert.equal(report.planCompletions.length, 1);
    assert.equal(report.verifiedOutcomes, 1);
    assert.equal(report.verifiedTransitions[0].evidence, 'evidence:item-equipped');
    assert.equal(report.attempts.requests, 1);
    assert.equal(report.planCompletions[0].goal, 'enter');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('matched efficiency comparison labels fake results and refuses mismatched scenarios', () => {
  const report = { runDir: 'run', wallMs: 1000, counts: { tierRequests: { luna: 5, terra: 3, sol: 1 }, tierErrors: 1, mindPauses: 0 }, playingRoleUsage: { input_tokens: 1000, cached_input_tokens: 200, output_tokens: 50, missing: 1 }, modelTiming: { luna: { elapsedMs: 100 }, terra: { elapsedMs: 400 }, sol: { elapsedMs: 50 } }, verifiedOutcomes: 2, plans: [{}, {}], pauses: [] };
  const two = measurementFromReport(report, { routing: 'two-tier', scenarioId: 'same', startFingerprint: 'start', live: false });
  const three = measurementFromReport(report, { routing: 'three-tier', scenarioId: 'same', startFingerprint: 'start', live: false });
  assert.equal(two.schemaVersion, MEASUREMENT_SCHEMA);
  assert.equal(two.evidence, 'fake');
  const comparison = compareMeasurements({ twoTier: two, threeTier: three });
  assert.equal(comparison.evidence, 'fake');
  assert.equal(comparison.claim, 'not-evidence-of-real-saving');
  assert.ok(comparison.warnings.some(warning => /Fake\/injected/.test(warning)));
  assert.throws(() => compareMeasurements({ twoTier: two, threeTier: { ...three, startFingerprint: 'other' } }), /starting fingerprint/);
});

test('matched harness uses both routing arms against one labeled scenario', async () => {
  const report = { runDir: 'run', wallMs: 500, counts: { tierRequests: { luna: 0, terra: 2, sol: 0 }, tierErrors: 0 }, playingRoleUsage: { input_tokens: 500, cached_input_tokens: 0, output_tokens: 20, missing: 0 }, modelTiming: { luna: { elapsedMs: 0 }, terra: { elapsedMs: 100 }, sol: { elapsedMs: 0 } }, verifiedOutcomes: 1, plans: [{}], pauses: [] };
  const comparison = await runMatchedHarness({
    scenarioId: 'matched', startFingerprint: 'start-1', sourceRevision: 'rev', live: false,
    arms: {
      twoTier: async () => measurementFromReport(report, { routing: 'two-tier', scenarioId: 'matched', startFingerprint: 'start-1', live: false }),
      threeTier: async () => measurementFromReport(report, { routing: 'three-tier', scenarioId: 'matched', startFingerprint: 'start-1', live: false }),
    },
  });
  assert.equal(comparison.evidence, 'fake');
  assert.equal(comparison.claim, 'not-evidence-of-real-saving');
});

test('repair status requires current proposal and all continuity invariants; hold survives replacement',async()=>{
 const handle=runOnce({initialRepair:{proposalId:'current',hold:true,status:null,verified:false}});try{
  const s=handle.runtime.scheduler;assert.equal(s.summary().repair.hold,true);
  assert.equal((await s.receiveRepairStatus({proposalId:'old',phase:'verified',afterRevision:'new',invariants:{pagePreserved:true,characterPreserved:true,memoryPreserved:true,planPreserved:true}})).code,'unknown-repair-proposal');
  assert.equal((await s.receiveRepairStatus({proposalId:'current',phase:'verified',afterRevision:'new',invariants:{pagePreserved:true,characterPreserved:true}})).code,'invalid-repair-status');assert.equal(s.summary().repair.hold,true);
  assert.equal((await s.receiveRepairStatus({proposalId:'current',phase:'verified',afterRevision:'new',invariants:{pagePreserved:true,characterPreserved:true,memoryPreserved:true,planPreserved:true}})).resumeReady,true);
 }finally{handle.cleanup();}
});

test('driver-hosted components are classified for replacement and source identity is agent Git',async()=>{
 const {classifySwap,sourceIdentity}=await import('../src/mind/revision.mjs');
 for(const p of ['src/native-controller.mjs','src/player/workflows.mjs','src/legacy-windows.mjs'])assert.equal(classifySwap(p),'driver');
 assert.equal(classifySwap('src/native-bridge.mjs'),'bridge');
 const id=sourceIdentity(process.cwd());assert.match(id.revision,/^[0-9a-f]{40}$/);assert.equal(typeof id.dirty,'boolean');
});
