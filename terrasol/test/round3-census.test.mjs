import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { census } from '../src/watch/census.mjs';

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'support/round3-watch/legacy');

test('census preserves legacy browser counts but leaves mode-dependent metrics unavailable', () => {
  const result = census(fixture);
  assert.equal(result.verifiedUseful.metricVersion, 2);
  assert.equal(result.verifiedUseful.count, null);
  assert.equal(result.verifiedUseful.state, 'absent');
  assert.equal(result.modelCalls.tiers.terra.usage, 'known');
  assert.equal(result.sections.stopReasons.state, 'absent');
  assert.equal(result.time.waitingOnModelsMs, null);
});

test('census counts native outcomes by task kind and preserves unknown usage', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'round3-census-'));
  try {
    fs.mkdirSync(path.join(dir, 'epoch-1'));
    const row = (kind, fields = {}) => JSON.stringify({ mode: 'online', kind, at: '2026-01-01T00:00:00.000Z', ...fields }) + '\n';
    fs.writeFileSync(path.join(dir, 'trace.jsonl'), row('session-start') + row('session-end'));
    fs.writeFileSync(path.join(dir, 'epoch-1/trace.jsonl'), row('epoch-start') + row('model-request', { role: 'luna' }) + row('model-response', { role: 'luna' }) + row('intent-outcome', { task: { id: 'g1', status: 'terminal', kind: 'goto', outcome: 'completed', progress: { displacement: 3, remaining: 0 } } }));
    const result = census(dir);
    assert.equal(result.verifiedUseful.count, 1);
    assert.equal(result.modelCalls.tiers.luna.usage, 'unknown');
    assert.equal(result.taskOutcomes.byCategory.intent.goto.completed, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
