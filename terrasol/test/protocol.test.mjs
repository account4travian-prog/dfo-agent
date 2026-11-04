import test from 'node:test';
import assert from 'node:assert/strict';
import { PILOT_SCHEMA, PLANNER_SCHEMA, normalizeAction } from '../src/protocol.mjs';

const full = { kind: 'wait', keys: [], ms: 250, controlId: null, x: null, y: null, dx: null, dy: null, toX: null, toY: null, text: '', button: 'left' };
test('schemas demand complete strict model responses', () => {
  assert.deepEqual(PILOT_SCHEMA.required, ['note', 'goal', 'memory', 'handbookQuery', 'escalate', 'action']);
  assert.equal(PILOT_SCHEMA.additionalProperties, false);
  assert.equal(PILOT_SCHEMA.properties.action.additionalProperties, false);
  assert.deepEqual(PILOT_SCHEMA.properties.action.required, Object.keys(full));
  assert.deepEqual(PLANNER_SCHEMA.required, ['goal', 'plan', 'memory', 'handbookQuery']);
  assert.equal(PLANNER_SCHEMA.additionalProperties, false);
});
test('each action retains only meaningful fields', () => {
  assert.deepEqual(normalizeAction({ ...full, kind: 'key', keys: ['W'], x: 900 }), { kind: 'key', keys: ['W'] });
  assert.deepEqual(normalizeAction({ ...full, kind: 'click', controlId: 4, x: 8, y: 9, button: 'right' }), { kind: 'click', controlId: 4, button: 'right' });
  assert.deepEqual(normalizeAction({ ...full, kind: 'drag', x: 1, y: 2, toX: 3, toY: 4, button: 'right' }), { kind: 'drag', x: 1, y: 2, toX: 3, toY: 4, button: 'right' });
  assert.deepEqual(normalizeAction({ ...full, kind: 'swing', keys: ['W'], ms: 1200, dx: 80, dy: 0 }), { kind: 'swing', keys: ['W'], ms: 1200, dx: 80, dy: 0 });
  assert.deepEqual(normalizeAction({ ...full, kind: 'swing' }), { kind: 'swing', keys: [], ms: 250 });
  assert.deepEqual(normalizeAction({ ...full, kind: 'hold', keys: ['W'], ms: 12000 }), { kind: 'hold', keys: ['W'], ms: 12000 });
  assert.deepEqual(normalizeAction({ ...full, kind: 'release' }), { kind: 'release' });
  assert.deepEqual(normalizeAction(full), { kind: 'wait', ms: 250 });
});
test('rejects invalid input before it reaches the browser', () => {
  for (const a of [
    { ...full, kind: 'hold', keys: ['W'], ms: 15001 },
    { ...full, kind: 'wait', ms: 6001 },
    { ...full, kind: 'swing', keys: ['W'], ms: 6001 },
    { ...full, kind: 'swing', keys: ['W', 'A', 'S', 'D', 'Q', 'E'] },
    { ...full, kind: 'swing', keys: [''] },
    { ...full, kind: 'swing', dx: 401 },
    { ...full, kind: 'key', keys: [] },
    { ...full, kind: 'click' },
    { ...full, kind: 'click', controlId: -1 },
    { ...full, kind: 'click', controlId: 1, button: 'other' },
    { ...full, kind: 'drag', x: 1, y: 2, toX: 3 },
    { ...full, kind: 'look', dx: 4001 },
    { ...full, kind: 'type', text: 'x'.repeat(2001) },
    { ...full, kind: 'scroll', x: 2 },
    { ...full, kind: 'unknown' },
  ]) assert.throws(() => normalizeAction(a), a.kind);
});
