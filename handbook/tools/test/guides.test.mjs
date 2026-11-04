import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = [
  'begin/offline-and-online.md',
  'begin/first-90-minutes.md',
  'reference/coming-from-daggerfall.md',
  'reference/mods-saves-and-wipes.md',
  'town/play-with-a-friend.md',
  'feet/session-planner.md',
  'feet/progression-map.md',
  'creation/online-builds.md',
  'town/standing-and-reputation.md',
  'gear/safe-storage.md',
  'feet/money-routes.md',
  'hold/combat-math.md',
  'gear/spellmaking-math.md',
  'gear/magic-item-economy.md',
  'hold/bestiary.md',
  'hold/privateers-hold-walkthrough.md',
  'hold/stuck-and-recovery.md'
];

test('the guide-expansion set ships complete, source-checked drafts', () => {
  const orders = new Map();
  for (const page of pages) {
    const text = readFileSync(`handbook/content/${page}`, 'utf8');
    assert.match(text, /^---\n[\s\S]*?\n---\n/, `${page} has front matter`);
    assert.match(text, /^title: .+$/m, `${page} has a title`);
    assert.match(text, /^summary: .+$/m, `${page} has a summary`);
    assert.match(text, /^stage: (begin|creation|feet|gear|hold|reference|town)$/m, `${page} has a known stage`);
    const order = Number(text.match(/^order:\s*(\d+)$/m)?.[1]);
    assert.ok(order > 0, `${page} has an order`);
    const key = `${text.match(/^stage:\s*(.+)$/m)[1]}:${order}`;
    assert.ok(!orders.has(key), `${page} order ${key} is unique`);
    orders.set(key, page);
    assert.match(text, /^status: draft$/m, `${page} is still a draft`);
    assert.match(text, /^verified: e4f093166$/m, `${page} is verified against the snapshot`);
    assert.match(text, /^> \[!tip\] At a glance/m, `${page} has an at-a-glance box`);
    assert.match(text, /^## Common mistakes$/m, `${page} has common mistakes`);
    assert.match(text, /^## Sources$/m, `${page} cites sources`);
    assert.ok(text.split(/\s+/).length > 700, `${page} is substantial`);
  }
});
