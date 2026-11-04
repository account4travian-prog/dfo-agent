// THE BODY (docs/07 sections 3 and 3.1): the agent's reflexes. It runs inside the game page on its own clock (20 times
// a second) and costs no tokens. It turns, walks, backs off, swings and uses a quick slot, through window.__agent and
// nothing else, so it can do no more than the agent mode allows.
//
// ABILITIES, NEVER STRATEGY. What the Body does is decided by its POLICY TABLE: rules the agent's mind writes and
// rewrites from experience. A table is data in a fixed vocabulary (CONDITIONS, ACTS, SETTINGS below), checked by
// validatePolicy before it is used: nothing a model writes is ever run as code. The starter table follows the mind's
// goal, with one declared instinct: strike back at what attacks you up close (STARTER_POLICY's 'defend'). A win
// reached with it is reported as such. When to fight, flee or heal is otherwise for the agent to learn.
//
// It also watches: what changed (a foe in sight, a wound, being stuck, a window) goes into an event log, which is what
// wakes the mind.
//
// This file has no imports: the gateway injects it into the page as a plain script (its `export` keywords stripped),
// and the tests import it as a module.

const TICK_MS = 50;
const LOG_MAX = 300;
const SCAN_LOG_MAX = 16;   // scan samples kept in the log (see note)
const THREAT_MS = 3000;      // bridge short occlusion and range flicker; not an indefinite pursuit
const FOE_RADIUS_M = 0.45;  // a visible body's footprint, including rounded bearing/distance uncertainty
const FOE_TRAIL_MS = 1000;  // moving bodies must not leave permanent prop walls behind
const CLOSE_M = 1.3;        // step this close to a foe before swinging
const SIGHT = 20;            // metres: a hostile closer than this is "in sight" for the events

// ---------------------------------------------------------------------------------------------------------------
// The vocabulary

const num = (lo, hi) => ({ kind: 'number', lo, hi });
const int = (lo, hi) => ({ kind: 'int', lo, hi });
const points = (optional = false) => ({ kind: 'points', max: 256, optional });   // [[x, z], ...] waypoints

/** A rule's `when`: every key given must hold. An empty `when` always holds. */
export const CONDITIONS = {
  hpBelowPct: num(0, 100),
  hpAbovePct: num(0, 100),
  fatigueBelowPct: num(0, 100),
  magickaBelowPct: num(0, 100),
  hostileWithin: num(0, 40),       // the nearest hostile foe is this close (metres)
  noHostileWithin: num(0, 40),     // no hostile foe this close
  hostilesAtLeast: int(1, 20),     // this many hostiles in sight
  goal: { kind: 'enum', of: ['idle', 'explore', 'goto', 'turn', 'look', 'use', 'route', 'follow'] },
};

const TARGET = { kind: 'enum', of: ['nearestHostile'] };

/** A rule's `do`: one act and its parameters. */
export const ACTS = {
  fight: { target: TARGET },                         // close to reach, face, swing
  face: { target: TARGET },
  keepAway: { target: TARGET, range: num(1, 30) },   // back off while facing, until this far
  flee: { from: TARGET },                            // turn away and run
  useSlot: { slot: int(1, 2) },                      // press quick slot 1 or 2 (whatever is in it)
  followGoal: {},                                    // do the mind's current goal
  stop: {},                                          // stand still
};

/** The Body's tunable numbers: [lowest, highest, starting value]. Starting values are plain, not tuned. */
export const SETTINGS = {
  reach: [0.5, 6, 2],                 // metres: how close "fight" closes before swinging
  swingMs: [50, 2000, 250],           // how long a swing is held
  swingCooldownMs: [100, 5000, 700],  // the least time between swings
  slotCooldownMs: [500, 60000, 5000], // the least time between quick-slot uses
  faceToleranceDeg: [2, 45, 12],      // facing "enough" to walk or swing
  pxPerDeg: [0.5, 20, 3.5],           // the look's pixels per degree of turn (measured in Phase 0: 300 px = ~86 deg)
  stuckSeconds: [0.5, 10, 1.5],       // walking this long without moving is "stuck"
  wallStop: [0.3, 2, 0.7],            // metres: a wall this close in front is not walked into (in DFO that starts a climb)
  strideMs: [1000, 10000, 3000],      // forward is held at most this long at a stretch...
  strideRestMs: [50, 1000, 150],      // ...then let go this long, as a person's steps would
};

/** The mind's current goal. */
export const GOALS = {
  idle: {},
  explore: { heading: { ...num(0, 360), optional: true } },   // walk this way (degrees, as state().yaw reads); turns aside when stuck. With no heading the mind loop explores edge to edge (agent/mind/autopilot.mjs) and sends the Body goto goals
  goto: { x: num(-1e7, 1e7), z: num(-1e7, 1e7) },
  turn: { by: num(-180, 180) },        // turn in place by this much, then idle
  look: {},                            // turn a full circle, pausing to look each way, then say what was seen
  use: { x: num(-1e7, 1e7), z: num(-1e7, 1e7), via: points(true), target: { kind: 'position', optional: true } },
  follow: { target: { kind: 'position' }, distance: { ...num(1, 10), optional: true } },
  route: { points: points() },         // walk a way found on the map, waypoint by waypoint (the mind finds it)
};

const LOOK_JUMP = 3;        // metres: neighbouring readings further apart than this are separate stretches
const USE_REACH = 1.6;      // metres: close enough to use a thing
const USE_REACH_BLOCKED = 3; // metres: blocked by what is right in front, facing the thing, this near is near enough to use it
const USE_CHECK_MS = 2500;  // after a use, watch this long for anything to change before calling it "nothing happened"
const CLIMB_BACK_MS = 400;  // an accidental climb: step back this long
const STUCK_REPEAT_MS = 3000;   // the same "blocked" line is said at most once in this long
export const SCAN_MAX_AGE_MS = 450;   // a footing sample this old (same page and frame) still certifies the ground left AHEAD of the feet
export const HEADROOM_M = 1.8;
const FOOT_CORE_M = 0.2;        // the radius checked against the footing strip (hazards use the body's full radius)
const CREEP_BELOW_M = 4;        // certified ground ahead shorter than this: walk in short pulses, never run (a careful player in the dark)
const CREEP_PULSE_MS = 600;     // ...each press at most this long, then the usual breath, so a fresh look comes before the strip is used up
const CERT_LOOK_M = 6;          // how far ahead the certified strip is measured

export const STARTER_POLICY = {
  rules: [
    // an instinct, not a plan: anyone swings back at something biting them, and the mind is seconds away
    { id: 'defend', when: { hostileWithin: 2.5 }, do: { act: 'fight', target: 'nearestHostile' }, why: 'starter: strike back at what attacks you up close', source: 'starter' },
    { id: 'default', when: {}, do: { act: 'followGoal' }, why: 'starter: do what the mind asked', source: 'starter' },
  ],
  settings: {},
};

const EYE = 1.7;              // metres: the eye above the feet, to aim a blow at a body
const DRAW_WAIT_MS = 1500;    // after asking for the weapon, wait this long before asking again (it takes a moment)

// ---------------------------------------------------------------------------------------------------------------
// Checking what the mind hands over

function checkValue(spec, v, path, errors) {
  if (spec.kind === 'number' || spec.kind === 'int') {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < spec.lo || v > spec.hi || (spec.kind === 'int' && !Number.isInteger(v))) {
      errors.push(`${path}: a${spec.kind === 'int' ? 'n integer' : ' number'} from ${spec.lo} to ${spec.hi}`);
    }
  } else if (spec.kind === 'enum') {
    if (!spec.of.includes(v)) errors.push(`${path}: one of ${spec.of.join(', ')}`);
  } else if (spec.kind === 'points') {
    const ok = Array.isArray(v) && v.length >= 1 && v.length <= spec.max
      && v.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1e7));
    if (!ok) errors.push(`${path}: a list of 1 to ${spec.max} [x, z] points`);
  } else if (spec.kind === 'position') {
    if (!v || Object.keys(v).some((k) => !['x', 'z'].includes(k)) || !Number.isFinite(v.x) || !Number.isFinite(v.z) || Math.abs(v.x) > 1e7 || Math.abs(v.z) > 1e7) errors.push(`${path}: {x,z} of a visible person`);
  }
}

function checkFields(specs, obj, path, errors, { required = true } = {}) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { errors.push(`${path}: an object`); return; }
  // own keys only: `k in specs` would let "__proto__", "toString" and the like through as vocabulary (Sol's review)
  for (const k of Object.keys(obj)) if (!Object.hasOwn(specs, k) && !(path.endsWith('.do') && k === 'act')) errors.push(`${path}.${k}: not a known field`);
  for (const [k, spec] of Object.entries(specs)) {
    if (obj[k] === undefined) { if (required && !spec.optional) errors.push(`${path}.${k}: missing`); continue; }
    checkValue(spec, obj[k], `${path}.${k}`, errors);
  }
}

const shortText = (v, max) => typeof v === 'string' && v.length <= max;

/** Check a policy table. Returns { ok, errors, policy } - `policy` is a clean copy, with every setting filled in:
 *  a setting the table leaves out keeps its value in `base` (the table in force), else its starting value. */
export function validatePolicy(table, base = {}) {
  const errors = [];
  if (!table || typeof table !== 'object') return { ok: false, errors: ['the table: an object with rules and settings'] };
  const rules = table.rules;
  if (!Array.isArray(rules) || rules.length < 1 || rules.length > 30) errors.push('rules: a list of 1 to 30 rules');
  const ids = new Set();
  for (const [i, r] of (Array.isArray(rules) ? rules : []).entries()) {
    const at = `rules[${i}]`;
    if (!r || typeof r !== 'object') { errors.push(`${at}: an object`); continue; }
    for (const k of Object.keys(r)) if (!['id', 'when', 'do', 'why', 'source'].includes(k)) errors.push(`${at}.${k}: not a known field`);
    if (!shortText(r.id, 40) || !r.id) errors.push(`${at}.id: a name up to 40 characters`);
    else if (ids.has(r.id)) errors.push(`${at}.id: "${r.id}" is used twice`);
    else ids.add(r.id);
    checkFields(CONDITIONS, r.when ?? {}, `${at}.when`, errors, { required: false });
    const act = Object.hasOwn(ACTS, r.do?.act ?? '') ? ACTS[r.do.act] : null;
    if (!act) errors.push(`${at}.do.act: one of ${Object.keys(ACTS).join(', ')}`);
    else checkFields(act, r.do, `${at}.do`, errors);
    if (r.why !== undefined && !shortText(r.why, 200)) errors.push(`${at}.why: text up to 200 characters`);
    if (r.source !== undefined && !shortText(r.source, 60)) errors.push(`${at}.source: text up to 60 characters`);
  }
  const settings = {};
  const given = table.settings ?? {};
  if (typeof given !== 'object' || Array.isArray(given)) errors.push('settings: an object');
  else {
    for (const k of Object.keys(given)) if (!Object.hasOwn(SETTINGS, k)) errors.push(`settings.${k}: not a known setting`);
    for (const [k, [lo, hi, start]] of Object.entries(SETTINGS)) {
      const v = given[k] ?? base[k] ?? start;
      if (typeof v !== 'number' || !Number.isFinite(v) || v < lo || v > hi) errors.push(`settings.${k}: a number from ${lo} to ${hi}`);
      settings[k] = v;
    }
  }
  if (errors.length) return { ok: false, errors };
  const clean = rules.map((r) => ({ id: r.id, when: { ...(r.when ?? {}) }, do: { ...r.do }, why: r.why ?? '', source: r.source ?? '' }));
  return { ok: true, errors: [], policy: { rules: clean, settings } };
}

/** Check a goal. Returns { ok, errors, goal }. */
export function validateGoal(goal) {
  const errors = [];
  const spec = Object.hasOwn(GOALS, goal?.kind ?? '') ? GOALS[goal.kind] : null;
  if (!spec) return { ok: false, errors: [`kind: one of ${Object.keys(GOALS).join(', ')}`] };
  const { kind, ...rest } = goal;
  checkFields(spec, rest, 'goal', errors);
  return errors.length ? { ok: false, errors } : { ok: true, errors: [], goal: { kind, ...rest } };
}

// ---------------------------------------------------------------------------------------------------------------
// Reading the state

const pct = (v, max) => (Number.isFinite(v) && Number.isFinite(max) && max > 0 ? (100 * v) / max : null);
export const norm180 = (d) => { const x = ((d + 180) % 360 + 360) % 360 - 180; return x === -180 ? 180 : x; };

/** Degrees off the facing to a point, positive to the right (the agent mode's bearing law). */
export function bearingTo(state, x, z) {
  const yaw = (state.yaw * Math.PI) / 180;
  const dx = x - state.pos[0], dz = z - state.pos[2];
  const ahead = dx * Math.sin(yaw) + dz * Math.cos(yaw);
  const right = dx * Math.cos(yaw) - dz * Math.sin(yaw);
  return { bearing: (Math.atan2(right, ahead) * 180) / Math.PI, dist: Math.hypot(dx, dz) };
}

export function readSituation(s) {
  const hostiles = (s.foes ?? []).filter((f) => f.hostile);
  const v = s.vitals ?? {};
  return {
    hpPct: pct(v.health, v.maxHealth),
    fatiguePct: pct(v.fatigue, v.maxFatigue),
    magickaPct: pct(v.magicka, v.maxMagicka),
    hostiles,
    nearest: hostiles[0] ?? null,   // the agent mode sorts foes nearest first
  };
}

/** Does a rule's `when` hold. */
export function holds(when, sit, goal) {
  const near = sit.nearest?.dist ?? Infinity;
  const inSight = sit.hostiles.filter((f) => f.dist <= SIGHT).length;
  for (const [k, v] of Object.entries(when ?? {})) {
    const ok = {
      hpBelowPct: () => sit.hpPct != null && sit.hpPct < v,
      hpAbovePct: () => sit.hpPct != null && sit.hpPct > v,
      fatigueBelowPct: () => sit.fatiguePct != null && sit.fatiguePct < v,
      magickaBelowPct: () => sit.magickaPct != null && sit.magickaPct < v,
      hostileWithin: () => near <= v,
      noHostileWithin: () => near > v,
      hostilesAtLeast: () => inSight >= v,
      goal: () => goal?.kind === v,
    }[k]?.();
    if (!ok) return false;
  }
  return true;
}

/** The first rule that holds, or null. */
export const pickRule = (policy, sit, goal) => policy.rules.find((r) => holds(r.when, sit, goal)) ?? null;

// Only prop-like actor hits are ambiguous. A wall, door, water or drop stays real even beside a foe.
export function foeBodyHit(p, footprints) {
  const at=p?.at ?? p?.point;
  return ['prop','tree/prop'].includes(p?.ends) && Array.isArray(at) && footprints.some((f) =>
    Math.hypot(at[0]-f.x,at[2]-f.z)<=FOE_RADIUS_M && at[1]>=f.y-0.1 && at[1]<=f.y+f.h+0.1);
}
export function foeFootprints(scan) {
  const feet=scan?.pose?.feet, yaw=scan?.pose?.direction ?? scan?.pose?.yaw;
  if (!Array.isArray(feet) || !Number.isFinite(yaw)) return [];
  return (scan.foes ?? []).filter((f) => f.hostile && Number.isFinite(f.dist) && Number.isFinite(f.bearing)).map((f) => {
    const angle=yaw+f.bearing*Math.PI/180;
    return {x:feet[0]+Math.sin(angle)*f.dist,z:feet[2]+Math.cos(angle)*f.dist,y:feet[1]+(f.dy ?? 0),h:f.h ?? 1.8,time:scan.time};
  });
}
const cellGap=(ix,iz,x,z) => Math.hypot(Math.max(ix*0.5-x,0,x-(ix+1)*0.5),Math.max(iz*0.5-z,0,z-(iz+1)*0.5));
// Trial 8: a raster corner barely overlaps feet already standing on support. Permit only a local step out,
// never deeper into that wall cell, never from inside it, and never an exemption for water or unknown ground.
const leavingWall=(walls,ix,iz,level,x,z,x0,z0,radius=0.35) => {
  const gap=cellGap(ix,iz,x0,z0);
  return walls.has(navKey(ix,iz,level)) && gap>=radius-0.10-1e-6 && gap<radius &&
    Math.hypot(x-x0,z-z0)<=0.75 && cellGap(ix,iz,x,z)>=gap-1e-6;
};

const wallClearanceIndexes=new WeakMap();
// Trial 10: overlap a raster wall cell only on the observed free side of ALL
// its faces, over floor actually seen in that same cell.
function wallCellClear(graph,ix,iz,level,x,z,height,radius=0.35,origin=null) {
  if(!graph) return false;
  let index=wallClearanceIndexes.get(graph);
  if(!index) {index=new Map((graph.wallClearance ?? []).map(p=>[navKey(p.ix,p.iz,p.level),p]));wallClearanceIndexes.set(graph,index);}
  const p=index.get(navKey(ix,iz,level));
  if(!p)return p;
  if(p.height-height>0.3+1e-6||p.height-height< -0.5-1e-6||
      !p.faces.every(([fx,fz,nx,nz])=>(x-fx)*nx+(z-fz)*nz>=radius-1e-6))return false;
  if(!p.exitOnly)return true;
  // Trial 11: standing on seen floor is evidence that the starting disk is
  // occupied. A local step may leave its wall raster overlap, but cannot deepen
  // it or cross any retained face. Fresh hit points still veto real protrusions.
  if(!origin)return false;
  // Cave walls need not have axis-aligned normals. A recorded footing origin
  // proves only that occupied disk, not a plane or new floor in the wall cell.
  // Keep actual wall hits as vetoes, just as the live guard does.
  if(p.hits) {
    if(!graph.strips?.some(s=>{
      const [sx,sy,sz]=s.feet,gap=cellGap(ix,iz,sx,sz);
      return gap>0&&gap<radius&&Math.abs(sy-origin[1])<=0.03&&onFooting(s,sx,sz,radius)&&
        // The mind's state rounds positions to 1 cm while strips keep the scan's mm: allow that much, no more.
        Math.hypot(origin[0]-sx,origin[2]-sz)<=0.75&&Math.hypot(x-sx,z-sz)<=0.75&&
        cellGap(ix,iz,origin[0],origin[2])>=gap-0.01;
    })||
        p.hits.some(([hx,hz])=>Math.hypot(x-hx,z-hz)<radius+0.1))return false;
  } else if(!p.faces.length)return false;
  const gap=cellGap(ix,iz,origin[0],origin[2]);
  return gap>0&&gap<radius&&Math.hypot(x-origin[0],z-origin[2])<=0.75&&
    cellGap(ix,iz,x,z)>=gap-1e-6;
}

// Cave trial 7: ceiling and high arch hits must not become hazards on the floor beneath them.
export function overheadHit(p, feetY) {
  const point = p?.at ?? p?.point;
  return ['wall','prop','tree','tree/prop','door'].includes(p?.ends) &&
    Array.isArray(point) && point.length === 3 && point.every(Number.isFinite) &&
    (point[1] - feetY > HEADROOM_M || p.normal?.[1] <= -0.7);
}

/** docs/21 amendment: three fresh, contiguous ground lines are usable, without a fork certificate.
 * Returned strips retain their actual width: rasterisation must not certify neighbouring whole cells. */
export function footingSupport(scan, { time = scan?.time, frame = scan?.frame, maxAge = SCAN_MAX_AGE_MS } = {}) {
  const feet = scan?.pose?.feet, yaw = scan?.pose?.direction ?? scan?.pose?.yaw;
  if (scan?.version !== 1 || scan.blocked || scan.frame !== frame || !Number.isFinite(time) ||
      !Number.isFinite(scan.time) || time < scan.time || time-scan.time > maxAge ||
      !Array.isArray(feet) || feet.length !== 3 || !feet.every(Number.isFinite) || !Number.isFinite(yaw)) return null;
  const probes = scan.footing ?? [];
  if (!Array.isArray(probes) || probes.length > 96) return null;
  const sides = [...new Set(probes.map((p) => p.side))].sort((a,b) => a-b);
  if (sides.length !== 3 || sides[1] !== 0 || !Number.isFinite(sides[0]) || !Number.isFinite(sides[2]) ||
      sides[0] > -0.35 || sides[2] < 0.35 || sides[0] < -1 || sides[2] > 1) return null;
  const sin = Math.sin(yaw), cos = Math.cos(yaw), heights = [feet[1]], previous = sides.map(() => feet[1]);
  let reach = 0;
  const footprints=foeFootprints(scan);
  const wall = Math.min(Infinity, ...(scan.rays ?? []).filter((r) => r.row === 0 &&
    ['wall','tree/prop','tree','prop','door'].includes(r.ends) && !foeBodyHit(r,footprints)).map((r) => r.dist).filter(Number.isFinite));
  for (let station = 1; station <= 32; station++) {
    const distance = station*0.25;
    if (distance >= wall) break;
    const row = sides.map((side) => probes.filter((p) => p.station === station && p.side === side));
    if (row.some((ps) => ps.length !== 1)) break;
    const points = row.map(([p]) => p);
    if (points.some((p, i) => p.ends !== 'ground' || !Number.isFinite(p.height) ||
      !Number.isFinite(p.reach) || Math.abs(p.reach-distance) > 0.001 || !Array.isArray(p.at) || p.at.length !== 3 || !p.at.every(Number.isFinite) ||
      Math.abs(p.at[1]-p.height) > 0.01 || Math.hypot(p.at[0]-feet[0]-sin*distance-cos*p.side,
        p.at[2]-feet[2]-cos*distance+sin*p.side) > 0.14 ||
      p.height-previous[i] > 0.3+1e-6 || p.height-previous[i] < -0.5-1e-6)) break;
    points.forEach((p,i) => { previous[i] = p.height; });
    reach = distance; heights.push(points[1].height);
  }
  return reach ? { feet: [...feet], yaw, width: Math.min(-sides[0],sides[2])*2, reach, heights } : null;
}

/** Containment in the observed strip, including the disk already occupied at its origin. */
export function onFooting(strip, x, z, radius = 0.35) {
  const dx = x-strip.feet[0], dz = z-strip.feet[2], sin = Math.sin(strip.yaw), cos = Math.cos(strip.yaw);
  const along = dx*sin+dz*cos, side = dx*cos-dz*sin;
  // Centimetre pose rounding in state() must not reject the same scan's feet.
  return Math.abs(side)+radius <= strip.width/2+0.015 && along >= -0.015 && along+radius <= strip.reach+0.001;
}

// Shared offline/page planner. Seen support plus revealed indoor floor; hazards override both (GAZE-BRIEF).
const navKey = (x, z, level) => `${x},${z},${level}`;
// Dense engine-floor observations already passed picture, light and a single unobstructed eye ray.
export function scanFloorPoints(scan) {
  return ['floor','water'].flatMap((kind) => (Array.isArray(scan?.[kind]) ? scan[kind] : []).slice(0,200)
    .filter((p) => p && Number.isInteger(p.ix) && Number.isInteger(p.iz) && Number.isFinite(p.height))
    .map((p) => ({ends:kind==='floor'?'ground':'water',at:[(p.ix+0.5)*0.5,p.height,(p.iz+0.5)*0.5]})));
}
export function supportedGraph(snap) {
  const surfaces=snap?.surfaces ?? [], surfaceIndex=new Map(surfaces.map((s) => [navKey(s.ix,s.iz,s.level),s]));
  const seen=surfaces.filter((s) => s.kind==='support' && s.plannable===true && Number.isFinite(s.height));
  const seenNodes=seen.filter((s) => {
    let continuous=false;
    for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) {
      const p=surfaceIndex.get(navKey(s.ix+dx,s.iz+dz,s.level));
      if (!p) continue;
      if (p.kind!=='support' && p.kind!=='unknown' || p.coverage==='blocked') return false;
      if (p.kind==='support' && Number.isFinite(p.height)) {
        if (p.height-s.height>0.3+1e-6 || p.height-s.height< -0.5-1e-6) return false;
        if ((dx || dz) && Math.abs(p.height-s.height)<=0.3+1e-6) continuous=true;
      }
    }
    return continuous;
  }).map(({ix,iz,level,height}) => ({ix,iz,level,height,planningOnly:true}));
  const nodes = (snap?.surfaces ?? []).filter((s) => s.kind === 'support' && s.usable === true && s.coverage === 'full' && s.clearance >= 1.8)
    .map((s) => ({ ix: s.ix, iz: s.iz, level: s.level, height: s.height }));
  const strips = snap?.strips ?? [], keys = new Set(nodes.map((n) => navKey(n.ix,n.iz,n.level)));
  for (const strip of strips) for (let d = 0; d+0.35 <= strip.reach+1e-6; d += 0.05) {
    const x = strip.feet[0]+Math.sin(strip.yaw)*d, z = strip.feet[2]+Math.cos(strip.yaw)*d;
    const height = strip.heights[Math.min(strip.heights.length-1,Math.ceil(d/0.25))], level = Math.round(height/3);
    const ix = Math.floor(x/0.5), iz = Math.floor(z/0.5), key = navKey(ix,iz,level);
    if (!keys.has(key)) { nodes.push({ix,iz,level,height,x,z}); keys.add(key); }
  }
  nodes.push(...seenNodes.filter((n) => !keys.has(navKey(n.ix,n.iz,n.level))));
  const occupied=new Map();
  for(const strip of strips) {
    const [x,height,z]=strip.feet,level=Math.round(height/3);
    if(!onFooting(strip,x,z))continue;
    for(let ix=Math.floor((x-.35)/.5);ix<=Math.floor((x+.35)/.5);ix++)for(let iz=Math.floor((z-.35)/.5);iz<=Math.floor((z+.35)/.5);iz++) {
      const gap=cellGap(ix,iz,x,z);
      if(gap>0&&gap<.35)occupied.set(navKey(ix,iz,level),height);
    }
  }
  const wallClearance=surfaces.filter(s=>s.kind==='wall').flatMap(s=>{
    const faces=(s.faces ?? []).map(f=>[...f]);
    if(faces.length&&Number.isFinite(s.ground))return [{ix:s.ix,iz:s.iz,level:s.level,height:s.ground,faces,...(s.unresolved?{exitOnly:true}:{})}];
    // An observed non-axis wall can bound an exit from occupied footing. An
    // absent normal, or a missing axis face, still supplies no clearance proof.
    const n=s.normal;
    if(!Array.isArray(n)||n.length!==3||!n.every(Number.isFinite)||Math.hypot(n[0],n[2])<0.5||
        Math.abs(n[1])<0.001&&(Math.abs(n[0])>0.999&&Math.abs(n[2])<0.001||Math.abs(n[2])>0.999&&Math.abs(n[0])<0.001))return [];
    const height=occupied.get(navKey(s.ix,s.iz,s.level));
    const hits=[s,...(s.history ?? [])].filter(p=>p.kind==='wall'&&Array.isArray(p.at)&&p.at.length===3&&p.at.every(Number.isFinite))
      .map(p=>[p.at[0],p.at[2]]).filter((p,i,all)=>all.findIndex(q=>q[0]===p[0]&&q[1]===p[1])===i);
    return Number.isFinite(height)&&hits.length?[{ix:s.ix,iz:s.iz,level:s.level,height,faces,exitOnly:true,hits}]:[];
  });
  return { cell: 0.5, nodes, strips, wallClearance, time:snap?.time ?? 0, people:(snap?.people ?? []).map((p) => ({x:p.x,z:p.z,level:p.level,until:p.time+1000})), doors:(snap?.surfaces ?? []).filter((s) => s.kind==='door').map((s) => [s.ix,s.iz,s.level]), walls:(snap?.surfaces ?? []).filter((s) => s.kind==='wall').map((s) => [s.ix,s.iz,s.level]), blocked: (snap?.surfaces ?? []).filter((s) => s.kind !== 'support').map((s) => [s.ix, s.iz, s.level]) };
}

const routePrep = new WeakMap();   // graph -> its node index, strip tiles and spot answers (see traceRoute)
/** Layered A*, bounded nodes and a heap. Circle/cell overlap checks include end caps, not three thin lines. */
export function traceRoute(graph, x0, z0, x1, z1, level = 0, { maxNodes = 12000, targetLevel = level } = {}) {
  const none = (reason) => ({ status: 'none', points: [], reason });
  if (!graph || graph.cell !== 0.5) return none('no observed support map');
  const cell = 0.5, radius = 0.35;
  // the setup and the spot answers are shared by every search over the same graph (the autopilot tries several)
  let prep = routePrep.get(graph);
  if (!prep) { prep = { nodes: new Map(graph.nodes.map((n) => [navKey(n.ix, n.iz, n.level), n])), blocked: new Set((graph.blocked ?? []).map((p) => navKey(...p))), stripTiles: null, diskMemo: new Map() }; routePrep.set(graph, prep); }
  const { nodes, blocked } = prep;
  const at = (x, z, l) => nodes.get(navKey(Math.floor(x / cell), Math.floor(z / cell), l));
  const nx = (n) => n.x ?? (n.ix+0.5)*cell, nz = (n) => n.z ?? (n.iz+0.5)*cell;
  // PERFORMANCE (trial 5, Claude): every disk test scanned EVERY footing strip ever recorded - thousands after a few
  // minutes - so one route search blocked the loop ~20 s and the Body's lease lapsed. Strips are filed under the 2 m
  // tiles their footprint covers, so a test looks only at strips near it, and each spot's answer is kept for the search.
  const TILE = 2;
  const stripTiles = prep.stripTiles ?? (prep.stripTiles = new Map());
  if (!prep.tiled) for (const s of graph.strips ?? []) {
    const ex = s.feet[0]+Math.sin(s.yaw)*s.reach, ez = s.feet[2]+Math.cos(s.yaw)*s.reach, pad = (s.width ?? 0.7)/2+radius;
    for (let tx = Math.floor((Math.min(s.feet[0],ex)-pad)/TILE); tx <= Math.floor((Math.max(s.feet[0],ex)+pad)/TILE); tx++) {
      for (let tz = Math.floor((Math.min(s.feet[2],ez)-pad)/TILE); tz <= Math.floor((Math.max(s.feet[2],ez)+pad)/TILE); tz++) {
        const k = `${tx},${tz}`; if (!stripTiles.has(k)) stripTiles.set(k, []); stripTiles.get(k).push(s);
      }
    }
  }
  prep.tiled = true;
  const stripsNear = (x, z) => stripTiles.get(`${Math.floor(x/TILE)},${Math.floor(z/TILE)}`) ?? [];
  const walls=new Set((graph.walls ?? []).map((p) => navKey(...p)));
  const overlapping=(graph.walls ?? []).some(([ix,iz,l]) => l===level && cellGap(ix,iz,x0,z0)<radius);
  // The exit-only rule depends on the start only within 0.75 m of it: share the cache beyond that. Trial 12: dropping the
  // whole cache whenever the feet overlapped a wall cell froze the gateway 20-35 s per search and the lease lapsed.
  const nearMemo = new Map();
  function disk(x, z, n) {
    const mk = `${Math.round(x*100)},${Math.round(z*100)},${n.level},${n.height}`;
    const diskMemo = overlapping && Math.hypot(x-x0,z-z0) <= 0.75 + 2*radius ? nearMemo : prep.diskMemo;
    if (diskMemo.has(mk)) return diskMemo.get(mk);
    const ok = diskUncached(x, z, n); diskMemo.set(mk, ok); return ok;
  }
  function diskUncached(x, z, n) {
    if ((graph.people ?? []).some((p) => p.level===n.level && p.until>(graph.time ?? 0) && Math.hypot(p.x-x,p.z-z)<0.7)) return false;
    const strip = stripsNear(x, z).some((s) => onFooting(s,x,z,radius) &&
      Math.abs(s.heights[Math.min(s.heights.length-1,Math.ceil(Math.hypot(x-s.feet[0],z-s.feet[2])/0.25))]-n.height) <= 0.5);
    for (let ix = Math.floor((x - radius) / cell); ix <= Math.floor((x + radius) / cell); ix++) {
      for (let iz = Math.floor((z - radius) / cell); iz <= Math.floor((z + radius) / cell); iz++) {
        const dx = Math.max(ix * cell - x, 0, x - (ix + 1) * cell), dz = Math.max(iz * cell - z, 0, z - (iz + 1) * cell);
        if (dx * dx + dz * dz >= radius * radius - 1e-9) continue;
        if (blocked.has(navKey(ix,iz,n.level))) {
          const clear=wallCellClear(graph,ix,iz,n.level,x,z,n.height,radius,[x0,start?.height ?? n.height,z0]);
          if (clear===true || clear==null&&leavingWall(walls,ix,iz,n.level,x,z,x0,z0,radius)) continue;
          return false;
        }
        if (strip) continue;
        const support = [n.level,n.level-1,n.level+1].map((l) => nodes.get(navKey(ix,iz,l))).find((p) => p && Math.abs(p.height-n.height)<=0.3 && !blocked.has(navKey(ix,iz,p.level)));
        if (!support) return false;
      }
    }
    return true;
  }
  function swept(a, b, ax = nx(a), az = nz(a)) {
    const bx = nx(b), bz = nz(b);
    const len = Math.hypot(bx - ax, bz - az), dy = b.height - a.height;
    if (dy > 0.3 || dy < -0.5 || Math.abs(dy) > Math.tan(35 * Math.PI / 180) * Math.max(len, 0.01)) return false;
    const steps = Math.max(1, Math.ceil(len / 0.05));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      const n = at(x, z, a.level) ?? at(x, z, b.level);
      if (!n || !disk(x, z, n)) return false;
    }
    return true;
  }
  const start = at(x0, z0, level);
  if (!start || !disk(x0, z0, start)) return none('unknown or unsafe footing at start');
  const heap = [];
  const push = (n) => { heap.push(n); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p].f <= n.f) break; heap[i] = heap[p]; i = p; } heap[i] = n; };
  const pop = () => { const out = heap[0], end = heap.pop(); if (heap.length) { let i = 0; while (i * 2 + 1 < heap.length) { let c = i * 2 + 1; if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++; if (heap[c].f >= end.f) break; heap[i] = heap[c]; i = c; } heap[i] = end; } return out; };
  const h = (n) => Math.hypot(nx(n) - x1, nz(n) - z1) + Math.abs(n.level - targetLevel) * 3;
  const scores = new Map(), closed = new Set();
  const first = { ...start, g: 0, f: h(start), prev: null }; push(first); scores.set(navKey(start.ix, start.iz, start.level), 0);
  let best = first, end = null, count = 0;
  while (heap.length && count++ < maxNodes) {
    const cur = pop(), k = navKey(cur.ix, cur.iz, cur.level);
    if (closed.has(k)) continue;
    closed.add(k);
    if (h(cur) < h(best)) best = cur;
    if (cur.ix === Math.floor(x1 / cell) && cur.iz === Math.floor(z1 / cell) && cur.level === targetLevel) { end = cur; break; }
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue;
      for (const dl of [-1, 0, 1]) {
        let n = nodes.get(navKey(cur.ix + dx, cur.iz + dz, cur.level + dl));
        if (!n) continue;
        // The swept disk proves the corner, including a diagonal strip with no full orthogonal cells.
        if (!swept(cur, n, cur === first ? x0 : undefined, cur === first ? z0 : undefined)) {
          // A cell centre can force a sideways step into a wall while leaving
          // occupied footing. Try a short first step within that same floor cell.
          if(cur!==first||!overlapping||n.x!==undefined)continue;
          let exit=null;
          for(let r=1;r<=4&&!exit;r++)for(let a=-r;a<=r&&!exit;a++)for(let b=-r;b<=r&&!exit;b++) {
            if(Math.max(Math.abs(a),Math.abs(b))!==r)continue;
            const q={...n,x:nx(n)+a*.05,z:nz(n)+b*.05};
            if(swept(cur,q,x0,z0))exit=q;
          }
          if(!exit)continue;
          n=exit;
        }
        const nk = navKey(n.ix, n.iz, n.level), g = cur.g + Math.hypot(dx, dz) * cell;
        if (g >= (scores.get(nk) ?? Infinity)) continue;
        scores.set(nk, g); push({ ...n, g, f: g + h(n), prev: cur });
      }
    }
  }
  const status = end ? 'complete' : 'partial'; end ??= best;
  if (end === first && status === 'partial') return none('no supported route to a frontier');
  const chain = []; for (let n = end; n?.prev; n = n.prev) chain.unshift(n);
  if (!chain.length) chain.push(end);
  // Remove only collinear points; shortcutting would need another swept check.
  const pts = chain.filter((n, i) => !i || i === chain.length - 1 || n.level !== chain[i - 1].level || n.level !== chain[i + 1].level ||
    Math.abs((nx(n)-nx(chain[i-1]))*(nz(chain[i+1])-nz(n))-(nz(n)-nz(chain[i-1]))*(nx(chain[i+1])-nx(n))) > 1e-9);
  if (pts.length > 256) return none('route exceeds waypoint budget');
  const door = (graph.doors ?? []).some(([x, z, l]) => l === end.level && Math.hypot(x-end.ix,z-end.iz)*cell < 1.5);
  return { status, points: pts.map((n) => [nx(n), nz(n), n.level]), reason: end && status === 'complete' ? 'supported route' : door ? 'door blocks the way' : count >= maxNodes ? 'route search budget; supported frontier only' : 'known support ends at frontier' };
}

// ---------------------------------------------------------------------------------------------------------------
// The Body

/**
 * @param {any} agent   window.__agent, or a fake: state(), press(action, ms), release(action), look(dx, dy), swing(dx, dy, ms)
 * @param {{ now?: () => number, random?: () => number }} [opts]
 */
export function createBody(agent, { now = () => Date.now(), random = Math.random } = {}) {
  const id = random().toString(36).slice(2, 10);   // a new page is a new Body: the gateway re-applies the mind's table
  let policy = validatePolicy(STARTER_POLICY).policy;
  let goal = { kind: 'idle' };
  let enabled = false;
  let leaseUntil = Infinity;
  let combatGuard = null, combatGuardFailure = null, combatMissingSince=null, useTargetId=null;
  let activeRule = null;
  const held = new Set();          // the movement actions the Body is holding
  const log = [];
  let seq = 0;
  let dropped = 0;
  let lostThroughSeq = 0;
  let lastSwing = -Infinity;
  let lastSlot = -Infinity;
  let walkFrom = null;              // { x, z, t } while walking, for "stuck"
  let turnTarget = null;            // a 'turn' goal's absolute yaw
  let useCheck = null;              // after a use: what the screen was, to tell what came of it
  let navigation = null, goalRevision = 0, goalSetAt = -Infinity, replans = 0, lastReplan = -Infinity, lastRoute = null;
  // setGoal and setNavigation are two commands; the mind sends the route a round trip after the goal (live 2026-10-29).
  const ROUTE_WAIT_MS = 500;
  let sight = null, lastScan = null, targetTrack = null, guardReason = null, sightMark = null, certAhead = 0, motionState = null, speed = 0, boundary = null;
  let floorMemory = { strips:[], nodes:new Map(), hazards:new Map(), seen:new Map() }, floorSample = null;
  let exploreSteering=null;
  let glanceUntil = -Infinity, glanceKey = null, gazeDistance = 0;
  let supportIndex = null;
  let gazeAt = -Infinity, gazeWant = null;
  const seen = { hostiles: 0, hp: null, max: null, window: false, hpBand: 100 };
  let tutorial = null;
  let threat=null, fightFocus=null, hurtUntil=-Infinity, foeTrail=[];
  function rememberThreat(st,sit,wounded) {
    foeTrail=foeTrail.filter((p) => now()-p.time<=FOE_TRAIL_MS);
    for (const f of sit.hostiles) if (Number.isFinite(f.dist) && Number.isFinite(f.bearing) && f.dist<=SIGHT) {
      const a=(st.yaw+f.bearing)*Math.PI/180;
      foeTrail.push({x:st.pos[0]+Math.sin(a)*f.dist,z:st.pos[2]+Math.cos(a)*f.dist,y:st.pos[1]+(f.dy ?? 0),h:f.h ?? 1.8,time:now()});
    }
    foeTrail=foeTrail.slice(-128);
    if (foeTrail.length) for (const [key,p] of floorMemory.hazards) if (foeBodyHit(p,foeTrail)) floorMemory.hazards.delete(key);
    const f=sit.nearest;
    if (f && Number.isFinite(f.dist) && Number.isFinite(f.bearing) && f.dist<=SIGHT) {
      if (threat?.foe.type!==f.type) fightFocus=null;
      const a=(st.yaw+f.bearing)*Math.PI/180;
      threat={foe:{...f},x:st.pos[0]+Math.sin(a)*f.dist,z:st.pos[2]+Math.cos(a)*f.dist,y:st.pos[1]+(f.dy ?? 0),until:now()+THREAT_MS};
    }
    if (wounded) { hurtUntil=now()+THREAT_MS; if (threat) threat.until=hurtUntil; }
    if (threat && now()>=threat.until) fightFocus=null;
    if (!f && threat && now()<threat.until) sit.nearest={...threat.foe,...bearingTo(st,threat.x,threat.z),dy:threat.y-st.pos[1],remembered:true};
  }

  let lastStuck = { text: null, t: -Infinity };
  let here = null;   // where the Body stands and faces this tick: a "blocked" says where it was stopped, for the mind's map
  function note(kind, text, data = undefined) {
    if (kind === 'stuck' && !data && here) data = { ...here };
    // the same "blocked" again within a few seconds is the same moment, not news: it would flood the mind
    if (kind === 'stuck') { if (lastStuck.text === text && now() - lastStuck.t < STUCK_REPEAT_MS) return; lastStuck = { text, t: now() }; }
    log.push({ seq: ++seq, t: now(), kind, text, ...(data ? { data: { ...here, ...data } } : {}) });
    // a scan sample is large and only the latest few matter to the map: keep SCAN_LOG_MAX of them, pruning older scans
    // only (not counted as dropped news). 300 full scans made one /body/events read ~25 s, so the lease lapsed every
    // pass (trial 4, Claude)
    if (kind === 'scan') {
      let scans = 0;
      for (let i = log.length - 1; i >= 0; i--) if (log[i].kind === 'scan' && ++scans > SCAN_LOG_MAX) log.splice(i, 1);
    }
    while (log.length > LOG_MAX) { const lost=log.shift(); lostThroughSeq=Math.max(lostThroughSeq,lost.seq); dropped++; }
  }

  function hold(want, { keepWalk = false } = {}) {
    for (const a of [...held]) if (!want.has(a)) { agent.release(a); held.delete(a); }
    for (const a of want) if (!held.has(a)) { agent.press(a); held.add(a); }
    // time standing still (a fight in place) is never time "stuck" - but a stride's breath is part of the walk:
    // clearing the clock there would let short strides hide being stuck for ever (Sol's review)
    if (!want.has('MoveForwards') && !keepWalk) walkFrom = null;
  }
  function letGo() { hold(new Set()); walkFrom = null; }
  /** Everything up, a swing in progress included: the agent mode's own releaseAll ends its timed swings too. */
  function letGoAll() { letGo(); agent.releaseAll?.(); }

  /** `quiet`: a wait for sight is not news for the mind (it is not a failure), so it is not logged as a stall. */
  function stopReason(reason, final = false, quiet = false) {
    letGo();
    if (!quiet && (guardReason !== reason || final)) note('stuck', reason, { ...here, reason });
    guardReason = reason;
    if (final) { note('goal-failed', reason, { goalRevision }); goal = { kind: 'idle' }; }
  }
  function waitingForSight() {
    return guardReason && /missing or stale footing|unknown support or clearance/.test(guardReason);
  }
  /** The clock of "no new certified ground": it restarts when the feet moved on or a sample certifies more than before. */
  function touchSight(st, certified) {
    const [x, , z] = st.pos, t = now();
    if (!sightMark || Math.hypot(x - sightMark.x, z - sightMark.z) >= 0.25) sightMark = { t, x, z, best: certified ?? 0 };
    else if (certified != null && certified > sightMark.best + 0.1) { sightMark.t = t; sightMark.best = certified; }
  }
  /** Waiting for sight is not failure: hold still, glance briefly, keep the goal. Give up only after
   *  stuckSeconds with no new certified ground at all. */
  function waitForSight(st) {
    touchSight(st, null);
    letGo(); gaze(st, true);
    const waited = now() - sightMark.t;
    if (waited >= policy.settings.stuckSeconds * 1000) stopReason(`no ground seen ahead within the light for ${(waited / 1000).toFixed(1)} s`, true);
  }
  /** A footing sample the Body may still use: the fork's own flag, or the same page and frame and at most
   *  SCAN_MAX_AGE_MS old. An old sample is not wrong, only short: onFooting() below measures from the feet NOW. */
  function scanUsable(st, sc) {
    if (!sc || sc.blocked || !st.scan || st.scan.id !== sc.id || st.scan.page !== sc.page || st.frame !== sc.frame) return false;
    if (Number.isFinite(st.t) && st.t-sc.time > SCAN_MAX_AGE_MS) return false;
    if (st.scan.fresh) return true;
    return Number.isFinite(st.t) && Number.isFinite(sc.time) && st.t >= sc.time && st.t - sc.time <= SCAN_MAX_AGE_MS;
  }
  // GAZE-BRIEF: keep seen support and hazards when the picture no longer includes the feet.
  function rememberFooting(st, sc) {
    if (!scanUsable(st,sc) || floorSample === `${sc.page}:${sc.frame}:${sc.id}`) return;
    floorSample = `${sc.page}:${sc.frame}:${sc.id}`;
    const strip=footingSupport(sc,{time:Math.max(sc.time,st.t ?? sc.time),frame:st.frame});
    if (strip) for (const [key,p] of floorMemory.hazards) if (p.ends==='door' && onFooting(strip,p.at[0],p.at[2],0)) floorMemory.hazards.delete(key);
    if (strip) { floorMemory.strips.unshift(strip); floorMemory.strips.length=Math.min(256,floorMemory.strips.length); }
    for (const p of scanFloorPoints(sc)) if (p.ends==='ground') {
      const [x,height,z]=p.at, ix=Math.floor(x/0.5), iz=Math.floor(z/0.5), level=Math.round(height/3);
      floorMemory.nodes.set(navKey(ix,iz,level),{height});
    }
    for (const p of sc.coverage?.patches ? sc.patches ?? [] : []) {
      if (p.ends!=='ground' || !p.usable || !(p.clearance>=1.8) || !Number.isFinite(p.height) ||
          p.bounds?.length!==4 || !p.bounds.every(Number.isFinite)) continue;
      const [x0,z0,x1,z1]=p.bounds;
      if (x1<x0 || z1<z0 || (x1-x0)*(z1-z0)>256) continue;
      for (let ix=Math.ceil(x0/0.5);(ix+1)*0.5<=x1;ix++) for (let iz=Math.ceil(z0/0.5);(iz+1)*0.5<=z1;iz++)
        floorMemory.nodes.set(navKey(ix,iz,Math.round(p.height/3)),{height:p.height});
    }
    for (const p of [...(sc.rays ?? []),...(sc.footing ?? []),...scanFloorPoints(sc)]) {
      const at=p.at ?? p.point;
      if (!at || overheadHit(p,st.pos[1]) || foeBodyHit(p,foeTrail) || !['water','ledge','wall','prop','tree','tree/prop','door'].includes(p.ends)) continue;
      const level=Math.round((p.ends==='water'?at[1]:st.pos[1])/3);
      floorMemory.hazards.set(navKey(Math.floor(at[0]/0.5),Math.floor(at[2]/0.5),level),{ends:p.ends==='tree/prop'?'prop':p.ends,at,level});
    }
    for(const p of sc.rays ?? []) if(p.ends==='ground' && Array.isArray(p.at) && p.at.length===3 && p.at.every(Number.isFinite) &&
        p.lit!==false && p.visible!==false && p.inView!==false && p.pictured!==false) {
      const [x,height,z]=p.at, level=Math.round(height/3), ix=Math.floor(x/0.5), iz=Math.floor(z/0.5);
      floorMemory.seen.set(navKey(ix,iz,level),{ix,iz,level,height,kind:'support',plannable:true});
    }
    while(floorMemory.seen.size>20000) floorMemory.seen.delete(floorMemory.seen.keys().next().value);
    while (floorMemory.nodes.size>20000) floorMemory.nodes.delete(floorMemory.nodes.keys().next().value);
    while (floorMemory.hazards.size>20000) floorMemory.hazards.delete(floorMemory.hazards.keys().next().value);
  }
  function gaze(st, unseen = false) {
    const key=`${Math.floor(st.pos[0]/0.5)},${Math.floor(st.pos[2]/0.5)},${Math.round(st.yaw/15)}`;
    if (now()>=glanceUntil && (gazeDistance>=3 || unseen && key!==glanceKey)) {
      glanceUntil=now()+400; glanceKey=key; gazeDistance=0;
    }
    const want=now()<glanceUntil ? -55 : 0;
    if (gazeAt!==now() || gazeWant!==want) pitchTo(st,want,5);
    gazeAt=now(); gazeWant=want;
  }
  // While closing on a visible foe, a door is an obstacle at worst, not a drop.
  function supportGuard(st, backward = false, aiming = false, limit = Infinity, passDoors = false) {
    const sc = sight?.scan;
    if (!scanUsable(st, sc)) {
      certAhead = 0; touchSight(st, null);
      stopReason('missing or stale footing scan', false, true); return false;
    }
    const angle = (st.yaw + (backward ? 180 : 0)) * Math.PI / 180;
    const distance = Math.max(0.5, speed * 0.15 + 0.2), radius = 0.35;
    if (!backward && (sc.rays ?? []).some((p) => p.row===0 && Math.abs(p.bearing ?? 0)<=10 && ['wall','door','tree','prop','tree/prop'].includes(p.ends) && !(passDoors && p.ends==='door') && !foeBodyHit(p,foeTrail) && p.dist<distance+radius)) {
      stopReason('wall ahead; support guard stopped'); return false;
    }
    const patches = sc.coverage?.patches === true ? (sc.patches ?? []).filter((p) => p.ends === 'ground' && p.usable === true && p.clearance >= 1.8 && Number.isFinite(p.height)) : [];
    // state.t is rounded to milliseconds; the same trusted scan can be fractionally newer.
    const derived = footingSupport(sc, {time: Math.max(sc.time,st.t ?? sc.time), frame: st.frame});
    rememberFooting(st,sc);
    const graph=navigation?.graph, level=Math.round(st.pos[1]/3);
    if (!supportIndex || supportIndex.graph!==graph || supportIndex.count!==graph?.blocked?.length) supportIndex={graph,count:graph?.blocked?.length,
      nodes:new Map((graph?.nodes ?? []).filter((n) => n.x===undefined && !n.planningOnly).map((n) => [navKey(n.ix,n.iz,n.level),n])),
      blocked:new Set((graph?.blocked ?? []).map((p) => navKey(...p)))};
    const {nodes,blocked}=supportIndex;
    const walls=new Set((graph?.walls ?? []).map((p) => navKey(...p)));
    const doorCells=new Set(passDoors ? (graph?.doors ?? []).map((p) => navKey(...p)) : []);
    const escape=(ix,iz,x,z) => {
      const clear=wallCellClear(graph,ix,iz,level,x,z,st.pos[1],radius,st.pos);
      return clear===true || clear==null&&leavingWall(walls,ix,iz,level,x,z,st.pos[0],st.pos[2],radius);
    };
    const strips=[...floorMemory.strips,...(graph?.strips ?? [])];
    const remembered = (x,z) => {
      if (strips.some((s) => onFooting(s,x,z,FOOT_CORE_M) &&
          Math.abs(s.heights[Math.min(s.heights.length-1,Math.ceil(Math.hypot(x-s.feet[0],z-s.feet[2])/0.25))]-st.pos[1])<=0.5)) return true;
      for (let ix=Math.floor((x-radius)/0.5);ix<=Math.floor((x+radius)/0.5);ix++) for(let iz=Math.floor((z-radius)/0.5);iz<=Math.floor((z+radius)/0.5);iz++) {
        if (Math.hypot(Math.max(ix*0.5-x,0,x-(ix+1)*0.5),Math.max(iz*0.5-z,0,z-(iz+1)*0.5))>=radius) continue;
        if (escape(ix,iz,x,z)) continue;
        const n=[level,level-1,level+1].map((l) => floorMemory.nodes.get(navKey(ix,iz,l)) ?? nodes.get(navKey(ix,iz,l)))
          .find((p) => p && p.height-st.pos[1]<=0.3 && p.height-st.pos[1]>=-0.5);
        if (!n) return false;
      }
      return true;
    };
    // Footing is checked over a 0.2 m core: the strip is exactly body width (its edge lines at +-0.35 m), so the full
    // radius left ~1.5 cm of drift before every wait; ground already seen on both edge lines bounds the rest. Hazards
    // still use the full body radius (Claude, after trial 1).
    const solid = (x, z) => (derived && onFooting(derived,x,z,FOOT_CORE_M)) || remembered(x,z) || patches.some((p) => p.bounds?.length === 4 && x-radius >= p.bounds[0] && z-radius >= p.bounds[1] && x+radius <= p.bounds[2] && z+radius <= p.bounds[3] && p.height-st.pos[1] <= 0.3 && p.height-st.pos[1] >= -0.5);
    const hazards = [...floorMemory.hazards.values()].filter((p) => p.level===level && !(passDoors && p.ends==='door') && !foeBodyHit(p,foeTrail) && Math.hypot(p.at[0]-st.pos[0],p.at[2]-st.pos[2])<CERT_LOOK_M+1);
    for (const p of [...(sc.footing ?? []),...(sc.rays ?? [])]) if ((p.at ?? p.point) && !overheadHit(p,st.pos[1]) && !(passDoors && p.ends==='door') && !foeBodyHit(p,foeTrail) &&
        (['water','ledge','wall','prop','tree','tree/prop','door'].includes(p.ends) || p.ends==='ground' &&
        (p.height-st.pos[1]>0.3+1e-6 || p.height-st.pos[1]<-0.5-1e-6))) hazards.push({...p,ends:p.ends==='ground'?'ledge':p.ends});
    // Recheck the swept segment against remembered support and current hazards, from the feet NOW.
    // An old strip only allows what is left of it; unknown ground beyond the map remains unknown.
    let certified = 0;
    for (let d = 0; d <= CERT_LOOK_M + 0.001; d += 0.05) {
      const inReach = d <= distance + 0.001;
      const x = st.pos[0] + Math.sin(angle) * d, z = st.pos[2] + Math.cos(angle) * d;
      if (inReach && (sc.things ?? []).some((p) => p.kind==='person' && Math.hypot(p.x-x,p.z-z)<0.7 && Math.hypot(p.x-st.pos[0],p.z-st.pos[2])>0.5)) { stopReason('visible person temporarily blocks the way'); return false; }
      const hazard = hazards.find((p) => Math.hypot((p.at ?? p.point)[0]-x,(p.at ?? p.point)[2]-z) < radius + 0.1);
      // Trial 11: a route's last leg was 0.25 m, but the 0.85 m look ahead saw the shut door past its end and the Body
      // never stepped. Remembered wall/door cells count only along the leg being walked; live hazards keep full range.
      let blockedCell=false;
      for (let ix=Math.floor((x-radius)/0.5);ix<=Math.floor((x+radius)/0.5);ix++) for(let iz=Math.floor((z-radius)/0.5);iz<=Math.floor((z+radius)/0.5);iz++)
        if (d <= limit && blocked.has(navKey(ix,iz,level)) && !(passDoors && doorCells.has(navKey(ix,iz,level))) && !escape(ix,iz,x,z) && Math.hypot(Math.max(ix*0.5-x,0,x-(ix+1)*0.5),Math.max(iz*0.5-z,0,z-(iz+1)*0.5))<radius) blockedCell=true;
      if (hazard || blockedCell) {
        if (inReach) { stopReason(`${hazard?.ends ?? 'remembered obstacle'} ahead; support guard stopped`); return false; }
        break;
      }
      if (!solid(x, z)) {
        if (!inReach || d > limit) break;   // unseen ground past the leg's end is the next leg's question
        touchSight(st, certified);
        // the strip ends at water or a ledge the eyes did see: that is a hazard, not ground still to be seen
        const edge = (sc.footing ?? []).find((p) => ['water','ledge'].includes(p.ends) && p.at && Math.hypot(p.at[0]-x,p.at[2]-z) < 0.6);
        if (edge) { stopReason(`${edge.ends} ahead; support guard stopped`); return false; }
        certAhead = certified;
        stopReason('unknown support or clearance; look down before stepping', false, true); gaze(st,true); return false;
      }
      certified = d;
    }
    certAhead = certified;
    guardReason = null; sightMark = null; if (!aiming) gaze(st); return true;
  }
  function replan(st, reason, target) {
    letGo();
    if (!navigation || replans >= 2) { stopReason(`${reason}; two local replans exhausted or map missing; ask the mind`, true); return false; }
    if (now() - lastReplan < 500) return false;
    replans++; lastReplan = now();
    navigation.graph.time=now();
    const r = traceRoute(navigation.graph, st.pos[0], st.pos[2], target.x, target.z, Math.round(st.pos[1]/3));
    const signature = JSON.stringify(r.points);
    if (r.status === 'none' || signature === lastRoute) { stopReason(`${reason}; unchanged failed route refused`, true); return false; }
    navigation.route = r; navigation.at = 0; lastRoute = signature;
    note('replanned', `local replan ${replans}/2: ${r.reason}`); return true;
  }
  function walkRoute(st, target) {
    // A new goal's route may still be on its way: stand still briefly rather than fail the goal. A route for another
    // page or frame is never waited for.
    if ((!navigation || navigation.goalRevision !== goalRevision) && now() - goalSetAt < ROUTE_WAIT_MS) { letGo(); return false; }
    if (!navigation || navigation.page !== st.scan?.page || navigation.frame !== st.frame || navigation.goalRevision !== goalRevision) { stopReason('missing or wrong-frame route', true); return false; }
    const route = navigation.route;
    if (route.status === 'none' || !route.points.length) { gaze(st); stopReason(`no route: ${route.reason}`, true); return false; }
    navigation.at ??= 0;
    let point = route.points[navigation.at], b = bearingTo(st, point[0], point[1]);
    while (b.dist < 0.15 && navigation.at < route.points.length-1) { point = route.points[++navigation.at]; b = bearingTo(st, point[0], point[1]); }
    if (navigation.at === route.points.length-1 && b.dist < 0.2) {
      letGo();
      if (route.status === 'partial') { stopReason(`partial route ended: ${route.reason}; observation needed`, true); return false; }
      return true;
    }
    if (walkToward(st, b.bearing, { tight: true, limit: b.dist })) {
      if (waitingForSight()) {waitForSight(st);return false;}
      navigation.graph.blocked ??= [];
      if (guardReason?.includes('person')) navigation.graph.people=(sight.scan.things ?? []).filter((p) => p.kind==='person').map((p) => ({x:p.x,z:p.z,level:Math.round(st.pos[1]/3),until:now()+1000}));
      else navigation.graph.blocked.push([Math.floor(point[0]/0.5),Math.floor(point[1]/0.5),point[2]]);
      replan(st, guardReason ?? 'route blocked', target);
    }
    return false;
  }
  function trackPerson(st) {
    const sc = sight?.scan;
    if (!targetTrack) targetTrack = { ...goal.target, time: -Infinity, sample: null, page:st.scan?.page, frame:st.frame };
    if (targetTrack.page!==st.scan?.page || targetTrack.frame!==st.frame) return false;
    if (!sc || sc.frame !== st.frame || sc.page !== st.scan?.page || !st.scan?.fresh) return now()-targetTrack.time <= 500;
    if (sc.id !== targetTrack.sample) {
      targetTrack.sample = sc.id;
      const people = (sc.things ?? []).filter((p) => p.kind === 'person' && Number.isFinite(p.x) && Number.isFinite(p.z) && Math.hypot(p.x-targetTrack.x,p.z-targetTrack.z) <= 2)
        .sort((a,b) => Math.hypot(a.x-targetTrack.x,a.z-targetTrack.z)-Math.hypot(b.x-targetTrack.x,b.z-targetTrack.z));
      if (people[0]) {
        const p = people[0], moved = Math.hypot(p.x-targetTrack.x,p.z-targetTrack.z);
        targetTrack = { x:p.x, z:p.z, time:now(), sample:sc.id, visible:true, page:sc.page, frame:sc.frame };
        if (moved > 1 && navigation && now()-lastReplan >= 500) replan(st,'visible target moved',targetTrack);
      } else targetTrack.visible = false;
    }
    return now()-targetTrack.time <= 500;
  }

  let lastDraw = -Infinity;

  /** Tilt the view to a pitch (degrees, negative is down); true once near it. The look's +dy looks down. */
  function pitchTo(st, want, tolerance = 8) {
    const diff = want - (st.pitch ?? 0);
    if (Math.abs(diff) <= tolerance) return true;
    agent.look(0, Math.max(-100, Math.min(100, -diff * policy.settings.pxPerDeg * 0.5)));
    return false;
  }
  /** Aim at a foe's middle, as a player looks down at a rat: its height off the ground over its distance. */
  const aimAt = (st, f) => pitchTo(st, (Math.atan2((f.dy ?? 0) + (f.h ?? 1.8) / 2 - EYE, Math.max(0.3, f.dist)) * 180) / Math.PI, 10);

  /** Turn toward a bearing; true once within tolerance. */
  function turnBy(deg, tolerance = policy.settings.faceToleranceDeg) {
    const s = policy.settings;
    if (Math.abs(deg) <= tolerance) return true;
    const px = Math.max(-150, Math.min(150, deg * s.pxPerDeg * 0.5));   // half the gap per tick: no overshoot past the look's smoothing
    agent.look(px, 0);
    return false;
  }

  function stuckCheck(st, walking) {
    if (!walking) { walkFrom = null; return false; }
    const t = now();
    if (!walkFrom) { walkFrom = { x: st.pos[0], z: st.pos[2], t }; return false; }
    if (Math.hypot(st.pos[0] - walkFrom.x, st.pos[2] - walkFrom.z) > 0.3) { walkFrom = { x: st.pos[0], z: st.pos[2], t }; return false; }
    if (t - walkFrom.t < policy.settings.stuckSeconds * 1000) return false;
    walkFrom = { x: st.pos[0], z: st.pos[2], t };
    return true;
  }

  let strideFrom = null;   // when forward went down this stretch
  let restUntil = 0;       // a stride's pause runs to here

  // A passage choice is a local ability: the nearest supported bearing to the requested
  // heading, inside its 150 degree cone. Planning here never presses a movement key.
  function steerExplore(st) {
    const e=exploreSteering, sc=sight?.scan;
    letGo();
    if (!scanUsable(st,sc)) { waitForSight(st); return; }
    if (e.turned>180) { stopReason(`exploring gave up: turned over 180 degrees without progress (${e.turns} turns)`,true); return; }
    const level=Math.round(st.pos[1]/3);
    const floorAt=(x,z) => {
      const n=floorMemory.nodes.get(navKey(Math.floor(x/0.5),Math.floor(z/0.5),level)) ??
        floorMemory.seen.get(navKey(Math.floor(x/0.5),Math.floor(z/0.5),level));
      if(n && n.height-st.pos[1]<=0.3 && n.height-st.pos[1]>=-0.5) return true;
      return floorMemory.strips.some((s) => onFooting(s,x,z,0) &&
        Math.abs(s.heights[Math.min(s.heights.length-1,Math.ceil(Math.hypot(x-s.feet[0],z-s.feet[2])/0.25))]-st.pos[1])<=0.3);
    };
    const distance=Math.max(0.75,speed*0.15+0.2);
    const hazards=[...floorMemory.hazards.values()].filter((p) => p.level===level && Math.hypot(p.at[0]-st.pos[0],p.at[2]-st.pos[2])<distance+0.5);
    const passage=(a,distance) => {
      for(let d=0;d<=distance+.001;d+=.05) {
        const x=st.pos[0]+Math.sin(a)*d,z=st.pos[2]+Math.cos(a)*d;
        if(hazards.some((p) => Math.hypot(p.at[0]-x,p.at[2]-z)<0.45)) return false;
        for(const side of [-.35,0,.35]) if(!floorAt(x+Math.cos(a)*side,z-Math.sin(a)*side)) return false;
      }
      return true;
    };
    const candidates=[];
    for(let offset=0;offset<=75;offset+=2.5) for(const sign of offset ? [-1,1] : [1]) candidates.push(goal.heading+offset*sign);
    for(const heading of candidates) {
      if (Math.abs(norm180(heading-st.yaw))<=2) continue;
      if ((sc.rays ?? []).some((r) => r.row===0 && ['wall','tree/prop','tree','prop','door'].includes(r.ends) &&
          Math.abs(norm180((sc.pose.yaw*180/Math.PI)+(r.bearing ?? 0)-heading))<=10 && r.dist<distance+0.35)) continue;
      if(!passage(heading*Math.PI/180,distance)) continue;
      e.heading=((heading%360)+360)%360;e.turns++;
      note('explore-turn',`passage turn ${e.turns}: heading ${Math.round(e.heading)} degrees`,{turns:e.turns,heading:e.heading});
      guardReason=null;sightMark=null;return;
    }
    stopReason(`exploring gave up: no supported passage within 75 degrees of heading ${Math.round(goal.heading)} (${e.turns} turns)`,true);
  }

  /** Walk toward a bearing. True when blocked: walked without moving, or a wall stands right in front when facing the
   *  way. A person stops short of a wall and does not hold the key down for ever, so neither does the Body. */
  /** `tight`: walk only when nearly facing the way (a route's corners, where turning while walking cuts the wall). */
  function walkToward(st, bearing, { run = false, tight = false, foe = null, limit = Infinity } = {}) {
    const s = policy.settings;
    const facing = turnBy(bearing, tight ? 2 : s.faceToleranceDeg);
    // front is a coarse ray too: ignore it only when the fresh front hit is the foe, not a wall.
    const frontIsFoe=foe && scanUsable(st,sight?.scan) && (sight.scan.rays ?? []).some((p) => p.row===0 && Math.abs(p.bearing ?? 0)<=10 && Math.abs(p.dist-st.front)<0.15 && foeBodyHit(p,foeTrail));
    const wallAhead = st.front != null && st.front < s.wallStop && !frontIsFoe;
    // facing the way with a wall right there: blocked. Turning with a wall right there: no step into it either
    if (wallAhead && facing) { hold(new Set()); guardReason = 'wall blocks the way'; return true; }
    const t = now();
    let go = !wallAhead && (tight ? Math.abs(bearing) <= 2 : facing || Math.abs(bearing) < 60);
    const resting = t < restUntil;
    if (go && resting) go = false;
    if (go) {
      strideFrom ??= t;
      if (t - strideFrom >= (certAhead < CREEP_BELOW_M ? Math.min(s.strideMs, CREEP_PULSE_MS) : s.strideMs)) { restUntil = t + s.strideRestMs; strideFrom = null; go = false; }
    } else if (!resting) strideFrom = null;
    if (go && !supportGuard(st, false, false, limit, !!foe)) return true;
    const want = new Set(go ? ['MoveForwards'] : []);
    if (run && want.size && certAhead >= CREEP_BELOW_M) want.add('Run');   // never run on ground seen less than a few metres ahead
    const breathing = t < restUntil;
    hold(want, { keepWalk: breathing });
    return breathing ? false : stuckCheck(st, want.has('MoveForwards'));
  }

  function doGoal(st) {
    if (goal.kind === 'idle') { letGo(); return; }
    if (goal.kind === 'look') return lookAround(st);
    if(goal.kind==='use'&&useTargetId&&!goal.checking){
      const target=sight?.scan?.things?.find(t=>t.targetId===useTargetId);
      if(!st.scan?.fresh||!target){letGoAll();return;}
      goal.x=target.x;goal.z=target.z; // observed moving actor, never another nearest person
    }
    if (goal.kind === 'follow' || goal.kind === 'use' && goal.target) {
      if (!trackPerson(st)) { stopReason('lost target: unseen for 0.5 s or frame changed', true); note('lost-target','lost visible person'); return; }
      if (!targetTrack.visible) { letGo(); return; }
      const b = bearingTo(st,targetTrack.x,targetTrack.z);
      if (goal.kind === 'follow') {
        if (b.dist <= (goal.distance ?? 2)) { letGo(); turnBy(b.bearing); return; }
        walkRoute(st,targetTrack); return;
      }
      goal.x = targetTrack.x; goal.z = targetTrack.z;
    }
    if (goal.kind === 'route' || goal.kind === 'goto' || goal.kind === 'use') {
      const b = bearingTo(st,goal.x ?? goal.points?.at(-1)?.[0],goal.z ?? goal.points?.at(-1)?.[1]);
      if (goal.kind !== 'use' || b.dist > USE_REACH) {
        const done = walkRoute(st, { x:goal.x ?? goal.points?.at(-1)?.[0], z:goal.z ?? goal.points?.at(-1)?.[1] });
        if (done && goal.kind !== 'use') { letGo(); note('arrived','reached complete supported route'); goal={kind:'idle'}; }
        if (!done || goal.kind !== 'use') return;
      }
    }
    if (goal.kind === 'use') {
      const { bearing, dist } = bearingTo(st, goal.x, goal.z);
      // a closed door stops you short of its middle: facing the thing, with something right in front within a few
      // metres of it, a player presses use there (the fight pilot: the Body stood 1.7 m from a door, blocked by the door
      // itself, and never used it)
      // ...but only with the thing right there in sight - a door the eyes see just ahead, or the crosshair's plaque naming
      // something (the enhanced skin's; the classic skin has none): a wall corner in front is not a door (the second
      // fight try pressed use at a wall, and the agent wrote the door off)
      const blockedClose = st.front != null && st.front < policy.settings.wallStop + 0.5 && dist <= USE_REACH_BLOCKED && Math.abs(bearing) <= policy.settings.faceToleranceDeg * 2;
      const blockedAtIt = blockedClose && (!!st.ahead || (agent.view?.()?.things ?? []).some((t) => t.dist <= USE_REACH_BLOCKED && Math.abs(t.bearing) <= 12 && Math.hypot(t.x - goal.x, t.z - goal.z) < 1.5));
      if (dist > USE_REACH && !blockedAtIt) return;
      hold(new Set());
      if (goal.checking) return;   // pressed: the tick's watch decides what came of it (Sol's R5)
      if (!turnBy(bearing,useTargetId?2:policy.settings.faceToleranceDeg)) return;
      const things=sight?.scan?.things ?? sight?.things ?? [];
      const chosen=things.find(p=>(!useTargetId||p.targetId===useTargetId)&&Math.hypot(p.x-goal.x,p.z-goal.z)<1&&p.dist<=USE_REACH_BLOCKED&&Math.abs(p.bearing)<=(useTargetId?2:12));
      const visible=!!chosen;
      if (!st.scan?.fresh || (useTargetId?!visible:!visible&&!st.ahead)) { stopReason('use needs a fresh visible target or plaque', true); return; }
      if(useTargetId&&things.some(p=>p.targetId!==useTargetId&&Math.abs(p.bearing)<=2&&p.dist<chosen.dist-.25)){stopReason('another visible thing blocks the selected use target',true);return;}
      const r = agent.press('ActivateCenterObject', 120);
      const at = `${Math.round(goal.x)}, ${Math.round(goal.z)}`;
      if (r?.ok === false) { note('use-failed', `could not use the thing at ${at}: ${r.why ?? 'the use control did nothing'}`, { x: goal.x, z: goal.z }); goal = { kind: 'idle' }; return; }
      useCheck = { origin: { ...here }, x: goal.x, z: goal.z, at, until: now() + USE_CHECK_MS, before: { mode: st.mode, overlay: !!st.overlay, window: st.window ?? null, front: st.front ?? null, pos: st.pos, seq: st.lastSeq ?? null } };
      goal = { ...goal, checking: true };
      return;
    }
    if (goal.kind === 'turn') {
      turnTarget ??= st.yaw + goal.by;
      hold(new Set());
      if (turnBy(norm180(turnTarget - st.yaw))) { note('arrived', `turned to ${Math.round(((turnTarget % 360) + 360) % 360)} deg`); turnTarget = null; goal = { kind: 'idle' }; }
      return;
    }
    if (goal.kind === 'explore') {
      if (!Number.isFinite(goal.heading)) { stopReason('exploring with no heading is run by the mind loop, which sends goto goals', true); return; }
      exploreSteering ??= {heading:goal.heading,turns:0,turned:0,lastYaw:st.yaw,anchor:[st.pos[0],st.pos[2]]};
      const e=exploreSteering;
      e.turned+=Math.abs(norm180(st.yaw-e.lastYaw));e.lastYaw=st.yaw;
      if(Math.hypot(st.pos[0]-e.anchor[0],st.pos[2]-e.anchor[1])>=0.5) {e.anchor=[st.pos[0],st.pos[2]];e.turned=0;}
      if(e.turned>180) {steerExplore(st);return;}
      if (walkToward(st, norm180(e.heading - st.yaw),{tight:true})) {
        if (waitingForSight()) {
          const wallNear=(sight?.scan?.rays ?? []).some((r) => r.row===0 && ['wall','tree/prop','tree','prop'].includes(r.ends) && r.dist<=1.25);
          if(wallNear) steerExplore(st); else waitForSight(st);
          return;
        }
        if (/wall|prop|obstacle/.test(guardReason ?? '')) steerExplore(st);
        else stopReason(guardReason ?? 'exploration reached unsupported frontier', true);
      }
      return;
    }

  }

  // ---- A LOOK AROUND: a full circle in LOOK_STOPS pauses, gathering what the eyes report at each ----
  let look = null;   // { from, stop, dwellFrom, floor, rays: [{ heading, dist, ends }], things: [...] }
  const LOOK_FLOOR_PITCH = -55;   // the second turn of a look, as low as gaze()'s footing glance: the footing probes from the toes are in view
  const heading = (yaw, rel) => Math.round((((yaw + rel) % 360) + 360) % 360);

  function lookAround(st) {
    hold(new Set());
    // A footing wait leaves the camera pointing at the feet. A panorama must first lift it to eye level;
    // otherwise a full turn only re-observes the floor and misses doors and rising passages.
    // Then a second turn tilted down: a 65° view from 1.7 m sees no floor nearer than about 2.7 m at eye level,
    // so a level panorama alone leaves the ground under the feet unconnected to everything it saw.
    if (!pitchTo(st, look?.floor ? LOOK_FLOOR_PITCH : 0, 5)) return;
    look ??= { from: st.yaw, last: st.yaw, turned: 0, time: now(), rays: [], things: [], origin: { ...here } };
    look.turned += Math.max(0, norm180(st.yaw-look.last)); look.last=st.yaw;
    if (look.floor) {
      // The floor turn feeds the place memory through the scans; its short floor rays are not walls to describe.
      if (look.turned >= 359.5) { note('looked', describeLook(st, look), { ...look.origin, rays: look.rays, things: look.things }); look = null; goal = { kind: 'idle' }; return; }
    } else if (sight?.scan && sight.scan.id !== look.sample) {
      look.sample=sight.scan.id;
      for (const r of sight.scan.rays ?? []) look.rays.push({ heading:heading(sight.yaw,r.bearing),dist:r.dist,ends:r.ends });
      for (const p of sight.scan.things ?? []) if (!look.things.some((t) => t.kind===p.kind && Math.hypot(t.x-p.x,t.z-p.z)<1)) look.things.push(p);
    }
    if (!look.floor && look.turned >= 359.5) {
      look.floor = true; look.turned = 0; look.commanded = 0; look.last = st.yaw;
      return;
    }
    const dt = Math.min(50,Math.max(0,now()-look.time)); look.time=now();
    const degrees = Math.min(360-look.turned,60*dt/1000);
    // Do not queue turns ahead of observed yaw if mouse smoothing lags.
    if ((look.commanded ?? 0)-look.turned < 3) { agent.look(degrees*3.5,0); look.commanded=(look.commanded ?? 0)+degrees; }
  }

  /** The circle in words: which ways lead on (open or dark) and which are walls, then what was seen and where. */
  function describeLook(st, l) {
    const byHeading = new Map();
    for (const r of l.rays) {   // one reading per 15 degrees; overlapping cones keep the furthest
      const h = Math.round(r.heading / 15) * 15 % 360;
      const prev = byHeading.get(h);
      if (!prev || r.dist > prev.dist) byHeading.set(h, r);
    }
    // neighbouring headings that end alike read as one stretch: "165-315°: dark past 3-6m"
    const sorted = [...byHeading.entries()].sort((a, b) => a[0] - b[0]);
    const runs = [];
    for (const [h, r] of sorted) {
      const last = runs.at(-1);
      // a jump in depth between neighbours is an edge - a doorway in a wall, a pillar before a hall - not one stretch:
      // "wall 0-11m" once hid an opening and the room was called enclosed (Sol's R7)
      if (last && last.ends === r.ends && h - last.to <= 15 && Math.abs(r.dist - last.end) <= LOOK_JUMP) { last.to = h; last.end = r.dist; last.lo = Math.min(last.lo, r.dist); last.hi = Math.max(last.hi, r.dist); }
      else runs.push({ from: h, to: h, ends: r.ends, lo: r.dist, hi: r.dist, start: r.dist, end: r.dist });
    }
    if (runs.length > 1 && runs[0].from === 0 && runs.at(-1).to === 345 && runs[0].ends === runs.at(-1).ends && Math.abs(runs[0].start - runs.at(-1).end) <= LOOK_JUMP) {   // the circle closes
      const tail = runs.pop();
      runs[0] = { ...runs[0], from: tail.from, lo: Math.min(runs[0].lo, tail.lo), hi: Math.max(runs[0].hi, tail.hi) };
    }
    const span = (a, b) => (a === b ? `${a}m` : `${Math.round(a)}-${Math.round(b)}m`);
    const ways = runs.map((r) => `${r.from === r.to ? r.from : `${r.from}-${r.to}`}°${r.from > r.to ? ' (through 0)' : ''}: ${r.ends === 'open' ? `open ${span(r.lo, r.hi)}+` : r.ends === 'dark' ? `dark past ${span(r.lo, r.hi)}` : `${r.ends} ${span(r.lo,r.hi)}`}`);
    const things = l.things.map((t) => `${t.kind} ${t.dist}m at ${heading(0, bearingTo(st, t.x, t.z).bearing + st.yaw)}° (${t.x}, ${t.z})`);
    return `looked around from (${Math.round(st.pos[0])}, ${Math.round(st.pos[2])}). Ways: ${ways.join('; ') || 'none read'}. Seen: ${things.join('; ') || 'nothing'}.`;
  }

  function doAct(st, sit, d) {
    const s = policy.settings;
    const t = now();
    const f = sit.nearest;
    switch (d.act) {
      case 'followGoal': return doGoal(st);
      case 'stop': return letGo();
      case 'face': hold(new Set()); if (f) turnBy(f.bearing); return;
      case 'fight': {
        if (!f) return letGo();
        // An occluded foe is a remembered place to face, not a licence to walk or swing blind.
        if (f.remembered) { letGo(); turnBy(f.bearing); return; }
        // a weapon put away swings at nothing: have it out first (the game refuses a sheathed swing without a word)
        if (st.weapon && !st.weapon.out) {
          if (t - lastDraw >= DRAW_WAIT_MS) { agent.press('ReadyWeapon', 100); lastDraw = t; note('weapon', `readying ${st.weapon.name} to fight`); }
        }
        const a=(st.yaw+f.bearing)*Math.PI/180;
        const footprint={x:st.pos[0]+Math.sin(a)*f.dist,z:st.pos[2]+Math.cos(a)*f.dist,y:st.pos[1]+(f.dy ?? 0),h:f.h ?? 1.8};
        const contact=f.dist<=Math.min(2.5,s.reach+FOE_RADIUS_M) && scanUsable(st,sight?.scan) &&
          [...(sight.scan.rays ?? []),...floorMemory.hazards.values()].some((p) => foeBodyHit(p,[footprint]) &&
            Math.hypot((p.at ?? p.point)[0]-st.pos[0],(p.at ?? p.point)[2]-st.pos[2])<0.95);
        // Step into close range before each swing. If terrain blocks the step, keep a little bite range
        // so a foe against a doorway can still be fought without recording a blocked walk as a hit.
        if (f.dist > Math.min(s.reach,CLOSE_M) && !(contact && supportGuard(st,false,true))) {
          const blocked=walkToward(st,f.bearing,{foe:f});
          if (f.dist > s.reach+0.3) { if (blocked) note('stuck',`blocked closing on ${f.type}`,{...here,combat:true}); return; }
          if (!blocked) return;
        }
        hold(new Set());
        const faced = turnBy(f.bearing);
        const aimed = aimAt(st, f);
        const ready = !st.weapon || st.weapon.out;
        // never a swing before the last one is let go: each swing's own release would cut the next one short
        if (faced && aimed && ready && t - lastSwing >= Math.max(s.swingCooldownMs, s.swingMs + 50)) { agent.swing(0, 0, s.swingMs); lastSwing = t; note('swing', `swung at ${f.type}`, {dist:f.dist,reach:s.reach,contact,pitch:st.pitch}); }
        return;
      }
      case 'keepAway': {
        if (!f) return letGo();
        const faced = turnBy(f.bearing);
        hold(new Set(faced && f.dist < d.range && supportGuard(st,true) ? ['MoveBackwards'] : []));
        return;
      }
      case 'flee': {
        if (!f) return letGo();
        if (walkToward(st, norm180(f.bearing + 180), { run: true })) note('stuck', 'blocked while fleeing', { ...here, combat: true });
        return;
      }
      case 'useSlot': {
        hold(new Set());
        if (t - lastSlot >= s.slotCooldownMs) { agent.press(`QuickUse${d.slot}`, 120); lastSlot = t; note('slot', `pressed quick slot ${d.slot} (what came of it shows in your state)`); }
        return;
      }
      default: return letGo();
    }
  }

  /** Notice what changed since the last tick. */
  function watch(st, sit) {
    const inSight = sit.hostiles.filter((h) => h.dist <= SIGHT);
    if (inSight.length > seen.hostiles) {
      const n = inSight[0];
      note('foe', `${inSight.length} hostile in sight; nearest ${n.type ?? 'something'} ${Math.round(n.dist)} m, ${Math.round(n.bearing)} deg`);
    } else if (inSight.length === 0 && seen.hostiles > 0) note('clear', 'no hostiles in sight');
    seen.hostiles = inSight.length;
    const hp = st.vitals?.health;
    const max = st.vitals?.maxHealth;
    // a wound is health lost under the same ceiling: at the start the stand-in pool is replaced by the rolled one
    if (Number.isFinite(hp) && Number.isFinite(seen.hp) && hp < seen.hp && max === seen.max) note('hurt', `hp ${hp}/${max} (-${Math.round(seen.hp - hp)})`);
    if (Number.isFinite(hp) && hp <= 0 && seen.hp > 0) note('down', 'health reached 0');
    seen.hp = hp;
    seen.max = max;
    if (sit.hpPct != null) {
      const band = sit.hpPct < 25 ? 25 : sit.hpPct < 50 ? 50 : 100;
      if (band < seen.hpBand) note('low', `hp below ${band}%`);
      seen.hpBand = band;
    }
    if (st.overlay && !seen.window) note('window', String(st.window || 'a window opened').slice(0, 400), st.windowKind ? { kind: st.windowKind } : undefined);
    if (!st.overlay && seen.window) note('window-closed', 'the window closed');
    seen.window = !!st.overlay;
  }

  /** WHAT CAME OF A USE (Sol's R5): pressing the control is not the same as something happening. A use succeeds only
   *  on a change a player would see: another place, a window, what stands in front moving (a door), or words on the
   *  screen. Nothing within a few seconds is said as nothing, and the planner's task fails on it. Runs while a window
   *  is up too: a window is often what the use brought. */
  function settleUse(st) {
    const c = useCheck;
    if (!c) return;
    const b = c.before;
    const heard = b.seq != null ? (agent.events?.(b.seq)?.lines ?? []).filter((l) => l.text) : [];
    let outcome = null, what = '';
    if (st.mode !== b.mode) { outcome = 'place'; what = `you are now ${st.mode === 'exterior' ? 'outside' : `in a ${st.mode}`}`; }
    else if (st.overlay && (!b.overlay || st.window !== b.window)) { outcome = 'window'; what = `a window: ${String(st.window ?? '').slice(0, 160)}`; }
    else if (st.pos && b.pos && Math.hypot(st.pos[0] - b.pos[0], st.pos[2] - b.pos[2]) > 3) { outcome = 'place'; what = `you were moved to ${Math.round(st.pos[0])}, ${Math.round(st.pos[2])}`; }
    else if (heard.length) { outcome = 'text'; what = `the game said: ${heard.map((l) => l.text).join(' / ').slice(0, 200)}`; }
    else if ((b.front == null) !== (st.front == null) || (b.front != null && Math.abs(st.front - b.front) > 1)) {
      outcome = 'moved'; what = `what stood in front moved (${b.front == null ? 'nothing near' : `${b.front.toFixed(1)} m`} -> ${st.front == null ? 'nothing near' : `${st.front.toFixed(1)} m`})`;
    }
    if (!outcome && now() < c.until) return;
    useCheck = null;
    if (goal.kind === 'use' && goal.checking) goal = { kind: 'idle' };
    note('used', outcome ? `used the thing at ${c.at}: ${what}` : `used the thing at ${c.at}: nothing seemed to happen`, { ...c.origin, x: c.x, z: c.z, outcome: outcome ?? 'nothing' });
  }

  let wasHeld = false;   // whether the last tick left anything pressed, so a pause lets go once rather than every tick
  let climbBackUntil = 0;   // an accidental climb's step back runs to here
  function tick() {
    let st;
    try {if(enabled&&combatGuard)agent._scan?.({fresh:true});st = agent.state();} catch { st = null; }
    // A model-selected combat target is fenced at the Body clock, before any input.
    if (enabled && combatGuard) {
      const foes = (st?.foes ?? []).filter(f => f?.hostile && Number.isFinite(f.dist));
      const chosen = foes.find(f=>f.targetId===combatGuard.targetId);
      const hp=st?.vitals?.health, max=st?.vitals?.maxHealth ?? st?.vitals?.healthMax;
      const reason = !st || st.loading || st.frame!==combatGuard.frame || st.scan?.page!==combatGuard.page ? 'combat observation or frame lost'
        : !Number.isFinite(hp) || !Number.isFinite(max) || max<=0 || hp<=0 || hp/max*100<=combatGuard.stopHpPct ? 'combat health floor reached or unavailable'
        : null;
      if (reason) { enabled=false; combatGuardFailure=reason; activeRule=null; letGoAll(); wasHeld=false; note('combat-guard',reason); return; }
      if(st.scan?.fresh!==true||!chosen){
        combatMissingSince??=now();letGoAll();wasHeld=false;
        if(now()-combatMissingSince>=750){enabled=false;combatGuardFailure='chosen hostile absent beyond observation grace';note('combat-guard',combatGuardFailure);}
        return; // no blind movement or swings during temporary occlusion
      }
      combatMissingSince=null;
    }
    // Wake the camera refresh for the NEXT tick's read, never by a movement pulse - and never under a window or a pause,
    // where the Body acts on nothing (Sol, trial 1: it was asked inside every support check)
    if (enabled && goal.kind !== 'idle' && st && !st.loading && !st.overlay && !st.paused) agent.look?.(0, 0);
    // no state (a reload, an error): nothing stays pressed while the Body cannot see
    if (!st || st.loading) { if (enabled && (held.size || wasHeld)) { letGoAll(); wasHeld = false; } return; }
    here = Array.isArray(st.pos) ? { x: st.pos[0], y:st.pos[1], z: st.pos[2], heading: ((st.yaw % 360) + 360) % 360, page:st.scan?.page, frame:st.frame, time:st.scan?.time } : null;
    const nextBoundary=`${st.scan?.page}:${st.frame}`;
    if (boundary!==null && boundary!==nextBoundary) { navigation=null; floorMemory={strips:[],nodes:new Map(),hazards:new Map(),seen:new Map()}; floorSample=null; glanceUntil=-Infinity; glanceKey=null; gazeDistance=0; motionState=null; targetTrack=null; look=null; tutorial=null; threat=null; fightFocus=null; hurtUntil=-Infinity; foeTrail=[]; letGoAll(); if (goal.kind!=='idle') stopReason('frame changed; route, look and target cancelled',true); }
    boundary=nextBoundary;
    sight = agent.view?.() ?? null;
    if (sight?.scan && `${sight.scan.page}:${sight.scan.frame}:${sight.scan.id}` !== lastScan) {
      lastScan=`${sight.scan.page}:${sight.scan.frame}:${sight.scan.id}`;
      note('scan','dated camera sample',{ scan:sight.scan });
    }
    if (motionState && now()>motionState.time) {
      const moved=Math.hypot(st.pos[0]-motionState.x,st.pos[2]-motionState.z);
      speed=moved/((now()-motionState.time)/1000); gazeDistance+=moved;
    }
    motionState={x:st.pos[0],z:st.pos[2],time:now()};
    if (navigation && (navigation.page !== st.scan?.page || navigation.frame !== st.frame)) { navigation=null; targetTrack=null; if (goal.kind !== 'idle') stopReason('frame changed; route and target lost',true); }
    const sit = readSituation(st);
    if(combatGuard){const chosen=sit.hostiles.find(f=>f.targetId===combatGuard.targetId);if(chosen)sit.nearest=chosen;}
    const wounded = Number.isFinite(st.vitals?.health) && st.vitals.health < seen.hp && st.vitals.maxHealth === seen.max;
    rememberThreat(st,sit,wounded);
    // Trial 8's state.window had clipped line fragments, without the card's final instruction. Read the
    // same visible window text the mind reads; no engine window type or hidden UI metadata is needed.
    let cardText=String(st.window ?? '').trim();
    if (st.overlay) {
      const observation=agent.windowObservation?.();
      cardText=String(observation?.text ?? observation?.body ?? cardText).trim();
    }
    const card = !!st.overlay && /click or press (any|a) key\s*$/i.test(cardText);
    if (card) {
      const key = `${nextBoundary}:${st.windowRevision ?? ''}:${cardText}`;
      if (tutorial?.key !== key) {
        tutorial = { key, since: now(), lastPress: -Infinity };
        note('tutorial-read', cardText); // full visible words survive the card for the strategist
      }
    } else tutorial = null;
    watch(st, sit);
    settleUse(st);
    if (enabled && now() > leaseUntil) { enabled = false; letGoAll(); activeRule = null; note('body', 'disabled: the mind stopped renewing its lease'); }
    if (!enabled) return;
    if (Number.isFinite(st.vitals?.health) && st.vitals.health<=0) { letGoAll(); fightFocus=null; return; }
    // SOFTWARE-TACTICIAN: only a visible any-key card gets an automatic key, after its grace.
    // Its full words are already retained above; every other window waits for the mind.
    if (st.overlay || st.paused) {
      if (held.size || wasHeld) { letGoAll(); wasHeld = false; }
      if (tutorial && st.vitals?.health > 0 && now()-tutorial.since >= 550 && now()-tutorial.lastPress >= 550) {
        tutorial.lastPress = now();
        agent.press('ActivateCursor', 100); // Enter reaches the overlay router; Mouse0 is not a keyboard key
        note('tutorial-dismissed', 'pressed a key to dismiss a tutorial card');
      }
      if (goal.kind==='look') { look=null; goal={kind:'idle'}; note('stuck','look cancelled by window or pause'); note('goal-cancelled','look cancelled by window or pause',{goalRevision}); }
      return;
    }
    wasHeld = true;
    // NO CLIMB IS EVER ASKED FOR (there is no act for one), so a climb is an accident: let go, step back, say so -
    // and, exploring, turn aside, as being blocked would. Nothing else this tick or while the step back runs.
    if (st.climbing) {
      if (now() >= climbBackUntil) {
        letGoAll();
        if (supportGuard(st,true)) agent.press('MoveBackwards', CLIMB_BACK_MS);
        climbBackUntil = now() + CLIMB_BACK_MS + 100;
        note('climb', 'started climbing a wall by accident; let go and stepped back');
        if (goal.kind === 'explore') goal = { kind:'idle' };
      }
      return;
    }
    if (now() < climbBackUntil) return;
    rememberFooting(st,sight?.scan);
    // Keep the fight's admission distance through brief occlusion/range flicker; all other table conditions
    // and priority still apply. Replacing the table clears this latch immediately.
    const ruleSit=fightFocus && threat && now()<threat.until && sit.nearest ? {...sit,nearest:{...sit.nearest,dist:Math.min(sit.nearest.dist,fightFocus.dist)}} : sit;
    const rule = policy.rules.find((r) => holds(r.when,r.id===fightFocus?.id && r.do.act==='fight' ? ruleSit : sit,goal)) ?? null;
    if (rule?.do.act==='fight' && sit.nearest && !sit.nearest.remembered && !fightFocus) fightFocus={id:rule.id,dist:sit.nearest.dist};
    const aiming = rule?.do.act==='fight' && !sit.nearest?.remembered;
    if (goal.kind!=='look' && !aiming) gaze(st);
    if ((rule?.id ?? null) !== activeRule) { activeRule = rule?.id ?? null; note('rule', `now: ${activeRule ?? 'none'}`); }
    if (rule?.do.act==='followGoal' && now()<hurtUntil) { letGo(); if (sit.nearest) turnBy(sit.nearest.bearing); }
    else if (rule) doAct(st, sit, rule.do); else letGo();
  }

  return {
    tick,
    /** On or off. `leaseMs`: stay on only that long unless enabled again - a mind that dies without a word must not
     *  leave the character walking (the loop renews it every pass). */
    enable(on, leaseMs = 0) {
      if (on && combatGuardFailure) return {ok:false,errors:[combatGuardFailure]};
      const was = enabled;
      enabled = !!on;
      leaseUntil = enabled && leaseMs > 0 ? now() + leaseMs : Infinity;
      if (!enabled) { letGoAll(); activeRule = null; if (goal.kind==='look') { look=null; goal={kind:'idle'}; } }
      if (was !== enabled) note('body', enabled ? 'enabled' : 'disabled');
      return { ok: true, enabled };
    },
    setCombatGuard(value) {
      if (enabled) return {ok:false,errors:['disable Body before changing combat guard']};
      if (value !== null && (!value || typeof value.targetId!=='string' || !value.targetId || value.targetId.length>200 || typeof value.page!=='string' || !value.page || value.page.length>128 || !['string','number'].includes(typeof value.frame) || !Number.isFinite(value.stopHpPct) || value.stopHpPct<0 || value.stopHpPct>100)) return {ok:false,errors:['invalid combat guard']};
      combatGuard=value===null ? null : {targetId:value.targetId,page:value.page,frame:value.frame,stopHpPct:value.stopHpPct};
      combatGuardFailure=null;combatMissingSince=null; return {ok:true};
    },
    setUseTarget(value){if(value!==null&&(typeof value!=='string'||!value||value.length>200))return {ok:false,errors:['invalid use target']};useTargetId=value;return {ok:true};},
    setPolicy(table) {
      const r = validatePolicy(table, policy.settings);
      if (r.ok) { policy = r.policy; activeRule = null; fightFocus=null; hurtUntil=-Infinity; note('policy', `new table: ${policy.rules.map((x) => x.id).join(', ')}`); }
      return { ok: r.ok, errors: r.errors };
    },
    getPolicy: () => policy,
    setGoal(g) {
      const r = validateGoal(g);
      if (r.ok) {
        goal = structuredClone(r.goal); exploreSteering=null; goalRevision++; goalSetAt=now(); replans=0; lastReplan=-Infinity; targetTrack=null; navigation=null; lastRoute=null; guardReason=null; sightMark=null; certAhead=0; turnTarget = null; walkFrom = null; look = null; useCheck = null; letGo();
        const end = goal.kind === 'route' ? goal.points.at(-1) : null;
        note('goal', end ? `route of ${goal.points.length} waypoints to ${Math.round(end[0])}, ${Math.round(end[1])}` : JSON.stringify({ ...goal, via: goal.via ? `${goal.via.length} waypoints` : undefined }));
      }
      return { ok: r.ok, errors: r.errors };
    },
    setNavigation(data) {
      const st=agent.state();
      if (typeof data?.page!=='string' || !data.page || data.page.length>128 || data.frame==null) return {ok:false,errors:['navigation needs an opaque page and frame']};
      const ok = data && data.page===st.scan?.page && data.frame===st.frame && typeof data.visit==='string' && data.visit.length<=80 && Number.isInteger(data.revision) && data.revision>=0 && data.goalRevision===goalRevision && data.graph?.cell===0.5 && Array.isArray(data.graph.nodes) && data.graph.nodes.length<=20000 && data.graph.nodes.every((n) => ['ix','iz','level','height'].every((k) => Number.isFinite(n[k])) && ['ix','iz','level'].every((k) => Number.isInteger(n[k]))) && Array.isArray(data.graph.blocked) && data.graph.blocked.length<=20000 && data.graph.blocked.every((p) => Array.isArray(p) && p.length===3 && p.every(Number.isInteger)) && ['complete','partial','none'].includes(data.route?.status) && Array.isArray(data.route.points) && data.route.points.length<=256 && data.route.points.every((p) => Array.isArray(p) && p.length===3 && p.every(Number.isFinite)) && typeof data.route.reason==='string' && data.route.reason.length<=200;
      if (!ok) return {ok:false,errors:['navigation malformed or stale page/frame/goal']};
      const strips = data.graph.strips ?? [];
      if (!Array.isArray(strips) || strips.length > 256 || strips.some((s) =>
        !Array.isArray(s.feet) || s.feet.length !== 3 || !s.feet.every(Number.isFinite) ||
        !Number.isFinite(s.yaw) || !Number.isFinite(s.width) || s.width < 0.7 || s.width > 2 ||
        !Number.isFinite(s.reach) || s.reach < 0.25 || s.reach > 8 ||
        !Array.isArray(s.heights) || s.heights.length !== Math.round(s.reach*4)+1 ||
        !s.heights.every((h,i) => Number.isFinite(h) && (!i || h-s.heights[i-1] <= 0.3+1e-6 && h-s.heights[i-1] >= -0.5-1e-6)))) return {ok:false,errors:['malformed footing strips']};
      if (data.graph.nodes.some((n) => (n.x !== undefined || n.z !== undefined) &&
        (!Number.isFinite(n.x) || !Number.isFinite(n.z) || Math.floor(n.x/0.5) !== n.ix || Math.floor(n.z/0.5) !== n.iz))) return {ok:false,errors:['malformed footing waypoint']};
      if (navigation && (data.visit!==navigation.visit || data.revision<navigation.revision)) return {ok:false,errors:['stale visit or map revision']};
      const graph={cell:0.5,nodes:data.graph.nodes.map(({ix,iz,level,height,x,z,planningOnly}) => ({ix,iz,level,height,planningOnly:planningOnly===true,...(x !== undefined ? {x,z} : {})})),
        strips:strips.map(({feet,yaw,width,reach,heights}) => ({feet:[...feet],yaw,width,reach,heights:[...heights]})),
        blocked:data.graph.blocked.map((p) => [...p]),walls:[],doors:[]};
      graph.time=now();graph.people=(Array.isArray(data.graph.people)?data.graph.people:[]).slice(0,128).filter((p) => [p.x,p.z,p.level,p.until].every(Number.isFinite)).map((p) => ({x:p.x,z:p.z,level:p.level,until:now()+Math.max(0,Math.min(1000,p.until-(data.graph.time ?? p.until)))}));
      if (Array.isArray(data.graph.doors) && data.graph.doors.length<=20000 && data.graph.doors.every((p) => Array.isArray(p) && p.length===3 && p.every(Number.isInteger))) graph.doors=data.graph.doors.map((p) => [...p]);
      if (Array.isArray(data.graph.walls) && data.graph.walls.length<=20000 && data.graph.walls.every((p) => Array.isArray(p) && p.length===3 && p.every(Number.isInteger))) graph.walls=data.graph.walls.map((p) => [...p]);
      const clearance=data.graph.wallClearance ?? [];
      const wallKeys=new Set(graph.walls.map(p=>navKey(...p)));
      if(!Array.isArray(clearance)||clearance.length>20000||clearance.some(p=>
        ![p.ix,p.iz,p.level].every(Number.isInteger)||!Number.isFinite(p.height)||
        !wallKeys.has(navKey(p.ix,p.iz,p.level))||
        !Array.isArray(p.faces)||!p.faces.length&&!p.hits||p.faces.length>8||p.exitOnly!==undefined&&p.exitOnly!==true||
        p.hits!==undefined&&(p.exitOnly!==true||!Array.isArray(p.hits)||!p.hits.length||p.hits.length>9||p.hits.some(h=>
          !Array.isArray(h)||h.length!==2||!h.every(Number.isFinite)||Math.floor(h[0]/.5)!==p.ix||Math.floor(h[1]/.5)!==p.iz))||p.faces.some(f=>
          !Array.isArray(f)||f.length!==4||!f.every(Number.isFinite)||
          Math.floor(f[0]/.5)!==p.ix||Math.floor(f[1]/.5)!==p.iz||Math.abs(f[2])+Math.abs(f[3])!==1||
          ![0,1].includes(Math.abs(f[2]))||![0,1].includes(Math.abs(f[3])))))return {ok:false,errors:['malformed wall clearance']};
      graph.wallClearance=structuredClone(clearance);
      const target=goal.target ?? (goal.kind==='route' ? {x:goal.points.at(-1)[0],z:goal.points.at(-1)[1]} : goal);
      if (!Number.isFinite(target.x) || !Number.isFinite(target.z)) return {ok:false,errors:['no walking goal for navigation']};
      const route=traceRoute(graph,st.pos[0],st.pos[2],target.x,target.z,Math.round(st.pos[1]/3));
      navigation={...structuredClone(data),graph,route}; lastRoute=JSON.stringify(route.points); return {ok:true};
    },
    status: () => ({ id, enabled, combatGuardFailure, rule: activeRule, goal, goalRevision, mapRevision:navigation?.revision ?? null, replans, exploreTurns:exploreSteering?.turns ?? 0, held: [...held], settings: policy.settings, lastSeq: seq }),
    events: (after = 0) => ({ dropped, lostThroughSeq, lines: log.filter((l) => l.seq > after) }),
  };
}

/** In the page: build the Body over window.__agent and run it on its own clock. */
export function startBody(agent) {
  const body = createBody(agent);
  const timer = setInterval(() => body.tick(), TICK_MS);
  // Warm builder repairs retire the old clock before installing another Body.
  body.dispose = () => { clearInterval(timer); body.enable(false); };
  return body;
}
