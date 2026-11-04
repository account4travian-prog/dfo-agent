import fs from 'node:fs';
import path from 'node:path';

const ROLES = new Set(['luna', 'terra', 'sol']);
const emptyUsage = () => ({ input_tokens: 0, cached_input_tokens: 0, output_tokens: 0 });
const emptyTiming = () => ({ completed: 0, elapsedMs: 0, unmatchedRequests: 0 });

function rows(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  // An incomplete final record is not evidence of an event.
  const end = raw.lastIndexOf('\n');
  if (end < 0) return [];
  return raw.slice(0, end).split('\n').filter(Boolean).map(line => JSON.parse(line));
}
const time = row => Date.parse(row?.at ?? '');
const difference = (end, start) => Number.isFinite(end) && Number.isFinite(start) && end >= start ? end - start : null;
const roleOf = e => ROLES.has(e?.role) ? e.role : null;

// Count demonstrated state transitions, separately from control receipts. These
// predicates do not establish kills, quests, meaningful destinations or causality.
const USEFUL_EVIDENCE = new Set(['inventory-changed', 'item-equipped', 'gold-changed', 'spell-readied', 'spell-effect-observed', 'quest-updated', 'location-arrived', 'save-confirmed', 'recovery-confirmed', 'chat-sent', 'encounter-observed', 'kill-verified']);
function transitionEvidence(task) {
  if (task.cleanupPending) return null;
  const evidence = task.evidence;
  if (evidence?.status === 'verified' && USEFUL_EVIDENCE.has(evidence.eventType)) return `evidence:${evidence.eventType}`;
  if (task.outcome !== 'completed') return null;
  const p = task.progress ?? {};
  if (task.kind === 'goto' && Number.isFinite(p.displacement) && p.displacement >= 2 && Number.isFinite(p.remaining) && p.remaining <= 1) return 'arrival-after-movement';
  if (task.kind === 'retreat' && Number.isFinite(p.displacement) && p.displacement >= 2 && Number.isFinite(p.targetDistance) && Number.isFinite(task.range) && p.targetDistance >= task.range) return 'observed-separation';
  if (task.kind === 'use' && p.interaction === 'place') return 'place-transition';
  return null;
}

// Describes recorded activity and dispatch receipts; it does not determine game outcomes.
export function buildReport(runDir) {
  const session = rows(path.join(runDir, 'trace.jsonl'));
  const epochs = fs.readdirSync(runDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^epoch-\d+$/.test(d.name))
    .map(d => ({ number: Number(d.name.slice(6)), events: rows(path.join(runDir, d.name, 'trace.jsonl')) }))
    .sort((a, b) => a.number - b.number);
  const start = session.find(e => e.kind === 'session-start');
  const end = [...session].reverse().find(e => e.kind === 'session-end');
  const mode = start?.mode;
  if (!['online', 'offline'].includes(mode)) throw Error('Report mode missing or invalid; refusing mixed results');
  const checkMode = events => { if (events.some(e => e.mode !== undefined && e.mode !== mode)) throw Error('Report mode mismatch; refusing mixed results'); };
  checkMode(session);
  if (session.some(e => e.kind === 'session-start' && e.mode !== mode)) throw Error('Report mode mismatch or missing mode');
  for (const epoch of epochs) {
    checkMode(epoch.events);
    const starts = epoch.events.filter(e => e.kind === 'epoch-start');
    if (epoch.events.length && (!starts.length || starts.some(e => e.mode !== mode))) throw Error('Report mode mismatch or missing mode for epoch');
  }
  const counts = {
    observations: 0, pilotRequests: 0, plannerRequests: 0, pilotResponses: 0, plannerResponses: 0,
    actionIntents: 0, dispatchReceipts: 0, actionErrors: 0, pilotErrors: 0, plannerErrors: 0, fatalErrors: 0, watcherHolds: 0,
    tierRequests: { luna: 0, terra: 0, sol: 0 }, tierResponses: { luna: 0, terra: 0, sol: 0 }, legacyPilotRequests: 0, legacyPlannerRequests: 0,
    planUpdates: 0, planRejections: 0, staleReplies: 0, tierUnavailable: 0, escalationsQueued: 0, tierErrors: 0, mindPauses: 0, fallbacks: 0,
    taskIntents: 0, taskOutcomes: 0, uiTasks: 0, workflowTasks: 0, decisionPackets: 0, repairProposals: 0, repairStatuses: 0, planCompletions: 0, sessionFinishes: 0,
  };
  const modelTiming = { luna: emptyTiming(), terra: emptyTiming(), sol: emptyTiming() };
  const usage = emptyUsage();
  const usageByRole = { luna: emptyUsage(), terra: emptyUsage(), sol: emptyUsage() };
  const usageRecords = { reported: 0, missing: 0 };
  const generationSet = new Set();
  const nativeOutcomes = [];
  const plans = [];
  const planCompletions = [];
  const pauses = [];
  const decisionPackets = [];
  const repairEvents = [];
  const playerPhases = {};
  const tierEvents = { unavailable: 0, staleReplies: 0, planUpdates: 0, planRejections: 0, escalationsQueued: 0, escalationsCoalesced: 0, fallbacks: 0, controlErrors: 0, taskErrors: 0 };
  const workerIntervals = [];
  for (const epoch of epochs) {
    const pending = { luna: [], terra: [], sol: [] };
    for (const e of epoch.events) {
      if (e.kind === 'observation') { counts.observations++; if (Number.isSafeInteger(e.generation)) generationSet.add(e.generation); }
      const role = roleOf(e);
      if (e.kind === 'model-request' && role) {
        pending[role].push(time(e));
        counts.tierRequests[role]++;
        if (role === 'terra') counts.pilotRequests++;
        if (role === 'sol') counts.plannerRequests++;
        if (!e.schemaVersion) { if (role === 'terra') counts.legacyPilotRequests++; if (role === 'sol') counts.legacyPlannerRequests++; }
      }
      if (e.kind === 'model-response' && role) {
        counts.tierResponses[role]++;
        if (e.usage && Number.isFinite(e.usage.input_tokens) && e.usage.input_tokens >= 0) {
          usageRecords.reported++;
          for (const key of Object.keys(usage)) if (Number.isFinite(e.usage[key]) && e.usage[key] >= 0) { usage[key] += e.usage[key]; usageByRole[role][key] += e.usage[key]; }
        } else usageRecords.missing++;
        if (role === 'terra') counts.pilotResponses++;
        if (role === 'sol') counts.plannerResponses++;
        const duration = difference(time(e), pending[role].shift());
        if (duration !== null) { modelTiming[role].completed++; modelTiming[role].elapsedMs += duration; }
      }
      if (e.kind === 'pilot-error') { counts.pilotErrors++; pending.terra.shift(); }
      if (e.kind === 'planner-error') { counts.plannerErrors++; pending.sol.shift(); }
      if (e.kind === 'tier-error') { counts.tierErrors++; const failed = roleOf(e); if (failed) pending[failed].shift(); }
      if (e.kind === 'action-intent') counts.actionIntents++;
      if (e.kind === 'action-result' && e.issued === true) counts.dispatchReceipts++;
      if (e.kind === 'action-error') counts.actionErrors++;
      if (e.kind === 'fatal') counts.fatalErrors++;
      if (e.kind === 'watcher-hold') counts.watcherHolds++;
      if (e.kind === 'plan-update') { counts.planUpdates++; tierEvents.planUpdates++; plans.push({ epoch: epoch.number, version: e.version ?? null, baseVersion: e.baseVersion ?? null, status: e.status ?? null, goal: e.goal ?? null, sessionComplete: e.sessionComplete === true, confidence: e.confidence ?? null }); }
      if (e.kind === 'plan-completed') { counts.planCompletions++; planCompletions.push({ epoch: epoch.number, version: e.version ?? null, goal: e.goal ?? null, plansCompleted: e.plansCompleted ?? null }); }
      if (e.kind === 'plan-rejected') { counts.planRejections++; tierEvents.planRejections++; }
      if (e.kind === 'tier-reply-rejected') { counts.staleReplies++; tierEvents.staleReplies++; }
      if (e.kind === 'tier-unavailable') { counts.tierUnavailable++; tierEvents.unavailable++; }
      if (e.kind === 'escalation-queued') { counts.escalationsQueued++; tierEvents.escalationsQueued++; }
      if (e.kind === 'tier-fallback') { counts.fallbacks++; tierEvents.fallbacks++; }
      if (e.kind === 'mind-pause') { counts.mindPauses++; pauses.push({ epoch: epoch.number, reason: e.reason ?? null, operator: e.operator === true }); }
      if (e.kind === 'mind-poll-error' || e.kind === 'mind-snapshot-error') tierEvents.controlErrors++;
      if (e.kind === 'tier-error') tierEvents.taskErrors++;
      if (e.kind === 'task-dispatch') { if (e.taskKind === 'ui') counts.uiTasks++; else if (e.taskKind === 'workflow') counts.workflowTasks++; else counts.taskIntents++; }
      if ((e.kind === 'task-outcome' || e.kind === 'intent-outcome') && e.task?.status === 'terminal') {
        counts.taskOutcomes++;
        nativeOutcomes.push({ epoch: epoch.number, id: e.task.id, requestId: e.task.requestId, generation: e.task.generation, startedAt: e.task.startedAt, kind: e.task.kind, taskKind: e.task.taskKind ?? e.taskKind ?? (e.kind === 'task-outcome' ? null : 'intent'), outcome: e.task.outcome, reason: e.task.reason ?? null, progress: e.task.progress ?? null, range: e.task.range, cleanupPending: e.task.cleanupPending ?? false, evidence: e.task.evidence ?? null, evidenceRecords:e.task.evidenceRecords??[], authority: e.task.authority ?? null, basis: e.task.basis ?? null });
      }
      if (e.kind === 'decision-packet' && e.packet) { counts.decisionPackets++; if (decisionPackets.length < 100) decisionPackets.push({ epoch: epoch.number, ...e.packet }); }
      if (e.kind === 'repair-proposal') { counts.repairProposals++; repairEvents.push({ epoch: epoch.number, kind: e.kind, proposalId: e.proposal?.proposalId ?? null }); }
      if (e.kind === 'repair-status') { counts.repairStatuses++; repairEvents.push({ epoch: epoch.number, kind: e.kind, proposalId: e.status?.proposalId ?? null, phase: e.status?.phase ?? null }); }
      if (e.kind === 'mind-control-ready' && Array.isArray(e.workflows)) { /* capability evidence */ }
      if (e.kind === 'observation' && e.player?.phase) playerPhases[e.player.phase] = (playerPhases[e.player.phase] ?? 0) + 1;
      if (e.kind === 'session-finish' || (e.kind === 'mind-pause' && /session/.test(e.reason ?? ''))) counts.sessionFinishes++;
    }
    for (const role of Object.keys(pending)) modelTiming[role].unmatchedRequests += pending[role].length;
    const first = epoch.events.find(e => e.kind === 'epoch-start');
    const exit = session.find(e => e.kind === 'worker-exit' && e.epoch === epoch.number);
    const finish = exit ?? [...epoch.events].reverse().find(e => e.kind === 'epoch-end');
    workerIntervals.push({ epoch: epoch.number, startedAt: first?.at ?? null, endedAt: finish?.at ?? null, elapsedMs: difference(time(finish), time(first)), endEvidence: exit ? 'worker-exit' : finish ? 'epoch-end' : 'unobserved' });
  }
  const holds = [];
  for (let i = 0; i < workerIntervals.length; i++) {
    const current = workerIntervals[i], next = workerIntervals[i + 1];
    const exit = session.find(e => e.kind === 'worker-exit' && e.epoch === current.epoch);
    if (!exit || exit.code === 0) continue;
    const until = next?.startedAt ?? end?.at;
    const elapsedMs = difference(Date.parse(until ?? ''), time(exit));
    if (elapsedMs !== null) holds.push({ afterEpoch: current.epoch, until: next ? 'next-epoch' : 'session-end', elapsedMs });
  }
  const outcomesByKind = {};
  for (const item of nativeOutcomes) { const key = item.kind ?? 'unknown'; const group = outcomesByKind[key] ??= {}; group[item.outcome] = (group[item.outcome] ?? 0) + 1; }
  const seen = new Set();
  const verifiedTransitions = nativeOutcomes.flatMap(task => {
    const evidence = transitionEvidence(task), key = task.id == null ? null : `${task.epoch}:${task.generation ?? ''}:${task.id}:${task.startedAt ?? ''}`;
    if (!evidence || (key && seen.has(key))) return [];
    if (key) seen.add(key);
    return [{ epoch: task.epoch, taskId: task.id, kind: task.kind, evidence, progress: task.progress }];
  });
  const verified = verifiedTransitions.length;
  const totalCalls = counts.tierRequests.luna + counts.tierRequests.terra + counts.tierRequests.sol;
  const modelWaitMs = Object.values(modelTiming).reduce((total, row) => total + row.elapsedMs, 0);
  const efficiencyFor = (roles) => {
    const calls = roles.reduce((total, role) => total + counts.tierRequests[role], 0);
    const input = roles.reduce((total, role) => total + usageByRole[role].input_tokens, 0);
    return { modelCalls: calls, inputTokens: input, modelCallsPerVerifiedOutcome: verified ? calls / verified : null, inputTokensPerVerifiedOutcome: verified && usageRecords.missing === 0 ? input / verified : null };
  };
  return {
    runDir, mode, startedAt: start?.at ?? null, endedAt: end?.at ?? null,
    wallMs: difference(time(end), time(start)), epochs: workerIntervals, holds,
    generationCount: generationSet.size, counts, modelTiming,
    metricVersion: 2, verifiedTransitions, nativeOutcomes, outcomesByKind, completedStops: outcomesByKind.stop?.completed ?? 0, verifiedOutcomes: verified,
    plans, latestPlan: plans.at(-1) ?? null, planCompletions, pauses, tierEvents, decisionPackets, repairEvents, playerPhases,
    attempts: { requests: totalCalls, failed: counts.tierErrors, unknownUsageResponses: usageRecords.missing },
    modelWaitMs,
    usageByRole, playingRoleUsage: { ...usage, ...usageRecords }, engineeringUsage: 'unavailable',
    efficiency: { verifiedOutcomes: verified, modelCalls: totalCalls, inputTokens: usage.input_tokens, modelWaitMs, unknownUsageResponses: usageRecords.missing, modelCallsPerVerifiedOutcome: verified ? totalCalls / verified : null, inputTokensPerVerifiedOutcome: verified && usageRecords.missing === 0 ? usage.input_tokens / verified : null, byRole: { luna: efficiencyFor(['luna']), terra: efficiencyFor(['terra']), sol: efficiencyFor(['sol']), all: efficiencyFor(['luna', 'terra', 'sol']) } },
    note: 'Durations reflect logged timestamps. Dispatch receipts do not establish gameplay outcomes; incomplete intervals are omitted. Metric v2 counts evidenced movement, separation, place transitions and verified EvidenceRecord event types; turns, generic UI changes and task completion alone are excluded. State transitions do not establish useful destinations, kills, quests or full gameplay success. Cached input is a subset of input; missing usage and engineering usage are unknown, not zero.',
  };
}
