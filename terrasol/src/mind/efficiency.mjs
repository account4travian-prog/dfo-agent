// Matched two-tier/three-tier measurement helpers. A fake result is labeled as
// fake; no helper claims a real saving. Counts and unknown usage stay explicit.
export const MEASUREMENT_SCHEMA = 'dfo-efficiency.v1';
const ROUTINGS = new Set(['two-tier', 'three-tier']);

function finite(value) { return Number.isFinite(value) ? value : null; }

export function measurementFromReport(report, { routing, scenarioId, startFingerprint = null, sourceRevision = null, live = false }) {
  if (!ROUTINGS.has(routing)) throw new TypeError('routing must be two-tier or three-tier');
  if (!report || typeof report !== 'object') throw new TypeError('measurement needs a report');
  const counts = report.counts ?? {};
  const usage = report.playingRoleUsage ?? {};
  const roles = report.modelTiming ?? {};
  const calls = (counts.tierRequests?.luna ?? 0) + (counts.tierRequests?.terra ?? 0) + (counts.tierRequests?.sol ?? 0);
  const transitions = report.verifiedOutcomes ?? report.verifiedTransitions?.length ?? 0;
  return {
    schemaVersion: MEASUREMENT_SCHEMA,
    mode: report.mode ?? null,
    routing,
    scenarioId: String(scenarioId ?? report.runDir ?? 'unnamed'),
    startFingerprint,
    sourceRevision,
    evidence: live ? 'live' : 'fake',
    calls,
    callsByRole: { luna: counts.tierRequests?.luna ?? 0, terra: counts.tierRequests?.terra ?? 0, sol: counts.tierRequests?.sol ?? 0 },
    input_tokens: finite(usage.input_tokens),
    cached_input_tokens: finite(usage.cached_input_tokens),
    output_tokens: finite(usage.output_tokens),
    unknownUsageCalls: usage.missing ?? null,
    verifiedTransitions: transitions,
    usefulProgressPerCall: calls ? transitions / calls : null,
    usefulProgressPerMillionInput: Number.isFinite(usage.input_tokens) && usage.input_tokens > 0 ? (transitions * 1e6) / usage.input_tokens : null,
    modelWaitMs: Object.values(roles).reduce((total, row) => total + (row.elapsedMs ?? 0), 0),
    wallMs: report.wallMs ?? null,
    pauses: report.pauses?.length ?? counts.mindPauses ?? 0,
    failedCalls: counts.tierErrors ?? 0,
    plans: report.plans?.length ?? 0,
    note: live ? 'Live measurement; still state scenario, revision and interventions.' : 'Fake/injected measurement; not evidence of a real token saving.',
  };
}

export function compareMeasurements({ twoTier, threeTier }) {
  if (!twoTier || !threeTier) throw new TypeError('comparison needs both measurements');
  if((twoTier.mode??null)!==(threeTier.mode??null))throw new TypeError('matched comparison needs the same session mode');
  for (const item of [twoTier, threeTier]) if (item.schemaVersion !== MEASUREMENT_SCHEMA) throw new TypeError('measurement schema mismatch');
  if (twoTier.scenarioId !== threeTier.scenarioId) throw new TypeError('matched comparison needs the same scenarioId');
  if (twoTier.startFingerprint !== threeTier.startFingerprint) throw new TypeError('matched comparison needs the same starting fingerprint');
  const delta = (three, two) => ({ calls: three.calls - two.calls, input_tokens: Number.isFinite(three.input_tokens) && Number.isFinite(two.input_tokens) ? three.input_tokens - two.input_tokens : null, verifiedTransitions: three.verifiedTransitions - two.verifiedTransitions, modelWaitMs: three.modelWaitMs - two.modelWaitMs });
  const fake = twoTier.evidence !== 'live' || threeTier.evidence !== 'live';
  return {
    schemaVersion: MEASUREMENT_SCHEMA,
    scenarioId: twoTier.scenarioId,
    evidence: fake ? 'fake' : 'live',
    twoTier, threeTier,
    delta: delta(threeTier, twoTier),
    claim: fake ? 'not-evidence-of-real-saving' : 'measured-comparison',
    warnings: [
      ...(fake ? ['Fake/injected measurements cannot establish a real token or latency saving.'] : []),
      ...(twoTier.unknownUsageCalls || threeTier.unknownUsageCalls ? ['Unknown usage is preserved; do not treat missing tokens as zero.'] : []),
      'Compare useful verified progress and survival alongside calls/tokens.',
    ],
  };
}

/**
 * Run both routing arms against the same caller-supplied scenario. Each arm
 * receives no shared mutable state; results are compared only when the scenario
 * id and start fingerprint match.
 */
export async function runMatchedHarness({ arms, scenarioId, startFingerprint, sourceRevision = null, live = false } = {}) {
  if (!arms || typeof arms.twoTier !== 'function' || typeof arms.threeTier !== 'function') throw new TypeError('matched harness needs twoTier and threeTier arm functions');
  const [twoTier, threeTier] = await Promise.all([arms.twoTier(), arms.threeTier()]);
  const normalize = arm => arm?.schemaVersion === MEASUREMENT_SCHEMA ? arm : measurementFromReport(arm?.report ?? arm, { routing: arm.routing, scenarioId, startFingerprint, sourceRevision, live });
  return compareMeasurements({ twoTier: normalize(twoTier), threeTier: normalize(threeTier) });
}

export function formatMeasurement(measurement) {
  const m = measurement;
  return `${m.routing} [${m.evidence}] calls=${m.calls} in=${m.input_tokens ?? 'unknown'} cached=${m.cached_input_tokens ?? 'unknown'} out=${m.output_tokens ?? 'unknown'} verified=${m.verifiedTransitions} waitMs=${m.modelWaitMs} note=${m.note}`;
}
