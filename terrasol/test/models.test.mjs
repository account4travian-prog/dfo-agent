import test from 'node:test';
import assert from 'node:assert/strict';
import { askModel, isUsageLimit, roleInstructionConfig } from '../src/models.mjs';
import { existsSync } from 'node:fs';

test('rejects invalid requests before launching Codex', async () => {
  await assert.rejects(askModel({ model: 'other', prompt: 'hi' }), /Unsupported model/);
  await assert.rejects(askModel({ model: 'gpt-6.1-terra', prompt: '' }), /Prompt/);
  await assert.rejects(askModel({ model: 'gpt-6.1-sol', prompt: 'hi', images: ['missing.png'] }), /Images/);
  await assert.rejects(askModel({ model: 'gpt-6.1-sol', prompt: 'hi', schema: [] }), /Schema/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(askModel({ model: 'gpt-6.1-terra', prompt: 'hi', signal: controller.signal }), /cancelled/);
});

test('role instruction config references the existing dedicated instruction file', () => {
  const config = roleInstructionConfig();
  assert.match(config, /^model_instructions_file=".*\/src\/role-instructions\.md"$/);
  assert.equal(existsSync(JSON.parse(config.slice(config.indexOf('=') + 1))), true);
});

test('classifies usage and rate exhaustion without treating unrelated failures as limits', () => {
  for (const message of ['Usage limit reached', 'RATE_LIMIT_EXCEEDED', 'quota_exceeded', 'no credits remaining', 'Too many requests']) assert.equal(isUsageLimit(message), true);
  for (const message of ['network disconnected', 'invalid output schema', '', null]) assert.equal(isUsageLimit(message), false);
});
