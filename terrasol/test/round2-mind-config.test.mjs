import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMindConfig, loadMindConfig, roleAvailable, RESOLVED_LUNA_ID } from '../src/mind/config.mjs';
import { parseModelMetadata, readLocalModelMetadata } from '../src/mind/model-metadata.mjs';
import { buildPreflightPlan, runRolePreflight } from '../src/mind/preflight.mjs';

function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-r2-config-')); }
const metadataDocument = {
  fetched_at: '2026-10-28T00:00:00Z', client_version: 'test',
  models: [
    { slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', visibility: 'list', supported_in_api: true, priority: 1, default_reasoning_level: 'low' },
    { slug: 'gpt-6.1-terra', display_name: 'GPT-6.1 Terra', visibility: 'list', supported_in_api: true, priority: 3, default_reasoning_level: 'low' },
    { slug: 'gpt-6-luna', display_name: 'GPT-6 Luna', visibility: 'list', supported_in_api: true, priority: 5, default_reasoning_level: 'medium' },
    { slug: 'gpt-5.6-luna', display_name: 'GPT-5.6 Luna', visibility: 'list', supported_in_api: true, priority: 9, default_reasoning_level: 'medium' },
    { slug: 'gpt-5.6-terra', display_name: 'GPT-5.6 Terra', visibility: 'list', supported_in_api: true, priority: 8 },
  ],
};

test('local model metadata resolves an exact available Luna/Terra/Sol set', () => {
  const metadata = parseModelMetadata(metadataDocument, { source: 'fixture' });
  assert.equal(metadata.ok, true);
  assert.equal(metadata.models.luna.slug, 'gpt-6-luna');
  assert.equal(metadata.models.terra.slug, 'gpt-6.1-terra');
  assert.equal(metadata.models.sol.slug, 'gpt-6.1-sol');
  const dir = temp();
  try {
    const file = path.join(dir, 'models_cache.json');
    fs.writeFileSync(file, JSON.stringify(metadataDocument));
    const read = readLocalModelMetadata({ env: { DFO_MODELS_CACHE: file } });
    assert.equal(read.ok, true);
    assert.equal(read.source, file);
    assert.equal(read.fetchedAt, metadataDocument.fetched_at);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('config resolves Luna from metadata, keeps finite caps and never substitutes a model', () => {
  const metadata = parseModelMetadata(metadataDocument, { source: 'fixture' });
  const config = resolveMindConfig({}, { modelMetadata: metadata });
  assert.equal(config.roles.luna.model, RESOLVED_LUNA_ID);
  assert.equal(config.roles.terra.model, 'gpt-6.1-terra');
  assert.equal(config.roles.sol.model, 'gpt-6.1-sol');
  assert.deepEqual(config.models.allowlist, ['gpt-6-luna', 'gpt-6.1-terra', 'gpt-6.1-sol']);
  assert.equal(config.models.resolution.ok, true);
  assert.equal(roleAvailable(config, 'luna', config.models.allowlist).ok, true);
  assert.ok(config.budget.maxInputTokens > 0);
  assert.ok(config.budget.maxCalls > 0);
  assert.equal(config.scheduler.continueAfterPlan, true);
  const explicit = resolveMindConfig({ roles: { luna: { model: 'gpt-5.6-luna' } } }, { modelMetadata: metadata });
  assert.equal(explicit.roles.luna.model, 'gpt-5.6-luna');
});

test('loadMindConfig finds the local cache and logs the resolution without model calls', () => {
  const dir = temp();
  try {
    const file = path.join(dir, 'models_cache.json');
    fs.writeFileSync(file, JSON.stringify(metadataDocument));
    const config = loadMindConfig({ env: { DFO_MODELS_CACHE: file } });
    assert.equal(config.roles.luna.model, 'gpt-6-luna');
    assert.equal(config.models.resolution.source, file);
    const overridden = loadMindConfig({ env: { DFO_MODELS_CACHE: file, DFO_LUNA_MODEL: 'gpt-5.6-luna' } });
    assert.equal(overridden.roles.luna.model, 'gpt-5.6-luna');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('bounded preflight is model-free until an explicit operator execution', async () => {
  const config = resolveMindConfig({}, { modelMetadata: parseModelMetadata(metadataDocument, { source: 'fixture' }) });
  const plan = buildPreflightPlan(config, { env: {} });
  assert.equal(plan.runnable, true);
  assert.equal(plan.subscriptionOnly, true);
  assert.equal(plan.apiBillingFallback, false);
  let calls = 0;
  const denied = await runRolePreflight({ config, askModel: async () => { calls++; }, env: {} });
  assert.equal(denied.ok, false);
  assert.equal(denied.code, 'operator-required');
  assert.equal(calls, 0);
  const receipts = [];
  const run = await runRolePreflight({
    config, allowPaid: true, env: { DFO_REAL_ROLE_PREFLIGHT: '1' }, clock: (() => { let value = 0; return () => (value += 10); })(),
    askModel: async ({ model }) => { calls++; return { json: { ok: true, role: model.includes('luna') ? 'luna' : model.includes('terra') ? 'terra' : 'sol' }, requestedModel: model, usage: { input_tokens: 10, cached_input_tokens: 0, output_tokens: 2 }, sessionId: 's' }; },
  });
  assert.equal(run.ok, true, JSON.stringify(run));
  assert.equal(calls, 3);
  assert.equal(run.receipts.length, 3);
  assert.ok(run.receipts.every(receipt => receipt.usageReported === true));
});
