import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { sourceContext } from './source-context.mjs';
import { collectSourceTables } from './tables.mjs';
import registry from '../facts/registry.mjs';
// Report value and provenance changes without hiding additions or removals.
export function diffFacts(previous = {}, next = {}) {
  const changes = [];
  const ids = [...new Set([...Object.keys(previous), ...Object.keys(next)])].sort();
  for (const id of ids) {
    if (!Object.hasOwn(next, id)) changes.push(`removed ${id}: ${previous[id].value}`);
    else if (!Object.hasOwn(previous, id)) changes.push(`added ${id}: ${next[id].value}`);
    else if (JSON.stringify(previous[id]) !== JSON.stringify(next[id])) {
      changes.push(previous[id].value === next[id].value ? `changed ${id}: metadata (value ${next[id].value} unchanged)`: `changed ${id}: ${previous[id].value} \u2192 ${next[id].value}`);
    }
  }
  return changes;
}
// Evaluate every fact and source table before replacing either snapshot.
export async function extractFacts({
  src = process.env.DFO_SRC, commit = process.env.DFO_COMMIT, output, definitions = registry, tablesOutput, tableDefinitions
} = {}) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  src = resolve(src || join(root, '../upstream/daggerfall-js-source/src'));
  output ||= join(root, 'facts/facts.json');
  tablesOutput ||= join(dirname(output), 'tables.json');
  if (!commit) {
    try {
      commit = execFileSync('git', ['-C', dirname(src), 'rev-parse', '--short', 'HEAD'], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
      }).trim();
    } catch {
      throw Error('Cannot determine DFO commit. Set DFO_COMMIT for a detached source snapshot.');
    }
  }
  if (!/^[a-f0-9]{7,40}$/i.test(commit)) throw Error('DFO_COMMIT must be a git commit hash');
  const dfo = sourceContext(src);
  const facts = await collectFacts(definitions, dfo);
  const sourceTables = await collectSourceTables(dfo, tableDefinitions);
  let old = {};
  try {
    old = JSON.parse(await readFile(output, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const diff = diffFacts(old.facts, facts);
  diff.forEach(line => console.log(line));
  if (!diff.length) console.log('No fact changes.');
  const result = {
    commit, extractedAt: new Date().toISOString(), facts
  };
  await mkdir(dirname(output), {
    recursive: true
  });
  await mkdir(dirname(tablesOutput), { recursive: true });
  await writeFile(tablesOutput, JSON.stringify({ commit, extractedAt: result.extractedAt, tables: sourceTables }, null, 2) + '\n');
  await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  console.log(`Extracted ${Object.keys(facts).length} facts at ${commit}.`);
  console.log(`Extracted ${Object.keys(sourceTables).length} source tables at ${commit}.`);
  return result;
}
// Collect every failure before refusing to replace the last good facts file.
async function collectFacts(definitions, dfo) {
  const facts = {}, errors = [];
  for (const definition of definitions) {
    try {
      if (Object.hasOwn(facts, definition.id)) throw Error('Duplicate fact id');
      const value = await definition.read(dfo);
      if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(`Expected a finite number, got ${String(value)}`);
      const {
        label, unit, source, symbol, appliesOnline, vendor, key, method
      } = definition;
      facts[definition.id] = {
        value,
        label,
        ...(unit ? {
          unit
        }
        : {}),
        source,
        symbol,
        method,
        appliesOnline,
        ...(vendor ? {
          vendor, key
        }
        : {})
      };
    } catch (error) {
      errors.push(`${definition.id} (${definition.source} / ${definition.symbol}): ${error.message}`);
    }
  }
  if (errors.length) throw Error(`Fact extraction failed; previous file preserved:\n${errors.join('\n')}`);
  return facts;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) extractFacts().catch (error => {
  console.error(error.message);
  process.exitCode = 1;
});
