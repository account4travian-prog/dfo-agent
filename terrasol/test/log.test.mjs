import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLogger } from '../src/log.mjs';

test('appends durable sequential events, scrubs credentials and retains game keys', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-log-'));
  const log = createLogger(dir);
  const row = log.event('move', { keys: ['W', 'A'], authorization: 'Bearer abc123', nested: { api_key: 'private', text: 'Bearer abc123', url: 'https://example.test/?token=anothersecret&x=1' } });
  assert.deepEqual(row.keys, ['W', 'A']);
  assert.equal(row.authorization, '[REDACTED]');
  log.flush();
  log.close();
  const contents = fs.readFileSync(path.join(dir, 'trace.jsonl'), 'utf8');
  assert.ok(!contents.includes('abc123') && !contents.includes('private') && !contents.includes('anothersecret'));
  const resumed = createLogger(dir);
  assert.equal(resumed.event('next').seq, 2);
  resumed.close();
});

test('discards incomplete final event on recovery and reports invalid state', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-log-'));
  const log = createLogger(dir);
  log.event('one'); log.close();
  fs.appendFileSync(path.join(dir, 'trace.jsonl'), '{"seq":2');
  const resumed = createLogger(dir);
  assert.equal(resumed.event('two').seq, 2);
  resumed.close();
  assert.throws(() => resumed.event('closed'), /closed/);
  assert.equal(fs.readFileSync(path.join(dir, 'trace.jsonl'), 'utf8').trim().split('\n').length, 2);
});

test('a short write stops the writer until tail recovery', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-log-'));
  const log = createLogger(dir);
  log.event('first');
  const original = fs.writeSync;
  try {
    fs.writeSync = (fd, line) => original(fd, line.slice(0, 3), null, 'utf8');
    assert.throws(() => log.event('interrupted'), /Incomplete log write/);
  } finally { fs.writeSync = original; }
  assert.throws(() => log.event('unsafe'), /reopen to recover/);
  log.close();
  const recovered = createLogger(dir);
  assert.equal(recovered.event('recovered').seq, 2);
  recovered.close();
});
