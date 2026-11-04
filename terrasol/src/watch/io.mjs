import fs from 'node:fs';
import path from 'node:path';

export function readRows(file) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const end = raw.lastIndexOf('\n');
  if (end < 0) return [];
  const rows = [];
  for (const line of raw.slice(0, end).split('\n').filter(Boolean)) {
    try { rows.push(JSON.parse(line)); } catch { /* malformed records are not evidence */ }
  }
  return rows;
}

export function allRunRows(runDir) {
  const files = [];
  const trace = readRows(path.join(runDir, 'trace.jsonl'));
  if (trace) files.push(...trace);
  if (fs.existsSync(runDir)) for (const dir of fs.readdirSync(runDir, { withFileTypes: true }).filter(d => d.isDirectory() && /^epoch-\d+$/.test(d.name)).sort((a, b) => Number(a.name.slice(6)) - Number(b.name.slice(6)))) {
    const rows = readRows(path.join(runDir, dir.name, 'trace.jsonl'));
    if (rows) files.push(...rows.map(row => ({ ...row, epoch: row.epoch ?? Number(dir.name.slice(6)) })));
  }
  return files;
}
