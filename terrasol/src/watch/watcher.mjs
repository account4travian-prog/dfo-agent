import fs from 'node:fs';
import path from 'node:path';
import { buildReport } from '../report.mjs';
import { allRunRows, readRows } from './io.mjs';
import { evaluateRules } from './rules.mjs';

const reportCache = new Map();

export function createHttpControl({ baseUrl = 'http://127.0.0.1:5391', fetchImpl = fetch } = {}) {
  async function get(url) { const response = await fetchImpl(`${baseUrl}${url}`); if (!response.ok) throw new Error(`control ${url}: HTTP ${response.status}`); return response.json(); }
  return {
    health: () => get('/health'),
    snapshot: () => get('/snapshot?ui=0&image=0&after=0'),
    stop: async () => { const response = await fetchImpl(`${baseUrl}/stop`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); if (!response.ok) throw new Error(`control /stop: HTTP ${response.status}`); return response.json().catch(() => ({})); },
  };
}

function lastUseful(report, loggedRows) {
  const ids = new Set(report.verifiedTransitions.map(item => `${item.epoch}:${item.taskId}`));
  const completedAt = new Map();
  for (const row of loggedRows) if (['intent-outcome', 'task-outcome'].includes(row.kind) && row.task?.id != null) {
    const key = `${row.epoch ?? ''}:${row.task.id}`;
    const at = Date.parse(row.at ?? '');
    if (Number.isFinite(at)) completedAt.set(key, at);
  }
  const outcomes = report.nativeOutcomes.filter(task => ids.has(`${task.epoch}:${task.id}`));
  return outcomes.reduce((latest, row) => {
    const key = `${row.epoch}:${row.id}`, raw = completedAt.get(key) ?? completedAt.get(`:${row.id}`);
    const at = Number.isFinite(raw) ? raw : Number.isFinite(row.startedAt) ? row.startedAt : Date.parse(row.startedAt ?? '');
    return Number.isFinite(at) && (latest === null || at > latest) ? at : latest;
  }, null);
}
function position(snapshot) { const p = snapshot?.native?.state?.pos; return Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite) ? p.join(',') : null; }

function logSignature(runDir) {
  const files = [path.join(runDir, 'trace.jsonl')];
  if (fs.existsSync(runDir)) for (const entry of fs.readdirSync(runDir, { withFileTypes: true }).filter(d => d.isDirectory() && /^epoch-\d+$/.test(d.name))) files.push(path.join(runDir, entry.name, 'trace.jsonl'));
  return files.sort().map(file => { try { const stat = fs.statSync(file); return `${file}:${stat.size}:${stat.mtimeMs}`; } catch { return `${file}:absent`; } }).join('|');
}
function reportAndRows(runDir) {
  const signature = logSignature(runDir), cached = reportCache.get(runDir);
  if (cached?.signature === signature) return cached;
  const data = { signature, rows: allRunRows(runDir), report: buildReport(runDir) };
  reportCache.set(runDir, data);
  return data;
}
function latestReset(rows, watchRows) {
  const times = [];
  for (const row of rows) {
    if (['session-start', 'epoch-start'].includes(row.kind) || (row.kind === 'operator-command' && (row.command === 'resume' || row.action === 'resume'))) {
      const at = Date.parse(row.at ?? '');
      if (Number.isFinite(at)) times.push(at);
    }
  }
  for (const row of watchRows) if (row.enforce === true && row.actions?.some(action => action.enforced === true)) {
    const at = Date.parse(row.at ?? '');
    if (Number.isFinite(at)) times.push(at);
  }
  return times.length ? Math.max(...times) : null;
}
function hasHostile(snapshot) {
  const targets = snapshot?.native?.targets;
  return Array.isArray(targets) && targets.some(target => target?.visible !== false && (target?.hostile === true || target?.isHostile === true || /^(hostile|enemy)$/i.test(target?.disposition ?? target?.relation ?? '')));
}
function bodyGoal(snapshot) {
  return snapshot?.native?.state?.body?.goal ?? snapshot?.native?.state?.currentGoal ?? snapshot?.native?.state?.goal ?? snapshot?.native?.body?.goal ?? null;
}
function inWorld(snapshot) { return snapshot?.native?.ready === true || snapshot?.player?.phase === 'world'; }

export async function watchOnce({ runDir, control, now = () => Date.now(), previous = null, config = {}, enforce = false } = {}) {
  const [health, snapshot] = await Promise.all([control.health(), control.snapshot()]);
  const { rows, report } = reportAndRows(runDir);
  const watchRows = readRows(path.join(runDir, 'watch.jsonl')) ?? [];
  const resetAt = latestReset(rows, watchRows);
  const evidenceRows = rows.filter(row => resetAt === null || Date.parse(row.at ?? '') > resetAt);
  const newestUseful = lastUseful(report, evidenceRows);
  const resetAfterPreviousPoll = resetAt !== null && previous?.at != null && resetAt > previous.at;
  const usefulAfterPreviousPoll = newestUseful !== null && previous?.lastUsefulAt != null && newestUseful > previous.lastUsefulAt;
  const inWorldNow = inWorld(snapshot);
  const polledAt = now();
  const idleMs = !inWorldNow || resetAfterPreviousPoll || usefulAfterPreviousPoll ? 0
    : previous?.inWorld && previous?.resetAt === resetAt && Number.isFinite(previous.idleMs) && Number.isFinite(previous.at)
      ? previous.idleMs + Math.max(0, polledAt - previous.at)
      : 0;
  const lastUsefulAt = newestUseful ?? resetAt;
  const statusFile = path.join(path.dirname(path.dirname(runDir)), 'session-status.json');
  let held = false;
  try { const status = JSON.parse(fs.readFileSync(statusFile, 'utf8')); held = status.run === runDir && status.state === 'held'; } catch { /* absent status means unknown, not held */ }
  const priorPoll = resetAfterPreviousPoll ? null : previous;
  const p = position(snapshot), movementAdvanced = priorPoll?.position != null && p !== null && priorPoll.position !== p;
  const activeTask = health.activeTask ?? snapshot.activeTask ?? null;
  const lease = health.inputLease ?? snapshot.inputLease ?? null;
  const inputHeld = health.inputHeld ?? snapshot.inputHeld ?? snapshot.native?.inputHeld ?? false;
  const currentHealth = snapshot.native?.state?.vitals?.health;
  const priorHealth = priorPoll?.health?.score;
  const healthFallPolls = Number.isFinite(currentHealth) && Number.isFinite(priorHealth) && currentHealth < priorHealth && !movementAdvanced ? (priorPoll?.healthFallPolls ?? 0) + 1 : 0;
  const verdict = evaluateRules({ now: polledAt, history: evidenceRows, lastUsefulAt, idleMs, held, health: { ...health, score: currentHealth }, previousHealth: priorPoll?.health ?? null, healthFallPolls, movementAdvanced, hostileVisible: hasHostile(snapshot), bodyGoal: bodyGoal(snapshot), inputHeld: inputHeld === true, activeTask: activeTask ?? false, lease, config });
  const verdictRow = { ...verdict, enforce, control: { generation: health.generation ?? null, frame: snapshot.basis?.frame ?? null } };
  if (enforce) for (const action of verdict.actions) try {
    const command = action.type === 'hold' ? 'hold' : 'stop';
    const dataDir = path.dirname(path.dirname(runDir));
    fs.mkdirSync(dataDir, { recursive: true });
    const temp = path.join(dataDir, `.watch-command-${process.pid}.tmp`);
    fs.writeFileSync(temp, JSON.stringify({ command, at: now(), reason: action.rule, watcher: true }));
    fs.renameSync(temp, path.join(dataDir, 'command.json'));
    await control.stop();
    action.enforced = true;
  } catch (error) { action.enforcementError = error.message; }
  fs.appendFileSync(path.join(runDir, 'watch.jsonl'), JSON.stringify(verdictRow) + '\n');
  return { verdict: verdictRow, previous: { at: polledAt, position: p, health: { score: currentHealth }, healthFallPolls, inWorld: inWorldNow, idleMs, resetAt, lastUsefulAt: newestUseful } };
}
