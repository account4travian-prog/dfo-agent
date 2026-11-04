import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { extractFacts } from '../extract-facts.mjs';
import { prepareTables, tables } from '../tables.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const run = promisify(execFile);

test('extraction snapshots every source table and never evaluates game-data tables', async () => {
  const dir = await mkdtemp(join(fixtures, 'snapshot-'));
  const output = join(dir, 'facts.json'), tablesOutput = join(dir, 'tables.json');
  const definition = { id: 'test.source', origin: 'source', columns: ['Name'], rows: async () => [['Saved row']] };
  try {
    await extractFacts({ src: dir, commit: '0df2d87eb', output, definitions: [], tableDefinitions: [definition, { origin: 'game-data', rows() { throw Error('Private data read'); } }] });
    const facts = JSON.parse(await readFile(output, 'utf8'));
    const snapshot = JSON.parse(await readFile(tablesOutput, 'utf8'));
    assert.equal(snapshot.commit, facts.commit);
    assert.equal(snapshot.extractedAt, facts.extractedAt);
    assert.deepEqual(snapshot.tables, { 'test.source': [['Saved row']] });
    await writeFile(output, 'previous facts');
    await writeFile(tablesOutput, 'previous tables');
    await assert.rejects(extractFacts({ src: dir, commit: '0df2d87eb', output, definitions: [], tableDefinitions: [{ ...definition, rows: async () => [[null]] }] }), /Invalid row/);
    assert.equal(await readFile(output, 'utf8'), 'previous facts');
    assert.equal(await readFile(tablesOutput, 'utf8'), 'previous tables');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('source snapshot includes every registered source table and excludes private tables', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../../facts/tables.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(snapshot.tables).sort(), [...tables.values()].filter(t => t.origin === 'source').map(t => t.id).sort());
  await assert.rejects(prepareTables(['classes.skills'], { factsCommit: '0000000' }), /commit must match facts/);
});

test('build succeeds with DFO_SRC unset, no fallback source tree and source readers disabled', async () => {
  const dir = await mkdtemp(join(fixtures, 'source-free-'));
  const dist = join(dir, 'dist');
  const contentDir = join(dir, 'content');
  const env = { ...process.env };
  delete env.DFO_SRC;
  delete env.DFO_COMMIT;
  const buildUrl = new URL('../build.mjs', import.meta.url).href;
  const tablesUrl = new URL('../tables.mjs', import.meta.url).href;
  // Separate process prevents environment or source-module caches from hiding a dependency.
  const script = `
    import { build } from ${JSON.stringify(buildUrl)};
    import { tables, prepareTables } from ${JSON.stringify(tablesUrl)};
    for (const table of tables.values()) if (table.origin === 'source') table.rows = () => { throw Error('Build evaluated DFO source'); };
    const html = await prepareTables(['classes.skills', 'online.ruleset', 'classes.base'], { gameDataFile: 'missing-private-data.json' });
    if (!html.get('classes.skills').includes('Critical Strike') || !html.get('classes.base').includes('available in local builds')) throw Error('Snapshot or data gate failed');
    const result = await build({ contentDir: ${JSON.stringify(contentDir)}, stagesFile: ${JSON.stringify(join(fixtures, 'stages.json'))}, dist: ${JSON.stringify(dist)} });
    if (!result.site.pages.some(p => p.render.tableIds.includes('online.ruleset'))) throw Error('Build did not exercise source tables');
  `;
  try {
    await mkdir(join(contentDir, 'begin'), { recursive: true });
    await writeFile(join(contentDir, 'begin/source-tables.md'), '---\ntitle: Source tables\nsummary: Snapshot build fixture\ntags: [test]\nstage: begin\norder: 1\ngate: none\nverified: 0df2d87eb\n---\n\n```table online.ruleset\n```\n\n```table classes.skills\n```\n\n```table classes.base\n```\n\n## Sources\n\n- Checked-in table snapshot.\n');
    await run(process.execPath, ['--input-type=module', '-e', script], { cwd: dir, env });
    const article = await readFile(join(dist, 'begin/source-tables/index.html'), 'utf8');
    assert.match(article, /fixedStrengthDamageModifier = true/);
    assert.match(article, /Balance-locked at defaults/);
    assert.match(article, /available in local builds/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
