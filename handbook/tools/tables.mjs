import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { basename, join } from 'node:path';
import { escapeHtml as e } from './markdown.mjs';
export const tables = await discoverTables();
// A new definition file is the whole registration step. IDs must match safe filenames.
async function discoverTables() {
  const directory = fileURLToPath(new URL('../facts/tables/', import.meta.url));
  const result = new Map();
  for (const file of(await readdir(directory)).filter(file => file.endsWith('.mjs')).sort()) {
    const {
      default: table
    } = await import (pathToFileURL(join(directory, file)).href);
    if (!table || !/^[a-z][a-z0-9.-]+$/.test(table.id) || table.id !== basename(file, '.mjs') || !['source', 'game-data'].includes(table.origin) || !Array.isArray(table.columns) || typeof table.rows !== 'function') throw Error(`Invalid table definition: ${file}`);
    if (result.has(table.id)) throw Error(`Duplicate table id: ${table.id}`);
    result.set(table.id, table);
  }
  return result;
}
export const localTableNote = "This table is drawn from the game's data files and is available in local builds.";
// Extraction evaluates all public tables, including tables not yet used by an article.
export async function collectSourceTables(dfo, definitions = tables.values()) {
  const rowsById = {};
  for (const definition of definitions) {
    if (definition.origin !== 'source') continue;
    if (Object.hasOwn(rowsById, definition.id)) throw Error(`Duplicate table id: ${definition.id}`);
    const rows = await definition.rows({ dfo });
    validateRows(definition, rows);
    rowsById[definition.id] = rows;
  }
  return rowsById;
}
function validateRows(definition, rows) {
  if (!Array.isArray(rows) || rows.some(row => !Array.isArray(row) || row.length !== definition.columns.length || row.some(cell => !['string', 'number', 'boolean'].includes(typeof cell) || (typeof cell === 'number' && !Number.isFinite(cell))))) throw Error(`Invalid row in ${definition.id}`);
}
// Materialize only referenced tables; public builds never read the player's extract.
export async function prepareTables(ids, options = {}) {
  const html = new Map();
  let gameData, snapshot;
  for (const id of ids) {
    const definition = tables.get(id);
    if (!definition) throw Error(`Unknown table id: ${id}`);
    if (definition.origin === 'game-data' && !options.gameData) {
      html.set(id, `<p class="local-build-note">${localTableNote}</p>`);
      continue;
    }
    if (definition.origin === 'game-data') gameData ||= JSON.parse(await readFile(resolve(options.gameDataFile || 'planner/data/game-data.json'), 'utf8'));
    let rows;
    if (definition.origin === 'source') {
      const file = options.tablesFile || (options.root ? join(options.root, 'facts/tables.json') : new URL('../facts/tables.json', import.meta.url));
      snapshot ||= JSON.parse(await readFile(file, 'utf8'));
      if (!/^[a-f0-9]{7,40}$/i.test(snapshot.commit || '') || (options.factsCommit && snapshot.commit !== options.factsCommit)) throw Error('Source table snapshot commit must match facts; rerun extract-facts.mjs');
      rows = snapshot.tables?.[id];
      if (!rows) throw Error(`Missing source table snapshot: ${id}; rerun extract-facts.mjs`);
    } else {
      rows = await definition.rows({ gameData });
    }
    validateRows(definition, rows);
    html.set(id, renderTable(definition, rows));
  }
  return html;
}
// Table cells are text, including their provenance; no source HTML can execute.
function renderTable(definition, rows) {
  const cells = (row, tag) => row.map(cell => `<${tag}${tag === 'th' ? ' scope="col"' : ''}>${e(cell)}</${tag}>`).join('');
  return `<figure class="data-table"><div class="table-scroll" role="region" aria-label="${e(definition.title)}" tabindex="0"><table><caption>${e(definition.title)}</caption><thead><tr>${cells(definition.columns, 'th')}</tr></thead><tbody>${rows.map(row => `<tr>${cells(row, 'td')}</tr>`).join('')}</tbody></table></div><figcaption>${definition.note ? `<p>${e(definition.note)}</p>` : ''}Source: ${e(definition.source)}</figcaption></figure>`;
}
