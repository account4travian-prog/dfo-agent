import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { DFO_ROOT } from './config.mjs';

// The handbook and this project share the DFO parent; load the index once per process.
const root = resolve(DFO_ROOT, 'handbook/content');
const words = text => (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(w => w.length > 1);
const stop = new Set('a an and are as at be by can do for from how i in is it me my of on or the to what when where with you your'.split(' '));
let index;

function buildIndex() {
  const paths = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) paths.push(path);
    }
  }
  walk(root);
  const docs = paths.map(path => {
    const raw = readFileSync(path, 'utf8');
    const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    const meta = front?.[1] ?? '';
    const title = meta.match(/^title:\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '') ?? path.split(/[\\/]/).pop().replace(/\.md$/i, '');
    const summary = meta.match(/^summary:\s*(.+)$/m)?.[1] ?? '';
    const tags = meta.match(/^tags:\s*(.+)$/m)?.[1] ?? '';
    const body = raw.slice(front?.[0].length ?? 0).split(/\r?\n## Sources\s*(?:\r?\n|$)/i)[0];
    const counts = new Map();
    for (const word of words(body)) counts.set(word, (counts.get(word) ?? 0) + 1);
    return { title, path: relative(root, path).replaceAll('\\', '/'), body, counts,
      titleWords: new Set(words(title)), metaWords: new Set(words(`${summary} ${tags}`)) };
  });
  const frequency = new Map();
  for (const doc of docs) for (const word of doc.counts.keys()) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  return { docs, frequency };
}

/** Search local handbook articles; maxChars caps the combined returned snippet text. */
export function searchHandbook(query, { limit = 3, maxChars = 7000 } = {}) {
  if (typeof query !== 'string' || !Number.isFinite(limit) || !Number.isFinite(maxChars)) return [];
  limit = Math.max(0, Math.floor(limit));
  maxChars = Math.max(0, Math.floor(maxChars));
  const terms = [...new Set(words(query).filter(w => !stop.has(w)))];
  if (!terms.length || !limit || !maxChars) return [];
  index ??= buildIndex();
  const { docs, frequency } = index;
  const idf = word => Math.log(1 + (docs.length + 1) / ((frequency.get(word) ?? 0) + 1));
  const ranked = docs.map(doc => {
    let score = 0;
    for (const word of terms) {
      const count = doc.counts.get(word) ?? 0;
      score += idf(word) * ((count ? 1 + Math.log(count) : 0) + (doc.titleWords.has(word) ? 3 : 0) + (doc.metaWords.has(word) ? 1.5 : 0));
    }
    return { doc, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path, 'en')).slice(0, limit);
  let remaining = maxChars;
  return ranked.flatMap(({ doc }, position) => {
    if (!remaining) return [];
    // Select the best nearby paragraphs, then restore their document order.
    const chunks = doc.body.split(/\r?\n\s*\r?\n/).map((text, i) => ({ text: text.trim(), i })).filter(x => x.text);
    for (const chunk of chunks) {
      const present = new Set(words(chunk.text));
      chunk.score = terms.reduce((sum, term) => sum + (present.has(term) ? idf(term) : 0), 0);
    }
    const budget = Math.max(1, Math.floor(remaining / (ranked.length - position)));
    const chosen = []; let used = 0;
    for (const chunk of [...chunks].sort((a, b) => b.score - a.score || a.i - b.i)) {
      if (chunk.score <= 0 || used >= budget) break;
      const length = budget - used - (chosen.length ? 2 : 0);
      if (length <= 0) break;
      chosen.push({ ...chunk, text: chunk.text.slice(0, length) });
      used += chosen.at(-1).text.length + (chosen.length > 1 ? 2 : 0);
    }
    if (!chosen.length && chunks.length) chosen.push({ ...chunks[0], text: chunks[0].text.slice(0, budget) });
    const text = chosen.sort((a, b) => a.i - b.i).map(x => x.text).join('\n\n');
    remaining -= text.length;
    return [{ title: doc.title, path: doc.path, text }];
  });
}
