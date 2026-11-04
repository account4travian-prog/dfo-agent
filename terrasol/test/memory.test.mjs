import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMemory } from '../src/memory.mjs';

test('persists all categories and recovers a torn final ledger entry', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-memory-'));
  const first = createMemory(dir);
  first.remember({ text: 'A bank is near the gate', kind: 'observation', confidence: 0.8 });
  first.remember({ text: 'The handbook mentions crafting', kind: 'handbook', source: 'handbook' });
  first.setGoal('Find the bank');
  first.journal('I should check the gate.');
  first.checkpoint();
  first.close();
  assert.throws(() => first.journal('closed'), /closed/);
  fs.appendFileSync(path.join(dir, 'memory.jsonl'), '{"revision":5');
  fs.writeFileSync(path.join(dir, 'snapshot.json'), '{broken');
  const recovered = createMemory(dir);
  assert.equal(recovered.snapshot().revision, 4);
  assert.equal(recovered.snapshot().goal, 'Find the bank');
  assert.equal(recovered.context('crafting', 1)[0].kind, 'handbook');
  assert.equal(recovered.remember({ text: 'Checked the gate', kind: 'routine' }).revision, 5);
  recovered.close();
  const reopened = createMemory(dir);
  assert.equal(reopened.snapshot().entries.length, 5);
  assert.match(reopened.persona.identity, /Daggerfall Online/);
  reopened.close();
});

test('retains old entries and validates inputs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-memory-'));
  const memory = createMemory(dir);
  memory.remember({ text: 'ancient unique landmark', kind: 'uncertain' });
  for (let i = 0; i < 205; i++) memory.remember({ text: `ordinary ${i}`, kind: 'social' });
  assert.equal(memory.context('unique landmark', 1)[0].revision, 1);
  assert.throws(() => memory.remember({ text: 'x'.repeat(4001) }), TypeError);
  assert.throws(() => memory.remember({ text: 'x', kind: 'invented' }), TypeError);
  assert.throws(() => memory.context('', 100), TypeError);
  memory.close();
  const reopened = createMemory(dir);
  assert.equal(reopened.snapshot().entries.length, 206);
  reopened.close();
});

test('a short write requires reopening before another memory can be saved', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-memory-'));
  const memory = createMemory(dir);
  memory.remember({ text: 'first' });
  const original = fs.writeSync;
  try {
    fs.writeSync = (fd, line) => original(fd, line.slice(0, 3), null, 'utf8');
    assert.throws(() => memory.remember({ text: 'interrupted' }), /Incomplete memory write/);
  } finally { fs.writeSync = original; }
  assert.throws(() => memory.remember({ text: 'unsafe' }), /reopen to recover/);
  memory.close();
  const recovered = createMemory(dir);
  assert.equal(recovered.remember({ text: 'recovered' }).revision, 2);
  recovered.close();
});
