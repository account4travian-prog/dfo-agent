import fs from 'node:fs';
import path from 'node:path';

const sensitive = /^(?:authorization|proxy-authorization|cookie|set-cookie|password|passwd|secret|token|access[_-]?token|refresh[_-]?token|api[_-]?key|private[_-]?key|credential|credentials)$/i;
function scrub(value, seen = new WeakSet()) {
  if (typeof value === 'string') return value
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/([?&](?:api[_-]?key|access[_-]?token|token|password|secret)=)[^&#\s]+/gi, '$1[REDACTED]')
    .replace(/\b((?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]');
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  const result = Array.isArray(value) ? value.map(v => scrub(v, seen)) : Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, sensitive.test(k) ? '[REDACTED]' : scrub(v, seen)]));
  seen.delete(value);
  return result;
}

export function createLogger(runDir) {
  fs.mkdirSync(runDir, { recursive: true });
  const file = path.join(runDir, 'trace.jsonl');
  const fd = fs.openSync(file, 'a+');
  let seq = 0, closed = false, failed = false;
  try {
    const bytes = fs.readFileSync(file);
    const lastNewline = bytes.lastIndexOf(10);
    if (lastNewline !== bytes.length - 1) fs.truncateSync(file, lastNewline + 1);
    for (const line of bytes.subarray(0, lastNewline + 1).toString('utf8').split('\n')) {
      if (!line) continue;
      const row = JSON.parse(line);
      if (!Number.isSafeInteger(row.seq) || row.seq !== seq + 1) throw new Error('Invalid log sequence');
      seq = row.seq;
    }
  } catch (error) { fs.closeSync(fd); throw error; }
  function check() {
    if (closed) throw new Error('Logger is closed');
    if (failed) throw new Error('Logger write failed; reopen to recover');
  }
  return {
    event(kind, data = {}) {
      check();
      if (typeof kind !== 'string' || !kind || kind.length > 200 || data === null || typeof data !== 'object' || Array.isArray(data)) throw new TypeError('Invalid log event');
      const row = { ...scrub(data), seq: seq + 1, at: new Date().toISOString(), kind: scrub(kind) };
      const line = JSON.stringify(row) + '\n';
      try {
        if (fs.writeSync(fd, line, null, 'utf8') !== Buffer.byteLength(line)) throw new Error('Incomplete log write');
      } catch (error) { failed = true; throw error; }
      seq = row.seq;
      return row;
    },
    flush() { check(); try { fs.fsyncSync(fd); } catch (error) { failed = true; throw error; } },
    close() { if (!closed) { try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); closed = true; } } },
  };
}
