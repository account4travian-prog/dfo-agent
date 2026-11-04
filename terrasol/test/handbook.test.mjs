import test from 'node:test';
import assert from 'node:assert/strict';
import { searchHandbook } from '../src/handbook.mjs';

test('finds helpful pages for common early-game questions', () => {
  for (const [query, relevant] of [
    ["Privateer's Hold first hours", /hold|first/i],
    ['spellcasting cast spell', /spell|magic/i],
    ['offline death online respawn', /offline|online|death/i],
    ['travel map destinations', /map|travel/i],
    ['combat fighting weapon swing', /fight|combat|control/i],
  ]) {
    const results = searchHandbook(query);
    assert.ok(results.length, query);
    assert.ok(results.some(r => relevant.test(`${r.title} ${r.path} ${r.text}`)), query);
    for (const result of results) {
      assert.ok(result.title && result.path.endsWith('.md') && result.text, query);
      assert.ok(!result.path.includes('..'), query);
    }
  }
});

test('returns deterministic bounded results and handles empty requests', () => {
  const results = searchHandbook('travel map', { limit: 2, maxChars: 300 });
  assert.deepEqual(results, searchHandbook('travel map', { limit: 2, maxChars: 300 }));
  assert.ok(results.length <= 2);
  assert.ok(results.reduce((sum, r) => sum + r.text.length, 0) <= 300);
  assert.deepEqual(searchHandbook(''), []);
  assert.deepEqual(searchHandbook('travel', { limit: 0 }), []);
  assert.deepEqual(searchHandbook('travel', { maxChars: 0 }), []);
  assert.deepEqual(searchHandbook('qzxvblorb123456789'), []);
});
