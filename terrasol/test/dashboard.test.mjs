import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDashboard } from '../src/dashboard.mjs';

test('dashboard uses the local status, cached screen and command endpoints', () => {
  const html = renderDashboard();
  assert.match(html, /fetch\('\/session'/);
  assert.match(html, /fetch\('\/screen\?t='/);
  assert.match(html, /fetch\('\/command'/);
  assert.match(html, /data-command="hold"/);
  assert.match(html, /data-command="resume"/);
  assert.doesNotMatch(html, /innerHTML|https?:\/\//);
});
