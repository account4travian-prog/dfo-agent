// Client for the frozen `dfo-control.v1` integration target. This module does
// not implement a controller: it only negotiates capabilities, reads coherent
// snapshots, and submits request-fenced intent/action calls to the driver.
import { LEGACY_INTENTS } from './config.mjs';
import { PLAYER_CONTRACT, WORKFLOW_SCHEMA, normalizeWorkflowCatalogue } from './tasks.mjs';

export const CONTRACT_VERSION = 'dfo-control.v1';
export const REQUIRED_CAPABILITIES = Object.freeze(['intents', 'snapshot', 'requestFencing']);

export class ControlError extends Error {
  constructor(message, { code = 'CONTROL_ERROR', status = null, retryable = false, cause = null } = {}) {
    super(message);
    this.name = 'ControlError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    if (cause) this.cause = cause;
  }
}
export class ControlUnavailableError extends ControlError {
  constructor(message, details = {}) { super(message, { code: 'CONTROL_UNAVAILABLE', ...details }); this.name = 'ControlUnavailableError'; this.details = details; }
}
export class SnapshotError extends ControlError {
  constructor(message, details = {}) { super(message, { code: 'SNAPSHOT_INVALID', ...details }); this.name = 'SnapshotError'; }
}
export class StaleTaskError extends ControlError {
  constructor(message, details = {}) { super(message, { code: 'STALE_TASK', ...details }); this.name = 'StaleTaskError'; }
}

const integer = value => Number.isSafeInteger(value);
const present = value => value !== null && value !== undefined;

/** Normalize the driver health document without assuming undocumented capability key names. */
export function normalizeCapabilities(health) {
  const caps = health?.capabilities ?? {};
  const contractVersion = health?.contractVersion ?? health?.contract ?? null;
  const intents = Array.isArray(caps.intents) ? caps.intents.map(String) : Array.isArray(health?.intents) ? health.intents.map(String) : null;
  const snapshot = caps.snapshot === true || caps.snapshot?.supported === true || health?.snapshot === true;
  const requestFencing = caps.requestFencing === true || caps.fencing === true || caps.requestFencing?.supported === true;
  const images = caps.images === true || caps.image === true || caps.images?.supported === true;
  const place = caps.place === true || caps.place?.supported === true;
  const ui = caps.ui === true || caps.ui?.supported === true;
  const missing = [];
  if (contractVersion !== CONTRACT_VERSION) missing.push(`contractVersion=${CONTRACT_VERSION}`);
  if (!intents) missing.push('capabilities.intents');
  else for (const intent of LEGACY_INTENTS) if (!intents.includes(intent)) missing.push(`intent:${intent}`);
  if (!snapshot) missing.push('capabilities.snapshot');
  if (!requestFencing) missing.push('capabilities.requestFencing');
  const playerContractVersion = health?.playerContractVersion ?? null;
  const tasks = caps.tasks === true;
  const uiActions = caps.uiActions === true;
  const workflows = Array.isArray(caps.workflows) ? caps.workflows.map(String) : [];
  const player = playerContractVersion === PLAYER_CONTRACT;
  const playerMissing = [];
  if (!player) playerMissing.push(`playerContractVersion=${PLAYER_CONTRACT}`);
  if (!tasks) playerMissing.push('capabilities.tasks');
  if (!uiActions) playerMissing.push('capabilities.uiActions');
  if (!Array.isArray(caps.workflows)) playerMissing.push('capabilities.workflows');
  return {
    ok: missing.length === 0,
    contractVersion,
    intents: intents ?? [],
    snapshot,
    requestFencing,
    images,
    place,
    ui,
    playerContractVersion,
    player,
    playerReady: player && tasks,
    tasks,
    uiActions,
    workflows,
    playerMissing,
    missing,
    generation: integer(health?.generation) ? health.generation : null,
  };
}

function requireBasis(basis) {
  if (!basis || typeof basis !== 'object') throw new SnapshotError('snapshot basis is missing');
  for (const key of ['pageId']) if (typeof basis[key] !== 'string' || !basis[key]) throw new SnapshotError(`snapshot basis.${key} is missing`);
  for (const key of ['generation', 'frame']) if (!integer(basis[key])) throw new SnapshotError(`snapshot basis.${key} is not an integer`);
  return basis;
}

/** A request-fenced client. `request(path, body?)` is injectable for fake drivers. */
export function createControlClient({ request, now = () => Date.now(), timeoutMs = 18000, healthTtlMs = 5000 } = {}) {
  if (typeof request !== 'function') throw new TypeError('control client needs a request function');
  let cachedHealth = null;
  let cachedAt = 0;
  let capabilities = null;
  const issued = new Set();
  const active = new Map();
  let cachedWorkflows = null;
  let cachedWorkflowsAt = 0;

  async function call(path, body) {
    try {
      const value = await request(path, body);
      if (value === undefined || value === null) throw new ControlError(`empty response from ${path}`, { code: 'CONTROL_EMPTY' });
      return value;
    } catch (error) {
      if (error instanceof ControlError) throw error;
      throw new ControlError(`control request failed: ${path}: ${error.message}`, { code: 'CONTROL_REQUEST_FAILED', status: error.status ?? null, retryable: true, cause: error });
    }
  }
  async function health({ refresh = false } = {}) {
    const at = now();
    if (!refresh && cachedHealth && at - cachedAt < healthTtlMs) return cachedHealth;
    cachedHealth = await call('/health');
    cachedAt = at;
    capabilities = normalizeCapabilities(cachedHealth);
    return cachedHealth;
  }
  async function capabilitiesInfo({ refresh = false } = {}) {
    await health({ refresh });
    return capabilities;
  }
  async function ensureAvailable() {
    const info = await capabilitiesInfo();
    if (!info.ok) throw new ControlUnavailableError(`driver does not satisfy ${CONTRACT_VERSION}: missing ${info.missing.join(', ') || 'capabilities'}`, { details: info });
    return info;
  }
  async function ensurePlayer() {
    const info = await capabilitiesInfo();
    if (!info.playerReady) throw new ControlUnavailableError(`driver does not satisfy ${PLAYER_CONTRACT}: missing ${info.playerMissing.join(', ') || 'player capabilities'}`, { details: info });
    return info;
  }
  async function workflowCatalogue({ refresh = false } = {}) {
    const at = now();
    if (!refresh && cachedWorkflows && at - cachedWorkflowsAt < healthTtlMs) return cachedWorkflows;
    await ensurePlayer();
    const document = await call('/workflows');
    if (document?.schemaVersion !== WORKFLOW_SCHEMA) throw new ControlError(`workflow catalogue must use ${WORKFLOW_SCHEMA}`, { code: 'WORKFLOW_CATALOGUE' });
    cachedWorkflows = normalizeWorkflowCatalogue(document);
    cachedWorkflowsAt = at;
    return cachedWorkflows;
  }
  async function snapshot({ ui = false, image = false, after = 0 } = {}) {
    const info = await ensureAvailable();
    if (image && !info.images) throw new ControlUnavailableError('driver does not advertise image capture', { details: info });
    const query = `?ui=${ui ? 1 : 0}&image=${image ? 1 : 0}&after=${encodeURIComponent(after)}`;
    const data = await call(`/snapshot${query}`);
    if (data.contractVersion !== undefined && data.contractVersion !== CONTRACT_VERSION) throw new SnapshotError(`snapshot contractVersion ${data.contractVersion} is not ${CONTRACT_VERSION}`);
    if (typeof data.observationId !== 'string' || !data.observationId) throw new SnapshotError('snapshot observationId is missing');
    requireBasis(data.basis);
    if (!data.captured || data.captured.coherent !== true) throw new SnapshotError('snapshot capture is not coherent', { retryable: true, details: { captured: data.captured } });
    if (!data.native || typeof data.native !== 'object') throw new SnapshotError('snapshot native block is missing');
    const player = data.player && typeof data.player === 'object' ? { phase: typeof data.player.phase === 'string' ? data.player.phase : 'unknown', facts: Array.isArray(data.player.facts) ? data.player.facts.slice(0, 64) : [] } : { phase: 'unknown', facts: [] };
    return { ...data, ui: data.ui ?? null, player };
  }
  async function place() {
    const info = await ensureAvailable();
    if (!info.place) return { available: false, reason: 'Driver does not advertise place maps' };
    return call('/place');
  }
  function validateTask(task, requestId) {
    if (!task || typeof task !== 'object') throw new StaleTaskError('driver returned no task');
    if (task.requestId !== undefined && task.requestId !== requestId) throw new StaleTaskError(`task requestId ${task.requestId} is not ${requestId}`);
    if (task.authority !== undefined && task.authority !== null && typeof task.authority !== 'object') throw new ControlError('task authority is malformed');
    return task;
  }
  async function startIntent({ requestId, basis, authority, intent, observedTarget = false } = {}) {
    if (typeof requestId !== 'string' || !requestId) throw new ControlError('requestId is required');
    if (issued.has(requestId)) throw new ControlError(`requestId ${requestId} was already used`, { code: 'DUPLICATE_REQUEST_ID' });
    if (!basis || typeof basis !== 'object') throw new ControlError('intent basis is required');
    if (!authority || typeof authority !== 'object') throw new ControlError('intent authority is required');
    if (!intent || typeof intent !== 'object') throw new ControlError('intent is required');
    issued.add(requestId);
    const result = await call('/intent', { requestId, basis, authority, intent, observedTarget });
    const task = result?.task ?? result;
    const normalized = validateTask(task, requestId);
    active.set(requestId, normalized);
    return { task: normalized, replayed: result?.replayed === true };
  }
  async function pollIntent(requestId) {
    if (typeof requestId !== 'string' || !requestId) throw new ControlError('requestId is required');
    const result = await call(`/intent?requestId=${encodeURIComponent(requestId)}`);
    const task = result?.task ?? null;
    const events = Array.isArray(result?.events) ? result.events : [];
    if (task) {
      if (task.requestId !== undefined && task.requestId !== requestId) throw new StaleTaskError(`poll returned task ${task.requestId} for ${requestId}`);
      if (task.status === 'terminal' && task.cleanupPending === undefined) task.cleanupPending = false;
      active.set(requestId, task);
    } else if (!active.has(requestId)) {
      throw new StaleTaskError(`unknown task ${requestId}`);
    }
    return { task, events };
  }
  async function cancelIntent(requestId, reason = 'request cancelled') {
    if (typeof requestId !== 'string' || !requestId) throw new ControlError('requestId is required');
    const result = await call('/intent/cancel', { requestId, reason: String(reason).slice(0, 500) });
    active.delete(requestId);
    return result;
  }
  async function startTask({ requestId, basis, authority, task } = {}) {
    await ensurePlayer();
    if (typeof requestId !== 'string' || !requestId) throw new ControlError('requestId is required');
    if (issued.has(requestId)) throw new ControlError(`requestId ${requestId} was already used`, { code: 'DUPLICATE_REQUEST_ID' });
    if (!basis || typeof basis !== 'object') throw new ControlError('task basis is required');
    if (!authority || typeof authority !== 'object') throw new ControlError('task authority is required');
    if (!task || typeof task !== 'object' || !['intent', 'ui', 'workflow'].includes(task.kind)) throw new ControlError('task payload is invalid');
    issued.add(requestId);
    const result = await call('/task', { requestId, basis, authority, task });
    const taskValue = result?.task ?? result;
    const normalized = validateTask(taskValue, requestId);
    active.set(requestId, normalized);
    return { task: normalized, replayed: result?.replayed === true };
  }
  async function pollTask(requestId) {
    if (typeof requestId !== 'string' || !requestId) throw new ControlError('requestId is required');
    const result = await call(`/task?requestId=${encodeURIComponent(requestId)}`);
    const task = result?.task ?? null;
    const events = Array.isArray(result?.events) ? result.events : [];
    if (task) {
      if (task.requestId !== undefined && task.requestId !== requestId) throw new StaleTaskError(`poll returned task ${task.requestId} for ${requestId}`);
      if (task.status === 'terminal' && task.cleanupPending === undefined) task.cleanupPending = false;
      active.set(requestId, task);
    } else if (!active.has(requestId)) throw new StaleTaskError(`unknown task ${requestId}`);
    return { task, events };
  }
  async function cancelTask(requestId, reason = 'request cancelled') {
    if (typeof requestId !== 'string' || !requestId) throw new ControlError('requestId is required');
    const result = await call('/task/cancel', { requestId, reason: String(reason).slice(0, 500) });
    active.delete(requestId);
    return result;
  }
  async function reconcileTask({requestId,basis,authority,reason}) {return call('/task/reconcile',{requestId,basis,authority,reason});}
  async function action({ generation, observationId, action } = {}) {
    if (!integer(generation)) throw new ControlError('action generation is required');
    if (typeof observationId !== 'string' || !observationId) throw new ControlError('action observationId is required');
    if (!action || typeof action !== 'object') throw new ControlError('action is required');
    return call('/action', { generation, observationId, action });
  }
  async function stop() { return call('/stop', {}); }
  async function pause() { return call('/pause', {}); }
  async function resume() { return call('/resume', {}); }
  function status() { return { capabilities, active: [...active.keys()], issued: issued.size, workflows: cachedWorkflows?.workflows?.length ?? null }; }
  return { contractVersion: CONTRACT_VERSION, playerContractVersion: PLAYER_CONTRACT, health, capabilities: capabilitiesInfo, ensureAvailable, ensurePlayer, workflowCatalogue, snapshot, place, startIntent, pollIntent, cancelIntent, startTask, pollTask, cancelTask, reconcileTask, action, stop, pause, resume, status };
}
