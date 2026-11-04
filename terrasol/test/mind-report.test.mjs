import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildReport } from '../src/report.mjs';

test('report keeps per-tier telemetry, historical roles and cached-input accounting', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-mind-report-'));
  try {
    fs.mkdirSync(path.join(dir, 'epoch-1'));
    const row = (kind, seconds, fields = {}) => JSON.stringify({ mode: 'online', kind, at: new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString(), ...fields }) + '\n';
    fs.writeFileSync(path.join(dir, 'trace.jsonl'), row('session-start', 0) + row('worker-exit', 30, { epoch: 1, code: 75 }) + row('session-end', 31));
    const events = [
      row('epoch-start', 1),
      row('observation', 2, { generation: 0 }),
      row('model-request', 3, { role: 'terra', schemaVersion: 'dfo-mind.v1', requestId: 'r1', planVersion: 0 }),
      row('plan-update', 3.5, { version: 1, baseVersion: 0, status: 'active', goal: 'Explore' }),
      row('model-response', 5, { role: 'terra', schemaVersion: 'dfo-mind.v1', requestId: 'r1', usage: { input_tokens: 100, cached_input_tokens: 40, output_tokens: 10 } }),
      row('intent-outcome', 6, { task: { id: 1, status: 'terminal', kind: 'goto', outcome: 'completed', progress: { displacement: 3, remaining: 0.2 }, cleanupPending: false } }),
      row('model-request', 7, { role: 'luna', schemaVersion: 'dfo-mind.v1', requestId: 'r2', planVersion: 1 }),
      row('model-response', 8, { role: 'luna', schemaVersion: 'dfo-mind.v1', requestId: 'r2', usage: { input_tokens: 50, cached_input_tokens: 10, output_tokens: 5 } }),
      row('tier-reply-rejected', 8.5, { role: 'terra', reason: 'plan-version-changed' }),
      row('plan-update', 9, { version: 2, baseVersion: 1, status: 'complete', goal: 'Explore' }),
      row('mind-pause', 10, { reason: 'budget-exhausted:call-cap', operator: false }),
      // Historical two-tier record has no schemaVersion; it remains a legacy pilot record.
      row('model-request', 11, { role: 'terra' }),
      row('model-response', 12, { role: 'terra', usage: { input_tokens: 20, cached_input_tokens: 0, output_tokens: 2 } }),
    ];
    fs.writeFileSync(path.join(dir, 'epoch-1', 'trace.jsonl'), events.join(''));
    const report = buildReport(dir);
    assert.equal(report.counts.tierRequests.terra, 2);
    assert.equal(report.counts.tierRequests.luna, 1);
    assert.equal(report.counts.legacyPilotRequests, 1);
    assert.equal(report.modelTiming.luna.completed, 1);
    assert.equal(report.modelTiming.terra.completed, 2);
    assert.equal(report.plans.length, 2);
    assert.equal(report.latestPlan.version, 2);
    assert.equal(report.pauses[0].reason, 'budget-exhausted:call-cap');
    assert.equal(report.tierEvents.staleReplies, 1);
    assert.equal(report.usageByRole.terra.input_tokens, 120);
    assert.equal(report.usageByRole.luna.input_tokens, 50);
    assert.equal(report.playingRoleUsage.cached_input_tokens, 50);
    assert.equal(report.playingRoleUsage.input_tokens, 170);
    assert.equal(report.verifiedOutcomes, 1);
    assert.equal(report.efficiency.modelCalls, 3);
    assert.equal(report.engineeringUsage, 'unavailable');
    assert.match(report.note, /engineering usage (is unavailable|are unknown),? not zero/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
