import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadSite } from '../site.mjs';
import { build } from '../build.mjs';
import { mapPlugin } from '../map-plugin.mjs';
import { prepareTables } from '../tables.mjs';
import { createTemplates } from '../templates.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const options = { contentDir: join(fixtures, 'reader'), stagesFile: join(fixtures, 'stages.json'), dist: join(fixtures, 'reader/dist') };

test('sidebar uses a shared legend for markers while cards keep full status badges', async () => {
  const site = await loadSite(options);
  const { chrome, card } = createTemplates(site, {});
  const html = chrome('index.html', { title: 'Test', description: 'Test' }, '');
  const sidebar = html.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[1];
  assert.doesNotMatch(sidebar, /status-badge/);
  assert.match(sidebar, /aria-label="Handbook stages" aria-describedby="nav-status-legend"/);
  assert.match(sidebar, /<p class="sr-only" id="nav-status-legend">Pages marked with a dot are drafts/);
  for (const status of ['planned', 'draft']) {
    assert.ok(sidebar.includes(`class="nav-status nav-status-${status}" aria-hidden="true" title="`), `${status} marker is decorative`);
  }
  // The accessible name stays the page title; one legend carries the explanation instead.
  assert.doesNotMatch(sidebar, /role="img"|aria-label="Draft"|aria-label="Planned"|>Draft</);
  assert.match(card(site.pages.find(p => p.meta.status === 'draft'), 'index.html'), /class="status-badge" title="Draft: checked against the game source, not yet read through end to end">Draft<span class="sr-only">/);
  assert.match(sidebar, /class="nav-title-end">weekly&nbsp;<span class="nav-status/);
});

test('planned pages are valid targets and drafts retain normal content', async () => {
  const { site, index } = await build(options);
  assert.deepEqual(site.errors, []);
  assert.ok(site.warnings.some(w => w.includes('planned page')));
  const planned = await readFile(join(options.dist, 'growth/next-journey/index.html'), 'utf8');
  assert.match(planned, /This page is being written/);
  assert.match(planned, /class="status-badge" title="Planned: this page is being written">Planned/);
  const article = await readFile(join(options.dist, 'begin/daily-and-weekly/index.html'), 'utf8');
  assert.match(article, /class="status-badge" title="Draft: checked against the game source, not yet read through end to end">Draft/);
  assert.match(article, /after a table fence/);
  assert.match(article, /available in local builds/);
  assert.match(article, /data-period="weekly"/);
  assert.match(article, /data-definition="A guide to direction/);
  assert.match(article, /id="peek-panel"/);
  assert.equal(index.find(p => p.title === 'Daily and weekly').excerpt, 'Your checklist stays in this browser. Follow a reference while keeping your place in this article.');
});

test('check validates table IDs and still rejects accidental missing articles', async () => {
  const temp = join(fixtures, 'table-validation');
  await mkdir(join(temp, 'begin'), { recursive: true });
  try {
    await writeFile(join(temp, 'begin/sample.md'), '---\ntitle: Sample\nsummary: Sample\nstage: begin\norder: 1\ngate: none\nstatus: planned\n---\n```table no.such.table\n```\n\n[Missing](missing.md)');
    const site = await loadSite({ ...options, contentDir: temp });
    assert.ok(site.errors.some(e => e.includes('unknown table id no.such.table')));
    assert.ok(site.errors.some(e => e.includes('broken internal link')));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('local class tables require an explicit gate and decode a supplied extract', async () => {
  const file = join(fixtures, 'local-table-temp.json');
  const c = { name: '<Test>', strength: 50, intelligence: 50, willpower: 50, agility: 50, endurance: 50, personality: 50, speed: 50, luck: 50, hitPointsPerLevel: 8, advancementMultiplier: 1.2, abilityFlagsAndSpellPointsBitfield: 20 << 8 };
  try {
    await writeFile(file, JSON.stringify({ classes: [c] }));
    const html = await prepareTables(['classes.base'], { gameData: true, gameDataFile: file });
    assert.match(html.get('classes.base'), /&lt;Test&gt;/);
    assert.match(html.get('classes.base'), /0.5 × INT/);
    assert.doesNotMatch(html.get('classes.base'), /<Test>/);
  } finally {
    await rm(file, { force: true });
  }
});

test('map plugin publishes the map data with --map', async () => {
  const map = await mapPlugin({ map: true });
  // A checkout without the private extract has a useful local-build state.
  if (!map.publish) return assert.match(map.html, /missing/);
  const dist = join(fixtures, 'local-map/dist');
  await map.publish(dist);
  assert.match(map.html, /data-assets="..\/..\/map-data\/"/);
  assert.match(map.html, /type="module"/);
  assert.doesNotMatch(map.html, /<script>\(function/);
  assert.ok((await readFile(join(dist, 'map-data/towns/index.json'))).length);
  assert.match(await readFile(join(dist, 'theme/map/bay-map.js'), 'utf8'), /function drawLand/);
  const css = await readFile(join(dist, 'theme/map/bay-map.css'), 'utf8');
  assert.doesNotMatch(css, /\$\{/);
});
