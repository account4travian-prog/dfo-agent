import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPreviews } from '../previews.mjs';
import { shouldPeek, checklistPeriod } from '../../theme/reading.mjs';
import { renderMarkdown } from '../markdown.mjs';
import { prepareTables } from '../tables.mjs';
import { mageryMultiplier } from '../../facts/tables/classes.base.mjs';
import { mapPlugin } from '../map-plugin.mjs';

// Excerpts must quote prose while preserving page and section ownership.
test('previews skip at-a-glance, callouts, fences, lists, tables and Sources', () => {
  const result = extractPreviews('# Page\n\n## At a glance\n\nSkip this.\n\n## Start\n\n> [!tip] Tip\n> Skip this too.\n\n| Value |\n| --- |\n| 10 |\n\n- Not prose\n\n```js info\nNot prose either\n```\n\nThe **actual** first paragraph\ncontinues here.\n\n## Next\n\nThe next section.\n\n## Sources\n\nSource paragraph.');
  assert.equal(result.excerpt, 'The actual first paragraph continues here.');
  assert.equal(result.sections.start.excerpt, result.excerpt);
  assert.equal(result.sections.next.excerpt, 'The next section.');
  assert.equal(result.sections.sources.excerpt, '');
  assert.equal(result.sections['at-a-glance'].excerpt, '');
});

test('preview section IDs match renderer deduplication, including explicit suffixes', () => {
  const source = '## Same\n\nFirst.\n\n## Same\n\nSecond.\n\n## Same-2\n\nThird.\n\n## Same\n\nFourth.';
  assert.deepEqual(Object.keys(extractPreviews(source).sections), renderMarkdown(source).headings.map(h => h.id));
});

const current = new URL('https://example.test/handbook/begin/first/');
const root = new URL('https://example.test/handbook/');
const event = { button: 0 };
const link = (url, options = {}) => ({ href: new URL(url, current).href, target: options.target || '', hasAttribute: key => key === 'download' && options.download, closest: () => options.excluded, classList: { contains: () => options.glossary } });

test('a plain click navigates; Ctrl or Cmd+click opens the panel; panel links stay in the panel', () => {
  const ctrl = { button: 0, ctrlKey: true }, cmd = { button: 0, metaKey: true };
  assert.equal(shouldPeek(event, link('../../creation/classes/'), current, root), false);
  assert.equal(shouldPeek(ctrl, link('../../creation/classes/'), current, root), true);
  assert.equal(shouldPeek(cmd, link('../../creation/classes/'), current, root), true);
  assert.equal(shouldPeek(ctrl, link('#part'), current, root), false);
  assert.equal(shouldPeek(ctrl, link('#part', { glossary: true }), current, root), true);
  assert.equal(shouldPeek(event, link('#part'), current, root, true), true);
  assert.equal(shouldPeek(event, link('../../creation/classes/'), current, root, true), true);
});

test('peek leaves Shift, Alt, middle click, external links and files to the browser', () => {
  const target = link('../../creation/classes/'), ctrl = { button: 0, ctrlKey: true };
  for (const flag of ['shiftKey', 'altKey', 'defaultPrevented']) assert.equal(shouldPeek({ ...ctrl, [flag]: true }, target, current, root), false, flag);
  for (const button of [1, 2]) assert.equal(shouldPeek({ button, ctrlKey: true }, target, current, root), false);
  for (const url of ['https://other.test/', '/outside/', 'file.pdf', '?online', 'mailto:help@example.test']) assert.equal(shouldPeek(ctrl, link(url), current, root), false, url);
  for (const option of [{ target: '_blank' }, { download: true }, { excluded: true }]) assert.equal(shouldPeek(ctrl, link('../../creation/classes/', option), current, root), false);
});

test('fence info strings retain their closing fence and following content', () => {
  const result = renderMarkdown('```table classes.base\n```\n\n## After\n\nStill here.');
  assert.deepEqual(result.tableIds, ['classes.base']);
  assert.match(result.html, /<h2 id="after">After<\/h2>/);
  assert.match(result.html, /<p>Still here\.<\/p>/);
  assert.match(renderMarkdown('```js extra info\nconst x = 1;\n```\n\nAfter').html, /language-js[\s\S]*<p>After<\/p>/);
});

test('checklists use UTC day and Monday UTC week across year boundaries', () => {
  assert.equal(checklistPeriod('daily', new Date('2026-10-21T23:59:00-05:00')), '2026-10-22');
  assert.equal(checklistPeriod('weekly', new Date('2027-01-01T12:00Z')), '2026-12-28');
  assert.equal(checklistPeriod('weekly', new Date('2026-10-26T00:00Z')), '2026-10-26');
  const html = renderMarkdown('```checklist weekly\n- [ ] Visit the bank\nRun a quest\n```', { checklistPage: 'town/tasks/' }).html;
  assert.match(html, /data-checklist="town\/tasks\/-1" data-period="weekly"/);
  assert.equal((html.match(/type="checkbox"/g) || []).length, 2);
  assert.doesNotMatch(html, /\[ \]/);
});

test('public table and map builds do not require or read local data', async () => {
  const html = await prepareTables(['classes.base'], { gameDataFile: 'does-not-exist.json' });
  assert.match(html.get('classes.base'), /available in local builds/);
  await assert.rejects(prepareTables(['missing.table']), /Unknown table id/);
  for (const flags of [{}, { map: true }, { gameData: true }]) {
    const map = await mapPlugin({ ...flags, mapDir: 'does-not-exist' });
    assert.equal(map.publish, undefined);
    assert.doesNotMatch(map.html, /map-data|<canvas/);
  }
});

test('class magery decodes the actual CFG ability field', () => {
  for (const [bits, multiplier] of [[20, '0.5'], [16, '1'], [12, '1.5'], [8, '1.75'], [4, '2'], [0, '3']]) assert.equal(mageryMultiplier((bits << 8) | 1), `${multiplier} × INT`);
  assert.throws(() => mageryMultiplier(28 << 8), /Unknown magery/);
});
