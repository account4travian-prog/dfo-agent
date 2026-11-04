import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { questPlugin } from '../quest-plugin.mjs';

const data = JSON.parse(await readFile(new URL('../../quests/quests.json', import.meta.url), 'utf8'));
const pageSlugs = new Set((await readdir(new URL('../../content/reference/quests/', import.meta.url))).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')));

test('the quest browser index covers every player-facing quest without demo records', () => {
  assert.equal(data.quests.length, 283);
  assert.ok(data.quests.every(q => !q.id.startsWith('__DEMO')));
  assert.equal(data.categories.length, 16);
  assert.ok(data.quests.every(q => q.category && q.group && q.name));
  const ids = data.quests.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length, 'quest ids are unique');
});

test('the public quest index carries facts, not the quest pack message text', () => {
  const text = JSON.stringify(data);
  assert.doesNotMatch(text, /"messages"\s*:/);
  assert.doesNotMatch(text, /"QRC"\s*:/);
  assert.doesNotMatch(text, /QuestorOffer|QuestFail|RumorsDuringQuest/);
});

test('main-quest and questline steps keep their sheet objectives and guide links', () => {
  const brisienna = data.quests.find(q => q.id === '_BRISIEN');
  assert.ok(brisienna);
  assert.equal(brisienna.kind, 'main');
  assert.ok(brisienna.objectives.length > 0);
  const lineStep = data.quests.find(q => q.id === 'QLBD01');
  assert.ok(lineStep);
  assert.equal(lineStep.questline.id, 'burningDoors');
  assert.equal(lineStep.questline.step, 1);
  assert.match(lineStep.source, /vendor\/dfu-quests\/Quests\/QLBD01\.txt$/);
  assert.equal(lineStep.guide, 'reference/the-burning-doors/');
  assert.equal(data.quests.find(q => q.id === '_BRISIEN').guide, 'reference/lady-brisienna/');
  assert.equal(data.quests.find(q => q.category === 'fighters').patternGuide, 'reference/fighters-guild-hunts/');
  assert.equal(data.quests.find(q => q.category === 'daedric').patternGuide, 'reference/daedric-quests/');
  assert.equal(data.quests.find(q => q.kind === 'tutorial').guide, 'reference/tutorial/');
  assert.equal(data.quests.find(q => q.kind === 'cure').guide, 'reference/cures/');
});

test('every generated family and every questline has a fixed page on disk', () => {
  for (const quest of data.quests) {
    const path = quest.guide || quest.patternGuide;
    if (!path) continue;
    const slug = path.replace(/^reference\//, '').replace(/\/$/, '');
    assert.ok(pageSlugs.has(slug), `${quest.id} links to missing page ${slug}`);
  }
  for (const line of data.lines) {
    for (const step of line.steps) {
      const quest = data.quests.find(q => q.id === step.id);
      assert.ok(quest?.guide, `${line.id}/${step.id} has no fixed guide`);
    }
  }
});

test('the plugin builds the browser shell and one search record per quest', async () => {
  const plugin = await questPlugin();
  assert.match(plugin.html, /class="quest-browser"/);
  assert.match(plugin.html, /id="qb-search"/);
  assert.match(plugin.html, /data-category="main"/);
  assert.equal(plugin.records.length, data.quests.length);
  assert.ok(plugin.records[0].url.startsWith('quests/#'));
  assert.equal(typeof plugin.publish, 'function');
});
