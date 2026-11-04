// THE MEMORY OF A PLACE: what a person keeps in their head while finding their way - where they started, the route
// they took, the ground they have covered, the ways they saw but have not tried, and the things they noticed. It is
// built only from what the agent itself saw and did (positions as it walked, its look-arounds, what it used), never
// from the game's data, and it is the mind's, not the Body's: the Strategist reads it as text and as a small map.
//
// A visit starts provisionally separate; an earned door crossing can restore an earlier place in this run.
// Page/frame tokens file evidence only. Ground remains per 3 m level band, never through floors.

import { createSessionMap, sampleOrigin } from './placeMap.mjs';
import { rememberedSurroundings } from './surroundings.mjs';
const CELL = 0.5;        // metres; 32 cells per 16 m chunk
const LEVEL = 3;         // metres of height: one floor of a place
const WAYPOINT = 4;      // metres walked before the route gains a point
const ROUTE_MAX = 40;    // the route keeps this many points (the oldest fall away, as memory does)
const LEAD_REACH = 2.5;  // metres: a way counts as tried once you have stood this close to where it leads
const WALLS_MAX = 20_000;   // wall points kept per place (1 m each): far more than a dungeon level holds
const LEAD_MIN = 3;      // metres: a reading shorter than this leads nowhere new

/** What came of using a thing, as a person would recall it. */
const USED = { nothing: 'tried it: nothing happened', place: 'used: it led to another place', window: 'used: a window came up', text: 'used: the game said something', moved: 'used: what stood there moved' };

const levelOf = (y) => Math.round((y ?? 0) / LEVEL);
const cellKey = (x, z, lv) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)},${lv}`;
const toward = (x, z, headingDeg, d) => { const a = (headingDeg * Math.PI) / 180; return [x + Math.sin(a) * d, z + Math.cos(a) * d]; };
const r1 = (v) => Math.round(v);

/** The town map as recalled: the named places first (nearest first), then how many of each kind are unnamed, with
 *  the nearest few of each - an unnamed shop is still a shop on the map. */
function townLines(town, pos) {
  const d = (o) => Math.hypot(o.x - pos[0], o.z - pos[2]);
  const named = town.buildings.filter((b) => b.names.length).sort((a, b) => d(a) - d(b));
  const loose = town.labels.filter((l) => !town.buildings.some((b) => b.names.includes(l.text)));
  const lines = [...named.slice(0, 15).map((b) => `${b.names.join(' / ')} (${b.kind}) at (${r1(b.x)},${r1(b.z)}), ${r1(d(b))} m away`),
    ...loose.slice(0, 5).map((l) => `${l.text} (a name on the map) at (${r1(l.x)},${r1(l.z)}), ${r1(d(l))} m away`)];
  const unnamed = {};
  for (const b of town.buildings) if (!b.names.length) (unnamed[b.kind] ??= []).push(b);
  for (const [kind, list] of Object.entries(unnamed)) {
    const n = list.length, many = (w) => (n === 1 ? w : `${w}s`);
    if (kind === 'house' || kind === 'unclassified') { lines.push(`${n} ${many(kind === 'house' ? 'house' : 'other building')} without names`); continue; }
    lines.push(`${n} ${many(kind)} without a name on the map; nearest: ${list.sort((a, b) => d(a) - d(b)).slice(0, 3).map((b) => `(${r1(b.x)},${r1(b.z)}) ${r1(d(b))} m`).join(', ')}`);
  }
  return `The town map (from the M map, as you read it; positions are a building's middle - its door is on its edge):\n${lines.map((l) => `- ${l}`).join('\n')}`;
}

export function createPlaceMemory() {
  /** @type {Map<string, any>} */
  const places = new Map();
  const origins = new Map();
  let currentOrigin = null;
  let mode = null, visit = 0;
  let before = null;   // the place left last: a use that led out of it belongs to it, not to where it led
  let moved = false;   // the frame changed: the next observation begins a new visit, even in the same kind of place
  let active = null;
  const crossings = [], portals = [];
  function labelDoor(p,state) {
    const name=typeof state.ahead==='string' ? /^To ([^\n]{1,100})$/.exec(state.ahead.trim())?.[1] : null;
    if (!name || !Array.isArray(state.pos)) return;
    const near=p.things.filter((t)=>['door','exit door'].includes(t.kind) && t.level===levelOf(state.pos[1]) &&
      Math.hypot(t.x-state.pos[0],t.z-state.pos[2])<3.2);
    if (near.length===1) near[0].destinationName=name; // painted plaque words, never a judge place name
  }

  // Copy only the visible vocabulary and coordinates; never retain engine ids or extra judge fields.
  function rememberThing(p, t, lv, time, ref = null) {
    if (!['door','exit door','opening','person','loot','corpse','container','shelf','well'].includes(t?.kind) ||
        !Number.isFinite(t.x) || !Number.isFinite(t.z)) return;
    const tolerance=['door','exit door'].includes(t.kind)?0.35:1;
    const old = p.things.find((s) => s.kind === t.kind && s.level === lv && Math.hypot(s.x-t.x,s.z-t.z)<tolerance);
    if (old && (old.time ?? -Infinity) > (time ?? -Infinity)) return;
    const value = {kind:t.kind,x:t.x,z:t.z,level:lv,time,ref,used:old?.used ?? false};
    if (old) Object.assign(old,value); else p.things.push(value);
  }

  function restore(c, target) {
    const fresh=c.to;
    if (fresh===target) return;
    target.map.merge(fresh.map);
    for (const k of fresh.cells) target.cells.add(k);
    for (const k of fresh.walls) target.walls.add(k);
    for (const t of fresh.things) rememberThing(target,t,t.level,t.time,t.ref);
    target.leads.push(...fresh.leads);
    target.last=fresh.last; target.level=fresh.level;
    target.route=fresh.route; // never draw a walked segment joining two separate visits
    target.name ??= fresh.name;
    target.time=Math.max(target.time ?? 0,fresh.time ?? 0);
    if (fresh.people) target.people=fresh.people;
    for (const [origin,p] of origins) if (p===fresh) origins.set(origin,target);
    for (const [key,p] of places) if (p===fresh) places.set(key,target);
    for (const edge of [...crossings,...portals]) {
      if (edge.from===fresh) edge.from=target;
      if (edge.to===fresh) edge.to=target;
    }
    if (active===fresh) active=target;
    if (before===fresh) before=target;
  }

  /** The place now: a new visit whenever the kind of place changes (in, out, down a door). */
  function placeOf(state) {
    const m = state?.mode ?? 'unknown';
    const origin = sampleOrigin(state?.scan ?? state);
    const departed=currentOrigin;
    if (origin && currentOrigin && origin !== currentOrigin) moved = true;
    if (origin) currentOrigin = origin;
    // one change of visit for a move, whether the kind of place changed, the frame did, or both (Sol, workspace review
    // B8: counting both overwrote the place left, and a door's outcome landed in the place it led to)
    let changed=false;
    if (m !== mode || moved) { before = active; mode = m; visit++; moved = false; changed=true; }
    const key = `${m}#${visit}`;
    if (!places.has(key)) places.set(key, { key, kind: m, start: null, cells: new Set(), route: [], leads: [], things: [], walls: new Set(), last: null, map: createSessionMap() });
    active=places.get(key);
    if (changed && before && Array.isArray(state?.pos)) crossings.push({from:before,to:active,fromOrigin:departed,arrival:[...state.pos],claimed:false});
    if (origin) origins.set(origin, places.get(key));
    return places.get(key);
  }

  // B8: a dated event resolves its original visit, without changing the active visit.
  function eventPlace(state, data) {
    const origin = sampleOrigin(data?.origin ?? data);
    if (origin) return origins.get(origin) ?? null;
    return placeOf(state); // legacy events without a frame
  }

  return {
    /** The character is somewhere else now (the frame changed: a journey, a teleport) though the kind of place may
     *  be the same: positions from before mean nothing here, so the next observation begins a new visit. */
    elsewhere() { moved = true; },

    rememberFloor(state, map) {
      if (!['dungeon','interior'].includes(state?.mode)) return false;
      return placeOf(state).map.rememberFloor(map,state.pos?.[1]);
    },

    ingestScan(state, scan) {
      const origin = sampleOrigin(scan);
      let p = origin ? origins.get(origin) : null;
      if (!p && origin === sampleOrigin(state?.scan)) p = placeOf(state);
      if (!p) return false; // unbound late page/frame: never file it in today's place
      const ingested=p.map.ingest(scan, {time:Math.max(scan.time,state.t ?? state.scan?.time ?? scan.time),frame:scan.frame});
      if (ingested) {
        const latest=scan.time>=(p.time ?? -Infinity);
        p.time=Math.max(p.time ?? 0,scan.time);
        if (latest) {
          p.coverage={ missing:scan.coverage?.missing ?? 0, patches:scan.coverage?.patches===true };
          p.people=(scan.things ?? []).filter((t) => t.kind==='person' && Number.isFinite(t.x) && Number.isFinite(t.z)).map((t) => ({x:t.x,z:t.z,level:levelOf(scan.pose.feet[1]),time:scan.time}));
        }
        if (!scan.blocked) for (const t of scan.things ?? []) rememberThing(p,t,levelOf(scan.pose.feet[1]),scan.time,`${origin}:${scan.id}`);
        if (origin===sampleOrigin(state.scan)) labelDoor(p,state);
        for (const f of scan.far ?? []) if (f.kind==='buildings' && Number.isFinite(f.bearing)) {
          const heading=((scan.pose.yaw*180/Math.PI+f.bearing)%360+360)%360;
          p.far ??= [];
          p.far=p.far.filter((r) => Math.abs(r.heading-heading)>10);
          p.far.push({heading,time:scan.time,x:scan.pose.feet[0],z:scan.pose.feet[2]});
          p.far=p.far.slice(-4);
        }
      }
      return ingested;
    },

    /** Where the character stands now: the ground covered and the route. */
    observe(state) {
      if (!Array.isArray(state?.pos)) return;
      const p = placeOf(state);
      const [x, y, z] = state.pos;
      p.start ??= [x, z];
      p.cells.add(cellKey(x, z, levelOf(y)));
      const last = p.route.at(-1);
      if (!last || Math.hypot(x - last[0], z - last[1]) >= WAYPOINT) { p.route.push([x, z]); if (p.route.length > ROUTE_MAX) p.route.shift(); }
      p.last = [x, z];
      p.level = levelOf(y);
      labelDoor(p,state);
    },

    /** A look-around's readings (the Body's `looked` event data): the ways that lead on, and the things seen. */
    addLook(state, data) {
      if (!data) return;
      const p = eventPlace(state, data);
      if (!p) return;
      const lv = levelOf(data.y ?? state?.pos?.[1]);
      // neighbouring headings that lead on (open, or dark past arm's length) make one way, aimed at their middle
      // where a reading ended at a wall, that metre is wall: an edge of the known floor there leads nowhere (R7)
      for (const r of data.rays ?? []) {
        if (r.ends !== 'wall' || !(r.dist > 0) || p.walls.size >= WALLS_MAX) continue;
        const [wx, wz] = toward(data.x, data.z, r.heading, r.dist + 0.3);
        p.walls.add(`${Math.floor(wx)},${Math.floor(wz)},${lv}`);
      }
      const sorted = [...(data.rays ?? [])].sort((a, b) => a.heading - b.heading);
      const runs = [];
      for (const r of sorted) {
        const leads = r.ends === 'open' || (r.ends === 'dark' && r.dist >= LEAD_MIN) || (r.ends === 'wall' && r.dist >= 8);
        const last = runs.at(-1);
        if (leads && last && r.heading - last.to <= 20) { last.to = r.heading; last.dist = Math.max(last.dist, r.dist); last.ends = last.ends === 'open' || r.ends === 'open' ? 'open' : last.ends; }
        else if (leads) runs.push({ from: r.heading, to: r.heading, dist: r.dist, ends: r.ends });
      }
      for (const run of runs) {
        const heading = (run.from + run.to) / 2;
        // aim at the far edge of what was SEEN, a step short of it: past it may be rock (run 4 kept heading for points
        // 2 m beyond the light, inside the cave wall, and never got there). From the edge, a fresh look sees on.
        const [tx, tz] = toward(data.x, data.z, heading, Math.min(Math.max(run.dist - 1, 1.5), 12));
        if (p.leads.some((l) => l.level === lv && Math.hypot(l.x - tx, l.z - tz) < 3)) continue;
        p.leads.push({ fromX: data.x, fromZ: data.z, heading: Math.round(heading), span: [run.from, run.to], ends: run.ends, dist: run.dist, x: tx, z: tz, level: lv });
      }
      for (const t of data.things ?? []) rememberThing(p,t,lv,data.time ?? state?.t ?? null);
    },

    /** The Body was blocked here, facing this way (a "stuck" event's data): what is just ahead is not to be walked,
     *  whatever the map's floor says - a ledge, a corner, a thing in the way. A player learns "not that way" too. */
    blocked(state, data) {
      if (!data || !Number.isFinite(data.x) || !Number.isFinite(data.heading)) return;
      if (data.reason?.includes('person')) return; // temporary actor overlay, never a wall
      if (/missing or stale footing|unknown support or clearance/.test(data.reason ?? '')) return; // waiting for sight is not a collision
      if (data.combat) return;   // blocked by a creature, closing or fleeing: it moves on, the floor does not become wall (Sol)
      const p = eventPlace(state, data);
      if (!p) return;
      const lv = levelOf(data.y ?? state?.pos?.[1]);
      const [bx, bz] = toward(data.x, data.z, data.heading, 0.8);
      p.map.invalidate(bx, bz, lv, data.time ?? 0);
      for (const d of [0.8, 1.3]) {
        if (p.walls.size >= WALLS_MAX) return;
        const [wx, wz] = toward(data.x, data.z, data.heading, d);
        p.walls.add(`${Math.floor(wx)},${Math.floor(wz)},${lv}`);
      }
    },

    addThing(state, t) {
      const p = placeOf(state);
      const lv = levelOf(state?.pos?.[1]);
      rememberThing(p,t,lv,state?.t ?? state?.scan?.time ?? null);
    },

    /** Something was used at x,z (the Body's `used` event), and what came of it (its `outcome`: 'nothing' is kept
     *  too - a door that would not open is worth remembering). Only things on the level it was used on are marked, and
     *  a use that led to another place is marked in the place it was used in (Sol's R6). */
    used(state, x, z, outcome = 'used', origin = null) {
      const here = placeOf(state);
      const p = origin && sampleOrigin(origin) ? eventPlace(state,origin) : outcome === 'place' && before ? before : here;
      if (!p) return;
      const lv = Number.isFinite(origin?.y) ? levelOf(origin.y) : p === here ? levelOf(state?.pos?.[1]) : p.level;
      for (const t of p.things) if (t.level === lv && Math.hypot(t.x - x, t.z - z) < 1.5) { t.used = true; t.outcome = outcome; }
      if (outcome !== 'place') return;
      const sourceOrigin=sampleOrigin(origin);
      const c=crossings.findLast((edge) => edge.from===p && !edge.claimed && (!sourceOrigin || edge.fromOrigin===sourceOrigin));
      if (!c) return;
      c.claimed=true;
      // A relocation alone earns no recognition. Require a seen door at the actual use.
      const nearby=p.things.filter((t) => ['door','exit door'].includes(t.kind) && t.level===lv && Math.hypot(t.x-x,t.z-z)<1.5)
        .sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));
      if (nearby.length>1 && Math.hypot(nearby[1].x-x,nearby[1].z-z)-Math.hypot(nearby[0].x-x,nearby[0].z-z)<0.5) return;
      const door=nearby[0];
      if (!door) return;
      c.to.name ??= door.destinationName;
      const matches=portals.filter((e) => e.from===p && e.level===lv && Math.hypot(e.x-door.x,e.z-door.z)<(e.returnAnchor?1.5:0.5) &&
        e.to.kind===c.to.kind && levelOf(e.arrival[1])===levelOf(c.arrival[1]) && Math.hypot(e.arrival[0]-c.arrival[0],e.arrival[2]-c.arrival[2])<2.5);
      if (matches.length===1) restore(c,matches[0].to);
      else if (!matches.length) {
        portals.push({from:p,to:c.to,x:door.x,z:door.z,level:lv,arrival:c.arrival});
        // Returning through the arrival door can recover the source place too. It still needs a seen door/use.
        portals.push({from:c.to,to:p,x:c.arrival[0],z:c.arrival[2],level:levelOf(c.arrival[1]),arrival:[door.x,lv*LEVEL,door.z],returnAnchor:true});
      }
    },

    /** The town map, read off the open M map (the agent mode's townMap()): its buildings by the colour the map gives
     *  them, the names it shows, and where each stands. Kept with this visit outdoors, as a person keeps a map in mind
     *  after putting it away. A later reading replaces it: the map only ever shows more as the town is learned. */
    readTownMap(state, tm) {
      if (!tm?.buildings?.length) return null;
      const p = placeOf(state);
      p.town = {
        buildings: tm.buildings.map((b) => ({ kind: b.kind, x: b.pos[0], z: b.pos[2], names: (b.labels ?? []).map((l) => l.text), rows: b.footprint?.rows ?? [], cell: b.footprint?.cell ?? 1 })),
        labels: (tm.labels ?? []).map((l) => ({ text: l.text, x: l.pos[0], z: l.pos[2] })),
      };
      const kinds = {};
      for (const b of p.town.buildings) kinds[b.kind] = (kinds[b.kind] ?? 0) + 1;
      return `${p.town.buildings.length} buildings (${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(', ')}), ${p.town.labels.length} names`;
    },

    /** The place as a person would recall it, in a few lines. Ways and things on other levels are marked so. */
    describe(state) {
      const p = origins.get(sampleOrigin(state?.scan ?? state)) ?? placeOf(state);
      if (!p.start) return 'No memory of this place yet.';
      const lv = levelOf(state?.pos?.[1]);
      const here = [...p.cells].map((k) => k.split(',').map(Number)).filter((c) => c[2] === lv);
      const been = (x, z) => here.some(([cx, cz]) => Math.hypot((cx + 0.5) * CELL - x, (cz + 0.5) * CELL - z) <= LEAD_REACH);
      const xs = here.map((c) => c[0] * CELL), zs = here.map((c) => c[1] * CELL);
      const route = p.route.slice(-12).map(([x, z]) => `(${r1(x)},${r1(z)})`).join(' → ');
      const elsewhere = (o) => (o.level !== lv ? ' (on another level)' : '');
      const open = p.leads.filter((l) => l.level !== lv || !been(l.x, l.z));
      const tried = p.leads.length - open.length;
      const leadLines = open.slice(0, 8).map((l) => `from (${r1(l.fromX)},${r1(l.fromZ)}) toward ${l.span[0] === l.span[1] ? l.heading : `${l.span[0]}-${l.span[1]}`}°, ${l.ends === 'open' ? 'open' : 'dark'} past ${l.dist}m: go to (${r1(l.x)},${r1(l.z)})${elsewhere(l)}`);
      const thingLines = p.things.slice(-12).map((t) => `${t.kind} at (${r1(t.x)},${r1(t.z)})${t.used ? `, ${USED[t.outcome] ?? 'used'}` : t.level === lv && been(t.x, t.z) ? ', been beside it' : ', not reached yet'}${elsewhere(t)}`);
      return [
        `Memory of this ${p.kind}${p.name?` (${p.name})`:''}: you started at (${r1(p.start[0])},${r1(p.start[1])}). On this level you have covered ${here.length} squares of ${CELL}m${here.length ? `, across x ${Math.min(...xs)} to ${Math.max(...xs) + CELL}, z ${Math.min(...zs)} to ${Math.max(...zs) + CELL}` : ''}.`,
        `Your route (oldest first): ${route}${p.last ? ` → now (${r1(p.last[0])},${r1(p.last[1])})` : ''}.`,
        open.length ? `Ways you saw but have not tried (${tried} tried already):\n${leadLines.map((l) => `- ${l}`).join('\n')}` : `No untried ways remembered${tried ? ` (${tried} tried already)` : ''}.`,
        thingLines.length ? `Things you noticed:\n${thingLines.map((l) => `- ${l}`).join('\n')}` : '',
        p.town ? townLines(p.town, state.pos).slice(0,1600) : '',
        this.orientation(state),
      ].filter(Boolean).join('\n').slice(0,2400);
    },

    orientation(state) {
      return rememberedSurroundings(this.snapshot(state),state);
    },

    /** The memory of the place, at the current level only - for the map picture and for finding routes. */
    snapshot(state, visitKey = null) {
      // A role's asynchronous capture can refer to a just-left frame. Reading it must not relocate memory.
      const source=sampleOrigin(state?.scan ?? state);
      const p = visitKey ? places.get(visitKey) : origins.get(source) ?? placeOf(state);
      const lv = levelOf(state?.pos?.[1]);
      const cells = [...p.cells].map((k) => k.split(',').map(Number)).filter((c) => c[2] === lv).map(([cx, cz]) => [cx, cz]);
      const walls = [...p.walls].map((k) => k.split(',').map(Number)).filter((w) => w[2] === lv).map(([wx, wz]) => [wx, wz]);
      const map = p.map.snapshot();
      return { key: p.key, kind: p.kind, name:p.name ?? null, start: p.start, last: p.last, route: p.route, level: lv, heading:state.yaw ?? 0,
        origin: source ?? currentOrigin, ...map, time:state.scan?.fresh===false?Math.max(p.time ?? 0,(state.scan.time ?? 0)+201):p.time ?? 0, people:p.people ?? [], far:p.far ?? [], coverage:p.coverage, surfaces: map.surfaces, town: p.town ?? null, cells, walls, cell: CELL,
        leads: p.leads.filter((l) => l.level === lv), things: p.things.filter((t) => t.level === lv) };
    },
  };
}
