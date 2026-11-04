// Minimal fake dfo-control.v1 driver and fake model transport for Path B tests.
// No browser, game, network or paid model is involved.
export const LEGACY_INTENTS = ['turn', 'look', 'goto', 'use', 'explore', 'fight', 'retreat', 'stop'];

export function fakeHealth(overrides = {}) {
  return {
    ok: true, contractVersion: 'dfo-control.v1', generation: 1,
    capabilities: { intents: LEGACY_INTENTS, snapshot: true, requestFencing: true, images: true, ui: true },
    ...overrides,
  };
}

export function fakeSnapshot(overrides = {}) {
  return {
    contractVersion: 'dfo-control.v1', observationId: 'obs-1',
    basis: { pageId: 'page-1', generation: 1, frame: 1 },
    captured: { startedAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-01-01T00:00:00.010Z', coherent: true },
    native: {
      ready: true,
      state: { pos: [0, 0, 0], yaw: 0, pitch: 0, frame: 1, mode: 'dungeon', vitals: { health: 100, maxHealth: 100 }, weapon: null, overlay: false, paused: false, loading: false, scan: { page: 'page-1', frame: 1, id: 1, fresh: true } },
      view: { scan: { page: 'page-1', frame: 1, id: 1, things: [] } },
      window: null, events: { lines: [], dropped: 0 }, targets: [],
    },
    ui: null,
    ...overrides,
  };
}

/**
 * createFakeDriver({ health, snapshots, intents })
 * - snapshots: array of partial snapshot overrides; the last one repeats.
 * - intents: array of {polls, outcome, progress, events, cleanupPending}; consumed per start.
 */
export function createFakeDriver({ health = fakeHealth(), snapshots = [{}], intents = [], onRequest = null } = {}) {
  const calls = [];
  let snapshotIndex = 0;
  let active = null;
  let serial = 0;
  let observation = 0;
  let generation = health.generation ?? 1;
  function nextSnapshot() {
    const override = snapshots[Math.min(snapshotIndex, snapshots.length - 1)] ?? {};
    snapshotIndex++;
    observation++;
    const snapshot = fakeSnapshot({
      ...override,
      observationId: override.observationId ?? `obs-${observation}`,
      basis: { pageId: override.basis?.pageId ?? 'page-1', generation: override.basis?.generation ?? generation, frame: override.basis?.frame ?? 1 },
      native: { ...fakeSnapshot().native, ...(override.native ?? {}) },
    });
    return snapshot;
  }
  function task(requestId, authority, kind, status, extra = {}) {
    return { id: `task-${serial}`, requestId, authority, kind, status, ...extra };
  }
  async function request(path, body) {
    calls.push({ path, body });
    onRequest?.(path, body, calls);
    if (path === '/health') return health;
    if (path.startsWith('/snapshot')) return nextSnapshot();
    if (path === '/intent' && body) {
      if (active) return { error: 'task already running' };
      const spec = intents.shift() ?? { polls: 1 };
      active = { requestId: body.requestId, authority: body.authority, intent: body.intent, poll: 0, spec, taskId: ++serial };
      return { task: task(body.requestId, body.authority, body.intent.kind, 'running', { id: `task-${serial}`, progress: {} }) };
    }
    if (path.startsWith('/intent?')) {
      if (!active) throw Object.assign(new Error('no task'), { status: 404 });
      active.poll++;
      const spec = active.spec;
      const events = spec.eventsByPoll?.[active.poll - 1] ?? spec.events ?? [];
      if (active.poll >= (spec.polls ?? 1)) {
        const taskValue = task(active.requestId, active.authority, active.intent.kind, 'terminal', {
          id: `task-${active.taskId}`, outcome: spec.outcome ?? 'completed', progress: spec.progress ?? {},
          ...(spec.cleanupPending ? { cleanupPending: true } : {}), ...(spec.evidence ? { evidence: spec.evidence } : {}),
        });
        active = null;
        return { task: taskValue, events };
      }
      return { task: task(active.requestId, active.authority, active.intent.kind, 'running', { id: `task-${active.taskId}`, progress: {} }), events };
    }
    if (path === '/intent/cancel') {
      const cancelled = active ? { requestId: active.requestId, reason: body?.reason ?? null } : null;
      active = null;
      return { cancelled: true, task: cancelled };
    }
    if (path === '/stop' || path === '/pause' || path === '/resume') return { ok: true, [path.slice(1)]: true };
    if (path === '/action') return { issued: true, generation: body?.generation ?? generation };
    throw new Error(`fake driver: unknown path ${path}`);
  }
  return {
    request, calls, get generation() { return generation; },
    setGeneration(value) { generation = value; },
    counts: () => ({ starts: calls.filter(call => call.path === '/intent').length, polls: calls.filter(call => call.path.startsWith('/intent?')).length, cancels: calls.filter(call => call.path === '/intent/cancel').length }),
  };
}

export function fakeModels(script = []) {
  const calls = [];
  async function askModel(options) {
    calls.push(options);
    const next = script.shift();
    if (!next) throw new Error('fake model: unexpected call');
    if (typeof next === 'function') return next(options);
    return {
      json: next.json, text: JSON.stringify(next.json),
      usage: next.usage ?? { input_tokens: 100, cached_input_tokens: 40, output_tokens: 10 },
      ms: next.ms ?? 1, requestedModel: options.model,
    };
  }
  return { askModel, calls, remaining: () => script.length, push: item => script.push(item) };
}

export function terraPlan({ baseVersion = 0, steps = [{ id: 's1', skill: 'explore', args: {}, maxMs: 60000 }], complete = false, goal = 'Explore the room', memory = '', reassessOn = [], ttlMs = 600000, reason = '' } = {}) {
  return { schemaVersion: 'dfo-mind.v1', goal, memory, handbookQuery: '', baseVersion, complete, reason, ttlMs, reassessOn, steps };
}
export function completePlan({ baseVersion, goal = 'Done' } = {}) {
  return { schemaVersion: 'dfo-mind.v1', goal, memory: '', handbookQuery: '', baseVersion, complete: true, reason: 'complete', ttlMs: 600000, reassessOn: [], steps: [] };
}
export function lunaLook(note = 'look around') {
  return { schemaVersion: 'dfo-mind.v1', note, memory: '', handbookQuery: '', escalate: false, intent: { kind: 'look', targetIndex: null, x: null, z: null, degrees: null, range: null, maxMs: null, stopHpPct: null } };
}
export function solReview(note = 'review') {
  return { schemaVersion: 'dfo-mind.v1', goal: 'Done', memory: '', handbookQuery: '', strategyNote: note, review: { summary: note, confidence: 'low', findings: [], recommendations: [] }, engineering: null };
}
