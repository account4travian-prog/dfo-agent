/**
 * Build the assistant's bundled retrieval index from the built site.
 *
 * Run after `node handbook/tools/build.mjs --map --planner`:
 *   node handbook/tools/build-assistant-index.mjs
 *
 * The worker imports the generated JSON; it is not served by the static site.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const search = JSON.parse(await readFile(join(root, 'handbook/dist/search-index.json'), 'utf8'));
const facts = JSON.parse(await readFile(join(root, 'handbook/facts/facts.json'), 'utf8'));

// The browser search index already has page bodies, section excerpts and stable anchors. Keep only what the
// assistant needs, and cap section excerpts so a worker request stays small.
const docs = search.map(doc => ({
  url: doc.url,
  title: doc.title,
  summary: doc.summary ?? '',
  stage: doc.stage ?? '',
  stageId: doc.stageId ?? '',
  gate: doc.gate ?? '',
  status: doc.status ?? 'published',
  tags: doc.tags ?? [],
  headings: doc.headings ?? [],
  body: String(doc.body ?? '').slice(0, 12000),
  sections: Object.fromEntries(Object.entries(doc.sections ?? {}).map(([slug, section]) => [slug, {
    title: section.title ?? '',
    excerpt: String(section.excerpt ?? '').slice(0, 700)
  }]))
}));
const data = {
  schemaVersion: 1,
  builtAt: new Date().toISOString(),
  corpus: { commit: facts.commit ?? null, pages: docs.length, facts: Object.keys(facts.facts ?? {}).length },
  facts: facts.facts ?? {},
  docs
};
const out = join(root, 'handbook/assistant/data/index.json');
await mkdir(join(root, 'handbook/assistant/data'), { recursive: true });
await writeFile(out, JSON.stringify(data));
console.log(`Wrote ${docs.length} docs and ${Object.keys(data.facts).length} facts to ${out} (${(JSON.stringify(data).length / 1024).toFixed(1)} KiB)`);
