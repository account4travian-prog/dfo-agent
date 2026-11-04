import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMemory } from '../src/memory.mjs';

test('memory qualifies facts, lessons and social context and retrieves the useful ones', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-r2-memory-'));
  const memory = createMemory(dir);
  try {
    memory.setGoal('Find the bank');
    memory.remember({ text: 'The bank is near the north gate', kind: 'observation', confidence: 0.95, subject: 'bank' });
    memory.remember({ text: 'I infer the guild is east of the bank', kind: 'uncertain', confidence: 0.45, subject: 'guild' });
    memory.remember({ text: 'The guard at the gate asked for help', kind: 'social', confidence: 0.8, subject: 'guard', tags: ['npc', 'quest'] });
    memory.remember({ text: 'Routine step 1', kind: 'routine', confidence: 0.2 });
    memory.remember({ text: 'Temporary fact', kind: 'observation', expiresAt: '2000-01-01T00:00:00Z' });
    const selected = memory.select('bank gate guild', { limit: 4 });
    assert.ok(selected.some(row => row.subject === 'bank'));
    assert.ok(selected.some(row => row.kind === 'social'));
    assert.ok(!selected.some(row => row.text === 'Temporary fact'));
    const qualifications = new Set(memory.snapshot().entries.map(row => row.qualification));
    assert.ok(qualifications.has('observed'));
    assert.ok(qualifications.has('inferred') || qualifications.has('uncertain'));
    const compacted = memory.compact({ routineKeep: 1 });
    assert.equal(compacted.routineEntries, 1);
    memory.journal('Unfinished work: ask the gate guard about the missing shipment');
    assert.match(memory.snapshot().entries.at(-1).text, /Unfinished work/);
  } finally {
    memory.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
