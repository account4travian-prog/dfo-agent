// Task specifications for the additive dfo-player.v1 contract. The playing
// process selects a bounded task; the driver owns execution of UI/workflow
// steps and every physical input writer. No code/command payload is accepted.
export const PLAYER_CONTRACT = 'dfo-player.v1';
export const WORKFLOW_SCHEMA = 'dfo-workflows.v1';
export const TASK_SCHEMA = 'dfo-task.v1';
export const TASK_KINDS = Object.freeze(['intent', 'ui', 'workflow']);
const phases = new Set(['frontdoor', 'loading', 'world', 'modal', 'death', 'unknown']);
const actionKinds = new Set(['key', 'hold', 'click', 'look', 'type', 'scroll', 'drag', 'swing', 'wait', 'release']);
const forbiddenKeys = new Set(['code', 'script', 'command', 'shell', 'exec', 'cmd', 'powershell', 'bash', 'python', 'eval', 'source']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export class TaskError extends Error {
  constructor(code, message) { super(message); this.name = 'TaskError'; this.code = code; }
}
const fail = (code, message) => { throw new TaskError(code, message); };
/** Strict structured output cannot describe free-form objects, so the role schemas carry them as JSON object text.
 *  Objects pass through (tests and non-model callers); empty text or null is absent. */
export function objectArg(value, name) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return value;
  let parsed;
  try { parsed = JSON.parse(value); } catch { fail('TASK_INVALID', `${name} must be JSON object text`); }
  if (!isObject(parsed)) fail('TASK_INVALID', `${name} must be a JSON object`);
  return parsed;
}

function noCode(value, path = 'payload') {
  if (value === null || value === undefined || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach((item, index) => noCode(item, `${path}[${index}]`)); return; }
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.has(key.toLowerCase())) fail('TASK_CODE_FORBIDDEN', `${path}.${key} is not an allowed task parameter`);
    noCode(item, `${path}.${key}`);
  }
}

export function normalizeTaskSpec(input, { catalogue = null, capabilities = null, snapshot = null } = {}) {
  if (!isObject(input)) fail('TASK_INVALID', 'task must be an object');
  if (!TASK_KINDS.includes(input.kind)) fail('TASK_KIND', `task kind ${input.kind} is unsupported`);
  let payload = input.payload ?? {};
  if (!isObject(payload)) fail('TASK_INVALID', 'task payload must be an object');
  noCode(payload);
  if (input.kind === 'intent') {
    if (typeof payload.kind !== 'string') fail('TASK_INVALID', 'intent payload kind is required');
    return { kind: 'intent', payload: { ...payload } };
  }
  if (input.kind === 'ui') {
    if (!isObject(payload.action) || !actionKinds.has(payload.action.kind)) fail('TASK_INVALID', 'ui payload needs a supported action');
    if (capabilities && capabilities.player && capabilities.uiActions === false) fail('TASK_UNSUPPORTED', 'driver does not advertise uiActions');
    return { kind: 'ui', payload: { action: { ...payload.action }, ...(payload.uiObservationId ? { uiObservationId: String(payload.uiObservationId) } : {}) } };
  }
  payload = { ...payload, args: objectArg(payload.args, 'workflow args') };
  const workflowId = typeof payload.workflowId === 'string' ? payload.workflowId : null;
  const version = Number.isSafeInteger(payload.version) ? payload.version : null;
  if (!workflowId || !version) fail('TASK_INVALID', 'workflow payload needs workflowId and version');
  if (capabilities && Array.isArray(capabilities.workflows) && !capabilities.workflows.includes(workflowId)) fail('TASK_UNSUPPORTED', `workflow ${workflowId} is not advertised`);
  const definition = catalogue ? findWorkflow(catalogue, workflowId, version) : null;
  if (catalogue && !definition) fail('TASK_UNSUPPORTED', `workflow ${workflowId}@${version} is not in the advertised catalogue`);
  if (definition) {
    validateWorkflowArgs(definition, payload.args ?? {});
    if (snapshot?.player?.phase && Array.isArray(definition.allowedPhases) && definition.allowedPhases.length && !definition.allowedPhases.includes(snapshot.player.phase)) fail('TASK_PHASE', `workflow ${workflowId} is not allowed in phase ${snapshot.player.phase}`);
    if (payload.maxMs !== undefined && payload.maxMs !== null && (!Number.isSafeInteger(payload.maxMs) || payload.maxMs < 1000 || payload.maxMs > 120000)) fail('TASK_INVALID', 'workflow maxMs must be 1000..120000');
    return { kind: 'workflow', payload: { workflowId, version, args: payload.args ?? {}, maxMs: payload.maxMs ?? definition.maxMs ?? 30000 } };
  }
  if (payload.args !== undefined && !isObject(payload.args)) fail('TASK_INVALID', 'workflow args must be an object');
  return { kind: 'workflow', payload: { workflowId, version, args: payload.args ?? {}, maxMs: payload.maxMs ?? 30000 } };
}

export function normalizeWorkflowCatalogue(document) {
  if (!isObject(document) || document.schemaVersion !== WORKFLOW_SCHEMA) fail('WORKFLOW_CATALOGUE', `workflow catalogue must use ${WORKFLOW_SCHEMA}`);
  if (!Array.isArray(document.workflows)) fail('WORKFLOW_CATALOGUE', 'workflow catalogue needs a workflows array');
  const workflows = [];
  const seen = new Set();
  for (const [index, item] of document.workflows.entries()) {
    if (!isObject(item)) fail('WORKFLOW_CATALOGUE', `workflow ${index} must be an object`);
    const id = typeof item.id === 'string' ? item.id : fail('WORKFLOW_CATALOGUE', `workflow ${index} id is required`);
    if (!/^[A-Za-z0-9._:-]{1,80}$/.test(id)) fail('WORKFLOW_CATALOGUE', `workflow id ${id} is invalid`);
    const version = Number.isSafeInteger(item.version) && item.version >= 1 ? item.version : fail('WORKFLOW_CATALOGUE', `workflow ${id} version must be a positive integer`);
    if (seen.has(`${id}@${version}`)) fail('WORKFLOW_CATALOGUE', `duplicate workflow ${id}@${version}`);
    seen.add(`${id}@${version}`);
    if (typeof item.description !== 'string' || item.description.length > 600) fail('WORKFLOW_CATALOGUE', `workflow ${id} description is invalid`);
    if (!isObject(item.parameterSchema)) fail('WORKFLOW_CATALOGUE', `workflow ${id} parameterSchema is required`);
    noCode(item.parameterSchema, `workflow.${id}.parameterSchema`);
    const allowedPhases = Array.isArray(item.allowedPhases) ? item.allowedPhases : [];
    if (allowedPhases.some(phase => !phases.has(phase))) fail('WORKFLOW_CATALOGUE', `workflow ${id} has an unknown phase`);
    if (item.maxMs !== undefined && (!Number.isSafeInteger(item.maxMs) || item.maxMs < 1000 || item.maxMs > 120000)) fail('WORKFLOW_CATALOGUE', `workflow ${id} maxMs is invalid`);
    workflows.push({ id, version, description: item.description, parameterSchema: item.parameterSchema, allowedPhases, successEvidence: typeof item.successEvidence === 'string' ? item.successEvidence : null, maxMs: item.maxMs ?? 30000 });
  }
  return { schemaVersion: WORKFLOW_SCHEMA, workflows };
}

export function findWorkflow(catalogue, workflowId, version = null) {
  if (!catalogue?.workflows) return null;
  return catalogue.workflows.find(item => item.id === workflowId && (version === null || item.version === version)) ?? null;
}

export function workflowsForPhase(catalogue, phase) {
  return (catalogue?.workflows ?? []).filter(item => !item.allowedPhases.length || item.allowedPhases.includes(phase));
}

export function validateWorkflowArgs(workflow, args) {
  if (!isObject(args)) fail('TASK_INVALID', 'workflow args must be an object');
  noCode(args, 'workflow.args');
  const schema = workflow.parameterSchema ?? {};
  const properties = isObject(schema.properties) ? schema.properties : {};
  if (schema.type !== undefined && schema.type !== 'object') fail('WORKFLOW_CATALOGUE', `workflow ${workflow.id} parameterSchema must be an object`);
  for (const key of Array.isArray(schema.required) ? schema.required : []) if (!(key in args)) fail('TASK_INVALID', `workflow ${workflow.id} is missing required argument ${key}`);
  if (schema.additionalProperties === false) for (const key of Object.keys(args)) if (!(key in properties)) fail('TASK_INVALID', `workflow ${workflow.id} does not accept argument ${key}`);
  for (const [key, definition] of Object.entries(properties)) {
    if (!(key in args)) continue;
    const value = args[key];
    const type = definition?.type;
    if (type === 'string' && typeof value !== 'string') fail('TASK_INVALID', `workflow argument ${key} must be a string`);
    if (type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) fail('TASK_INVALID', `workflow argument ${key} must be a number`);
    if (type === 'integer' && !Number.isSafeInteger(value)) fail('TASK_INVALID', `workflow argument ${key} must be an integer`);
    if (type === 'boolean' && typeof value !== 'boolean') fail('TASK_INVALID', `workflow argument ${key} must be a boolean`);
    if (Array.isArray(definition?.enum) && !definition.enum.includes(value)) fail('TASK_INVALID', `workflow argument ${key} is not in its enum`);
    if (typeof value === 'string' && value.length > 500) fail('TASK_INVALID', `workflow argument ${key} is too long`);
  }
  return true;
}

export function taskSummary(task) {
  if (!task) return null;
  return { schemaVersion: TASK_SCHEMA, kind: task.kind, payload: task.payload };
}

export function playerPhase(snapshot) {
  const phase = snapshot?.player?.phase;
  return phases.has(phase) ? phase : 'unknown';
}
