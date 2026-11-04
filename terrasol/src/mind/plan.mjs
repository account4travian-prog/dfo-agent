// Typed, versioned session plans. A plan is a sequence of concrete legacy
// intents, plus optional tactical steps that delegate a bounded choice to Luna.
// Only the scheduler may dispatch an intent, and it validates the current plan
// version and target references before dispatch.
import { randomUUID } from 'node:crypto';
import { normalizeTaskSpec } from './tasks.mjs';

export const PLAN_SCHEMA = 'dfo-plan.v1';
export const PLAN_SKILLS = Object.freeze(['turn', 'look', 'goto', 'use', 'explore', 'fight', 'retreat', 'stop', 'tactical']);
export const REASSESS_EVENTS = Object.freeze(['scene-change', 'damage', 'death', 'hostile-appeared', 'ui-transition', 'chat', 'step-failure', 'ttl', 'plan-complete']);
const MAX_STEPS = 8;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

export class PlanError extends Error {
  constructor(code, message) { super(message); this.name = 'PlanError'; this.code = code; }
}
const fail = (code, message) => { throw new PlanError(code, message); };

function string(value, name, max, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail('invalid-plan', `${name} must be a non-empty string of at most ${max} characters`);
  return value.trim();
}
function optionalInteger(value, name, min, max) {
  if (value === undefined || value === null) return undefined;
  if (!Number.isSafeInteger(value) || value < min || value > max) fail('invalid-plan', `${name} must be an integer in ${min}..${max}`);
  return value;
}

export function validateTargetRef(ref) {
  if (!isObject(ref)) fail('invalid-plan', 'targetRef must be an object');
  if (ref.kind === 'foe') {
    if (typeof ref.targetId !== 'string' || !ref.targetId) fail('invalid-plan', 'foe targetRef needs targetId');
    return;
  }
  if (ref.kind === 'thing') {
    if (ref.handle !== undefined && typeof ref.handle !== 'string') fail('invalid-plan', 'thing targetRef handle must be a string');
    if (ref.targetKind !== undefined && typeof ref.targetKind !== 'string') fail('invalid-plan', 'thing targetRef targetKind must be a string');
    if (ref.handle === undefined && !(finite(ref.x) && finite(ref.z))) fail('invalid-plan', 'thing targetRef needs handle or x/z');
    return;
  }
  fail('invalid-plan', 'targetRef.kind must be foe or thing');
}

export function validateStep(step, index = 0) {
  if (!isObject(step)) fail('invalid-plan', `step ${index} must be an object`);
  const id = string(step.id, 'step id', 64, true);
  if (!/^[A-Za-z0-9._:-]+$/.test(id)) fail('invalid-plan', `step id ${id} contains unsupported characters`);
  if (step.task !== undefined) {
    try { normalizeTaskSpec(step.task); } catch (error) { fail('invalid-plan', `step ${id} task: ${error.message}`); }
    optionalInteger(step.maxMs, `step ${id} maxMs`, 1000, 90000);
    if (step.onFailure !== undefined && !['retry', 'escalate', 'skip'].includes(step.onFailure)) fail('invalid-plan', `step ${id} onFailure is invalid`);
    return;
  }
  if (!PLAN_SKILLS.includes(step.skill)) fail('invalid-plan', `step ${id} skill is not allowed`);
  if (step.skill === 'tactical') {
    string(step.objective, `step ${id} objective`, 600, true);
    const allowedSkills = Array.isArray(step.allowedSkills) ? step.allowedSkills : [];
    const allowedTasks = Array.isArray(step.allowedTasks) ? step.allowedTasks : [];
    if (allowedSkills.length < 1 && allowedTasks.length < 1) fail('invalid-plan', `step ${id} needs allowedSkills or allowedTasks`);
    if (allowedSkills.length > 8) fail('invalid-plan', `step ${id} has too many allowedSkills`);
    for (const skill of allowedSkills) if (!PLAN_SKILLS.includes(skill) || skill === 'tactical') fail('invalid-plan', `step ${id} allowedSkills contains ${skill}`);
    for (const kind of allowedTasks) if (!['ui', 'workflow'].includes(kind)) fail('invalid-plan', `step ${id} allowedTasks contains ${kind}`);
    if (step.allowedWorkflows !== undefined && (!Array.isArray(step.allowedWorkflows) || step.allowedWorkflows.some(id => typeof id !== 'string'))) fail('invalid-plan', `step ${id} allowedWorkflows is invalid`);
    if (step.fallbackIntent !== undefined && step.fallbackIntent !== null) validateIntentSpec(step.fallbackIntent);
    if (step.fallbackTask !== undefined && step.fallbackTask !== null) { try { normalizeTaskSpec(step.fallbackTask); } catch (error) { fail('invalid-plan', `step ${id} fallbackTask: ${error.message}`); } }
    optionalInteger(step.maxMs, `step ${id} maxMs`, 1000, 90000);
    return;
  }
  validateIntentSpec({ kind: step.skill, ...(step.args ?? {}) });
  optionalInteger(step.maxMs, `step ${id} maxMs`, 1000, 90000);
  if (step.onFailure !== undefined && !['retry', 'escalate', 'skip'].includes(step.onFailure)) fail('invalid-plan', `step ${id} onFailure is invalid`);
}

/** Validate the intent-shaped part of a plan step or Luna reply. */
export function validateIntentSpec(spec) {
  if (!isObject(spec)) fail('invalid-intent', 'intent must be an object');
  if (!PLAN_SKILLS.includes(spec.kind) || spec.kind === 'tactical') fail('invalid-intent', 'intent kind is not a legacy skill');
  if (spec.kind === 'turn') {
    if (!finite(spec.degrees) || Math.abs(spec.degrees) > 180) fail('invalid-intent', 'turn needs signed degrees within 180');
  }
  if (spec.kind === 'goto' || spec.kind === 'use') {
    const hasRef = spec.targetRef !== undefined;
    const hasPoint = finite(spec.x) && finite(spec.z);
    if (!hasRef && !hasPoint) fail('invalid-intent', `${spec.kind} needs a targetRef or observed ground x/z`);
    if (hasRef) validateTargetRef(spec.targetRef);
  }
  if (spec.kind === 'explore') optionalInteger(spec.maxMs, 'explore maxMs', 1000, 90000);
  if (spec.kind === 'fight' || spec.kind === 'retreat') {
    if (spec.targetRef !== undefined) validateTargetRef(spec.targetRef);
    if (spec.range !== undefined && (!finite(spec.range) || spec.range < 0 || spec.range > 100)) fail('invalid-intent', 'range must be within 0..100');
    if (spec.stopHpPct !== undefined && (!finite(spec.stopHpPct) || spec.stopHpPct < 0 || spec.stopHpPct > 100)) fail('invalid-intent', 'stopHpPct must be within 0..100');
  }
  optionalInteger(spec.maxMs, 'maxMs', 1000, 90000);
}

export function validatePlan(plan) {
  if (!isObject(plan)) return ['plan must be an object'];
  const errors = [];
  if (plan.schema !== PLAN_SCHEMA) errors.push(`schema must be ${PLAN_SCHEMA}`);
  if (!Number.isSafeInteger(plan.version) || plan.version < 1) errors.push('version must be a positive integer');
  if (typeof plan.planId !== 'string' || !plan.planId) errors.push('planId is required');
  if (typeof plan.goal !== 'string' || !plan.goal.trim() || plan.goal.length > 1000) errors.push('goal is required');
  if (!Array.isArray(plan.steps)) errors.push('steps must be an array');
  else {
    if (plan.steps.length > MAX_STEPS) errors.push(`at most ${MAX_STEPS} steps`);
    const ids = new Set();
    plan.steps.forEach((step, index) => {
      try { validateStep(step, index); } catch (error) { errors.push(error.message); }
      if (step?.id) { if (ids.has(step.id)) errors.push(`duplicate step id ${step.id}`); ids.add(step.id); }
    });
  }
  if (plan.status === 'complete' && plan.planCompleteReason !== undefined && typeof plan.planCompleteReason !== 'string') errors.push('planCompleteReason must be a string');
  return errors;
}

function normalizeBasis(basis) {
  if (!isObject(basis)) return null;
  const out = {};
  for (const key of ['observationId', 'pageId', 'scene']) if (basis[key] !== undefined) out[key] = basis[key];
  for (const key of ['generation', 'frame']) if (Number.isSafeInteger(basis[key])) out[key] = basis[key];
  return out;
}

export function createPlan({ goal, steps = [], author = 'terra', basis = null, ttlMs = 180000, planId = null, now = () => Date.now(), reassessOn = [] } = {}) {
  const plan = {
    schema: PLAN_SCHEMA, planId: planId ?? `plan-${randomUUID()}`, version: 1, author,
    goal: string(goal, 'goal', 1000, true), steps, reassessOn: [...new Set(reassessOn)],
    ttlMs: optionalInteger(ttlMs, 'ttlMs', 1000, 3600000) ?? 180000,
    basis: normalizeBasis(basis), status: 'active',
    createdAt: new Date(now()).toISOString(), updatedAt: new Date(now()).toISOString(),
    stepStates: Object.fromEntries(steps.map(step => [step.id, 'pending'])),
  };
  const errors = validatePlan(plan);
  if (errors.length) fail('invalid-plan', errors.join('; '));
  return plan;
}

/**
 * A single mutable plan store. Updates carry the version they were based on;
 * mismatched versions are stale and are rejected rather than applied.
 */
export function createPlanStore({ mode = null, plan = null, now = () => Date.now(), idFactory = () => randomUUID() } = {}) {
  let current = null;
  if(mode!==null&&!['online','offline'].includes(mode))fail('invalid-plan','Invalid plan mode');
  if(mode&&plan?.mode&&plan.mode!==mode)fail('invalid-plan','Saved plan mode mismatch');
  const history = [];
  if (plan) {
    const errors = validatePlan(plan);
    if (errors.length) fail('invalid-plan', `saved plan is invalid: ${errors.join('; ')}`);
    current = structuredClone(plan);
    if(mode)current.mode=mode;
    current.stepStates = { ...Object.fromEntries(current.steps.map(step => [step.id, 'pending'])), ...(current.stepStates ?? {}) };
  }
  const rejected = [];
  function reject(code, reason, at = now()) {
    const row = { code, reason, at: new Date(at).toISOString(), version: current?.version ?? 0 };
    rejected.push(row);
    return { ok: false, code, reason, rejected: row, plan: current ? structuredClone(current) : null };
  }
  function snapshot() { return current ? structuredClone(current) : null; }
  function nextStep() {
    if (!current || current.status === 'complete' || current.stale) return null;
    const step = current.steps.find(item => ['pending', 'running'].includes(current.stepStates[item.id]));
    return step ? structuredClone(step) : null;
  }
  function markRunning(stepId) {
    if (!current) return false;
    if (current.stepStates[stepId] !== 'pending') return false;
    current.stepStates[stepId] = 'running';
    current.updatedAt = new Date(now()).toISOString();
    return true;
  }
  function markStep(stepId, outcome) {
    if (!current) return { ok: false, code: 'no-plan' };
    if (!current.stepStates[stepId]) return { ok: false, code: 'unknown-step' };
    const completed = outcome === 'completed' || outcome === 'cleared';
    current.stepStates[stepId] = completed ? 'completed' : 'failed';
    current.updatedAt = new Date(now()).toISOString();
    const remaining = current.steps.filter(step => current.stepStates[step.id] === 'pending').length;
    const failed = current.steps.filter(step => current.stepStates[step.id] === 'failed').length;
    if (remaining === 0 && failed === 0 && current.status !== 'complete') {
      current.status = 'complete';
      current.planCompleteReason = 'all-steps-completed';
    }
    return { ok: true, completed, remaining, failed, planComplete: current.status === 'complete' };
  }
  function resetStep(stepId) {
    if (!current) return false;
    if (!current.stepStates[stepId]) return false;
    if (!['failed', 'running'].includes(current.stepStates[stepId])) return false;
    current.stepStates[stepId] = 'pending';
    current.updatedAt = new Date(now()).toISOString();
    return true;
  }
  function markSceneChanged(reason = 'scene changed') {
    if (!current) return;
    current.stale = true;
    current.staleReason = reason;
    current.updatedAt = new Date(now()).toISOString();
  }
  function apply(update, { snapshot: world = null, at = now() } = {}) {
    if (!isObject(update)) return reject('invalid-plan', 'plan update must be an object', at);
    if (!Number.isSafeInteger(update.baseVersion)) return reject('plan-base-version-required', 'plan update needs an integer baseVersion', at);
    if (current ? update.baseVersion !== current.version : update.baseVersion !== 0) {
      return reject('stale-plan', `plan update based on version ${update.baseVersion} but current is ${current?.version ?? 0}`, at);
    }
    let steps = update.steps;
    let goal = update.goal;
    if (update.complete === true) {
      steps = [];
      goal = goal ?? current?.goal ?? 'Session complete';
    }
    if (goal === undefined) goal = current?.goal;
    if (!Array.isArray(steps)) {
      if (update.complete === true) steps = [];
      else return reject('invalid-plan', 'plan update needs steps or complete:true', at);
    }
    const planId = update.planId ?? current?.planId ?? `plan-${idFactory()}`;
    const version = (current?.version ?? 0) + 1;
    const basis = normalizeBasis(update.basis ?? (world ? { observationId: world.observationId, pageId: world.basis?.pageId, generation: world.basis?.generation, frame: world.basis?.frame, scene: world.scene } : current?.basis));
    const plan = {
      schema: PLAN_SCHEMA, ...(mode?{mode}:{}), planId, version, author: update.author ?? 'terra',
      goal: string(goal, 'goal', 1000, true), steps,
      reassessOn: [...new Set(update.reassessOn ?? current?.reassessOn ?? [])],
      ttlMs: optionalInteger(update.ttlMs, 'ttlMs', 1000, 3600000) ?? current?.ttlMs ?? 180000,
      basis, status: update.complete === true ? 'complete' : 'active',
      createdAt: current?.createdAt ?? new Date(at).toISOString(), updatedAt: new Date(at).toISOString(),
      stepStates: Object.fromEntries(steps.map(step => [step.id, 'pending'])),
    };
    if (update.complete === true) plan.planCompleteReason = 'model-complete';
    const errors = validatePlan(plan);
    if (errors.length) return reject('invalid-plan', errors.join('; '), at);
    current = plan;
    history.push(structuredClone(plan));
    return { ok: true, plan: structuredClone(plan), version, previousVersion: update.baseVersion };
  }
  function needsReassessment({ at = now(), event = null, failures = 0 } = {}) {
    if (!current) return { needed: true, reason: 'no-plan' };
    if (current.stale) return { needed: true, reason: 'plan-stale' };
    if (current.status === 'complete') return { needed: true, reason: 'plan-complete' };
    if (at - Date.parse(current.updatedAt) > current.ttlMs) return { needed: true, reason: 'plan-ttl' };
    if (event && current.reassessOn.includes(event)) return { needed: true, reason: `event:${event}` };
    if (failures >= 2) return { needed: true, reason: 'repeated-failure' };
    return { needed: false };
  }
  function serialized() {
    return { plan: snapshot(), history: history.length, rejected: rejected.slice(-20) };
  }
  return { snapshot, current: snapshot, version: () => current?.version ?? 0, basis: () => current?.basis ?? null, nextStep, markRunning, markStep, resetStep, markSceneChanged, apply, needsReassessment, serialized, rejected: () => rejected.slice(), history: () => history.map(structuredClone), hasPlan: () => current !== null };
}

/** Resolve a plan step or Luna intent against the current snapshot targets. */
export function resolveIntent(step, snapshot, plan = null) {
  const spec = step.skill === 'tactical' ? step.fallbackIntent : { kind: step.skill, ...(step.args ?? {}) };
  if (!spec) fail('intent-unavailable', 'tactical step has no fallback intent');
  validateIntentSpec(spec);
  const intents = Array.isArray(snapshot?.native?.targets) ? snapshot.native.targets : Array.isArray(snapshot?.targets) ? snapshot.targets : [];
  const targetFor = ref => {
    if (!ref) return undefined;
    if (ref.kind === 'foe') {
      const found = intents.find(item => item.kind === 'foe' && (item.target?.targetId === ref.targetId || item.targetId === ref.targetId || item.handle === ref.targetId));
      return found?.target ?? null;
    }
    const found = intents.find(item => {
      if (item.kind !== 'thing') return false;
      const target = item.target ?? item;
      if (ref.targetKind !== undefined && target.kind !== ref.targetKind) return false;
      if (ref.handle !== undefined && (target.handle === ref.handle || item.handle === ref.handle)) return true;
      return finite(target.x) && finite(target.z) && Math.hypot(target.x - ref.x, target.z - ref.z) <= 0.75;
    });
    return found?.target ?? null;
  };
  const intent = { kind: spec.kind };
  if (spec.kind === 'turn') intent.degrees = spec.degrees;
  if (spec.kind === 'explore') { if (spec.maxMs) intent.maxMs = spec.maxMs; if (spec.maxMs === undefined && step.maxMs) intent.maxMs = step.maxMs; }
  if (spec.kind === 'goto' || spec.kind === 'use') {
    if (spec.targetRef) {
      const target = targetFor(spec.targetRef);
      if (!target) fail('target-unavailable', `${spec.kind} target is not in the current observation`);
      intent.target = target;
    } else {
      intent.target = { x: spec.x, z: spec.z };
    }
  }
  if (spec.kind === 'fight' || spec.kind === 'retreat') {
    if (spec.targetRef) {
      const target = targetFor(spec.targetRef);
      if (!target) fail('target-unavailable', `${spec.kind} target is not in the current observation`);
      intent.target = target;
    }
    if (spec.range !== undefined) intent.range = spec.range;
    if (spec.stopHpPct !== undefined) intent.stopHpPct = spec.stopHpPct;
    if (spec.maxMs !== undefined) intent.maxMs = spec.maxMs;
  }
  if (spec.maxMs !== undefined && intent.maxMs === undefined) intent.maxMs = spec.maxMs;
  else if (intent.maxMs === undefined && step.maxMs) intent.maxMs = step.maxMs;
  // A target index is only meaningful for the observation that produced it.
  if (spec.targetIndex !== undefined) {
    if (!plan?.basis?.observationId || plan.basis.observationId !== snapshot?.observationId) fail('target-index-stale', 'targetIndex belongs to a different observation');
    const found = intents[spec.targetIndex];
    if (!found?.target) fail('target-unavailable', 'targetIndex is not in the current observation');
    intent.target = found.target;
  }
  return { intent, observedTarget: !!intent.target && spec.targetRef !== undefined };
}

export function planSummary(plan) {
  if (!plan) return null;
  return {
    ...(plan.mode?{mode:plan.mode}:{}), planId: plan.planId, version: plan.version, status: plan.status, goal: plan.goal,
    steps: plan.steps.map(step => ({
      id: step.id, skill: step.skill ?? null, taskKind: step.task?.kind ?? 'intent', state: plan.stepStates?.[step.id] ?? 'pending',
      maxMs: step.maxMs ?? null, onFailure: step.onFailure ?? null,
      args: step.args ?? step.task?.payload ?? null,
    })),
    stale: !!plan.stale, reason: plan.staleReason ?? plan.planCompleteReason ?? null,
  };
}
