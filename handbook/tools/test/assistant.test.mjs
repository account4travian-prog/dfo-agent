import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantPlugin } from '../assistant-plugin.mjs';

test('the static-first assistant ships quoted cards and an optional model answer control', async () => {
  const plugin = await assistantPlugin();
  assert.match(plugin.html, /class="guide-assistant"/);
  assert.match(plugin.html, /id="ga-query"/);
  assert.match(plugin.html, /THE ARCHIVIST/);
  assert.match(plugin.html, /id="ga-ask"/);
  assert.match(plugin.html, /Static-first preview/);
  assert.doesNotMatch(plugin.html, /api\.openai|workers\.ai|fetch\(['"]https?:/i);
  assert.equal(typeof plugin.publish, 'function');
});

test('the assistant is opt-out for fixture builds', async () => {
  const off = await assistantPlugin({ assistant: false });
  assert.equal(off.html, '');
  assert.equal(off.publish, undefined);
});
