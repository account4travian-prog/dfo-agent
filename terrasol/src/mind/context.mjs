// Per-tier compact context. Images and handbook passages are opt-in: the
// scheduler decides when a decision actually needs them. The builder never
// dumps raw scan/view state and never duplicates a foe list that is already
// represented by typed targets.
import { MIND_SCHEMA } from './config.mjs';
import { planSummary } from './plan.mjs';

const clip = (value, max) => typeof value === 'string' ? value.slice(0, max) : value;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function compactVitals(vitals = {}) {
  if (!isObject(vitals)) return null;
  const out = {};
  for (const key of ['health', 'maxHealth', 'magicka', 'maxMagicka', 'fatigue', 'maxFatigue']) if (Number.isFinite(vitals[key])) out[key] = vitals[key];
  return out;
}
function compactTarget(item, index) {
  const target = item?.target ?? item ?? {};
  const out = { index, kind: item?.kind ?? target.kind ?? 'unknown' };
  if (target.targetId !== undefined) out.targetId = String(target.targetId);
  if (target.handle !== undefined) out.handle = String(target.handle);
  if (typeof target.kind === 'string' && target.kind !== out.kind) out.label = target.kind;
  for (const key of ['dist', 'bearing', 'x', 'y', 'z']) if (Number.isFinite(target[key])) out[key] = target[key];
  return out;
}
function compactWorld(snapshot, { targetLimit = 8, uiLimit = 0 } = {}) {
  if (!snapshot) return null;
  const native = snapshot.native ?? {};
  const state = native.state ?? {};
  const world = {
    observationId: snapshot.observationId,
    basis: snapshot.basis,
    nativeReady: native.ready === true,
    scene: state.scene ?? snapshot.scene ?? null,
    mode: state.mode ?? null,
    pose: Array.isArray(state.pos) ? { pos: state.pos.map(value => Number.isFinite(value) ? Math.round(value * 10) / 10 : value), yaw: Number.isFinite(state.yaw) ? Math.round(state.yaw * 10) / 10 : null, pitch: Number.isFinite(state.pitch) ? Math.round(state.pitch * 10) / 10 : null } : null,
    vitals: compactVitals(state.vitals),
    weapon: state.weapon ?? null,
    overlay: state.overlay === true,
    paused: state.paused === true,
    loading: state.loading === true,
    pointerLocked: state.pointerLocked === undefined ? snapshot.pointerLocked ?? null : state.pointerLocked,
  };
  const targets = Array.isArray(native.targets) ? native.targets : [];
  if (targets.length) world.targets = targets.slice(0, targetLimit).map(compactTarget);
  if (uiLimit > 0 && isObject(snapshot.ui)) {
    world.ui = {
      observationId: snapshot.ui.observationId ?? null,
      text: clip(String(snapshot.ui.text ?? ''), uiLimit),
      controls: Array.isArray(snapshot.ui.controls) ? snapshot.ui.controls.slice(0, 12).map(control => ({ id: control.id, tag: control.tag, text: clip(String(control.text ?? ''), 80), disabled: !!control.disabled })) : [],
    };
  }
  return world;
}
function compactOutcome(outcome) {
  if (!outcome) return null;
  const out = { kind: outcome.kind ?? null, status: outcome.status ?? null, outcome: outcome.outcome ?? null, reason: clip(outcome.reason ?? null, 300) };
  if (isObject(outcome.progress)) out.progress = outcome.progress;
  if (outcome.cleanupPending) out.cleanupPending = true;
  if(Array.isArray(outcome.evidenceRecords))out.evidenceRecords=outcome.evidenceRecords.filter(e=>e?.source!=='verification-only').slice(0,8);
  return out;
}
function compactPlan(plan) {
  const summary = planSummary(plan);
  if (!summary) return null;
  return { ...summary, steps: summary.steps.slice(0, 8) };
}
function selectMemory(memory, { query = '', limit = 6, goal = null } = {}) {
  if (!memory || limit <= 0) return [];
  const rows = typeof memory.select === 'function' ? memory.select(query, { limit: Math.min(50, Math.max(limit * 3, limit)), goal }) : memory.context(query, Math.min(50, Math.max(limit * 3, limit)));
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (out.length >= limit) break;
    if (row.kind === 'goal' && (goal === null || row.text === goal)) continue;
    const key = String(row.text).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: row.kind, text: clip(row.text, 500), source: clip(row.source ?? null, 80), confidence: row.confidence ?? null, qualification: row.qualification ?? null, evidence: clip(row.evidence ?? null, 160) });
  }
  return out;
}
function render(payload) { return JSON.stringify(payload); }
function navigationContext({ plan, step, lastOutcome, events }) {
  const skills = [...(plan?.steps ?? []).map(item => item.skill ?? item.task?.kind), step?.skill, step?.task?.kind].filter(Boolean);
  if (skills.some(skill => ['goto', 'explore', 'turn', 'look'].includes(skill))) return true;
  const text = [plan?.goal, step?.objective, lastOutcome?.reason, lastOutcome?.kind, lastOutcome?.outcome,
    ...(events ?? []).map(event => `${event.kind ?? ''} ${event.data?.reason ?? ''} ${event.data?.text ?? ''}`)].filter(Boolean).join(' ').toLowerCase();
  return /navigat|explor|route|lost|where am i|movement|move failed|step-failure|stuck|way forward/.test(text);
}

export function createContextBuilder({ mode = 'online', memory, config, searchHandbook = null, now = () => Date.now() } = {}) {
  if (!memory) throw new TypeError('context builder needs memory');
  if (!config?.roles) throw new TypeError('context builder needs a mind config');
  let lastMapImageHash = null;
  function build({ role, snapshot, plan = null, step = null, lastOutcome = null, events = [], evidence = null, memoryQuery = '', handbookQuery = '', includeImage = false, placePicture = null, extra = null } = {}) {
    if (!config.roles[role]) throw new TypeError(`unknown role ${role}`);
    const roleConfig = config.roles[role];
    const goal = plan?.goal ?? memory.snapshot().goal ?? null;
    const payload = {
      schemaVersion: MIND_SCHEMA, mode, bindings:snapshot?.native?.bindings??snapshot?.ui?.bindings??{source:'fallback',reason:'Game bindings unavailable'},
      role,
      persona: { name: memory.persona.name, identity: memory.persona.identity, values: memory.persona.values },
      goal,
      plan: compactPlan(plan),
      memory: selectMemory(memory, { query: memoryQuery || goal || '', limit: role === 'luna' ? 3 : role === 'terra' ? 6 : 8, goal }),
      lastOutcome: compactOutcome(lastOutcome),
    };
    const navigation = role !== 'luna' && placePicture?.path && placePicture?.caption && navigationContext({ plan, step, lastOutcome, events });
    if (navigation) payload.mapPicture = { caption: clip(placePicture.caption, 700) };
    if (role === 'sol') {
      payload.evidence = evidence ?? null;
      payload.recentOutcomes = Array.isArray(extra?.recentOutcomes) ? extra.recentOutcomes.slice(-12).map(compactOutcome) : [];
      payload.metrics = extra?.metrics ?? null;
    } else {
      payload.world = compactWorld(snapshot, { targetLimit: role === 'luna' ? 12 : 8, uiLimit: role === 'luna' ? 1600 : role === 'terra' ? 2400 : 0 });
      payload.player = { mode, account:snapshot?.ui?.account??null, characters:snapshot?.ui?.characters??null, realmReady:snapshot?.ui?.realmReady??false, phase: snapshot?.player?.phase ?? 'unknown', facts: (snapshot?.player?.facts ?? []).slice(0, 10) };
      payload.step = step ? {
        id: step.id, skill: step.skill ?? null, taskKind: step.task?.kind ?? 'intent', task: step.task?.payload ?? step.args ?? null,
        objective: clip(step.objective ?? '', 400), allowedSkills: step.allowedSkills ?? null, maxMs: step.maxMs ?? null,
      } : null;
      payload.workflows = Array.isArray(extra?.workflows) ? extra.workflows.slice(0, 24).map(workflow => ({ id: workflow.id, version: workflow.version, description: clip(workflow.description ?? '', 120), allowedPhases: workflow.allowedPhases, parameterSchema:workflow.parameterSchema, maxMs:workflow.maxMs, successEvidence:clip(workflow.successEvidence??'',200) })) : undefined;
      payload.previousPlans = Array.isArray(extra?.previousPlans) ? extra.previousPlans.slice(-6).map(plan => ({ version: plan.version, goal: plan.goal, status: plan.status, reason: plan.reason ?? null, completedAt: plan.completedAt ?? null })) : undefined;
      payload.events = Array.isArray(events) ? events.slice(-(role === 'luna' ? 8 : 14)).map(event => ({ seq: event.seq ?? null, kind: clip(String(event.kind ?? ''), 60), data: clip(JSON.stringify(event.data ?? {}), role === 'luna' ? 180 : 300) })) : [];
      payload.previousEpoch = extra?.previousEpoch ?? null;
    }
    if (handbookQuery && typeof searchHandbook === 'function') {
      try { payload.handbook = searchHandbook(handbookQuery, { limit: 3, maxChars: role === 'sol' ? 5000 : 3000 }); } catch { payload.handbook = null; }
    } else if (Array.isArray(extra?.handbook) && extra.handbook.length) payload.handbook = extra.handbook.slice(0, 3);
    const imagePath = snapshot?.ui?.screen ?? snapshot?.screen ?? null;
    const images = [];
    let mapImagePath = null;
    if (imagePath && typeof imagePath === 'string') {
      if (roleConfig.images === 'always') images.push(imagePath);
      else if (roleConfig.images === 'ui' && includeImage) images.push(imagePath);
    }
    if (navigation && roleConfig.images !== 'never' && (roleConfig.images === 'always' || includeImage) && placePicture.sha256 !== lastMapImageHash) {
      images.push(placePicture.path);
      mapImagePath = placePicture.path;
    }
    let text = render(payload);
    const limit = roleConfig.contextBytes;
    let truncated = false;
    const reduce = () => {
      truncated = true;
      if (payload.memory?.length > 2) { payload.memory = payload.memory.slice(0, 2); return true; }
      if (payload.workflows?.length > 8) { payload.workflows = payload.workflows.slice(0, 8); return true; }
      if (payload.previousPlans?.length > 3) { payload.previousPlans = payload.previousPlans.slice(-3); return true; }
      if (payload.player?.facts?.length > 4) { payload.player.facts = payload.player.facts.slice(0, 4); return true; }
      if (payload.events?.length > 4) { payload.events = payload.events.slice(-4); return true; }
      if (payload.world?.targets?.length > 4) { payload.world.targets = payload.world.targets.slice(0, 4); return true; }
      if (payload.world?.ui?.text?.length > 200) { payload.world.ui.text = clip(payload.world.ui.text, 200); return true; }
      if (payload.handbook) { delete payload.handbook; return true; }
      if (payload.mapPicture?.caption?.length > 180) { payload.mapPicture.caption = clip(payload.mapPicture.caption, 180); return true; }
      if (payload.mapPicture) { delete payload.mapPicture; if (mapImagePath) images.splice(images.indexOf(mapImagePath), 1); return true; }
      if (payload.workflows?.length) { payload.workflowsOmitted=payload.workflows.length;payload.workflows=[];return true; }
      if (payload.memory?.length) { payload.memory = []; return true; }
      if (payload.events?.length) { payload.events = []; return true; }
      if (payload.world?.targets?.length) { payload.world.targets = []; return true; }
      if (payload.world?.ui) { delete payload.world.ui; return true; }
      if(payload.bindings?.bindings){payload.bindings={source:payload.bindings.source,reason:'Bindings omitted for context limit; read the live bindings in the role prompt'};return true;}
      return false;
    };
    while (Buffer.byteLength(text, 'utf8') > limit && reduce()) text = render(payload);
    if (Buffer.byteLength(text, 'utf8') > limit) {
      // Last resort: shorten the largest free-text fields without dropping the persona or plan.
      payload.lastOutcome = payload.lastOutcome ? { ...payload.lastOutcome, reason: clip(payload.lastOutcome.reason ?? '', 80) } : null;
      payload.memory = (payload.memory ?? []).slice(0, 1).map(row => ({ ...row, text: clip(row.text, 120), evidence: null }));
      if (payload.world?.ui) payload.world.ui.text = clip(payload.world.ui.text ?? '', 80);
      text = render(payload);
    }
    if (mapImagePath && images.includes(mapImagePath)) lastMapImageHash = placePicture.sha256 ?? placePicture.path;
    return { role, text, bytes: Buffer.byteLength(text, 'utf8'), limit, truncated, images, payload };
  }
  function needsPlacePicture({ role, plan = null, step = null, lastOutcome = null, events = [] } = {}) {
    return role !== 'luna' && navigationContext({ plan, step, lastOutcome, events });
  }
  return { build, needsPlacePicture, compactWorld, compactPlan, selectMemory };
}
