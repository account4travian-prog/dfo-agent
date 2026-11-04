// THE EXPLORATION HAND (Claude, 2026-10-18; docs/17): "explore" with no heading means KEEP EXPLORING. A robot's frontier
// exploration, not a strategy: the hand goes to the nearest edge of the ground the agent has observed, then the next,
// without a model call between them, and gives the decision back to the mind when something worth one appears.
//
// It knows nothing of this game: no direction, no exit, no place. It reads only what the roles can read - the session
// map (observed support, route.mjs), the Body's own events and the sensors' things and foes - and it moves the Body only
// by the goals the roles already have ("goto"), through the same door (the controller's queue, its checks, the
// gateway's stop and fence). It is not a timer: the loop's own pass drives it, so an operator stop, a reload, a frame
// change or a new goal ends it at once and nothing outlives the loop.
//
//   prepare()  the first edge, before the goal is set       (the controller's planRoute hook)
//   commit()   the goal was accepted: the run begins
//   hear()     the Body's events each pass (arrivals, failures, the things in each scan)
//   step()     each pass: a command - wait, goto <next edge>, finish with a reason, or ended
//
// A run STOPS (one task outcome with a plain reason) when: a window opens; a foe, door, exit door, person or loot comes
// into view that was not seen before; the Body is stopped by water or a ledge twice; it cannot reach three edges in a
// row; no reachable edge is left; 12 edges have been visited; or 90 s have passed.
import { walkable, frontiers, navigationFor } from './route.mjs';

export const EXPLORE_LIMITS = { frontiers: 12, seconds: 90 };
const VISITED_M = 1.5;       // a frontier this close to one already chosen this visit is visited
const TRAIL_M = 1.0;         // ... or to ground the feet have stood on
const LEAF_M = 0.6;          // a frontier this close to the way to a farther one is on the way, not an end
const REACH_M = 28;          // the farthest edge chosen (a navigation packet carries the 32 m around the feet)
const TRIES = 24;            // route searches per choice
const FOUND = 10;            // reachable edges compared per choice
const FAILS_IN_A_ROW = 3;
const VISITED_KEEP = 300, SEEN_KEEP = 400, WALKED_KEEP = 800;
const THING_M = 1.5, PERSON_M = 8;   // the same kind this close is the same thing (a person walks about)
const HAZARD = /water|ledge/i;
const ACTIVE_TASK = ['running', 'suspended'];

const hostileCounts = (state) => {
  const counts = new Map();
  for (const f of state?.foes ?? []) if (f?.hostile) counts.set(f.type ?? 'something', (counts.get(f.type ?? 'something') ?? 0) + 1);
  return counts;
};
const thingsIn = (scan) => (scan?.things ?? []).filter((t) => typeof t?.kind === 'string' && Number.isFinite(t.x) && Number.isFinite(t.z)).map((t) => ({ kind: t.kind, x: t.x, z: t.z }));
const sameThing = (a, b) => a.kind === b.kind && Math.hypot(a.x - b.x, a.z - b.z) < (a.kind === 'person' ? PERSON_M : THING_M);
const near = (a, b) => Math.abs(a - b) < 1e-6;
const heading = (from, x, z) => (((Math.atan2(x - from[0], z - from[1]) * 180) / Math.PI) + 360) % 360;   // 0 = +z, as "facing"

function distToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
/** A route as points every half metre or less, from `from`: the ground a run has gone over. */
const densify = (from, points) => {
  const out = []; let prev = from;
  for (const p of points) {
    const n = Math.max(1, Math.ceil(Math.hypot(p[0] - prev[0], p[1] - prev[1]) / 0.5));
    for (let i = 1; i <= n; i++) out.push([prev[0] + (p[0] - prev[0]) * i / n, prev[1] + (p[1] - prev[1]) * i / n]);
    prev = p;
  }
  return out;
};
const onWay = (p, line) => line.some((a, i) => i && distToSegment(p.x, p.z, line[i - 1][0], line[i - 1][1], a[0], a[1]) < LEAF_M);

/**
 * The nearest unvisited frontier of the observed ground, by route length from the feet, or null. A frontier is a
 * supported cell with unknown ground beside it (a wall, water or ledge already seen is not unknown). One on the way to
 * a farther one is only a point along a corridor, so the ends are compared; ties go by bearing. `visited` are the edges
 * chosen before (this visit) and `walked` the ground gone over to reach them; ground the feet have stood on counts too.
 */
export function pickFrontier({ state, snapshot, visited = [], walked = [], tries = TRIES }) {
  if (!Array.isArray(state?.pos) || !snapshot) return null;
  const graph = walkable(null, snapshot), [x, , z] = state.pos, size = snapshot.cell ?? 0.5;
  const trail = (snapshot.cells ?? []).map(([cx, cz]) => [(cx + 0.5) * size, (cz + 0.5) * size]);
  const skip = (tx, tz) => visited.some(([vx, vz]) => Math.hypot(vx - tx, vz - tz) < VISITED_M)
    || trail.some(([cx, cz]) => Math.hypot(cx - tx, cz - tz) < TRAIL_M) || walked.some(([wx, wz]) => Math.hypot(wx - tx, wz - tz) < TRAIL_M);
  const found = frontiers(graph, x, z, null, { max: FOUND, level: snapshot.level ?? 0, open: true, nearest: true, partial: true, tries, skip, routes: true }).filter((f) => f.walk <= REACH_M);
  const ends = found.filter((a) => !found.some((b) => b !== a && b.walk > a.walk + 1 && onWay(a, [[x, z], ...b.route])));
  ends.sort((a, b) => (Math.round(a.walk * 10) - Math.round(b.walk * 10)) || heading([x, z], a.x, a.z) - heading([x, z], b.x, b.z));
  return ends[0] ? { x: ends[0].x, z: ends[0].z, walk: ends[0].walk, path: densify([x, z], ends[0].route) } : null;
}

export function createAutopilot({ now = () => Date.now(), limits = EXPLORE_LIMITS, pick = pickFrontier } = {}) {
  let place = null, visited = [], walked = [], seen = [], run = null;
  let recent = [];   // the latest goal notes and outcomes heard, in order, for a goal whose acceptance is learned a moment after its events
  const forget = () => { visited = []; walked = []; seen = []; recent = []; };
  const mark = (t) => {
    visited.push([t.x, t.z]); if (visited.length > VISITED_KEEP) visited.shift();
  };

  /** A thing in a scan: new to this visit, and so news to a run in progress. */
  function remember(t, news = true) {
    if (seen.some((s) => sameThing(s, t))) return;
    seen.push(t); if (seen.length > SEEN_KEEP) seen.shift();
    if (run && news) run.fresh.push(t);
  }
  function hopEvent(e) {
    const hop = run.hop;
    if (!hop) return;
    if (e.kind === 'goal' && hop.seq == null) {
      // the Body's own note of the goal it was given: events before it belong to the goal before
      let g = null; try { g = JSON.parse(e.text); } catch { /* not a goal note */ }
      if (g?.kind === 'goto' && near(g.x, hop.target.x) && near(g.z, hop.target.z)) hop.seq = e.seq;
    } else if (hop.seq != null && e.seq > hop.seq) {
      if (e.kind === 'arrived') hop.end = { ok: true, text: e.text };
      else if (e.kind === 'goal-failed') hop.end = { ok: false, reason: String(e.text ?? 'the goal failed') };
    }
  }
  const hopFrom = (target) => { const hop = { target, sentAt: now(), seq: null, end: null, refused: null }; if (run) { run.hop = hop; for (const e of recent) hopEvent(e); } return hop; };

  return {
    get active() { return !!run; },
    get rev() { return run?.rev ?? null; },
    get visited() { return visited.map((v) => [...v]); },

    /** The Body's events of this pass, and the visit they belong to (a new visit forgets the old one's edges and things). */
    hear(events = [], { place: key } = {}) {
      if (key !== undefined && key !== place) { place = key; forget(); }
      for (const e of events) {
        if (e.kind === 'scan') for (const t of thingsIn(e.data?.scan)) remember(t);
        else if (e.kind === 'goal' || e.kind === 'arrived' || e.kind === 'goal-failed') {
          recent.push(e); if (recent.length > 30) recent.shift();
          if (run) hopEvent(e);
        }
      }
    },

    /** The first edge for a run, before its goal is set: { refuse } or the goto it would start with (and its ticket). */
    prepare({ state, snapshot }) {
      if (state?.overlay) return { refuse: 'a window is open: close it first' };
      const t = pick({ state, snapshot, visited, walked });
      if (!t) return { refuse: `explored all reachable known ground (${visited.length} edges visited): look around, or choose a place to go` };
      const navigation = navigationFor(state, snapshot, { kind: 'goto', x: t.x, z: t.z }, 0);
      if (navigation.route.status !== 'complete') return { refuse: 'no complete route over known ground to any edge' };
      return { x: t.x, z: t.z, walk: t.walk, path: t.path, navigation, snapshot };
    },

    /** The goal was accepted as task `rev`: the run begins at the edge `ticket` named. */
    commit(ticket, { rev, epoch, bodyId, state }) {
      run = { rev, epoch, bodyId, frame: state.frame, place: `${state.frame}:${state.mode}`, key: ticket.snapshot.key, startedAt: now(), visits: 1, fails: 0, hazards: 0, lastHazard: null,
        fresh: [], foes: hostileCounts(state), hop: null, arrived: 0 };
      hopFrom({ x: ticket.x, z: ticket.z });
      for (const t of ticket.snapshot.things ?? []) remember({ kind: t.kind, x: t.x, z: t.z }, false);   // what a look already showed
      mark(ticket);
      return run.rev;
    },

    /** The next goto was accepted / refused / could not be sent. */
    sent(cmd) { if (run?.rev === cmd.rev) hopFrom(cmd.target); },
    refused(cmd, why) { if (run?.rev === cmd.rev) hopFrom(cmd.target).refused = String(why).slice(0, 160); },

    /** Ends the run from outside (a stop, a reload, a new place). Answers what ended, or null. */
    cancel(why) { if (!run) return null; const r = { rev: run.rev, why }; run = null; return r; },
    reset() { run = null; forget(); },

    /**
     * One pass. `status` is the Body's, read at `readAt` (one older than the last goal sent says nothing yet); `task` is
     * the record's { rev, status }. Answers null, or { kind: 'wait', note } | { kind: 'goto', target, navigation } |
     * { kind: 'finish', status, reason } | { kind: 'ended', reason } - each with the run's `rev`.
     */
    step({ readAt = Infinity, op = null, status, state, snapshot, task, epoch, bodyId }) {
      if (!run) return null;
      const r = run;
      const out = (kind, extra) => { run = null; return { kind, rev: r.rev, ...extra }; };
      const ended = (reason) => out('ended', { reason });
      const finish = (st, reason) => out('finish', { status: st, reason, visits: r.visits, seconds: Math.round((now() - r.startedAt) / 1000) });

      if (op?.stopped) return ended('the operator stopped the agent');
      if (task.rev !== r.rev || !ACTIVE_TASK.includes(task.status)) return ended('the goal was replaced or ended');
      if (epoch !== r.epoch || bodyId !== r.bodyId) return ended('the page or the session changed');
      if (state.frame !== r.frame || `${state.frame}:${state.mode}` !== r.place || (snapshot && snapshot.key !== r.key)) return ended('the character is somewhere else now');
      // A planned route is not ground already walked: a blocked hop must leave its untraversed branches available.
      if (Array.isArray(state.pos) && (!walked.length || Math.hypot(state.pos[0]-walked.at(-1)[0],state.pos[2]-walked.at(-1)[1]) >= 0.25)) {
        walked.push([state.pos[0],state.pos[2]]); if (walked.length > WALKED_KEEP) walked.shift();
      }

      if (state.overlay) return finish('succeeded', 'a window opened');
      for (const [type, n] of hostileCounts(state)) if (n > (r.foes.get(type) ?? 0)) {
        const f = (state.foes ?? []).find((x) => x.hostile && (x.type ?? 'something') === type);
        return finish('succeeded', `a foe came into view (${type}${Number.isFinite(f?.dist) ? `, ${Math.round(f.dist)} m` : ''})`);
      }
      if (r.fresh.length) {
        const [x, , z] = state.pos ?? [0, 0, 0];
        const list = r.fresh.sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z));
        return finish('succeeded', `something new came into view: ${list.slice(0, 3).map((t) => `${t.kind} at (${Math.round(t.x)}, ${Math.round(t.z)}), ${Math.round(Math.hypot(t.x - x, t.z - z))} m away`).join('; ')}${list.length > 3 ? ` and ${list.length - 3} more` : ''}`);
      }
      if (now() - r.startedAt >= limits.seconds * 1000) return finish('succeeded', `${limits.seconds} s of exploring, ${r.visits} edges visited`);

      const hop = r.hop;
      if (hop.sentAt > readAt) return { kind: 'wait', rev: r.rev, note: null };   // a status older than the goal just sent
      const g = status?.goal;
      if (!g && !hop.refused) return { kind: 'wait', rev: r.rev, note: null };
      if (!hop.refused) {
        if (g?.kind === 'goto' && near(g.x, hop.target.x) && near(g.z, hop.target.z)) return { kind: 'wait', rev: r.rev, note: `exploring: edge ${r.visits} of ${limits.frontiers}, heading to (${Math.round(hop.target.x)}, ${Math.round(hop.target.z)})` };
        if (g?.kind !== 'idle') return ended('another goal replaced the exploring');
      }

      // the edge is done: reached, or given up on
      const end = hop.refused ? { ok: false, reason: `the goal was refused: ${hop.refused}` }
        : hop.end ?? { ok: false, reason: hop.seq == null ? 'the goal never started' : 'the Body went idle without finishing' };
      if (end.ok) { r.fails = 0; r.arrived++; } else { r.fails++; if (HAZARD.test(end.reason)) { r.hazards++; r.lastHazard = end.reason; } }
      if (r.hazards >= 2) return finish('failed', `water or a ledge stopped the Body twice (last: ${r.lastHazard})`);
      if (r.fails >= FAILS_IN_A_ROW) return finish('failed', `the Body could not get to ${r.fails} edges in a row (last: ${end.reason})`);
      if (r.visits >= limits.frontiers) return finish('succeeded', `${r.visits} edges visited`);
      const t = pick({ state, snapshot, visited, walked });
      if (!t) return finish('succeeded', `explored all reachable known ground (${r.visits} edges visited)`);
      const navigation = navigationFor(state, snapshot, { kind: 'goto', x: t.x, z: t.z }, 0);
      if (navigation.route.status !== 'complete') return finish('succeeded', `explored all reachable known ground (${r.visits} edges visited)`);
      mark(t);
      r.visits++;
      return { kind: 'goto', rev: r.rev, epoch: r.epoch, frame: r.frame, target: { x: t.x, z: t.z }, navigation, walk: t.walk, note: `exploring: edge ${r.visits} of ${limits.frontiers}, heading to (${Math.round(t.x)}, ${Math.round(t.z)})` };
    },
  };
}

/**
 * The loop's side of the hand: the controller's planRoute hook for a goal with no heading, and the pass that carries a
 * run on. Every goal it sends goes through the controller's queue and the checks every reply goes through, and its
 * outcome is ONE record in the task and ONE event for the planner.
 */
export function createExplorationHand({ autopilot, http, controller, task, lifecycle, record = () => {}, news = () => {}, say = () => {}, now = () => Date.now() }) {
  const log = (text, extra = {}) => record('events.jsonl', { seq: 0, t: now(), rt: now(), kind: 'autopilot', text, ...extra });
  const settle = (cancelled, reason) => { if (cancelled) task.finish('cancelled', reason, cancelled.rev); };

  async function send(cmd, { op, bodyId, bodySeq }) {
    const goal = { kind: 'goto', x: cmd.target.x, z: cmd.target.z, navigation: cmd.navigation };
    const r = await controller.exclusive(async () => {
      const cur = task.current;
      if (cur.rev !== cmd.rev || !ACTIVE_TASK.includes(cur.status) || autopilot.rev !== cmd.rev) return { gone: 'the exploring ended' };
      const why = await controller.check({ epoch: cmd.epoch, frame: cmd.frame, bodyId, operatorRevision: op?.revision, bodySeq, grantId: null });
      if (why) return { gone: why };
      return http.request('POST', '/body/goal', goal, { accept: [400, 409, 423] });
    });
    if (r?.gone) { settle(autopilot.cancel(r.gone), r.gone); log(`stopped: ${r.gone}`); return; }
    if (r.status === 200) { autopilot.sent(cmd); task.annotate(cmd.note, cmd.rev); log(cmd.note, { target: cmd.target, walk: Math.round(cmd.walk * 10) / 10 }); return; }
    if (r.status === 423 || r.status === 409) { const why = r.status === 423 ? 'the operator stopped the agent' : 'the game is being checked'; settle(autopilot.cancel(why), why); log(`stopped: ${why}`); return; }
    const why = (r.body?.errors ?? [r.body?.why]).filter(Boolean).join('; ') || `status ${r.status}`;
    autopilot.refused(cmd, why); log(`edge refused: ${why}`, { target: cmd.target });
  }

  return {
    get active() { return autopilot.active; },
    hear: (events, ctx) => autopilot.hear(events, ctx),

    /** The controller's planRoute for an explore goal with no heading; null for any other goal. */
    plan(goal, state, { bodyId = null } = {}) {
      if (goal?.kind !== 'explore' || (goal.heading !== undefined && goal.heading !== null)) return null;
      if (!state || !Array.isArray(state.pos)) return { refuse: 'nowhere known to explore from yet' };
      const t = autopilot.prepare({ state, snapshot: lifecycle.memory.snapshot(state) });
      if (t.refuse) return { refuse: t.refuse };
      return {
        goal: { kind: 'goto', x: t.x, z: t.z, navigation: t.navigation },
        how: `exploring by itself, first to (${Math.round(t.x)}, ${Math.round(t.z)}), ${Math.round(t.walk)} m`,
        started: (rev) => {
          autopilot.commit(t, { rev, epoch: lifecycle.epoch, bodyId, state });
          task.hold();
          log(`begun: edge 1 of ${EXPLORE_LIMITS.frontiers} at (${Math.round(t.x)}, ${Math.round(t.z)}), ${Math.round(t.walk)} m`, { target: { x: t.x, z: t.z } });
        },
      };
    },

    /** Called every pass of the loop, after the Body's events are in. */
    async pass({ readAt, op, status, state, bodyId, bodySeq }) {
      if (!autopilot.active) return;
      const cur = task.current;
      const cmd = autopilot.step({ readAt, op, status, state, snapshot: lifecycle.memory.snapshot(state), task: { rev: cur.rev, status: cur.status }, epoch: lifecycle.epoch, bodyId });
      if (!cmd) return;
      if (cmd.kind === 'wait') { if (cmd.note) task.annotate(cmd.note, cmd.rev); return; }
      if (cmd.kind === 'goto') return send(cmd, { op, bodyId, bodySeq });
      if (cmd.kind === 'ended') { task.finish('cancelled', cmd.reason, cmd.rev); log(`ended: ${cmd.reason}`); return; }
      // finish: one outcome for the task and one event the planner wakes on
      task.finish(cmd.status, cmd.reason, cmd.rev);
      const ev = { seq: 0, t: now(), rt: now(), kind: 'explored', text: `exploring stopped: ${cmd.reason} (${cmd.visits} edges, ${cmd.seconds} s)` };
      news(ev); record('events.jsonl', ev); say(ev.text);
      // a walk still going when the hand stops (a door came into view) stops with it; the mind decides what next
      if (status?.goal?.kind === 'goto') await controller.exclusive(() => http.request('POST', '/body/goal', { kind: 'idle' }, { accept: [400, 409, 423] }));
    },

    /** A stop, a reload, a frame change: the run ends and its task is cancelled. */
    cancel(why) { const c = autopilot.cancel(why); settle(c, why); if (c) log(`cancelled: ${why}`); },
    /** A page reload: the edges and things of the old page mean nothing. */
    reset() { autopilot.reset(); },
  };
}
