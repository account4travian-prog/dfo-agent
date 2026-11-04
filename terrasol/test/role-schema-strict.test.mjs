import test from 'node:test';
import assert from 'node:assert/strict';
import { LUNA_SCHEMA, TERRA_SCHEMA, SOL_SCHEMA, normalizeTerraDecision } from '../src/protocol.mjs';
import { normalizeTaskSpec } from '../src/mind/tasks.mjs';
import { MIND_SCHEMA } from '../src/mind/config.mjs';

// The first live three-tier run (2026-10-29) failed on Terra's first call: OpenAI's strict structured output answered
// 400 invalid_json_schema because a step's `args` was an object with no listed properties.
function strictViolations(schema, path = '') {
  const out = [];
  const walk = (s, at) => {
    if (!s || typeof s !== 'object') return;
    if (Array.isArray(s)) { s.forEach((x, i) => walk(x, `${at}[${i}]`)); return; }
    const types = [].concat(s.type ?? []);
    if (types.includes('object')) {
      if (!s.properties) out.push(`${at}: object without properties`);
      else {
        if (s.additionalProperties !== false) out.push(`${at}: additionalProperties is not false`);
        const required = new Set(s.required ?? []);
        for (const key of Object.keys(s.properties)) if (!required.has(key)) out.push(`${at}.${key}: not required`);
      }
    }
    for (const [key, value] of Object.entries(s)) if (value && typeof value === 'object') walk(value, `${at}.${key}`);
  };
  walk(schema, path);
  return out;
}

test('every role schema meets strict structured output rules', () => {
  for (const [name, schema] of Object.entries({ LUNA_SCHEMA, TERRA_SCHEMA, SOL_SCHEMA })) assert.deepEqual(strictViolations(schema, name), []);
});

test('step args, fallback intents and workflow args arrive as JSON object text', () => {
  const tactical = { id: 't1', skill: 'tactical', args: '', maxMs: 60000, objective: 'Find the exit', allowedSkills: ['explore'], allowedTasks: [], allowedWorkflows: [], fallbackIntent: '{"kind":"explore","maxMs":60000}', fallbackTask: null, task: null, onFailure: null };
  const turn = { id: 's1', skill: 'turn', args: '{"degrees":90}', maxMs: 10000, objective: '', allowedSkills: [], allowedTasks: [], allowedWorkflows: [], fallbackIntent: null, fallbackTask: null, task: null, onFailure: null };
  const d = normalizeTerraDecision({ schemaVersion: MIND_SCHEMA, goal: 'Explore', memory: '', handbookQuery: '', baseVersion: 0, complete: false, reason: '', ttlMs: 1000, reassessOn: ['damage'], steps: [turn, tactical] }, { currentVersion: 0 });
  const [s1, t1] = d.update.steps;
  assert.deepEqual(s1.args, { degrees: 90 });
  assert.deepEqual(t1.fallbackIntent, { kind: 'explore', maxMs: 60000 });
  const task = normalizeTaskSpec({ kind: 'workflow', payload: { workflowId: 'startup.select-mode', version: 1, args: '{"mode":"Offline","expectedText":"Continue"}', maxMs: null } });
  assert.deepEqual(task.payload.args, { mode: 'Offline', expectedText: 'Continue' });
  assert.throws(() => normalizeTaskSpec({ kind: 'workflow', payload: { workflowId: 'w', version: 1, args: '[1]' } }), /JSON object/);
  assert.throws(() => normalizeTaskSpec({ kind: 'workflow', payload: { workflowId: 'w', version: 1, args: '{nope' } }), /JSON object text/);
});

test("Sol's empty engineering fields take the repair defaults", async () => {
  const { createRepairProposal } = await import('../src/mind/repair.mjs');
  const engineering = { proposalId: '', diagnosis: 'Route start refused beside a wall', changes: [{ path: 'vendor/legacy-agent/body/core.mjs', description: 'exit-only clearance' }], affectedPaths: [], changeClass: '', reproducer: '', verificationCriteria: [], tests: ['test/body-wall-start.test.mjs'], risk: '', rollback: '', targetMetric: 'explore edges', budget: '' };
  const proposal = createRepairProposal({ engineering, sourceRevision: 'abc', failurePacketRefs: ['packet-1'] }); // throws if invalid
  assert.match(proposal.proposalId, /^repair-/);
  assert.equal(proposal.reproducer, 'test/body-wall-start.test.mjs');
  assert.deepEqual(proposal.verificationCriteria, ['test/body-wall-start.test.mjs']);
  assert.ok(proposal.budget && proposal.risk && proposal.rollback);
});

test('plan fields checked against fixed lists offer only those values', async () => {
  const { REASSESS_EVENTS } = await import('../src/mind/plan.mjs');
  const step = TERRA_SCHEMA.properties.steps.items.properties;
  // Live 2026-10-29: Terra's first plan asked to reassess on "low health", which the validator refuses.
  assert.deepEqual(TERRA_SCHEMA.properties.reassessOn.items.enum, [...REASSESS_EVENTS]);
  assert.ok(!step.allowedSkills.items.enum.includes('tactical'));
  assert.deepEqual(step.allowedTasks.items.enum, ['ui', 'workflow']);
  assert.deepEqual(step.onFailure.anyOf[0].enum, ['retry', 'escalate', 'skip']);
});

test('schemaVersion is fixed, and Luna may name one action in both of its fields', async () => {
  const { normalizeLunaDecision } = await import('../src/protocol.mjs');
  for (const schema of [LUNA_SCHEMA, TERRA_SCHEMA, SOL_SCHEMA]) assert.deepEqual(schema.properties.schemaVersion.enum, [MIND_SCHEMA]);
  const look = { kind: 'look', targetIndex: null, x: null, z: null, degrees: null, range: null, maxMs: 1200, stopHpPct: null };
  const base = { schemaVersion: MIND_SCHEMA, note: 'Inspect', memory: '', handbookQuery: '', confidence: 0.9, escalate: false };
  assert.equal(normalizeLunaDecision({ ...base, intent: look, task: { kind: 'intent', payload: { ...look } } }).intent.kind, 'look');
  assert.throws(() => normalizeLunaDecision({ ...base, intent: look, task: { kind: 'intent', payload: { ...look, kind: 'explore' } } }), /exactly one/);
});

test('a health floor on a non-combat intent is ignored, and still checked on fight', async () => {
  const { normalizeNativeDecision } = await import('../src/protocol.mjs');
  // Live 2026-10-29: Luna asked to explore with stopHpPct 60 three times and every reply was refused.
  const explore = normalizeNativeDecision({ intent: { kind: 'explore', maxMs: 8000, stopHpPct: 60 } }).intent ?? normalizeNativeDecision({ intent: { kind: 'explore', maxMs: 8000, stopHpPct: 60 } });
  assert.equal(explore.stopHpPct, undefined);
  assert.throws(() => normalizeNativeDecision({ intent: { kind: 'fight', stopHpPct: 140 } }), /health floor/);
});
