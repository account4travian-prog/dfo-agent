// Fake dfo-player.v1 service for model-free Path B tests. It executes no UI and
// has no game/browser dependency; it only exercises the mind's selection logic.
export const PLAYER_CONTRACT = 'dfo-player.v1';
export const LEGACY_INTENTS = ['turn', 'look', 'goto', 'use', 'explore', 'fight', 'retreat', 'stop'];
export const WORKFLOWS = [
  { id: 'ui.enter', version: 1, description: 'Enter the selected normal UI mode', parameterSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['offline', 'online'] } }, required: ['mode'], additionalProperties: false }, allowedPhases: ['frontdoor'], successEvidence: 'location-arrived', maxMs: 30000 },
  { id: 'ui.close-modal', version: 1, description: 'Close the current modal with Escape', parameterSchema: { type: 'object', properties: {}, additionalProperties: false }, allowedPhases: ['modal', 'frontdoor'], successEvidence: 'inventory-changed', maxMs: 10000 },
  { id: 'inventory.equip', version: 1, description: 'Equip an inventory item', parameterSchema: { type: 'object', properties: { itemName: { type: 'string' } }, required: ['itemName'], additionalProperties: false }, allowedPhases: ['world'], successEvidence: 'item-equipped', maxMs: 30000 },
];

export function makePlayerHealth(overrides = {}) {
  return {
    ok: true, contractVersion: 'dfo-control.v1', playerContractVersion: PLAYER_CONTRACT, generation: 1,
    capabilities: { intents: LEGACY_INTENTS, snapshot: true, requestFencing: true, images: true, ui: true, tasks: true, uiActions: true, workflows: WORKFLOWS.map(workflow => workflow.id) },
    ...overrides,
  };
}
export function makePlayerSnapshot({ phase = 'world', nativeReady = true, ui = null, observation = 1 } = {}) {
  return {
    contractVersion: 'dfo-control.v1', observationId: `obs-${observation}`,
    basis: { pageId: 'page-1', generation: 1, frame: 1 },
    captured: { startedAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-01-01T00:00:00.010Z', coherent: true },
    native: {
      ready: nativeReady,
      state: { pos: [0, 0, 0], yaw: 0, pitch: 0, mode: 'dungeon', vitals: { health: 100, maxHealth: 100 }, overlay: phase === 'modal', paused: false, loading: phase === 'loading', scan: { page: 'page-1', frame: 1, id: 1, fresh: true } },
      view: { scan: { page: 'page-1', frame: 1, id: 1, things: [] } }, window: null, events: { lines: [], dropped: 0 }, targets: [],
    },
    player: { phase, facts: phase === 'frontdoor' ? ['mode choices visible'] : phase === 'modal' ? ['modal open'] : [] },
    ui: ui ?? (phase === 'frontdoor' || phase === 'modal' ? { observationId: `ui-${observation}`, text: phase === 'frontdoor' ? 'Offline Online Continue' : 'Inventory', controls: phase === 'frontdoor' ? [{ id: 0, tag: 'button', text: 'Offline', disabled: false }, { id: 1, tag: 'button', text: 'Online', disabled: false }] : [{ id: 0, tag: 'button', text: 'Close', disabled: false }] } : null),
  };
}

export function createFakePlayerService({ health = makePlayerHealth(), snapshots = [{}], tasks = [], workflows = WORKFLOWS } = {}) {
  const calls = [];
  let snapshotIndex = 0;
  let active = null;
  let serial = 0;
  function nextSnapshot() {
    const override = snapshots[Math.min(snapshotIndex++, snapshots.length - 1)] ?? {};
    return makePlayerSnapshot({ ...(override.snapshot ?? override), observation: snapshotIndex });
  }
  function finishSpec() { return tasks.shift() ?? { polls: 1, outcome: 'completed', evidence: null }; }
  async function request(path, body) {
    calls.push({ path, body });
    if (path === '/health') return health;
    if (path === '/workflows') return { schemaVersion: 'dfo-workflows.v1', workflows };
    if (path.startsWith('/snapshot')) {const s=nextSnapshot();if(path.includes('ui=1')&&!s.ui)s.ui={observationId:`ui-${snapshotIndex}`,text:'',controls:[]};return s;}
    if (path === '/task' && body) {
      if (active) return { error: 'task already running' };
      const spec = finishSpec();
      active = { requestId: body.requestId, authority: body.authority, kind: body.task.kind, poll: 0, spec, id: `task-${++serial}` };
      return { task: { id: active.id, requestId: body.requestId, authority: body.authority, kind: active.kind, status: 'running', progress: {} } };
    }
    if (path.startsWith('/task?')) {
      if (!active) throw Object.assign(new Error('unknown task'), { status: 404 });
      active.poll++;
      const events = active.spec.eventsByPoll?.[active.poll - 1] ?? [];
      if (active.poll >= (active.spec.polls ?? 1)) {
        const task = { id: active.id, requestId: active.requestId, authority: active.authority, kind: active.kind, status: 'terminal', outcome: active.spec.outcome ?? 'completed', progress: active.spec.progress ?? {}, evidence: active.spec.evidence ?? null, ...(active.spec.cleanupPending ? { cleanupPending: true } : {}) };
        active = null;
        return { task, events };
      }
      return { task: { id: active.id, requestId: active.requestId, authority: active.authority, kind: active.kind, status: 'running', progress: {} }, events };
    }
    if (path === '/task/cancel') { const value = active ? { requestId: active.requestId, reason: body?.reason ?? null } : null; active = null; return { cancelled: true, task: value }; }
    if (path === '/stop' || path === '/pause' || path === '/resume') return { ok: true };
    if (path === '/intent' || path.startsWith('/intent?') || path === '/intent/cancel') throw Object.assign(new Error('legacy intent endpoint should not be used with player tasks'), { status: 400 });
    throw Object.assign(new Error(`unknown path ${path}`), { status: 404 });
  }
  return {
    request, calls, workflows,
    counts: () => ({ tasks: calls.filter(call => call.path === '/task').length, taskPolls: calls.filter(call => call.path.startsWith('/task?')).length, cancels: calls.filter(call => call.path === '/task/cancel').length, intents: calls.filter(call => call.path === '/intent').length }),
    taskKinds: () => calls.filter(call => call.path === '/task').map(call => call.body.task.kind),
  };
}
