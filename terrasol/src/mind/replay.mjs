// Source-versioned replay fixtures. A fixture can rebuild plan-version decisions
// and task/basis identity without a game, driver or model call.
import { createPlanStore } from './plan.mjs';
import { normalizeTerraDecision } from '../protocol.mjs';

export const REPLAY_SCHEMA = 'dfo-replay.v1';

export function buildReplayFixture({ scenarioId, sourceRevision = null, packets = [], plan = null, planHistory = [], taskOutcomes = [], omissions = [], expected = null } = {}) {
  const fixture = {
    schemaVersion: REPLAY_SCHEMA,
    scenarioId: String(scenarioId ?? 'unnamed'),
    sourceRevision,
    recordedAt: new Date().toISOString(),
    plan,
    planHistory,
    decisions: packets.map(packet => ({
      packetId: packet.packetId, role: packet.role, model: packet.model, basis: packet.basis ?? null,
      planVersion: packet.planVersion ?? 0, prompt: packet.prompt ?? '', reply: packet.reply ?? null,
      usage: packet.usage ?? null, usageKnown: packet.usageKnown === true, ms: packet.ms ?? null, omitted: packet.omitted ?? [],
    })),
    taskOutcomes: taskOutcomes.map(task => ({ requestId: task.requestId ?? null, kind: task.kind ?? null, outcome: task.outcome ?? null, basis: task.basis ?? null, evidenceId: task.evidence?.evidenceId ?? null })),
    omissions,
    expected,
    note: 'Replay fixtures are model-free. They do not establish live gameplay or token savings.',
  };
  return validateReplayFixture(fixture) ? fixture : null;
}

export function validateReplayFixture(fixture) {
  const errors = replayFixtureErrors(fixture);
  if (errors.length) throw new TypeError(`Invalid replay fixture: ${errors.join('; ')}`);
  return true;
}

export function replayFixtureErrors(fixture) {
  const errors = [];
  if (!fixture || typeof fixture !== 'object') return ['fixture must be an object'];
  if (fixture.schemaVersion !== REPLAY_SCHEMA) errors.push('schemaVersion');
  if (typeof fixture.scenarioId !== 'string' || !fixture.scenarioId) errors.push('scenarioId');
  if (!Array.isArray(fixture.decisions)) errors.push('decisions');
  else for (const [index, decision] of fixture.decisions.entries()) {
    if (typeof decision.packetId !== 'string') errors.push(`decisions[${index}].packetId`);
    if (!['luna', 'terra', 'sol'].includes(decision.role)) errors.push(`decisions[${index}].role`);
    if (!Number.isSafeInteger(decision.planVersion)) errors.push(`decisions[${index}].planVersion`);
  }
  return errors;
}

/** Rebuild versioned plan updates from recorded Terra packets. No model call. */
export function replayPlanDecisions(fixture) {
  validateReplayFixture(fixture);
  const store = createPlanStore({ plan: fixture.plan ?? null });
  const applied = [];
  const rejected = [];
  let snapshot = null;
  for (const decision of fixture.decisions) {
    if (decision.role !== 'terra' || !decision.reply) continue;
    try {
      const normalized = normalizeTerraDecision(decision.reply, { currentVersion: store.version(), snapshot });
      const result = store.apply(normalized.update, { snapshot });
      if (!result.ok) rejected.push({ packetId: decision.packetId, code: result.code, reason: result.reason });
      else applied.push({ packetId: decision.packetId, version: result.version, goal: result.plan.goal });
    } catch (error) {
      rejected.push({ packetId: decision.packetId, code: 'normalize', reason: error.message });
    }
  }
  return { schemaVersion: 'dfo-replay-result.v1', scenarioId: fixture.scenarioId, sourceRevision: fixture.sourceRevision, plan: store.snapshot(), applied, rejected };
}
