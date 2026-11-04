import fs from 'node:fs';
import path from 'node:path';
import { buildReport } from '../report.mjs';
import { allRunRows, readRows } from './io.mjs';

const ROLES = ['luna', 'terra', 'sol'];
const stamp = row => Date.parse(row?.at ?? '');
const duration = (end, start) => Number.isFinite(end) && Number.isFinite(start) && end >= start ? end - start : null;
function histogram(items) { const counts = {}; for (const item of items) counts[item] = (counts[item] ?? 0) + 1; return counts; }
function reasonOf(row) {
  const task = row.task ?? row;
  if (typeof task.reason === 'string' && task.reason.trim()) return task.reason.trim();
  if (typeof task.outcome === 'string' && ['blocked', 'failed', 'cancelled', 'interrupted'].includes(task.outcome)) return task.outcome;
  if (['watcher-hold', 'cycle-block', 'action-error', 'intent-error', 'pilot-error', 'fatal'].includes(row.kind)) {
    const note = task.note ?? task.error ?? task.warning;
    if (typeof note === 'string' && note.trim()) return note.trim();
  }
  return null;
}

export function census(runDir) {
  const traceFile = path.join(runDir, 'trace.jsonl');
  const trace = readRows(traceFile);
  const rows = allRunRows(runDir);
  const stopEvents = rows.filter(row => ['intent-outcome', 'task-outcome', 'action-result', 'action-error', 'intent-error', 'pilot-error'].includes(row.kind));
  const reasons = stopEvents.map(reasonOf).filter(Boolean);
  const outcomes = {};
  for (const row of rows.filter(row => ['intent-outcome', 'task-outcome'].includes(row.kind) && row.task?.status === 'terminal')) {
    const task = row.task, category = task.taskKind ?? row.taskKind ?? (row.kind === 'intent-outcome' ? 'intent' : ['workflow', 'ui', 'intent'].includes(task.kind) ? task.kind : 'intent');
    const intent = task.kind ?? 'unknown', outcome = task.outcome ?? 'unknown';
    const group = outcomes[category] ??= {};
    group[intent] ??= {}; group[intent][outcome] = (group[intent][outcome] ?? 0) + 1;
  }
  const tiers = Object.fromEntries(ROLES.map(role => [role, { calls: 0, responses: 0, usage: 'unknown', input_tokens: null, cached_input_tokens: null, output_tokens: null }]));
  const usageTotals = Object.fromEntries(ROLES.map(role => [role, { input_tokens: 0, cached_input_tokens: 0, output_tokens: 0, reported: 0, missing: 0 }]));
  for (const row of rows) if (ROLES.includes(row.role)) {
    const tier = tiers[row.role], usage = usageTotals[row.role];
      if (row.kind === 'model-request') tier.calls++;
    if (row.kind === 'model-response') {
      tier.responses++;
      if (row.usage && Number.isFinite(row.usage.input_tokens) && row.usage.input_tokens >= 0) {
        usage.reported++;
        for (const key of ['input_tokens', 'cached_input_tokens', 'output_tokens']) if (Number.isFinite(row.usage[key]) && row.usage[key] >= 0) usage[key] += row.usage[key];
      } else usage.missing++;
    }
  }
  for (const role of ROLES) {
    const u = usageTotals[role], incomplete = u.missing + Math.max(0, tiers[role].calls - tiers[role].responses);
    if (u.reported) tiers[role] = { ...tiers[role], usage: incomplete ? 'partial' : 'known', input_tokens: u.input_tokens, cached_input_tokens: u.cached_input_tokens, output_tokens: u.output_tokens, reportedResponses: u.reported, missingResponses: incomplete };
    else if (!tiers[role].responses) tiers[role].usage = 'absent';
    if (!tiers[role].calls && !tiers[role].responses) { tiers[role].state = 'absent'; tiers[role].calls = null; tiers[role].responses = null; }
  }
  let report;
  try { report = fs.existsSync(runDir) ? buildReport(runDir) : null; } catch { report = null; }
  const useful = report ? { metricVersion: report.metricVersion, count: report.verifiedOutcomes, transitions: report.verifiedTransitions } : { metricVersion: 2, count: null, transitions: null, state: 'absent' };
  const hasModelEvents = rows.some(row => row.kind === 'model-request' || row.kind === 'model-response');
  const modelWait = hasModelEvents ? report?.modelWaitMs ?? null : null;
  const held = report ? report.holds.reduce((sum, row) => sum + (row.elapsedMs ?? 0), 0) : null;
  const measuredEpochs = report?.epochs.filter(row => row.elapsedMs !== null) ?? [];
  const epochTime = measuredEpochs.length ? measuredEpochs.reduce((sum, row) => sum + row.elapsedMs, 0) : null;
  let repairMs = null, repairStart = null;
  for (const row of rows.filter(e => e.kind === 'repair-proposal' || e.kind === 'repair-status').sort((a, b) => stamp(a) - stamp(b))) {
    if (row.kind === 'repair-proposal' && repairStart === null) repairStart = stamp(row);
    if (row.kind === 'repair-status' && ['complete', 'failed', 'rejected', 'applied'].includes(row.status?.phase) && repairStart !== null) { repairMs = (repairMs ?? 0) + (duration(stamp(row), repairStart) ?? 0); repairStart = null; }
  }
  if (repairMs === null && !rows.some(row => row.kind.startsWith('repair-'))) repairMs = null;
  const failureCounts = histogram(reasons);
  return {
    runDir,
    sections: {
      stopReasons: Object.keys(failureCounts).length ? { state: 'present', histogram: failureCounts, source: 'logged notes and terminal reasons' } : { state: 'absent' },
      taskOutcomes: Object.keys(outcomes).length ? { state: 'present', byCategory: outcomes } : { state: 'absent' },
      holds: report ? { state: 'present', count: report.holds.length, intervals: report.holds } : { state: 'absent' },
    },
    taskOutcomes: { byCategory: outcomes },
    verifiedUseful: useful,
    modelCalls: { total: ROLES.reduce((sum, role) => sum + tiers[role].calls, 0), tiers },
    topRepeatedFailures: Object.entries(failureCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([reason, count]) => ({ reason, count })),
    time: { playingMs: epochTime === null || modelWait === null ? null : Math.max(0, epochTime - modelWait), waitingOnModelsMs: modelWait, heldMs: held, inRepairMs: repairMs },
  };
}
