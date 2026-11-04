import { validateAction } from './browser.mjs';

const actionProperties = {
  kind: { type: 'string', enum: ['key', 'hold', 'click', 'look', 'type', 'scroll', 'drag', 'swing', 'wait', 'release'] },
  keys: { type: 'array', items: { type: 'string' } },
  ms: { type: 'number' },
  controlId: { type: ['integer', 'null'] },
  x: { type: ['number', 'null'] }, y: { type: ['number', 'null'] },
  dx: { type: ['number', 'null'] }, dy: { type: ['number', 'null'] },
  toX: { type: ['number', 'null'] }, toY: { type: ['number', 'null'] },
  text: { type: 'string' },
  button: { type: 'string', enum: ['left', 'right', 'middle'] },
};
const objectSchema = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
// Strict structured output rejects an object without listed properties, so free-form objects travel as JSON text.
const jsonObjectText = { type: 'string', description: 'a JSON object written as text, e.g. {"degrees":90}; "" for none' };
export const PILOT_SCHEMA = objectSchema({
  note: { type: 'string' }, goal: { type: 'string' }, memory: { type: 'string' },
  handbookQuery: { type: 'string' }, escalate: { type: 'boolean' },
  action: objectSchema(actionProperties),
});
// The index refers only to the current observation; the worker resolves it to the
// exact observed target before dispatch. A ground destination is explicit.
const nativeIntentSchema = objectSchema({
  kind: {type:'string', enum:['turn','look','goto','use','explore','fight','retreat','stop']},
  targetIndex: {type:['integer','null']}, x: {type:['number','null']}, z: {type:['number','null']},
  degrees: {type:['number','null']}, range: {type:['number','null']}, maxMs: {type:['number','null']}, stopHpPct: {type:['number','null']},
});
export const NATIVE_PILOT_SCHEMA = objectSchema({
  note:{type:'string'}, goal:{type:'string'}, memory:{type:'string'}, handbookQuery:{type:'string'}, escalate:{type:'boolean'},
  intent:{anyOf:[nativeIntentSchema,{type:'null'}]}, action:{anyOf:[objectSchema(actionProperties),{type:'null'}]},
});
export function normalizeNativeDecision(d, targets=[]) {
  if (!d || (d.intent == null) === (d.action == null)) throw Error('Choose exactly one intent or UI action');
  if (d.action != null) return {action:normalizeAction(d.action)};
  const i=d.intent;
  if (!i || !['turn','look','goto','use','explore','fight','retreat','stop'].includes(i.kind)) throw Error('Invalid intent');
  const out={kind:i.kind};
  for (const k of ['degrees','range','maxMs']) if(i[k]!=null) { if(!Number.isFinite(i[k])) throw Error('Invalid intent '+k); out[k]=i[k]; }
  // A health floor only steers fight/retreat; on other intents (Luna adds one to explore) it is ignored, not refused:
  // a hit already interrupts every non-combat intent.
  if(i.stopHpPct!=null&&['fight','retreat'].includes(i.kind)){if(!Number.isFinite(i.stopHpPct)||i.stopHpPct<0||i.stopHpPct>100)throw Error('Invalid combat health floor');out.stopHpPct=i.stopHpPct;}
  if(i.targetIndex!=null) {
    if(!Number.isSafeInteger(i.targetIndex)||i.targetIndex<0||i.targetIndex>=targets.length) throw Error('Target is not in the current observation');
    if(i.x!=null||i.z!=null) throw Error('Choose one target');
    out.target=targets[i.targetIndex]?.target;
    if(!out.target || typeof out.target!=='object') throw Error('Invalid observed target');
  } else if(i.x!=null||i.z!=null) {
    if(!Number.isFinite(i.x)||!Number.isFinite(i.z)) throw Error('Ground target needs x and z');
    out.target={x:i.x,z:i.z};
  }
  return {intent:out,observedTarget:i.targetIndex!=null};
}
export const PLANNER_SCHEMA = objectSchema({
  goal: { type: 'string' }, plan: { type: 'string' }, memory: { type: 'string' }, handbookQuery: { type: 'string' },
});

// Keep only fields read for this kind: unused schema placeholders must not
// change an action or trigger a browser validation failure.
export function normalizeAction(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) throw Error('Action must be an object');
  const fields = {
    key: ['keys'], hold: ['keys', 'ms'], click: ['controlId', 'x', 'y', 'button'],
    look: ['dx', 'dy'], type: ['controlId', 'text'], scroll: ['x', 'y', 'dx', 'dy'],
    drag: ['x', 'y', 'toX', 'toY', 'button'], swing: ['keys', 'ms', 'dx', 'dy'], wait: ['ms'], release: [],
  };
  if (!Object.hasOwn(fields, a.kind)) throw Error('Unknown action');
  const result = { kind: a.kind };
  for (const name of fields[a.kind]) if (a[name] != null) result[name] = a[name];
  if (result.controlId != null && (!Number.isInteger(result.controlId) || result.controlId < 0)) throw Error('Invalid control ID');
  if (result.button != null && !['left', 'right', 'middle'].includes(result.button)) throw Error('Invalid button');
  if (a.kind === 'click') {
    if (result.controlId != null) { delete result.x; delete result.y; }
    else if (!Number.isFinite(result.x) || !Number.isFinite(result.y)) throw Error('Click requires coordinates or a control ID');
  }
  if (a.kind === 'drag' && !['x', 'y', 'toX', 'toY'].every(k => Number.isFinite(result[k]))) throw Error('Drag requires start and end coordinates');
  if (a.kind === 'scroll' && ((result.x == null) !== (result.y == null))) throw Error('Scroll position requires both coordinates');
  return validateAction(result);
}

// ---------------------------------------------------------------------------
// dfo-mind.v1 role decisions. These extend the legacy schemas above.
import { MIND_SCHEMA } from './mind/config.mjs';
import { PLAN_SKILLS, REASSESS_EVENTS, validateStep, validateIntentSpec } from './mind/plan.mjs';
import { normalizeTaskSpec, normalizeWorkflowCatalogue, objectArg } from './mind/tasks.mjs';

const taskSpecSchema = {
  anyOf: [
    { type: 'object', additionalProperties: false, properties: { kind: { const: 'intent' }, payload: nativeIntentSchema }, required: ['kind', 'payload'] },
    { type: 'object', additionalProperties: false, properties: { kind: { const: 'ui' }, payload: { type: 'object', additionalProperties: false, properties: { action: objectSchema(actionProperties), uiObservationId: { type: ['string', 'null'] } }, required: ['action', 'uiObservationId'] } }, required: ['kind', 'payload'] },
    { type: 'object', additionalProperties: false, properties: { kind: { const: 'workflow' }, payload: { type: 'object', additionalProperties: false, properties: { workflowId: { type: 'string' }, version: { type: 'integer' }, args: jsonObjectText, maxMs: { type: ['integer', 'null'] } }, required: ['workflowId', 'version', 'args', 'maxMs'] } }, required: ['kind', 'payload'] },
  ],
};

export const LUNA_SCHEMA = objectSchema({
  schemaVersion: { type: 'string', enum: [MIND_SCHEMA] }, note: { type: 'string' }, memory: { type: 'string' }, handbookQuery: { type: 'string' },
  confidence: { type: ['number', 'null'] }, escalate: { type: 'boolean' },
  intent: { anyOf: [nativeIntentSchema, { type: 'null' }] }, task: { anyOf: [taskSpecSchema, { type: 'null' }] },
});
const terraStepSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    id: { type: 'string' }, skill: { anyOf: [{ type: 'string', enum: [...PLAN_SKILLS] }, { type: 'null' }] },
    maxMs: { type: ['integer', 'null'] }, args: jsonObjectText,
    objective: { type: 'string' }, allowedSkills: { type: 'array', items: { type: 'string', enum: PLAN_SKILLS.filter(skill => skill !== 'tactical') } }, allowedTasks: { type: 'array', items: { type: 'string', enum: ['ui', 'workflow'] } }, allowedWorkflows: { type: 'array', items: { type: 'string' } },
    fallbackIntent: { anyOf: [jsonObjectText, { type: 'null' }] }, fallbackTask: { anyOf: [taskSpecSchema, { type: 'null' }] }, task: { anyOf: [taskSpecSchema, { type: 'null' }] },
    onFailure: { anyOf: [{ type: 'string', enum: ['retry', 'escalate', 'skip'] }, { type: 'null' }] },
  },
  required: ['id', 'skill', 'maxMs', 'args', 'objective', 'allowedSkills', 'allowedTasks', 'allowedWorkflows', 'fallbackIntent', 'fallbackTask', 'task', 'onFailure'],
};
export const TERRA_SCHEMA = objectSchema({
  schemaVersion: { type: 'string', enum: [MIND_SCHEMA] }, goal: { type: 'string' }, memory: { type: 'string' }, handbookQuery: { type: 'string' },
  confidence: { type: ['number', 'null'] }, baseVersion: { type: 'integer' }, complete: { type: 'boolean' },
  sessionComplete: { type: 'boolean' }, reason: { type: 'string' },
  ttlMs: { type: ['integer', 'null'] }, reassessOn: { type: 'array', items: { type: 'string', enum: [...REASSESS_EVENTS] } },
  steps: { type: 'array', items: terraStepSchema },
});
const reviewSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    summary: { type: 'string' }, confidence: { type: 'string' },
    findings: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { diagnosis: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } } }, required: ['diagnosis', 'evidence'] } },
    recommendations: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'confidence', 'findings', 'recommendations'],
};
const engineeringSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    proposalId: { type: 'string' }, diagnosis: { type: 'string' }, changes: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { path: { type: 'string' }, description: { type: 'string' } }, required: ['path', 'description'] } },
    affectedPaths: { type: 'array', items: { type: 'string' } }, changeClass: { type: 'string' }, reproducer: { type: 'string' }, verificationCriteria: { type: 'array', items: { type: 'string' } },
    tests: { type: 'array', items: { type: 'string' } }, risk: { type: 'string' }, rollback: { type: 'string' }, targetMetric: { type: 'string' }, budget: { type: 'string' },
  },
  required: ['proposalId', 'diagnosis', 'changes', 'affectedPaths', 'changeClass', 'reproducer', 'verificationCriteria', 'tests', 'risk', 'rollback', 'targetMetric', 'budget'],
};
export const SOL_SCHEMA = objectSchema({
  schemaVersion: { type: 'string', enum: [MIND_SCHEMA] }, goal: { type: 'string' }, memory: { type: 'string' }, handbookQuery: { type: 'string' },
  confidence: { type: ['number', 'null'] }, strategyNote: { type: 'string' }, review: { anyOf: [reviewSchema, { type: 'null' }] }, engineering: { anyOf: [engineeringSchema, { type: 'null' }] },
});

function mindVersion(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw Error('Decision must be an object');
  if (d.schemaVersion !== MIND_SCHEMA) throw Error(`Decision schemaVersion must be ${MIND_SCHEMA}`);
}
function text(value, name, max, required = false) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > max) throw Error(`Invalid ${name}`);
  return value.trim();
}

function confidenceOf(value) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0 || value > 1) throw Error('confidence must be within 0..1');
  return value;
}

/** Normalize a model-selected player task and resolve its intent targets against this observation. */
export function normalizeTaskDecision(rawTask, { targets = [], catalogue = null, capabilities = null, snapshot = null } = {}) {
  const task = normalizeTaskSpec(rawTask, { catalogue, capabilities, snapshot });
  if (task.kind === 'intent') {
    if (task.payload.target && typeof task.payload.target === 'object' && typeof task.payload.kind === 'string') {
      return { kind: 'intent', payload: { ...task.payload, observedTarget: task.payload.observedTarget === true || task.payload.target.targetId !== undefined } };
    }
    const decision = normalizeNativeDecision({ intent: task.payload, action: null }, targets);
    return { kind: 'intent', payload: { ...decision.intent, observedTarget: decision.observedTarget } };
  }
  if (task.kind === 'ui') {
    const action = normalizeAction(task.payload.action);
    return { kind: 'ui', payload: { action, ...(task.payload.uiObservationId ? { uiObservationId: task.payload.uiObservationId } : {}) } };
  }
  return task;
}

export function normalizeLunaDecision(d, options = {}) {
  mindVersion(d);
  const targets = Array.isArray(options) ? options : (options.targets ?? []);
  let taskRaw = d.task ?? null;
  const intentRaw = d.intent ?? null;
  // Live 2026-10-29: Luna sent the same look as both intent and an intent task. The same action twice is one choice.
  const set = value => JSON.stringify(Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== null).sort(([a], [b]) => a.localeCompare(b))));
  if (taskRaw?.kind === 'intent' && intentRaw && set(taskRaw.payload) === set(intentRaw)) taskRaw = null;
  if (taskRaw === null && intentRaw === null) throw Error('Luna must choose one intent/task');
  if (taskRaw !== null && intentRaw !== null) throw Error('Luna must choose exactly one intent/task');
  const task = taskRaw !== null
    ? normalizeTaskDecision(taskRaw, { targets, catalogue: options.catalogue ?? null, capabilities: options.capabilities ?? null, snapshot: options.snapshot ?? null })
    : normalizeTaskDecision({ kind: 'intent', payload: intentRaw }, { targets });
  return {
    schemaVersion: MIND_SCHEMA,
    task,
    ...(task.kind === 'intent' ? { intent: task.payload, observedTarget: task.payload.observedTarget === true } : {}),
    note: text(d.note, 'note', 600), memory: text(d.memory, 'memory', 2000),
    handbookQuery: text(d.handbookQuery, 'handbookQuery', 200), escalate: d.escalate === true,
    confidence: confidenceOf(d.confidence),
  };
}

export function normalizeTerraDecision(d, { currentVersion = 0, snapshot = null, catalogue = null, capabilities = null } = {}) {
  mindVersion(d);
  if (!Number.isSafeInteger(d.baseVersion) || d.baseVersion < 0) throw Error('Invalid plan baseVersion');
  if (d.baseVersion !== currentVersion) throw Error(`Plan update is stale: based on ${d.baseVersion}, current ${currentVersion}`);
  const goal = text(d.goal, 'goal', 1000, true);
  if (typeof d.complete !== 'boolean') throw Error('Invalid plan complete flag');
  const steps = Array.isArray(d.steps) ? d.steps : (() => { throw Error('Plan steps must be an array'); })();
  if (steps.length > 8) throw Error('Plan has too many steps');
  if (!d.complete && steps.length === 0) throw Error('Active plan needs at least one step');
  const reassessOn = Array.isArray(d.reassessOn) ? d.reassessOn : [];
  for (const event of reassessOn) if (!REASSESS_EVENTS.includes(event)) throw Error(`Unknown reassess event ${event}`);
  const targets = snapshot?.native?.targets ?? [];
  const normalizedSteps = steps.map((step, index) => {
    if (!step || typeof step !== 'object') throw Error(`Invalid step ${index}`);
    const out = { id: step.id, maxMs: step.maxMs ?? undefined, onFailure: step.onFailure ?? undefined };
    if (step.task !== undefined && step.task !== null) {
      // Structural validation here; the scheduler validates the live workflow
      // catalogue/phase at dispatch so an unavailable workflow becomes a bounded
      // reassessment instead of an invalid model reply.
      out.task = normalizeTaskDecision(step.task, { targets });
    } else {
      out.skill = step.skill;
      const args = objectArg(step.args, 'step args');
      out.args = args && typeof args === 'object' ? args : {};
    }
    if (step.skill === 'tactical') {
      out.objective = text(step.objective, 'tactical objective', 600, true);
      out.allowedSkills = Array.isArray(step.allowedSkills) ? step.allowedSkills : [];
      out.allowedTasks = Array.isArray(step.allowedTasks) ? step.allowedTasks : [];
      out.allowedWorkflows = Array.isArray(step.allowedWorkflows) ? step.allowedWorkflows : undefined;
      out.fallbackIntent = objectArg(step.fallbackIntent, 'fallbackIntent') ?? null;
      out.fallbackTask = step.fallbackTask ? normalizeTaskDecision(step.fallbackTask, { targets, catalogue, capabilities, snapshot }) : null;
    }
    validateStep(out, index);
    return out;
  });
  if (d.complete) normalizedSteps.length = 0;
  return {
    schemaVersion: MIND_SCHEMA, goal, memory: text(d.memory, 'memory', 2000), handbookQuery: text(d.handbookQuery, 'handbookQuery', 200),
    confidence: confidenceOf(d.confidence), sessionComplete: d.sessionComplete === true,
    update: {
      baseVersion: d.baseVersion, goal, steps: normalizedSteps, complete: d.complete,
      reassessOn, ttlMs: d.ttlMs ?? undefined, reason: text(d.reason, 'reason', 300),
    },
  };
}

export function normalizeSolDecision(d) {
  mindVersion(d);
  const review = d.review;
  if (review !== null && review !== undefined) {
    if (typeof review !== 'object' || Array.isArray(review)) throw Error('Invalid review');
    if (typeof review.summary !== 'string' || !review.summary.trim()) throw Error('Review needs a summary');
    if (!Array.isArray(review.findings) || !Array.isArray(review.recommendations)) throw Error('Review needs findings and recommendations');
  }
  const engineering = d.engineering;
  if (engineering !== null && engineering !== undefined) {
    if (typeof engineering !== 'object' || Array.isArray(engineering)) throw Error('Invalid engineering proposal');
    if (typeof engineering.diagnosis !== 'string' || !engineering.diagnosis.trim()) throw Error('Engineering proposal needs a diagnosis');
    if (!Array.isArray(engineering.changes) || !Array.isArray(engineering.tests)) throw Error('Engineering proposal needs changes and tests');
  }
  return {
    schemaVersion: MIND_SCHEMA, goal: text(d.goal, 'goal', 1000), memory: text(d.memory, 'memory', 2000),
    handbookQuery: text(d.handbookQuery, 'handbookQuery', 200), strategyNote: text(d.strategyNote, 'strategyNote', 2000),
    confidence: confidenceOf(d.confidence), review: review ?? null, engineering: engineering ?? null,
  };
}

export { normalizeWorkflowCatalogue };
