// Bounded, reconstructable decision packets. A packet captures the exact
// normalized input surface, the structured reply, basis/plan identity, usage
// and explicit omissions. Credentials are redacted; unknown data stays unknown.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const DECISION_PACKET_SCHEMA = 'dfo-decision-packet.v1';
const sensitive = /^(?:authorization|proxy-authorization|cookie|set-cookie|password|passwd|secret|token|access[_-]?token|refresh[_-]?token|api[_-]?key|private[_-]?key|credential|credentials|auth)$/i;
const MAX_STRING = 60000;
const MAX_DEPTH = 8;
function redact(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]').replace(/([?&](?:api[_-]?key|access[_-]?token|token|password|secret)=)[^&#\s]+/gi, '$1[REDACTED]').replace(/\b((?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]');
    return cleaned.length > MAX_STRING ? `${cleaned.slice(0, MAX_STRING)}...[truncated]` : cleaned;
  }
  if (typeof value !== 'object') return typeof value === 'function' ? '[function omitted]' : value;
  if (depth >= MAX_DEPTH) return '[depth omitted]';
  if (seen.has(value)) return '[circular omitted]';
  seen.add(value);
  let out;
  if (Array.isArray(value)) out = value.slice(0, 200).map(item => redact(item, depth + 1, seen));
  else out = Object.fromEntries(Object.entries(value).slice(0, 200).map(([key, item]) => [key, sensitive.test(key) ? '[REDACTED]' : redact(item, depth + 1, seen)]));
  seen.delete(value);
  return out;
}

export function validateDecisionPacket(packet) {
  const errors = [];
  if (!packet || typeof packet !== 'object') return ['packet must be an object'];
  if (packet.schemaVersion !== DECISION_PACKET_SCHEMA) errors.push('schemaVersion');
  if (typeof packet.packetId !== 'string' || !packet.packetId) errors.push('packetId');
  if (!['luna', 'terra', 'sol'].includes(packet.role)) errors.push('role');
  if (typeof packet.model !== 'string' || !packet.model) errors.push('model');
  if (packet.basis !== null && (typeof packet.basis !== 'object' || Array.isArray(packet.basis))) errors.push('basis');
  if (!Number.isSafeInteger(packet.planVersion)) errors.push('planVersion');
  if (typeof packet.prompt !== 'string') errors.push('prompt');
  if (packet.reply !== null && typeof packet.reply !== 'object') errors.push('reply');
  return errors;
}

export function makeDecisionPacket({
  packetId, role, model, sourceRevision = null, basis = null, planVersion = 0, reason = '', schemaId = null,
  prompt, reply = null, usage = null, ms = null, complete = true, omitted = [], images = [],
} = {}) {
  const packet = {
    schemaVersion: DECISION_PACKET_SCHEMA,
    packetId: String(packetId ?? `packet-${createHash('sha1').update(String(prompt ?? '')).digest('hex').slice(0, 12)}`),
    role, model, sourceRevision, basis: redact(basis), planVersion, reason: String(reason ?? '').slice(0, 500), schemaId,
    prompt: redact(String(prompt ?? '')),
    reply: redact(reply),
    usage: usage ? { input_tokens: usage.input_tokens ?? null, cached_input_tokens: usage.cached_input_tokens ?? null, output_tokens: usage.output_tokens ?? null } : null,
    usageKnown: !!usage,
    ms: Number.isFinite(ms) ? ms : null,
    complete: complete !== false,
    omitted: [...new Set([...(omitted ?? []), ...(usage ? [] : ['usage']), ...(reply ? [] : ['reply'])])],
    images: (images ?? []).map(item => typeof item === 'string' ? { ref: item, sha256: null } : item),
    recordedAt: new Date().toISOString(),
  };
  const errors = validateDecisionPacket(packet);
  if (errors.length) throw new TypeError(`Invalid decision packet: ${errors.join(', ')}`);
  return packet;
}

export function packetSummary(packet) {
  if (!packet) return null;
  return { packetId: packet.packetId, role: packet.role, model: packet.model, planVersion: packet.planVersion, basis: packet.basis, reason: packet.reason, usageKnown: packet.usageKnown, complete: packet.complete, omitted: packet.omitted, promptSha256: createHash('sha256').update(packet.prompt ?? '').digest('hex'), replySha256: packet.reply ? createHash('sha256').update(JSON.stringify(packet.reply)).digest('hex') : null };
}

export function createPacketStore({ dir, maxPackets = 500, maxBytes = 80 * 1024 * 1024 } = {}) {
  if (!dir) throw new TypeError('packet store needs a directory');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'packets.jsonl');
  let count = 0;
  let bytes = fs.existsSync(file) ? fs.statSync(file).size : 0;
  function record(packet) {
    if (count >= maxPackets) throw Object.assign(new Error('decision packet limit reached'), { code: 'PACKET_LIMIT' });
    const line = JSON.stringify(packet) + '\n';
    const size = Buffer.byteLength(line);
    if (bytes + size > maxBytes) throw Object.assign(new Error('decision packet byte limit reached'), { code: 'PACKET_BYTES' });
    fs.appendFileSync(file, line, 'utf8');
    count++;
    bytes += size;
    return { packetId: packet.packetId, bytes: size, count, file };
  }
  function readAll() {
    if (!fs.existsSync(file)) return [];
    return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
  return { record, readAll, file, count: () => count, bytes: () => bytes };
}

export function redactPacketValue(value) { return redact(value); }
