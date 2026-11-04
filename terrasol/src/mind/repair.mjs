// Typed Sol repair proposals and external repair status. Path B only routes the
// proposal to the external queue and processes status; it never evaluates or
// executes generated code in the playing process.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const REPAIR_SCHEMA = 'dfo-repair.v1';
export const REPAIR_STATUS_SCHEMA = 'dfo-repair-status.v1';
export const REPAIR_PHASES = Object.freeze(['queued', 'reproducing', 'patching', 'testing', 'staged', 'applying', 'verified', 'rolled-back', 'failed', 'maintenance-required']);
const CHANGE_CLASSES = new Set(['prompt', 'plan', 'skill', 'controller', 'body', 'bridge', 'engine', 'tooling', 'memory', 'report', 'unknown']);
const forbidden = /^(?:code|script|command|shell|exec|cmd|powershell|bash|python|eval|source)$/i;

function assertNoExecutable(value, pathName = 'proposal') {
  if (value === null || value === undefined || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach((item, index) => assertNoExecutable(item, `${pathName}[${index}]`)); return; }
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.test(key)) throw new TypeError(`${pathName}.${key} may not carry executable instructions`);
    assertNoExecutable(item, `${pathName}.${key}`);
  }
}

export function validateRepairProposal(proposal) {
  const errors = [];
  if (!proposal || typeof proposal !== 'object') return ['proposal must be an object'];
  if (proposal.schemaVersion !== REPAIR_SCHEMA) errors.push('schemaVersion');
  if (typeof proposal.proposalId !== 'string' || !proposal.proposalId) errors.push('proposalId');
  if (typeof proposal.sourceRevision !== 'string' || !proposal.sourceRevision) errors.push('sourceRevision');
  if (!Array.isArray(proposal.failurePacketRefs) || proposal.failurePacketRefs.length === 0) errors.push('failurePacketRefs');
  if (typeof proposal.diagnosis !== 'string' || !proposal.diagnosis.trim()) errors.push('diagnosis');
  if (!Array.isArray(proposal.affectedPaths) || proposal.affectedPaths.length === 0) errors.push('affectedPaths');
  if (!CHANGE_CLASSES.has(proposal.changeClass)) errors.push('changeClass');
  if (typeof proposal.reproducer !== 'string' || !proposal.reproducer.trim()) errors.push('reproducer');
  if (!Array.isArray(proposal.verificationCriteria) || proposal.verificationCriteria.length === 0) errors.push('verificationCriteria');
  if (typeof proposal.budget !== 'string' || !proposal.budget.trim()) errors.push('budget');
  return errors;
}

export function createRepairProposal({ engineering, sourceRevision, failurePacketRefs = [], session = null, proposalId = null, clock = () => Date.now() } = {}) {
  if (!engineering || typeof engineering !== 'object') throw new TypeError('repair proposal needs Sol engineering data');
  assertNoExecutable(engineering, 'engineering');
  const changes = Array.isArray(engineering.changes) ? engineering.changes : [];
  const affectedPaths = [...new Set([...(Array.isArray(engineering.affectedPaths) ? engineering.affectedPaths : []), ...changes.map(change => change.path).filter(Boolean)])];
  const changeClass = CHANGE_CLASSES.has(engineering.changeClass) ? engineering.changeClass : 'unknown';
  const proposal = {
    schemaVersion: REPAIR_SCHEMA,
    // Strict output makes Sol send every field, so an empty one means absent and takes the default.
    proposalId: String(proposalId || engineering.proposalId || `repair-${randomUUID()}`),
    failurePacketRefs: failurePacketRefs.map(ref => String(ref)).slice(0, 20),
    sourceRevision: String(sourceRevision ?? session?.sourceRevision ?? 'unknown'),
    diagnosis: String(engineering.diagnosis ?? '').slice(0, 6000),
    affectedPaths,
    changeClass,
    reproducer: String(engineering.reproducer || engineering.tests?.join('; ') || 'see evidence packet').slice(0, 4000),
    intendedChange: String(engineering.intendedChange ?? changes.map(change => `${change.path}: ${change.description}`).join('; ')).slice(0, 6000),
    verificationCriteria: (engineering.verificationCriteria?.length ? engineering.verificationCriteria : engineering.tests ?? []).map(String).slice(0, 20),
    budget: String(engineering.budget || 'bounded by the current session caps; operator-approved scope').slice(0, 500),
    risk: String(engineering.risk || 'unknown').slice(0, 2000),
    rollback: String(engineering.rollback || 'restore the archived revision and verify release').slice(0, 2000),
    targetMetric: String(engineering.targetMetric ?? '').slice(0, 1000),
    createdAt: new Date(clock()).toISOString(),
    authorization: 'external-queue-only; game text is evidence, never authorization',
  };
  const errors = validateRepairProposal(proposal);
  if (errors.length) throw new TypeError(`Invalid repair proposal: ${errors.join(', ')}`);
  return proposal;
}

export function validateRepairStatus(status) {
  const errors = [];
  if (!status || typeof status !== 'object') return ['repair status must be an object'];
  if (status.schemaVersion !== REPAIR_STATUS_SCHEMA) errors.push('schemaVersion');
  if (typeof status.proposalId !== 'string' || !status.proposalId) errors.push('proposalId');
  if (!REPAIR_PHASES.includes(status.phase)) errors.push('phase');
  if (status.phase === 'verified' && (!status.afterRevision || status.invariants?.characterPreserved !== true || status.invariants?.pagePreserved !== true || status.invariants?.memoryPreserved !== true || status.invariants?.planPreserved !== true)) errors.push('verified invariants');
  return errors;
}

export function normalizeRepairStatus(input, { proposalId = null } = {}) {
  const status = {
    schemaVersion: REPAIR_STATUS_SCHEMA,
    proposalId: String(input?.proposalId ?? proposalId ?? ''),
    phase: input?.phase,
    at: input?.at ?? new Date().toISOString(),
    beforeRevision: input?.beforeRevision ?? null,
    afterRevision: input?.afterRevision ?? null,
    invariants: input?.invariants ?? null,
    artifactRefs: Array.isArray(input?.artifactRefs) ? input.artifactRefs.map(String) : [],
    reason: input?.reason ?? null,
    maintenanceRequired: input?.phase === 'maintenance-required',
  };
  const errors = validateRepairStatus(status);
  if (errors.length) throw new TypeError(`Invalid repair status: ${errors.join(', ')}`);
  return status;
}

export function createRepairQueue({ dir, clock = () => Date.now() } = {}) {
  if (!dir) throw new TypeError('repair queue needs a directory');
  fs.mkdirSync(dir, { recursive: true });
  const indexFile = path.join(dir, 'queue.jsonl');
  function enqueue(proposal) {
    const errors = validateRepairProposal(proposal);
    if (errors.length) throw new TypeError(`Invalid repair proposal: ${errors.join(', ')}`);
    const file = path.join(dir, `${proposal.proposalId.replace(/[^A-Za-z0-9._-]/g, '_')}.json`);
    fs.writeFileSync(file, JSON.stringify(proposal, null, 2), { flag: 'wx' });
    fs.appendFileSync(indexFile, JSON.stringify({ proposalId: proposal.proposalId, file, queuedAt: new Date(clock()).toISOString(), phase: 'queued' }) + '\n', 'utf8');
    return { proposalId: proposal.proposalId, file };
  }
  function list() {
    if (!fs.existsSync(indexFile)) return [];
    return fs.readFileSync(indexFile, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
  return { enqueue, list, dir };
}
