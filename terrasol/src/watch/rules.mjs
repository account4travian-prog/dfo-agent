function stopReason(row) {
  const task = row.task ?? row;
  return task.reason ?? task.note ?? (['blocked', 'failed', 'cancelled', 'interrupted'].includes(task.outcome) ? task.outcome : null);
}
function isStopEvent(row) { return ['intent-outcome', 'task-outcome', 'watcher-hold', 'cycle-block', 'action-error', 'intent-error', 'pilot-error', 'fatal'].includes(row.kind); }
const healthValue = health => Number.isFinite(health?.score) ? health.score : Number.isFinite(health?.health) ? health.health : null;
const millis = value => Number.isFinite(value) ? value : Date.parse(value ?? '');

export function evaluateRules({ now, history = [], lastUsefulAt = null, idleMs = null, held = false, health = null, previousHealth = null, healthFallPolls = 0, movementAdvanced = false, hostileVisible = false, bodyGoal = null, inputHeld = false, activeTask = false, lease = null, config = {} }) {
  const actions = [];
  if (held) return { at: new Date(now).toISOString(), held: true, actions, evidence: { reason: 'run-already-held' } };
  const windowMs = config.windowMs ?? 10 * 60_000;
  const windowRows = history.filter(row => Number.isFinite(millis(row.at)) && now - millis(row.at) <= windowMs);
  const elapsedIdle = idleMs ?? (lastUsefulAt === null ? null : now - lastUsefulAt);
  if (elapsedIdle !== null && elapsedIdle >= (config.idleMs ?? 10 * 60_000)) actions.push({ type: 'hold', rule: 'no-verified-useful-outcome', evidence: { lastUsefulAt: lastUsefulAt === null ? null : new Date(lastUsefulAt).toISOString(), idleMs: elapsedIdle } });
  const repeated = new Map();
  for (const row of windowRows) { const reason = isStopEvent(row) ? stopReason(row) : null; if (reason) repeated.set(reason, (repeated.get(reason) ?? 0) + 1); }
  for (const [reason, count] of repeated) if (count >= (config.repeatCount ?? 5)) actions.push({ type: 'hold', rule: 'repeated-stop-reason', evidence: { reason, count, windowMs } });
  const before = healthValue(previousHealth), current = healthValue(health);
  const combatTask = typeof activeTask === 'string' ? /^(fight|retreat)$/i.test(activeTask) : /^(fight|retreat)$/i.test(activeTask?.kind ?? activeTask?.taskKind ?? '');
  const goalKind = typeof bodyGoal === 'string' ? bodyGoal : bodyGoal?.kind ?? bodyGoal?.goal ?? bodyGoal?.name ?? '';
  const combatGoal = /combat|fight|retreat/i.test(goalKind);
  if (before !== null && current !== null && healthFallPolls >= 3 && !movementAdvanced && !combatTask && !hostileVisible && !combatGoal) actions.push({ type: 'hold', rule: 'health-falling', evidence: { previousHealth: before, health: current, healthFallPolls, movementAdvanced, hostileVisible, bodyGoal } });
  if (inputHeld && !activeTask) actions.push({ type: 'stop', rule: 'input-without-task', evidence: { inputHeld, activeTask } });
  const leaseStartedAt = millis(lease?.startedAt);
  if (Number.isFinite(leaseStartedAt) && now - leaseStartedAt >= (config.leaseTimeoutMs ?? 30_000)) actions.push({ type: 'stop', rule: 'lease-not-released', evidence: { lease, elapsedMs: now - leaseStartedAt } });
  return { at: new Date(now).toISOString(), held: false, actions, evidence: { windowMs, windowRows: windowRows.length, lastUsefulAt: lastUsefulAt === null ? null : new Date(lastUsefulAt).toISOString(), idleMs: elapsedIdle, health: current, healthFallPolls, movementAdvanced, hostileVisible, bodyGoal, inputHeld, activeTask, lease: lease ?? null } };
}
