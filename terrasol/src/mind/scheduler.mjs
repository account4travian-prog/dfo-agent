// One event scheduler/blackboard for the three decision horizons. Luna may
// choose a bounded intent for a tactical plan step; Terra owns plan versions;
// Sol is asked only for difficult decisions or post-session review. The local
// executor runs a dispatched intent across many polls without asking a model,
// and only terminal evidence or a configured event can wake a tier.
import { createHash, randomUUID } from 'node:crypto';
import { createPlanStore, resolveIntent, planSummary, PlanError } from './plan.mjs';
import { normalizeLunaDecision, normalizeTerraDecision, normalizeSolDecision, LUNA_SCHEMA, TERRA_SCHEMA, SOL_SCHEMA } from '../protocol.mjs';
import { rolePrompt } from '../brain.mjs';
import { normalizeTaskSpec, playerPhase } from './tasks.mjs';
import { makeDecisionPacket } from './packets.mjs';
import { createRepairProposal, normalizeRepairStatus } from './repair.mjs';

const ROLE_SCHEMA = { luna: LUNA_SCHEMA, terra: TERRA_SCHEMA, sol: SOL_SCHEMA };
const hash = text => createHash('sha256').update(text).digest('hex');

const EVENT_LIMIT = 120;
// A look is two full turns (eye level, then the floor), about 15 s live. A model that asks for a 3 s look gets this floor
// instead: the look never moves Rowan, and a cut-short look leaves the place memory without the ground at his feet.
const LOOK_MIN_MS = 20000;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Pure staleness rule shared with tests: a reply may only be applied to the basis it was asked under. */
export function replyStatus({ role, request, snapshot, planVersion, now = Date.now() }) {
  if (!isObject(request)) return { fresh: false, reason: 'missing-request' };
  if (!isObject(request.basis)) return { fresh: false, reason: 'missing-basis' };
  if (!snapshot?.basis) return { fresh: false, reason: 'missing-snapshot' };
  const ttl = request.decisionTtlMs;
  if (!Number.isFinite(now) || !Number.isFinite(request.startedAt) || now - request.startedAt > ttl) return { fresh: false, reason: 'reply-expired' };
  if (request.basis.pageId !== snapshot.basis.pageId) return { fresh: false, reason: 'page-changed' };
  if (request.basis.generation !== snapshot.basis.generation) return { fresh: false, reason: 'generation-changed' };
  if (request.basis.frame !== snapshot.basis.frame) return { fresh: false, reason: 'frame-changed' };
  if (role === 'luna' && request.basis.observationId !== snapshot.observationId) return { fresh: false, reason: 'observation-changed' };
  if (role === 'terra' && request.planVersion !== planVersion) return { fresh: false, reason: 'plan-version-changed' };
  return { fresh: true, reason: null };
}

export function bindUIObservation(task,snapshot,decisionBasis) {
  const current=snapshot?.ui?.observationId, supplied=task?.payload?.uiObservationId;
  if(!current)throw Object.assign(Error('Current UI observation identity is missing'),{code:'ui-observation-unavailable'});
  if(supplied!=null&&String(supplied)!==String(current))throw Object.assign(Error('UI control belongs to a different observation'),{code:'stale-ui-control'});
  if(supplied==null&&decisionBasis?.observationId!==snapshot.observationId)throw Object.assign(Error('UI decision predates the current observation'),{code:'stale-ui-control'});
  return {...task,payload:{...task.payload,uiObservationId:String(current)}};
}

function eventKind(event) {
  const kind = typeof event?.kind === 'string' ? event.kind : typeof event?.type === 'string' ? event.type : 'event';
  return kind.slice(0, 80);
}
function eventData(event) {
  return isObject(event?.data) ? event.data : {};
}
function compactTask(task) {
  if (!task) return null;
  return { id: task.id ?? task.taskId ?? null, requestId: task.requestId ?? null, generation:task.generation??null, frame:task.frame??null, basis:task.basis??null, authority:task.authority??null, startedAt:task.startedAt??null, targetYaw:task.targetYaw??null, kind: task.kind ?? null, status: task.status ?? null, outcome: task.outcome ?? null, reason: task.reason ?? null, cleanupPending: task.cleanupPending === true, progress: task.progress ?? null, evidence: task.evidence ?? null, evidenceRecords: task.evidenceRecords ?? [] };
}

export function createScheduler({
  config, client, router, memory, context, budget, logger = { event() {}, flush() {} },
  clock = () => Date.now(), sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  idFactory = () => randomUUID(), plan = null, planHistory = [], searchHandbook = null,
  onPause = null, onCheckpoint = null, onPlanChange = null, onDecisionPacket = null, onRepairProposal = null,
  session = null, maxCycles = null, sourceRevision = null, readRepairStatus = null, initialRepair = null, placePictureWriter = null,
} = {}) {
  if (!config?.roles) throw new TypeError('scheduler needs a mind config');
  if (!client) throw new TypeError('scheduler needs a control client');
  if (!router) throw new TypeError('scheduler needs a model router');
  if (!memory) throw new TypeError('scheduler needs memory');
  if (!context) throw new TypeError('scheduler needs a context builder');
  if (!budget) throw new TypeError('scheduler needs a budget governor');

  const mode=session?.mode??'online';
  const planStore = createPlanStore({ mode, plan, now: clock, idFactory });
  const cfg = config.scheduler;
  const pollIntervalMs = cfg.pollIntervalMs;
  const state = {
    status: 'idle', paused: false, pauseReason: null, stopRequested: null,
    snapshot: null, capabilities: null, eventCursor: 0, events: [],
    step: null, lastOutcome: null, failures: new Map(),
    inflight: {}, queues: {}, lastStarted: {}, window: {},
    handbook: null, handbookQuery: '', imageRequested: false, recentOutcomes: [],
    lunaDecision: null, solDecision: null, lastTerraDecision: null, lastTerraReason: null,
    completedPlanVersion: null, player: null, workflows: null, playerReady: false,
    planHistory: Array.isArray(planHistory) ? structuredClone(planHistory).slice(-100) : [], lastCompletedPlanKey: null, emptyPlanBoundaries: 0,
    sessionFinished: false, playerUi: false, repair: initialRepair?.proposalId ? {hold:initialRepair.hold === true,status:initialRepair.status ?? null,verified:initialRepair.verified === true,proposalId:String(initialRepair.proposalId)} : { hold: false, status: null, verified: false, proposalId: null }, lastRepairStatusKey: null,
    recentPackets: [], stats: {
      modelCalls: { luna: 0, terra: 0, sol: 0 }, modelErrors: 0, staleReplies: 0, planUpdates: 0, planRejections: 0,
      queued: 0, coalesced: 0, intents: 0, tasks: 0, intentTasks: 0, uiTasks: 0, workflowTasks: 0, plans: 0, polls: 0, fallbacks: 0,
      snapshots: 0, controlErrors: 0, pauses: 0, modelWaitMs: 0, decisionWaitMs: 0, unknownUsageCalls: 0, repairProposals: 0, repairStatuses: 0, attemptedCalls: 0,
    },
  };
  for (const role of Object.keys(config.roles)) { state.queues[role] = null; state.lastStarted[role] = 0; state.window[role] = { start: 0, count: 0 }; }

  const log = (kind, data = {}) => { try { logger.event(kind, {...data,mode}); } catch { /* logging must not break play */ } };
  let placeRevision = null, placePicture = null, placeRead = null, placeWriteRevision = null, placeWrite = null;
  const summary = () => ({
    schemaVersion: 'dfo-mind.v1', mode, status: state.status, paused: state.paused, pauseReason: state.pauseReason,
    plan: planSummary(planStore.snapshot()), lastOutcome: compactTask(state.lastOutcome),
    stats: structuredClone(state.stats), budget: budget.status(), roles: router.snapshot(),
    inflight: Object.fromEntries(Object.entries(state.inflight).map(([role, value]) => [role, value ? value.request.requestId : null])),
    queues: Object.fromEntries(Object.entries(state.queues).map(([role, value]) => [role, value ? value.reason : null])),
    pendingStop: state.stopRequested, player: state.player, playerReady: state.playerReady,
    workflows: state.workflows?.workflows?.map(workflow => ({ id: workflow.id, version: workflow.version, allowedPhases: workflow.allowedPhases })) ?? null,
    planHistory: state.planHistory.slice(-12), plansCompleted: state.planHistory.length,
    lastTerraDecision: state.lastTerraDecision, sessionFinished: state.sessionFinished, repair: state.repair,
    packets: state.recentPackets.slice(-20),
  });

  function checkpoint(reason) {
    try { memory.checkpoint(); } catch (error) { log('mind-checkpoint-error', { reason, error: error.message }); }
    try { onCheckpoint?.(summary(),reason,{plan:planStore.snapshot(), planHistory:state.planHistory, player:state.player, repair:state.repair}); } catch (error) { log('mind-checkpoint-callback-error', { reason, error: error.message }); }
  }
  async function pause(reason, { operator = false } = {}) {
    if (state.paused) return summary();
    state.paused = true;
    state.status = 'paused';
    state.pauseReason = reason;
    state.stats.pauses++;
    await cancelActive(reason);
    log('mind-pause', { reason, operator, stats: state.stats });
    checkpoint(`pause:${reason}`);
    try { onPause?.(reason, summary()); } catch (error) { log('mind-pause-callback-error', { error: error.message }); }
    return summary();
  }
  function resume({ operator = false } = {}) {
    if (!operator) return { ok: false, code: 'operator-required', reason: 'exhaustion and operator stops are never auto-resumed' };
    if (!state.paused && !state.stopRequested) return { ok: true, already: true };
    state.paused = false;
    state.pauseReason = null;
    state.stopRequested = null;
    state.status = 'idle';
    log('mind-resume', { operator: true });
    return { ok: true };
  }
  function requestStop(reason = 'operator-stop', { operator = true } = {}) {
    state.stopRequested = { reason: String(reason).slice(0, 200), operator };
    state.status = 'stopping';
    log('mind-stop-requested', { reason, operator });
  }

  function roleConfig(role) { return config.roles[role]; }
  function budgetPaused() { return budget.paused(); }
  function windowReady(role) {
    const value = roleConfig(role);
    const now = clock();
    if (state.lastStarted[role] && now - state.lastStarted[role] < value.cooldownMs) return false;
    const win = state.window[role];
    if (!win.start || now - win.start >= value.windowMs) { state.window[role] = { start: now, count: 0 }; return true; }
    return win.count < value.maxCallsPerWindow;
  }
  function noteCall(role) {
    const value = roleConfig(role);
    const now = clock();
    const win = state.window[role];
    if (!win.start || now - win.start >= value.windowMs) state.window[role] = { start: now, count: 1 };
    else win.count++;
    state.lastStarted[role] = now;
  }
  function queueRequest(role, reason, { critical = false } = {}) {
    const existing = state.queues[role];
    if (existing && existing.reason === reason) {
      state.stats.coalesced++;
      return { queued: true, coalesced: true };
    }
    state.queues[role] = { reason: String(reason).slice(0, 240), at: clock(), critical: !!critical };
    state.stats.queued++;
    log('escalation-queued', { role, reason });
    return { queued: true, coalesced: false };
  }

  async function readSnapshot({ ui = false, image = false } = {}) {
    let lastError = null;
    for (let attempt = 0; attempt <= cfg.snapshotRetries; attempt++) {
      try {
        const snapshot = await client.snapshot({ ui, image, after: state.eventCursor });
        state.stats.snapshots++;
        if (!snapshot?.basis) throw new Error('snapshot has no basis');
        if(snapshot.native?.ready&&snapshot.native.sessionMode&&snapshot.native.sessionMode!==mode)throw new Error('Snapshot mode mismatch');
        if(snapshot.native?.ready&&snapshot.native.character?.name&&snapshot.native.character.name!=='Rowan')throw new Error(snapshot.native.character.name==='Tiger Fist'?'Tiger Fist belongs to the user and is refused':'Only Rowan may be played');
        return snapshot;
      } catch (error) {
        lastError = error;
        if (error?.code === 'CONTROL_UNAVAILABLE') throw error;
        if (attempt < cfg.snapshotRetries) await sleep(cfg.snapshotRetryDelayMs);
      }
    }
    throw lastError;
  }
  function absorbSnapshot(snapshot) {
    const previous = state.snapshot;
    state.snapshot = snapshot;
    if (snapshot.native?.events?.lines?.length) {
      for (const line of snapshot.native.events.lines) if (Number.isSafeInteger(line?.seq)) state.eventCursor = Math.max(state.eventCursor, line.seq);
    }
    if (previous?.basis && (previous.basis.generation !== snapshot.basis.generation || previous.basis.frame !== snapshot.basis.frame || previous.basis.pageId !== snapshot.basis.pageId)) {
      planStore.markSceneChanged('scene changed');
      state.imageRequested = true;
      recordEvent({ kind: 'scene-change', data: { from: previous.basis, to: snapshot.basis } });
    }
    if (snapshot.ui?.screen) state.imageRequested = true;
    return snapshot;
  }
  function recordEvent(event) {
    const row = { at: clock(), kind: eventKind(event), data: eventData(event) };
    state.events.push(row);
    if (state.events.length > EVENT_LIMIT) state.events.shift();
    log('mind-event', { event: row });
    const plan = planStore.snapshot();
    const reassess = plan?.reassessOn ?? [];
    const kind = row.kind;
    if (['damage', 'death', 'hostile-appeared', 'ui-transition', 'chat', 'scene-change'].includes(kind) && (reassess.includes(kind) || kind === 'death' || kind === 'scene-change')) {
      queueRequest('terra', `event:${kind}`);
    }
    if (kind === 'ui-transition') state.imageRequested = true;
    if (kind === 'scene-change') state.imageRequested = true;
    return row;
  }

  function roleAvailable(role) {
    const info = router.available(role);
    if (!info.ok) { log('tier-unavailable', { role, reason: info.reason }); return { ok: false, reason: info.reason }; }
    return { ok: true };
  }
  function buildRequest(role, reason, picture = null) {
    const snapshot = state.snapshot;
    const plan = planStore.snapshot();
    const roleCfg = roleConfig(role);
    const contextResult = context.build({
      role, snapshot, plan, step: state.step, lastOutcome: state.lastOutcome,
      events: state.events, evidence: role === 'sol' ? { session, plan: planSummary(plan), recentOutcomes: state.recentOutcomes, failures: [...state.failures.entries()], stats: state.stats } : null,
      memoryQuery: plan?.goal ?? memory.snapshot().goal ?? '', handbookQuery: state.handbook ? '' : state.handbookQuery,
      includeImage: roleCfg.images === 'always' || (roleCfg.images === 'ui' && (state.imageRequested || (state.playerReady && playerPhase(snapshot) !== 'world'))),
      placePicture: picture,
      extra: {
        strategy: state.solDecision?.decision?.strategyNote ?? null, previousEpoch: session?.previousEpoch ?? null,
        handbook: state.handbook, recentOutcomes: state.recentOutcomes,
        player: state.player, workflows: state.workflows?.workflows ?? null, previousPlans: state.planHistory.slice(-6),
        metrics: role === 'sol' ? { completedControlTasks: state.recentOutcomes.filter(item => item.outcome === 'completed').length, note: 'Control completion is not verified useful play.' } : null,
      },
    });
    const workflowIds = state.workflows?.workflows?.map(workflow => `${workflow.id}@${workflow.version}`).slice(0, 30) ?? [];
    const prompt = `${rolePrompt(role,mode,snapshot?.native?.bindings??snapshot?.ui?.bindings)}\nReason: ${reason}\nPlayer phase: ${playerPhase(snapshot)}\nAvailable workflows: ${workflowIds.join(', ') || 'none'}\nCurrent plan version: ${planStore.version()}\nCurrent plan: ${JSON.stringify(planSummary(plan))}\n${contextResult.text}`;
    return { role, requestId: idFactory(), reason, basis: { observationId: snapshot.observationId, pageId: snapshot.basis.pageId, generation: snapshot.basis.generation, frame: snapshot.basis.frame }, planVersion: planStore.version(), startedAt: clock(), decisionTtlMs: roleCfg.decisionTtlMs, contextBytes: contextResult.bytes, contextLimit: contextResult.limit, images: contextResult.images, prompt, schema: ROLE_SCHEMA[role], schemaId: `${role}-v1`, truncated: contextResult.truncated };
  }

  async function navigationPicture(role) {
    if (!['terra','sol'].includes(role) || !placePictureWriter || state.capabilities?.place !== true) return null;
    const plan = planStore.snapshot();
    if (!context.needsPlacePicture({ role, plan, step: state.step, lastOutcome: state.lastOutcome, events: state.events })) return null;
    try {
      const read = placeRead ??= client.place().finally(()=>{placeRead=null;});
      const current = await read;
      if (!current?.available || typeof current.revision !== 'string' || !current.revision) return null;
      if (current.revision === placeRevision) return placePicture;
      if (current.revision === placeWriteRevision) return await placeWrite;
      placeWriteRevision=current.revision;
      placeWrite=placePictureWriter.write(current.place, current.automap ?? null, current.edges ?? []);
      let rendered;
      try { rendered=await placeWrite; }
      finally { placeWrite=null;placeWriteRevision=null; }
      placeRevision = current.revision;
      placePicture = rendered;
      return rendered;
    } catch (error) {
      log('place-map-unavailable', { reason: error.message });
      return null;
    }
  }

  function applyReply(role, request, result) {
    const status = replyStatus({ role, request, snapshot: state.snapshot, planVersion: planStore.version(), now: clock() });
    if (!status.fresh) {
      state.stats.staleReplies++;
      log('tier-reply-rejected', { role, requestId: request.requestId, reason: status.reason, planVersion: planStore.version() });
      return { ok: false, code: 'stale', reason: status.reason };
    }
    if (!result?.ok) {
      state.stats.modelErrors++;
      log('tier-error', { role, requestId: request.requestId, code: result?.code ?? 'unknown', reason: result?.reason ?? null });
      if (result?.code === 'usage-limit') { pauseSync('budget-exhausted:usage-limit', { operator: false }); }
      return { ok: false, code: result?.code ?? 'model-error', reason: result?.reason ?? null };
    }
    const reply = result.json;
    try {
      if (role === 'terra') {
        const normalized = normalizeTerraDecision(reply, { currentVersion: planStore.version(), snapshot: state.snapshot, catalogue: state.workflows, capabilities: state.capabilities });
        const applied = planStore.apply(normalized.update, { snapshot: state.snapshot, at: clock() });
        if (!applied.ok) {
          state.stats.planRejections++;
          log('plan-rejected', { reason: applied.reason, code: applied.code, baseVersion: normalized.update.baseVersion });
          return { ok: false, code: applied.code ?? 'plan-rejected', reason: applied.reason };
        }
        state.stats.planUpdates++;
        state.failures.clear();
        state.lastTerraReason = request.reason;
        state.completedPlanVersion = applied.plan.status === 'complete' ? applied.version : null;
        state.lastTerraDecision = { sessionComplete: normalized.sessionComplete === true, confidence: normalized.confidence, goal: normalized.goal, version: applied.version, reason: normalized.update.reason ?? request.reason };
        if (normalized.goal) memory.setGoal(normalized.goal);
        if (normalized.memory) memory.remember({ text: normalized.memory, kind: 'uncertain', source: 'terra', confidence: normalized.confidence ?? undefined, evidence: `${session?.run ?? 'run'} plan v${applied.version}` });
        if (normalized.handbookQuery) { state.handbookQuery = normalized.handbookQuery; if (typeof searchHandbook === 'function') state.handbook = searchHandbook(normalized.handbookQuery, { limit: 3, maxChars: 3000 }); }
        state.queues.terra = null;
        log('plan-update', { version: applied.version, baseVersion: normalized.update.baseVersion, status: applied.plan.status, sessionComplete: normalized.sessionComplete === true, confidence: normalized.confidence, steps: applied.plan.steps.map(step => `${step.id}:${step.task?.kind ?? step.skill}`), goal: applied.plan.goal });
        try { onPlanChange?.(applied.plan, normalized); } catch (error) { log('mind-plan-callback-error', { error: error.message }); }
        checkpoint('plan-update');
        return { ok: true, version: applied.version, plan: applied.plan, sessionComplete: normalized.sessionComplete === true, confidence: normalized.confidence };
      }
      if (role === 'luna') {
        const decision = normalizeLunaDecision(reply, { targets: state.snapshot?.native?.targets ?? [], catalogue: state.workflows, capabilities: state.capabilities, snapshot: state.snapshot });
        state.lunaDecision = { decision, requestId: request.requestId, reason: request.reason };
        if (decision.note) memory.remember({ text: decision.memory || decision.note, kind: 'uncertain', source: 'luna', confidence: decision.confidence ?? undefined, evidence: `${session?.run ?? 'run'} obs ${request.basis.observationId}` });
        if (decision.handbookQuery) { state.handbookQuery = decision.handbookQuery; if (typeof searchHandbook === 'function') state.handbook = searchHandbook(decision.handbookQuery, { limit: 3, maxChars: 3000 }); }
        if (decision.escalate) queueRequest('terra', `luna-escalation:${decision.note}`.slice(0, 200));
        log('luna-decision', { requestId: request.requestId, kind: decision.task.kind, taskKind: decision.task.kind, note: decision.note });
        return { ok: true, decision, basis:request.basis, requestId:request.requestId };
      }
      if (role === 'sol') {
        const decision = normalizeSolDecision(reply);
        state.solDecision = { decision, requestId: request.requestId, at: clock() };
        if (decision.memory) memory.remember({ text: decision.memory, kind: 'uncertain', source: 'sol', confidence: decision.confidence ?? undefined, evidence: `${session?.run ?? 'run'} sol review` });
        if (decision.engineering) {
          const proposal = createRepairProposal({ engineering: decision.engineering, sourceRevision: sourceRevision ?? session?.sourceRevision ?? null, failurePacketRefs: state.recentPackets.slice(-6), session, clock });
          state.repair.proposalId = proposal.proposalId;
          state.stats.repairProposals++;
          log('repair-proposal', { proposal, note: 'queued for external executor; never executed in the playing process' });
          try { onRepairProposal?.(proposal); } catch (error) { log('repair-proposal-callback-error', { error: error.message }); }
        }
        log('sol-decision', { requestId: request.requestId, hasReview: !!decision.review, hasEngineering: !!decision.engineering, strategyNote: decision.strategyNote, confidence: decision.confidence });
        return { ok: true, decision };
      }
      return { ok: false, code: 'unknown-role' };
    } catch (error) {
      state.stats.modelErrors++;
      log('tier-reply-invalid', { role, requestId: request.requestId, error: error.message });
      return { ok: false, code: 'invalid-reply', reason: error.message };
    }
  }
  function pauseSync(reason) {
    // Budget/usage fatal transitions only; never resumes by itself.
    if (state.paused) return;
    state.paused = true; state.status = 'paused'; state.pauseReason = reason; state.stats.pauses++;
    log('mind-pause', { reason, operator: false, stats: state.stats });
    checkpoint(`pause:${reason}`);
    try { onPause?.(reason, summary()); } catch (error) { log('mind-pause-callback-error', { error: error.message }); }
  }

  function startTier(role, request) {
    noteCall(role);
    state.stats.modelCalls[role]++;
    log('model-request', { role, tier: role, model: roleConfig(role).model, schemaVersion: 'dfo-mind.v1', requestId: request.requestId, basis: request.basis, planVersion: request.planVersion, reason: request.reason, contextBytes: request.contextBytes, contextLimit: request.contextLimit, images: request.images.length, promptBytes: Buffer.byteLength(request.prompt, 'utf8'), promptHash: hash(request.prompt) });
    const promise = (async () => {
      state.stats.attemptedCalls++;
      const result = await router.call({ role, requestId: request.requestId, basis: request.basis, prompt: request.prompt, images: request.images, schema: request.schema, signal: state.signal ?? null });
      if (Number.isFinite(result?.ms)) { state.stats.modelWaitMs += result.ms; state.stats.decisionWaitMs += result.ms; }
      if (result?.ok) {
        log('model-response', { role, tier: role, model: result.model, requestId: request.requestId, ms: result.ms, usage: result.usage, schemaVersion: 'dfo-mind.v1', planVersion: request.planVersion });
      } else if (!result?.usage) state.stats.unknownUsageCalls++;
      try {
        const packet = makeDecisionPacket({
          packetId: request.requestId, role, model: result?.model ?? roleConfig(role).model, sourceRevision: sourceRevision ?? session?.sourceRevision ?? null,
          basis: request.basis, planVersion: request.planVersion, reason: request.reason, schemaId: request.schemaId,
          prompt: request.prompt, reply: result?.json ?? null, usage: result?.usage ?? null, ms: result?.ms ?? null,
          complete: result?.ok === true, omitted: result?.ok ? [] : ['model-error'], images: request.images,
        });
        state.recentPackets.push(packet.packetId);
        if (state.recentPackets.length > 50) state.recentPackets.shift();
        log('decision-packet', { packet: { packetId: packet.packetId, role: packet.role, model: packet.model, planVersion: packet.planVersion, usageKnown: packet.usageKnown, complete: packet.complete, omitted: packet.omitted } });
        try { onDecisionPacket?.(packet); } catch (error) { log('decision-packet-callback-error', { error: error.message }); }
      } catch (error) {
        log('decision-packet-error', { requestId: request.requestId, error: error.message });
      }
      if (budgetPaused()) pauseSync(budget.pauseReason() ?? 'budget-exhausted');
      return result;
    })().catch(error => ({ ok: false, code: 'model-error', reason: error?.message ?? String(error) })).then(result => {
      if (state.paused || state.stopRequested) return { ok: false, code: 'paused', reason: state.pauseReason ?? state.stopRequested?.reason ?? 'paused' };
      return applyReply(role, request, result);
    }).finally(() => {
      if (state.inflight[role]?.promise === promise) delete state.inflight[role];
      const queued = state.queues[role];
      if (queued && !state.paused && !state.stopRequested && windowReady(role)) {
        state.queues[role] = null;
        const preparing=(async()=>startTier(role,buildRequest(role,queued.reason,await navigationPicture(role))))();
        state.inflight[role]={request:null,promise:preparing};
        void preparing.catch(error=>log('place-map-unavailable',{reason:error.message}));
      } else if (queued && !state.paused && !state.stopRequested) {
        log('escalation-deferred', { role, reason: queued.reason });
      }
    });
    state.inflight[role] = { request, promise };
    return promise;
  }

  async function requestTier(role, reason, { awaitReply = true, critical = false } = {}) {
    if (state.paused || state.stopRequested) return { ok: false, code: 'paused', reason: state.pauseReason ?? state.stopRequested?.reason };
    const available = roleAvailable(role);
    if (!available.ok) return { ok: false, code: 'unavailable', reason: available.reason };
    if (state.inflight[role]) {
      queueRequest(role, reason, { critical });
      if (!awaitReply) return { ok: false, code: 'queued' };
      return { ok: false, code: 'busy', reason: `${role} already has a request in flight` };
    }
    if (!critical && !windowReady(role)) {
      queueRequest(role, reason, { critical });
      return { ok: false, code: 'cooldown', reason: `role ${role} is cooling down` };
    }
    const picture = await navigationPicture(role);
    if (state.inflight[role]) {
      queueRequest(role, reason, { critical });
      return awaitReply ? { ok: false, code: 'busy', reason: `${role} already has a request in flight` } : { ok: false, code: 'queued' };
    }
    const request = buildRequest(role, reason, picture);
    const promise = startTier(role, request);
    state.inflight[role] = { request, promise };
    if (!awaitReply) return { ok: true, pending: true, requestId: request.requestId };
    const result = await promise;
    // One corrective retry: a reply the validator refuses goes back to the same role with the reason in its prompt
    // instead of holding the session (live 2026-10-29: a wrong schemaVersion and a doubled Luna action each held a run).
    if (result?.code === 'invalid-reply' && !reason.startsWith('rejected-reply:')) {
      log('tier-reply-retry', { role, requestId: request.requestId, error: result.reason });
      return requestTier(role, `rejected-reply: ${result.reason} (was: ${reason})`.slice(0, 300), { awaitReply, critical: true });
    }
    return result;
  }

  async function requestTerra(reason, options = {}) {
    const result = await requestTier('terra', reason, options);
    if (result.ok) return result;
    if (result.code === 'unavailable') return result;
    if (result.code === 'paused') return result;
    return result;
  }
  async function requestLuna(reason) {
    const result = await requestTier('luna', reason, { awaitReply: true });
    if (!result.ok) return result;
    return result;
  }
  async function requestSol(reason) {
    return requestTier('sol', reason, { awaitReply: false });
  }

  async function executeIntent({ intent, basis, authority, signal }) {
    const requestId = idFactory();
    const maxMs = Math.max(Math.min(Number.isFinite(intent.maxMs) ? intent.maxMs : intent.kind==='explore'?90000:30000, 90000), intent.kind==='look'?LOOK_MIN_MS:0);
    if (intent.kind==='look') intent = { ...intent, maxMs };
    const started = clock();
    let pollFailures = 0;
    try {
      const target=intent.target;
      const observedTarget=!!target&&(target.targetId!=null||target.kind!=null||target.type!=null);
      const accepted=await client.startIntent({requestId,basis,authority,intent,observedTarget});
      state.stats.intents++;
      state.activeTask={requestId,kind:intent.kind,startedAt:clock(),task:accepted.task};
      while (true) {
        if (state.stopRequested || state.paused || signal?.aborted) {
          try { await client.cancelIntent(requestId, state.pauseReason ?? state.stopRequested?.reason ?? 'aborted'); } catch (error) { log('mind-cancel-error', { requestId, error: error.message }); }
          state.activeTask = null;
          return { status: 'terminal', outcome: 'cancelled', reason: state.pauseReason ?? state.stopRequested?.reason ?? 'aborted', requestId };
        }
        if (clock() - started > maxMs) {
          try { await client.cancelIntent(requestId, 'local execution deadline'); } catch (error) { log('mind-cancel-error', { requestId, error: error.message }); }
          state.activeTask = null;
          return { status: 'terminal', outcome: 'expired', reason: 'local execution deadline', requestId };
        }
        let poll;
        try {
          poll = await client.pollIntent(requestId);
          pollFailures = 0;
        } catch (error) {
          pollFailures++;
          state.stats.controlErrors++;
          log('mind-poll-error', { requestId, attempt: pollFailures, error: error.message, code: error.code });
          if (pollFailures > 3) {
            try { await client.cancelIntent(requestId, 'poll failed'); } catch {}
            state.activeTask = null;
            return { status: 'terminal', outcome: 'failed', reason: `driver polling failed: ${error.message}`, requestId, cleanupPending: true };
          }
          await sleep(Math.min(1000, pollIntervalMs * pollFailures));
          continue;
        }
        state.stats.polls++;
        for (const event of poll.events ?? []) recordEvent(event);
        if (!poll.task) {
          try { await client.cancelIntent(requestId, 'task disappeared'); } catch {}
          state.activeTask = null;
          return { status: 'terminal', outcome: 'failed', reason: 'driver task disappeared', requestId, cleanupPending: true };
        }
        if (poll.task.status === 'terminal') {
          state.activeTask = null;
          return { ...poll.task, requestId };
        }
        await sleep(pollIntervalMs);
      }
    } catch (error) {
      state.activeTask = null;
      if (error?.code === 'CONTROL_UNAVAILABLE') throw error;
      const stale = error?.status === 409;
      return { status: 'terminal', outcome: stale ? 'blocked' : 'failed', reason: `intent dispatch ${stale ? 'rejected' : 'failed'}: ${error.message}`, requestId, cleanupPending: stale ? false : true };
    }
  }

  function taskForStep(step, snapshot) {
    let task;
    if (step.task) task = normalizeTaskSpec(step.task, { catalogue: state.workflows, capabilities: state.capabilities, snapshot });
    else {
      const resolved = resolveIntent(step, snapshot, planStore.snapshot());
      task = { kind: 'intent', payload: { ...resolved.intent, observedTarget: resolved.observedTarget } };
    }
    if (task.kind === 'intent') {
      const payload = task.payload;
      if (!payload.target && (payload.targetRef || (Number.isFinite(payload.x) && Number.isFinite(payload.z)) || payload.targetIndex !== undefined)) {
        const resolved = resolveIntent({ skill: payload.kind, args: payload }, snapshot, planStore.snapshot());
        task = { kind: 'intent', payload: { ...resolved.intent, observedTarget: resolved.observedTarget } };
      }
    }
    if (step.maxMs && task.kind !== 'workflow') task.payload.maxMs = Math.min(step.maxMs, 90000);
    return task;
  }

  function taskAllowed(step, task) {
    if (step.skill !== 'tactical') return true;
    if (task.kind === 'intent') return Array.isArray(step.allowedSkills) && step.allowedSkills.includes(task.payload.kind);
    if (task.kind === 'ui') return Array.isArray(step.allowedTasks) ? step.allowedTasks.includes('ui') : false;
    if (task.kind === 'workflow') {
      const allowedKind = Array.isArray(step.allowedTasks) ? step.allowedTasks.includes('workflow') : false;
      const allowedFlow = !Array.isArray(step.allowedWorkflows) || step.allowedWorkflows.includes(task.payload.workflowId);
      return allowedKind && allowedFlow;
    }
    return false;
  }

  async function executeTask({ task, basis, authority, signal }) {
    const requestId = idFactory();
    const look = task.kind === 'intent' && task.payload?.kind === 'look';
    const maxMs = Math.max(Math.min(Number.isFinite(task.payload?.maxMs) ? task.payload.maxMs : task.kind === 'workflow' ? 60000 : task.payload?.kind === 'explore' ? 90000 : 30000, 120000), look ? LOOK_MIN_MS : 0);
    if (look) task = { ...task, payload: { ...task.payload, maxMs } };
    const started = clock();
    let pollFailures = 0;
    const playerEndpoint = state.playerReady && state.capabilities?.tasks === true;
    const startRequest = playerEndpoint ? client.startTask : client.startIntent;
    const pollRequest = playerEndpoint ? client.pollTask : client.pollIntent;
    const cancelRequest = playerEndpoint ? client.cancelTask : client.cancelIntent;
    try {
      const accepted = playerEndpoint
        ? await startRequest({ requestId, basis, authority, task })
        : await startRequest({ requestId, basis, authority, intent: task.payload, observedTarget: task.payload?.observedTarget === true });
      state.stats.tasks++;
      if (task.kind === 'intent') state.stats.intentTasks++;
      else if (task.kind === 'ui') state.stats.uiTasks++;
      else state.stats.workflowTasks++;
      state.activeTask = { requestId, kind: task.kind, startedAt: clock(), task: accepted.task };
      while (true) {
        await pollRepairStatus();
        if (state.repair.hold) {
          if(state.activeTask)await cancelActive('repair-hold');
          state.activeTask = null;
          return { status: 'terminal', outcome: 'interrupted', reason: 'repair-hold', requestId, taskKind: task.kind, repairHold: true };
        }
        if (state.stopRequested || state.paused || signal?.aborted) {
          try { await cancelRequest(requestId, state.pauseReason ?? state.stopRequested?.reason ?? 'aborted'); } catch (error) { log('mind-cancel-error', { requestId, error: error.message }); }
          state.activeTask = null;
          return { status: 'terminal', outcome: 'cancelled', reason: state.pauseReason ?? state.stopRequested?.reason ?? 'aborted', requestId, taskKind: task.kind };
        }
        if (clock() - started > maxMs) {
          try { await cancelRequest(requestId, 'local execution deadline'); } catch (error) { log('mind-cancel-error', { requestId, error: error.message }); }
          state.activeTask = null;
          return { status: 'terminal', outcome: 'expired', reason: 'local execution deadline', requestId, taskKind: task.kind };
        }
        let poll;
        try { poll = await pollRequest(requestId); pollFailures = 0; }
        catch (error) {
          pollFailures++;
          state.stats.controlErrors++;
          log('mind-poll-error', { requestId, attempt: pollFailures, error: error.message, code: error.code });
          if (pollFailures > 3) {
            try { await cancelRequest(requestId, 'poll failed'); } catch {}
            state.activeTask = null;
            return { status: 'terminal', outcome: 'failed', reason: `driver polling failed: ${error.message}`, requestId, cleanupPending: true, taskKind: task.kind };
          }
          await sleep(Math.min(1000, pollIntervalMs * pollFailures));
          continue;
        }
        state.stats.polls++;
        for (const event of poll.events ?? []) recordEvent(event);
        if (!poll.task) {
          try { await cancelRequest(requestId, 'task disappeared'); } catch {}
          state.activeTask = null;
          return { status: 'terminal', outcome: 'failed', reason: 'driver task disappeared', requestId, cleanupPending: true, taskKind: task.kind };
        }
        if (poll.task.status === 'terminal') {
          state.activeTask = null;
          return { ...poll.task, requestId, taskKind: task.kind };
        }
        await sleep(pollIntervalMs);
      }
    } catch (error) {
      state.activeTask = null;
      if (error?.code === 'CONTROL_UNAVAILABLE') throw error;
      const stale = error?.status === 409;
      return { status: 'terminal', outcome: stale ? 'blocked' : 'failed', reason: `task dispatch ${stale ? 'rejected' : 'failed'}: ${error.message}`, requestId, cleanupPending: stale ? false : true, taskKind: task.kind };
    }
  }

  async function runStep(step, snapshot, signal) {
    if (!snapshot.ui && (step.task?.kind === 'ui' || step.task?.kind === 'workflow' || (step.skill === 'tactical' && step.allowedTasks?.includes('ui')))) {
      try { snapshot=absorbSnapshot(await readSnapshot({ui:true,image:false})); } catch (error) { return {ok:false,code:'ui-observation-unavailable',reason:error.message}; }
    }
    if (state.paused || state.stopRequested) return { ok: false, code: 'paused' };
    planStore.markRunning(step.id);
    state.step = step;
    state.imageRequested = step.skill === 'use' || step.skill === 'tactical' || step.task?.kind === 'ui' || step.task?.kind === 'workflow' ? true : state.imageRequested;
    let task;
    let decisionUsed = null;
    if (step.skill === 'tactical') {
      const luna = await requestLuna(`tactical-step:${step.id}`);
      if (luna.ok) {
        const decision = luna.decision;
        if (taskAllowed(step, decision.task)) { task = decision.task; decisionUsed = luna; }
        else log('luna-decision-rejected', { stepId: step.id, kind: decision.task.kind, allowedSkills: step.allowedSkills, allowedTasks: step.allowedTasks ?? null });
      }
      if (!task && step.fallbackTask) {
        state.stats.fallbacks++;
        log('tier-fallback', { role: 'luna', stepId: step.id, fallback: step.fallbackTask.kind });
        task = normalizeTaskSpec(step.fallbackTask, { catalogue: state.workflows, capabilities: state.capabilities, snapshot });
      } else if (!task && step.fallbackIntent) {
        state.stats.fallbacks++;
        log('tier-fallback', { role: 'luna', stepId: step.id, fallback: step.fallbackIntent.kind });
        const resolved = resolveIntent({ skill: step.fallbackIntent.kind, args: step.fallbackIntent }, snapshot, planStore.snapshot());
        task = { kind: 'intent', payload: { ...resolved.intent, observedTarget: resolved.observedTarget } };
      }
      // Only a Luna the router cannot reach holds the session. A Luna that answered but chose nothing usable is a failed
      // step for Terra to replan (live 2026-10-29: two empty choices held a session as "tier-unavailable").
      if (!task && (luna.ok || ['invalid-reply', 'model-error'].includes(luna.code))) return { ok: false, code: 'no-choice', reason: luna.ok ? 'Luna chose a task the step does not allow' : `Luna gave no usable choice: ${luna.reason ?? luna.code}` };
      if (!task) return { ok: false, code: 'tier-unavailable', reason: 'Luna is unavailable and the tactical step has no fallback' };
    } else {
      try { task = taskForStep(step, snapshot); }
      catch (error) {
        log('task-selection-error', { stepId: step.id, code: error?.code ?? 'task-error', reason: error.message });
        if (error instanceof PlanError) return { ok: false, code: error.code, reason: error.message, planError: true };
        return { ok: false, code: error?.code ?? 'task-error', reason: error.message, planError: true };
      }
    }
    try { task = normalizeTaskSpec(task, { catalogue: state.workflows, capabilities: state.capabilities, snapshot }); }
    catch (error) { return { ok: false, code: 'task-unsupported', reason: error.message, taskError: true }; }
    if (task.kind === 'ui') {try { task=bindUIObservation(task,snapshot,decisionUsed?.basis??planStore.snapshot()?.basis); } catch(error) {return {ok:false,code:error.code??'stale-ui-control',reason:error.message,planError:true};}}
    if (task.kind === 'ui' && !task.payload.uiObservationId) return {ok:false,code:'ui-observation-unavailable',reason:'Current UI observation identity is missing'};
    if (task.kind === 'intent' && snapshot.native?.ready !== true) return { ok: false, code: 'native-unavailable', reason: 'native world is unavailable for an intent task' };
    if (task.kind !== 'intent' && !state.playerReady) return { ok: false, code: 'player-unavailable', reason: 'driver does not advertise player UI/workflow tasks' };
    const plan = planStore.snapshot();
    const authority = { planId: plan.planId, planVersion: plan.version, stepId: step.id };
    log('task-dispatch', { stepId: step.id, taskKind: task.kind, task: task.payload, planVersion: plan.version, requestBasis: snapshot.observationId, authority, decision: decisionUsed ? { requestId: decisionUsed.requestId } : null });
    if (task.kind === 'intent') log('intent-dispatch', { stepId: step.id, kind: task.payload.kind, planVersion: plan.version, requestBasis: snapshot.observationId, authority });
    if (state.paused || state.stopRequested) return { ok: false, code: 'paused', reason: state.pauseReason ?? state.stopRequested?.reason };
    const outcome = await executeTask({ task, basis: { observationId: snapshot.observationId, pageId: snapshot.basis.pageId, generation: snapshot.basis.generation, frame: snapshot.basis.frame }, authority, signal });
    state.lastOutcome = outcome;
    state.recentOutcomes.push(compactTask(outcome));
    if (state.recentOutcomes.length > 20) state.recentOutcomes.shift();
    log(task.kind === 'intent' ? 'intent-outcome' : 'task-outcome', { task: { ...compactTask(outcome), taskKind: task.kind }, stepId: step.id, taskKind: task.kind, authority });
    if(outcome.reconciliationRequired){
      if(outcome.cleanupPending){await pause('unverified-cleanup',{operator:true});return {ok:false,code:'paused'};}
      let fresh;try{fresh=absorbSnapshot(await readSnapshot({ui:true,image:false}));}catch(error){await pause('ui-reconciliation-observation-failed',{operator:true});return {ok:false,code:'paused'};}
      const decision=await requestTerra('ui-effect-unknown: inspect the fresh UI and make a new plan; the uncertain side effect must not be repeated',{awaitReply:true,critical:true});
      if(!decision.ok||state.paused||state.stopRequested||budgetPaused()){await pause('ui-reconciliation-decision-unavailable',{operator:true});return {ok:false,code:'paused'};}
      const next=planStore.snapshot(),nextStep=planStore.nextStep();
      if(!next||!nextStep){await pause('ui-reconciliation-no-plan',{operator:true});return {ok:false,code:'paused'};}
      try {const resolution=await client.reconcileTask({requestId:outcome.requestId,basis:{observationId:fresh.observationId,...fresh.basis},authority:{planId:next.planId,planVersion:next.version,stepId:nextStep.id},reason:'New model plan after observing the unknown UI effect; continue only with safe actions'});log('ui-effect-reconciled',{requestId:outcome.requestId,resolution});return {ok:false,code:'ui-reconciled'};}
      catch(error){await pause('ui-reconciliation-failed',{operator:true});return {ok:false,code:'paused',reason:error.message};}
    }
    if (outcome.repairHold) {
      planStore.resetStep(step.id);
      return { ok: false, code: 'repair-hold', reason: 'repair hold interrupted the step' };
    }
    const marked = planStore.markStep(step.id, outcome.outcome);
    if (outcome.cleanupPending) return { ok: false, code: 'cleanup-pending', reason: 'physical input cleanup unverified', outcome };
    if (outcome.outcome === 'cancelled') return { ok: false, code: 'cancelled', outcome };
    if (outcome.outcome === 'completed' || outcome.outcome === 'cleared') {
      state.failures.delete(step.id);
      state.imageRequested = false;
      checkpoint(`step:${step.id}`);
      return { ok: true, outcome, marked };
    }
    const failures = (state.failures.get(step.id) ?? 0) + 1;
    state.failures.set(step.id, failures);
    log('step-failure', { stepId: step.id, failures, outcome: outcome.outcome, reason: outcome.reason ?? null });
    if (failures <= cfg.localRetries && step.onFailure !== 'escalate') {
      planStore.resetStep(step.id);
      log('local-retry', { stepId: step.id, attempt: failures });
      checkpoint(`retry:${step.id}`);
      return { ok: false, code: 'retry', failures, outcome };
    }
    return { ok: false, code: 'escalate', failures, outcome };
  }

  async function handleStepFailure(step, failure, signal) {
    if (failure.code === 'repair-hold') return { status: 'wait', repairHold: true };
    if (failure.code === 'cleanup-pending') return pause('cleanup-pending', { operator: true });
    if (failure.code === 'tier-unavailable') return pause('tier-unavailable:luna', { operator: false });
    if (failure.code === 'cancelled') return pause(state.stopRequested?.reason ?? state.pauseReason ?? 'cancelled', { operator: true });
    const reason = failure.code === 'escalate' ? `repeated-failure:${step.id}:${failure.outcome?.outcome ?? 'unknown'}` : `step-failure:${step.id}:${failure.reason ?? failure.code}`;
    const result = await requestTerra(reason, { awaitReply: true, critical: true });
    if (!result.ok) {
      if (result.code === 'unavailable') return pause('tier-unavailable:terra', { operator: false });
      if (result.code === 'paused' || budgetPaused()) return pause(budget.pauseReason() ?? 'budget-exhausted', { operator: false });
      return pause(`unresolved-step-failure:${result.code}`, { operator: true });
    }
    state.failures.clear();
    return { ok: true, replanned: true };
  }

  async function finishSession(reason) {
    if (cfg.reviewAtSessionEnd && router.available('sol').ok) {
      await requestTier('sol', 'session-review', { awaitReply: true, critical: true });
    }
    state.sessionFinished = true;
    return { paused: true, summary: await pause(reason, { operator: true }) };
  }

  async function continueAfterPlan(completedPlan) {
    const completedKey = `${completedPlan.planId}:${completedPlan.version}`;
    if (state.lastCompletedPlanKey !== completedKey) {
      state.lastCompletedPlanKey = completedKey;
      state.planHistory.push({ ...planSummary(completedPlan), completedAt: new Date(clock()).toISOString() });
      if (state.planHistory.length > 100) state.planHistory.shift();
      state.stats.plans = state.planHistory.length;
      log('plan-completed', { version: completedPlan.version, goal: completedPlan.goal, plansCompleted: state.planHistory.length });
    }
    checkpoint('plan-completed');
    if (!cfg.continueAfterPlan) {
      if (router.available('sol').ok && cfg.requestSolReviewOnComplete) await requestTier('sol', 'session-review', { awaitReply: true, critical: true });
      return { paused: true, summary: await pause('session-complete', { operator: true }) };
    }
    for (let attempt = 0; attempt < cfg.maxEmptyPlanBoundaries; attempt++) {
      if(state.playerReady){try{absorbSnapshot(await readSnapshot({ui:true,image:false}));}catch(error){return {paused:true,summary:await pause('ui-observation-unavailable',{operator:false})};}}
      state.lastTerraDecision = null;
      const result = await requestTerra('next-plan', { awaitReply: true, critical: true });
      if (!result.ok) {
        if (result.code === 'unavailable') return { paused: true, summary: await pause('tier-unavailable:terra', { operator: false }) };
        if (result.code === 'paused' || budgetPaused()) return { paused: true, summary: await pause(budget.pauseReason() ?? 'budget-exhausted', { operator: false }) };
        return { paused: true, summary: await pause(`planning-failed:${result.code}`, { operator: false }) };
      }
      const plan = planStore.snapshot();
      if (state.lastTerraDecision?.sessionComplete === true) return finishSession('session-finished');
      if (plan && plan.status === 'active') { state.emptyPlanBoundaries = 0; return { paused: false }; }
      state.emptyPlanBoundaries++;
      log('empty-plan-boundary', { attempt: attempt + 1, max: cfg.maxEmptyPlanBoundaries, goal: state.lastTerraDecision?.goal ?? null });
    }
    return finishSession('planning-exhausted');
  }

  async function stepOnce(signal) {
    if (state.paused || state.stopRequested) return { status: 'paused' };
    if (!state.capabilities) {
      try { state.capabilities = await client.ensureAvailable(); }
      catch (error) { state.stats.controlErrors++; log('mind-control-unavailable', { reason: error.message, details: error.details ?? null }); return pause('control-unavailable', { operator: false }); }
      state.playerReady = state.capabilities.playerReady === true;
      if (state.playerReady) {
        try { state.workflows = await client.workflowCatalogue({ refresh: true }); }
        catch (error) { state.playerReady = false; log('mind-workflows-unavailable', { error: error.message }); }
      }
      log('mind-control-ready', { contractVersion: state.capabilities.contractVersion, playerContractVersion: state.capabilities.playerContractVersion, playerReady: state.playerReady, intents: state.capabilities.intents, snapshot: state.capabilities.snapshot, requestFencing: state.capabilities.requestFencing, uiActions: state.capabilities.uiActions, workflows: state.workflows?.workflows?.length ?? 0 });
    }
    let snapshot;
    try { snapshot = absorbSnapshot(await readSnapshot({ ui: state.imageRequested || (state.playerReady && state.playerUi), image: state.imageRequested })); }
    catch (error) {
      state.stats.controlErrors++;
      log('mind-snapshot-error', { error: error.message, code: error.code ?? null });
      if (error?.code === 'CONTROL_UNAVAILABLE') return pause('control-unavailable', { operator: false });
      return pause('snapshot-unavailable', { operator: false });
    }
    state.player = snapshot.player ?? { phase: 'unknown', facts: [] };
    const phase = playerPhase(snapshot);
    log('observation', { id: snapshot.observationId, observationId: snapshot.observationId, generation: snapshot.basis.generation, frame: snapshot.basis.frame, player: state.player, nativeReady: snapshot.native?.ready === true, hasUi: !!snapshot.ui });
    state.playerUi = state.playerReady && phase !== 'world';
    if (state.playerUi && !snapshot.ui) {
      try { snapshot = absorbSnapshot(await readSnapshot({ ui: true, image: state.imageRequested })); state.player = snapshot.player ?? state.player; }
      catch (error) { log('mind-ui-snapshot-error', { error: error.message }); }
    }
    if (snapshot.native?.loading || snapshot.native?.paused) {
      log('mind-world-busy', { loading: !!snapshot.native?.loading, paused: !!snapshot.native?.paused, phase });
      return { status: 'wait' };
    }
    if (snapshot.native?.ready !== true && !state.playerReady) {
      if (phase === 'loading') return { status: 'wait' };
      return pause('native-unavailable', { operator: false });
    }
    if (budgetPaused()) return pause(budget.pauseReason() ?? 'budget-exhausted', { operator: false });

    let plan = planStore.snapshot();
    const reassessment = planStore.needsReassessment({ at: clock(), event: null, failures: 0 });
    if (!plan || reassessment.needed) {
      const reason = plan ? reassessment.reason : 'initial-plan';
      if (plan?.status === 'complete') {
        const continued = await continueAfterPlan(plan);
        if (continued.paused) return continued.summary;
        plan = planStore.snapshot();snapshot=state.snapshot;
      } else {
        state.lastTerraDecision = null;
        if(state.playerReady&&!snapshot.ui){try{snapshot=absorbSnapshot(await readSnapshot({ui:true,image:false}));}catch(error){return pause('ui-observation-unavailable',{operator:false});}}
        const result = await requestTerra(reason, { awaitReply: true, critical: true });
        if (!result.ok) {
          if (result.code === 'unavailable') return pause('tier-unavailable:terra', { operator: false });
          if (result.code === 'paused' || budgetPaused()) return pause(budget.pauseReason() ?? 'budget-exhausted', { operator: false });
          return pause(`planning-failed:${result.code}`, { operator: false });
        }
        plan = planStore.snapshot();
        if (!plan) return pause('planning-failed:empty-plan', { operator: false });
        if (plan.status === 'complete') {
          if (state.lastTerraDecision?.sessionComplete) {
            const finished = await finishSession('session-finished');
            if (finished.paused) return finished.summary;
          }
          const continued = await continueAfterPlan(plan);
          if (continued.paused) return continued.summary;
          plan = planStore.snapshot();snapshot=state.snapshot;
          if (!plan || plan.status !== 'active') return pause('planning-failed:empty-plan', { operator: false });
        }
      }
    }
    const step = planStore.nextStep();
    if (!step) return pause('no-plan-step', { operator: false });
    const failure = await runStep(step, snapshot, signal);
    if (failure.ok) {
      // A queued Terra reassessment from an event is deferred until the next step boundary.
      if (state.queues.terra && !state.inflight.terra && !state.paused) {
        const queued = state.queues.terra;
        state.queues.terra = null;
        log('escalation-drain', { role: 'terra', reason: queued.reason });
        await requestTerra(queued.reason, { awaitReply: true });
      }
      return { status: 'step', outcome: failure.outcome };
    }
    if (failure.code === 'retry') return { status: 'retry' };
    if (failure.code === 'ui-reconciled') return {status:'reconciled'};
    if (failure.code === 'paused') return summary();
    return handleStepFailure(step, failure, signal);
  }

  async function cancelActive(reason) {
    const active = state.activeTask;
    if (!active?.requestId) return true;
    try {
      const result=active.kind === 'intent' && !(state.playerReady && state.capabilities?.tasks === true) ? await client.cancelIntent(active.requestId, reason) : await client.cancelTask(active.requestId, reason);
      const task=result?.task??result;
      if(task?.status!=='terminal'||task.cleanupPending===true)throw Error('Cancellation or release not acknowledged');
      state.activeTask = null;return true;
    } catch (error) { log('mind-cancel-error', { requestId: active.requestId, error: error.message });state.activeTask = null;state.paused=true;state.pauseReason='unverified-cleanup';state.status='paused';return false; }
  }

  async function receiveRepairStatus(input) {
    let status;
    try { status = normalizeRepairStatus(input); }
    catch (error) { log('repair-status-invalid', { error: error.message }); return { ok: false, code: 'invalid-repair-status', reason: error.message }; }
    if (!state.repair.proposalId || status.proposalId !== state.repair.proposalId) return {ok:false,code:'unknown-repair-proposal',reason:'Status does not match the active proposal'};
    if (status.phase==='verified' && !state.repair.hold) return {ok:false,code:'repair-not-held',reason:'Verified status requires an active repair hold'};
    const key = `${status.proposalId}:${status.phase}:${status.at}`;
    if (key === state.lastRepairStatusKey) return { ok: true, duplicate: true, status };
    state.lastRepairStatusKey = key;
    state.repair.status = status;
    state.stats.repairStatuses++;
    log('repair-status', { status });
    if (['queued', 'reproducing', 'patching', 'testing', 'staged', 'applying'].includes(status.phase)) {
      state.repair.hold = true;
      state.repair.verified = false;
      state.status = 'repair-hold';
      await cancelActive(`repair-${status.phase}`);
      checkpoint(`repair-${status.phase}`);
      return { ok: true, hold: true, status };
    }
    if (status.phase === 'verified') {
      const wasHold = state.repair.hold;
      state.repair.hold = false;
      state.repair.verified = true;
      state.status = state.paused ? 'paused' : 'playing';
      log('repair-resume-ready', { proposalId: status.proposalId, wasHold });
      checkpoint('repair-verified');
      return { ok: true, hold: false, resumeReady: !state.paused, status };
    }
    if (status.phase === 'rolled-back' || status.phase === 'failed' || status.phase === 'maintenance-required') {
      state.repair.hold = false;
      state.repair.verified = false;
      if (!state.paused) await pause(`repair-${status.phase}`, { operator: true });
      return { ok: true, hold: false, status };
    }
    return { ok: true, status };
  }

  async function pollRepairStatus() {
    if (typeof readRepairStatus !== 'function') return false;
    let status = null;
    try { status = readRepairStatus(); } catch (error) { log('repair-status-read-error', { error: error.message }); return false; }
    if (!status) return false;
    if (!state.repair.proposalId || status.proposalId !== state.repair.proposalId) return {ok:false,code:'unknown-repair-proposal',reason:'Status does not match the active proposal'};
    if (status.phase==='verified' && !state.repair.hold) return {ok:false,code:'repair-not-held',reason:'Verified status requires an active repair hold'};
    const key = `${status.proposalId}:${status.phase}:${status.at}`;
    if (key === state.lastRepairStatusKey) return false;
    await receiveRepairStatus(status);
    return true;
  }

  async function run({ signal = null, deadline = null, shouldStop = null } = {}) {
    state.status = 'playing';
    state.signal = signal;
    log('mind-run-start', { planVersion: planStore.version(), config: { roles: Object.fromEntries(Object.entries(config.roles).map(([role, value]) => [role, { enabled: value.enabled, model: value.model, images: value.images }])) } });
    let cycles = 0;
    const limit = maxCycles ?? cfg.maxCycles;
    try {
      while (!state.paused && !state.stopRequested && !signal?.aborted) {
        if (deadline !== null && clock() >= deadline) { await pause('deadline', { operator: true }); break; }
        if (shouldStop?.()) { await pause('operator-stop', { operator: true }); break; }
        if (cycles++ >= limit) { await pause('cycle-limit', { operator: false }); break; }
        await pollRepairStatus();
        if (state.repair.hold && !state.paused) { await sleep(pollIntervalMs); continue; }
        let result;
        result = await stepOnce(signal);
        if (state.paused) break;
        if (result?.status === 'wait') { await sleep(pollIntervalMs); continue; }
        if (result?.status === 'retry') { await sleep(Math.min(pollIntervalMs, 50)); continue; }
      }
    } catch (error) {
      state.stats.controlErrors++;
      log('mind-run-error', { error: error.message, stack: error.stack });
      if (error?.code === 'CONTROL_UNAVAILABLE') await pause('control-unavailable', { operator: false });
      else await pause(`scheduler-error:${error.message}`.slice(0, 200), { operator: false });
    } finally {
      if (state.stopRequested && !state.paused) await pause(state.stopRequested.reason, { operator: true });
      else if (signal?.aborted && !state.paused) await pause('aborted', { operator: true });
      checkpoint('run-end');
      log('mind-run-end', { status: state.status, pauseReason: state.pauseReason, stats: state.stats, budget: budget.status() });
    }
    return summary();
  }

  return {
    run, stepOnce, resume, requestStop, pause, receiveRepairStatus, summary, snapshot: summary,
    stats: () => structuredClone(state.stats), plan: () => planStore.snapshot(), planStore,
    budget: () => budget.status(), paused: () => state.paused, pauseReason: () => state.pauseReason,
    lastOutcome: () => compactTask(state.lastOutcome), setActiveSignal: null,
    planHistory: () => state.planHistory.map(entry => structuredClone(entry)),
  };
}
