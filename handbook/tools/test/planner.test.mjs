import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { plannerPlugin } from '../planner-plugin.mjs';

const hasPlannerData = existsSync(new URL('../../../planner/data/game-data.json', import.meta.url));

test('the planner page is opt-in', async () => {
  const off = await plannerPlugin();
  assert.equal(off.html, '');
  assert.equal(off.publish, undefined);
});

test('the planner page embeds the app and publishes it', { skip: !hasPlannerData && 'planner/data/game-data.json is absent' }, async () => {
  const on = await plannerPlugin({ planner: true });
  assert.match(on.html, /class="planner-embed"/);
  assert.match(on.html, /src="\.\.\/\.\.\/planner\/"/);
  assert.equal(typeof on.publish, 'function');
});
