import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const persona = Object.freeze({ name: 'Rowan', identity: 'A curious, practical adventurer learning and exploring Daggerfall Online.', values: Object.freeze(['curiosity', 'practicality', 'learning from evidence']), uncertaintyPolicy: 'observed facts, inferred lessons and uncertain guesses are labeled separately' });
const kinds = new Set(['observation', 'handbook', 'uncertain', 'routine', 'social', 'goal', 'journal']);
const qualifications = new Set(['observed', 'inferred', 'uncertain', 'stale']);
function string(value, name, max, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new TypeError(`Invalid ${name}`);
  return value.trim();
}
function initial() { return { revision: 0, goal: null, entries: [] }; }
function apply(state, row) {
  if (!Number.isSafeInteger(row.revision) || row.revision !== state.revision + 1 || !kinds.has(row.kind) || typeof row.text !== 'string' || typeof row.at !== 'string') throw new Error('Invalid memory ledger');
  if (row.qualification !== undefined && !qualifications.has(row.qualification)) throw new Error('Invalid memory ledger');
  state.revision = row.revision;
  state.entries.push(row);
  if (row.kind === 'goal') state.goal = row.text;
}

export function createMemory(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const ledger = path.join(dir, 'memory.jsonl');
  const snapshotFile = path.join(dir, 'snapshot.json');
  const fd = fs.openSync(ledger, 'a+');
  const state = initial();
  let closed = false, failed = false;
  try {
    const bytes = fs.readFileSync(ledger);
    const end = bytes.lastIndexOf(10) + 1;
    if (end !== bytes.length) { fs.truncateSync(ledger, end); fs.fsyncSync(fd); }
    for (const line of bytes.subarray(0, end).toString('utf8').split('\n')) if (line) apply(state, JSON.parse(line));
  } catch (error) { fs.closeSync(fd); throw error; }
  function check() {
    if (closed) throw new Error('Memory is closed');
    if (failed) throw new Error('Memory write failed; reopen to recover');
  }
  function add(item) {
    check();
    const row = { revision: state.revision + 1, at: new Date().toISOString(), ...item };
    const line = JSON.stringify(row) + '\n';
    try {
      if (fs.writeSync(fd, line, null, 'utf8') !== Buffer.byteLength(line)) throw new Error('Incomplete memory write');
      fs.fsyncSync(fd);
    } catch (error) { failed = true; throw error; }
    apply(state, row);
    return structuredClone(row);
  }
  function snapshot() { return structuredClone({ persona, ...state }); }
  return {
    persona,
    snapshot,
    context(query = '', limit = 12) {
      if (typeof query !== 'string' || query.length > 2000 || !Number.isInteger(limit) || limit < 0 || limit > 50) throw new TypeError('Invalid memory query');
      const terms = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])];
      return state.entries.map(row => ({ row, score: terms.reduce((n, t) => n + ((`${row.text} ${row.source || ''} ${row.evidence || ''}`).toLowerCase().includes(t) ? 1 : 0), 0) }))
        .sort((a, b) => b.score - a.score || b.row.revision - a.row.revision)
        .slice(0, limit).map(({ row }) => structuredClone(row));
    },
    select(query = '', { limit = 12, goal = null, kinds: kindFilter = null, includeStale = false, now = Date.now() } = {}) {
      if (!Number.isInteger(limit) || limit < 0 || limit > 50) throw new TypeError('Invalid memory limit');
      const terms = [...new Set(String(query ?? '').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])];
      const allowed = kindFilter ? new Set(kindFilter) : null;
      const weights = { journal: 2.2, social: 2, handbook: 1.5, observation: 1, uncertain: 0.85, routine: 0.45, goal: 0.8 };
      const routine = state.entries.filter(row => row.kind === 'routine');
      const keepRoutine = new Set(routine.slice(-20).map(row => row.revision));
      const seen = new Set();
      return state.entries.map(row => {
        if (allowed && !allowed.has(row.kind)) return null;
        if (row.kind === 'goal') return null;
        if (!includeStale && row.qualification === 'stale') return null;
        if (row.expiresAt && Date.parse(row.expiresAt) <= now) return null;
        if (row.kind === 'routine' && !keepRoutine.has(row.revision)) return null;
        const key = String(row.text).toLowerCase().replace(/\s+/g, ' ').trim();
        if (!key || seen.has(key)) return null;
        seen.add(key);
        const matches = terms.reduce((total, term) => total + ((`${row.text} ${row.subject ?? ''} ${row.source ?? ''} ${row.evidence ?? ''}`).toLowerCase().includes(term) ? 1 : 0), 0);
        const confidence = Number.isFinite(row.confidence) ? row.confidence : row.qualification === 'inferred' ? 0.6 : row.qualification === 'uncertain' ? 0.3 : 0.8;
        const score = matches * 3 + (weights[row.kind] ?? 0.5) + confidence + (row.revision / Math.max(1, state.revision)) * 0.2;
        return { row, score };
      }).filter(Boolean).sort((a, b) => b.score - a.score || b.row.revision - a.row.revision).slice(0, limit).map(({ row }) => structuredClone(row));
    },
    compact({ routineKeep = 20 } = {}) {
      const routineRows = state.entries.filter(row => row.kind === 'routine');
      const staleRows = state.entries.filter(row => row.qualification === 'stale');
      return { routineEntries: routineRows.length, routineKept: Math.min(routineRows.length, routineKeep), staleEntries: staleRows.length, note: 'Compaction is retrieval-time; the append-only ledger is retained for reconstruction.' };
    },
    remember(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Invalid memory');
      const text = string(input.text, 'text', 4000, true);
      const kind = input.kind === undefined ? 'observation' : input.kind;
      if (!kinds.has(kind) || kind === 'goal' || kind === 'journal') throw new TypeError('Invalid memory kind');
      const source = string(input.source, 'source', 500);
      const evidence = string(input.evidence, 'evidence', 2000);
      const subject = string(input.subject, 'subject', 120);
      const confidence = input.confidence;
      if (confidence !== undefined && !(typeof confidence === 'number' && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1)) throw new TypeError('Invalid confidence');
      const qualification = input.qualification ?? (confidence === undefined ? (kind === 'uncertain' ? 'uncertain' : 'observed') : confidence >= 0.8 ? 'observed' : confidence >= 0.5 ? 'inferred' : 'uncertain');
      if (!qualifications.has(qualification)) throw new TypeError('Invalid memory qualification');
      const tags = input.tags === undefined ? undefined : [...new Set(input.tags ?? [])];
      if (tags !== undefined && (!Array.isArray(tags) || tags.length > 8 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 40))) throw new TypeError('Invalid memory tags');
      const expiresAt = input.expiresAt === undefined ? undefined : new Date(input.expiresAt).toISOString();
      if (expiresAt !== undefined && !Number.isFinite(Date.parse(expiresAt))) throw new TypeError('Invalid memory expiry');
      return add({
        kind, text, qualification,
        ...(source !== undefined && { source }), ...(evidence !== undefined && { evidence }),
        ...(confidence !== undefined && { confidence }), ...(subject !== undefined && { subject }),
        ...(tags !== undefined && { tags }), ...(expiresAt !== undefined && { expiresAt }),
      });
    },
    setGoal(goal) { return add({ kind: 'goal', text: string(goal, 'goal', 2000, true) }); },
    journal(text) { return add({ kind: 'journal', text: string(text, 'journal', 4000, true) }); },
    checkpoint() {
      check();
      const temp = path.join(dir, `.snapshot-${crypto.randomUUID()}.tmp`);
      const file = fs.openSync(temp, 'wx');
      try { fs.writeFileSync(file, JSON.stringify(snapshot()) + '\n'); fs.fsyncSync(file); } finally { fs.closeSync(file); }
      try { fs.renameSync(temp, snapshotFile); } catch (error) { try { fs.unlinkSync(temp); } catch {} throw error; }
      return snapshot();
    },
    close() {
      if (!closed) {
        try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); closed = true; }
      }
    },
  };
}
