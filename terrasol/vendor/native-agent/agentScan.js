// @ts-check
// AGENT14: dated camera samples. Scene queries stay in scene space; only the returned points are continuous.
// A ray proves its own hit, never a triangle of safe floor between neighbouring rays.
import { isLit, DARK_SIGHT, relative } from './agentSenses.js';
import { TERRAIN_SIZE } from '../world/terrain/terrainSampler.js';
import { isActionDoorObject } from '../world/actionSystem.js';
import { CAPSULE_RADIUS } from '../player/motor.js';
import { batchSphere, batchLift, quadHalfDiagonal, placementRadius } from '../render/bounds.js';
import { createVisibleFloor } from './agentFloor.js';

const DEG = Math.PI / 180;
const unit = (v) => { const n = Math.hypot(...v); return v.map((x) => x / n); };
const point = (o, d, t) => o.map((x, i) => x + d[i] * t);
const distance = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));
const rounded = (x) => Math.round(x * 1000) / 1000;
const generation = globalThis.crypto?.randomUUID?.() ?? `page-${Date.now()}-${Math.random()}`;
/** Flats lower than this (metres) are plants a player walks through and sees over (see sceneTrace). */
export const LOW_FLAT_M = 1.6;
/** Outdoor refresh rates, in Hz; Claude can tune these after measuring live. */
export const OUTDOOR_MOVING_HZ = 5, OUTDOOR_STILL_HZ = 1;
export const OUTDOOR_FLAT_RANGE = 60;
/** The most flats one placement's cached tree is built over (once per placement). */
export const FLAT_TREE_LIMIT = 2_000_000;
/** Pixels looked at, and the nearest kept for tracing (see sceneTrace). */
export const PIXEL_SCAN_LIMIT = 4096, PIXEL_KEEP = 96;
export const SCAN_LIMITS = Object.freeze({ rays: 219, footing: 96, queries: 512, cells: 32768, candidates: 32768 });

/** The actual perspective and view matrices, already supplied by the renderer. Missing projection fails closed. */
export function cameraPicture(renderer) {
  const p = renderer?._proj, v = renderer?._view;
  if (!p || !v || !(Math.abs(p[0]) > 0 && p[5] > 0) || p[15] !== 0) return null;
  const eye = Array.from(renderer._camPos ?? []);
  if (eye.length !== 3 || !eye.every(Number.isFinite)) return null;
  // The view's rows are the camera basis; its third row points back. This also keeps pitch and camera shake.
  const right = [v[0], v[4], v[8]], up = [v[1], v[5], v[9]], forward = [-v[2], -v[6], -v[10]];
  const far = p[14] / (p[10] + 1);
  return { eye, right, up, forward, projection: Array.from(p), view: Array.from(v),
    viewport: Array.from(renderer._worldViewportPx ?? [0, 0, renderer.canvas?.width ?? 0, renderer.canvas?.height ?? 0]),
    // an infinite far plane (p[10] = -1, outdoors) divides by zero: it is "as far as allowed", never zero - zero blinded
    // every outdoor ray (Claude, live, 2026-10-18); a broken projection is still refused above
    far: Math.min(800, Number.isFinite(far) && far > 0 ? far : far === Infinity || Math.abs(p[10] + 1) < 1e-6 ? 800 : 0) };
}

export function pictureRay(pic, x, y) {
  const p = pic.projection, sx = (x + p[8]) / p[0], sy = (y + p[9]) / p[5];
  return unit(pic.forward.map((f, i) => f + pic.right[i] * sx + pic.up[i] * sy));
}

export function inPicture(pic, at) {
  if (!pic) return false;
  const d = at.map((x, i) => x - pic.eye[i]);
  const dot = (a) => a.reduce((n, x, i) => n + x * d[i], 0);
  const z = dot(pic.forward), p = pic.projection;
  const x = p[0] * dot(pic.right) / z - p[8], y = p[5] * dot(pic.up) / z - p[9];
  const near = p[14] / (p[10] - 1);
  return z >= near && distance(at, pic.eye) <= pic.far && Math.abs(x) <= 1 && Math.abs(y) <= 1;
}

/** Exact two-sided triangle intersection, used on the current drawn terrain LOD, never height at the eye. */
export function triangleHit(o, d, a, b, c, max) {
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a.reduce((n, x, i) => n + x * b[i], 0);
  const e = sub(b, a), f = sub(c, a), h = cross(d, f), det = dot(e, h);
  if (Math.abs(det) < 1e-9) return null;
  const s = sub(o, a), u = dot(s, h) / det;
  if (u < -1e-7 || u > 1 + 1e-7) return null;
  const q = cross(s, e), v = dot(d, q) / det, t = dot(f, q) / det;
  if (v < -1e-7 || u + v > 1 + 1e-7 || t < 1e-5 || t > max) return null;
  return { dist: t, normal: unit(cross(e, f)) };
}

/** The part of this finite ray inside a drawn pixel's square, in near-to-far order. */
function pixelSpan(o, d, max, t) {
  let lo = 0, hi = max;
  for (const k of [0, 2]) {
    if (Math.abs(d[k]) < 1e-9) { if (o[k] < t[k] || o[k] >= t[k] + TERRAIN_SIZE) return null; }
    else { const a = (t[k] - o[k]) / d[k], b = (t[k] + TERRAIN_SIZE - o[k]) / d[k]; lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b)); }
  }
  if (hi < lo) return null;
  return [lo, hi];
}

/** Where a ray enters a vertical cylinder (a billboard's core: radius r about x,z, from y0 up to y1), in front of the
 *  eye; null when it misses or the eye is already inside (a flat beside the player places nothing ahead). */
function cylinderEntry(o, d, max, x, z, r, y0, y1) {
  const ox = o[0] - x, oz = o[2] - z, a = d[0] * d[0] + d[2] * d[2];
  if (a < 1e-12 || ox * ox + oz * oz <= r * r) return null;
  const b = ox * d[0] + oz * d[2], disc = b * b - a * (ox * ox + oz * oz - r * r);
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / a;
  if (!(t > 0) || t > max) return null;
  const y = o[1] + d[1] * t;
  return y >= y0 && y <= y1 ? t : null;
}

function sphereEntry(o, d, max, x, y, z, r) {
  const dx = x-o[0], dy = y-o[1], dz = z-o[2], along = dx*d[0]+dy*d[1]+dz*d[2];
  const disc = r*r - (dx*dx+dy*dy+dz*dz-along*along);
  if (disc < 0 || along + Math.sqrt(disc) < 0) return null;
  const near = Math.max(0, along-Math.sqrt(disc));
  return near <= max ? near : null;
}

// Placement grids are immutable renderer products. Refine dense cells once, rather than rescan a forest per ray.
// The size cap bounds even the first build; larger/unavailable geometry remains unknown.
const flatTrees = new WeakMap();
function flatTree(q, budget) {
  if (flatTrees.has(q)) return flatTrees.get(q);
  // Built ONCE per placement and cached, so its cost is not one sample's: charging it to the sample's candidates, and
  // refusing a forest bigger than them, made every ray through a large forest unknown at 0 m (Claude, live, 2026-10-18).
  const count = q.pts.length / 3;
  if (count > FLAT_TREE_LIMIT) return null;
  const pts = q.pts;
  const build = (ids) => {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const i of ids) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], pts[i+k]); hi[k] = Math.max(hi[k], pts[i+k]); }
    const centre = lo.map((v, k) => (v+hi[k])/2), r = Math.hypot(...hi.map((v, k) => (v-lo[k])/2));
    if (ids.length <= 16) return { centre, r, ids };
    const axis = hi[0]-lo[0] >= hi[2]-lo[2] ? 0 : 2;
    ids.sort((a, b) => pts[a+axis]-pts[b+axis]);
    const mid = ids.length >> 1;
    return { centre, r, children: [build(ids.slice(0, mid)), build(ids.slice(mid))] };
  };
  const tree = build(Array.from({length: pts.length/3}, (_, i) => i*3));
  flatTrees.set(q, tree); return tree;
}

/** Outdoor terrain is a coarse height march, not a walk over every drawn triangle.
 * Missing ground ends coverage at that point. Coarse steps can miss ridges narrower than a step. */
function outdoorTerrainHit(ctx, o, d, max, budget, drawnAt) {
  if (!ctx.heightAt) return { ends: 'unknown', dist: 0 };
  let t = 0;
  while (t <= max) {
    if (--budget.cells < 0) return { ends: 'unknown', dist: t };
    const x = o[0] + d[0] * t, y = o[1] + d[1] * t, z = o[2] + d[2] * t;
    const height = ctx.heightAt(x, z);
    if (!Number.isFinite(height)) return { ends: 'unknown', dist: t };
    if (y <= height) {
      const water = ctx.outdoorWaterAt?.(x, z);
      return { dist: t, ends: !drawnAt([x, y, z]) || water == null ? 'unknown' : water ? 'water' : 'ground', normal: [0, 1, 0] };
    }
    if (t === max) break;
    t = Math.min(max, t + Math.min(5, 0.5 + t * 0.1));
  }
  return null;
}

/** GAZE-BRIEF: near ground can be remembered, or immediately ahead of the level view. */
function outdoorFooting(s, pic, target, budget, remembered) {
  const unknown = { ends: 'unknown', at: null, normal: null };
  if (!s.heightAt || !s.collider?.raycastHit || --budget.queries < 0) return unknown;
  const height = s.heightAt(target[0], target[2]);
  if (!Number.isFinite(height)) return unknown;
  const at = [target[0], height, target[2]], len = distance(pic.eye, at);
  const pictured=inPicture(pic,at);
  const near=Math.hypot(at[0]-s.feet[0],at[2]-s.feet[2]), yaw=s.direction ?? s.cam.yaw;
  const toward=near<=2.5 && inPicture(pic,[s.feet[0]+Math.sin(yaw)*Math.max(0.75,near),pic.eye[1],s.feet[2]+Math.cos(yaw)*Math.max(0.75,near)]);
  if ((!pictured && !remembered(at) && !toward) || len > s.fogLimit || !isLit(at, s.light)) return unknown;
  const hit = s.collider.raycastHit(pic.eye, unit(at.map((x, i) => x - pic.eye[i])), len);
  if (Number.isFinite(hit?.dist) && hit.dist >= 0 && hit.dist < len - 0.05) return unknown;
  const water = s.outdoorWaterAt?.(at[0], at[2]);
  return water == null ? unknown : { ends: water ? 'water' : 'ground', at, normal: [0, 1, 0], pictured };
}

/** Adapter over the hosts' existing draw contexts. Cover cylinders are deliberately not evidence of a surface. */
export function sceneTrace(ctx, pic) {
  const c = ctx.collider?.(), mode = ctx.mode(), ec = mode === 'exterior' ? ctx.exterior?.() : null;
  const local = mode === 'dungeon' ? ctx.dungeon?.() : mode === 'interior' ? ctx.interior?.() : null;
  // The NEAREST drawn pixels, never all or nothing: live, the streamed grid holds hundreds, and bailing out past a
  // count blinded every outdoor ray (Claude, live, 2026-10-18). Rays cull per pixel, so a few hundred cost little;
  // past the cap the far ones are left out, and a ray that runs off the kept pixels ends unknown, not open.
  const visible = [];
  let examined = 0;
  for (const p of ec?.pixels ?? []) {
    if (++examined > PIXEL_SCAN_LIMIT) break;
    if (p._visible) visible.push(p);
  }
  const eyeX = pic?.eye?.[0] ?? 0, eyeZ = pic?.eye?.[2] ?? 0;
  const pixels = visible.map((p) => ({ p, t: ec.pixelTranslation(p.px, p.py) }))
    .map((x) => ({ ...x, d: Math.hypot(x.t[0] + TERRAIN_SIZE / 2 - eyeX, x.t[2] + TERRAIN_SIZE / 2 - eyeZ) }))
    .sort((a, b) => a.d - b.d).slice(0, PIXEL_KEEP);
  // Only nearby pixels can contribute flat posts; far terrain still uses the world height sampler.
  const flatPixels = pixels.filter(({t}) => Math.hypot(Math.max(t[0] - eyeX, 0, eyeX - t[0] - TERRAIN_SIZE),
    Math.max(t[2] - eyeZ, 0, eyeZ - t[2] - TERRAIN_SIZE)) <= OUTDOOR_FLAT_RANGE);
  const doors = new Set();
  for (const o of local?.actions?.objects?.values?.() ?? []) if (isActionDoorObject(o)) doors.add(o.key);
  // A hit counts as seen when it lands inside a DRAWN pixel's square. Live bucket keys are mesh names, not "px,py", so
  // the earlier key test failed every outdoor hit (Claude, live, 2026-10-18): judge by where the hit is.
  const drawnAt = (q) => pixels.some(({ t }) => q[0] >= t[0] && q[0] < t[0] + TERRAIN_SIZE && q[2] >= t[2] && q[2] < t[2] + TERRAIN_SIZE);
  return (o, d, max, budget, why = null) => {
    if (!c?.raycastHit) return { ends: 'unknown', dist: 0 };
    let best = c.raycastHit(o, d, max);
    // Collider's miss is an object with dist Infinity, not null. A miss must never become a far wall.
    if (!Number.isFinite(best?.dist) || best.dist < 0 || best.dist > max) best = null;
    if (best) best = mode === 'exterior' && !drawnAt(point(o, d, best.dist)) ? { dist: best.dist, ends: 'unknown' }
      : { dist: best.dist, normal: Array.from(best.normal ?? [0, 0, 0]),
        ends: doors.has(best.key) ? 'door' : best.normal?.[1] > 0.5 ? 'ground' : 'wall', key:best.key };
    const take = (hit, src = '?') => { if (hit) why?.push({ src, dist: hit.dist, ends: hit.ends }); if (hit && (!best || hit.dist < best.dist)) best = hit; };   // `why`: builder diagnosis only
    if (mode === 'exterior') take(outdoorTerrainHit(ctx, o, d, best?.dist ?? max, budget, drawnAt), 'terrain-march');
    const flatMax = Math.min(OUTDOOR_FLAT_RANGE, best?.dist ?? max);
    const crossed = flatPixels.map(({p, t}) => ({p, t, span: pixelSpan(o, d, flatMax, t)}))
      .filter((p) => p.span).sort((a, b) => a.span[0]-b.span[0]);
    for (const { p, t, span } of crossed) {
      if (span[0] > Math.min(flatMax, best?.dist ?? max)) break;
      // A flat's bounding sphere includes transparent texels and wind. It can only close coverage, never name art.
      for (const b of p.batches ?? []) {
        if (--budget.candidates < 0) return { ends: 'unknown', dist: 0 };
        if (!b.bounds || b._dead || b.castOnly || b.size?.h < LOW_FLAT_M) continue;
        const sphere = batchSphere({bounds: b.bounds, size: b.size, origin: t}, [0,0,0,0]);
        if (sphereEntry(o, d, Math.min(flatMax, best?.dist ?? max), ...sphere) === null) continue;
        // A batch sphere can cover a whole forest. Its placement grid retains the actual individual flats.
        const pts = b._place?.pts;
        if (pts) {
          const half = placementRadius(quadHalfDiagonal(b.size), 0), lift = batchLift(b), q = b._place;
          const tree = flatTree(q, budget);
          if (!tree) return {ends: 'unknown', dist: 0};
          const pending = [tree];
          while (pending.length) {
            if (--budget.candidates < 0) return { ends: 'unknown', dist: 0 };
            const node = pending.pop();
            if (sphereEntry(o, d, Math.min(flatMax, best?.dist ?? max), node.centre[0]+t[0], node.centre[1]+t[1]+lift, node.centre[2]+t[2], node.r+half) === null) continue;
            if (node.children) { pending.push(...node.children); continue; }
            for (const i of node.ids) {
              if (--budget.candidates < 0) return { ends: 'unknown', dist: 0 };
              // a billboard is a picture on a post, not a ball: test its core as a vertical cylinder (a third of its
              // width), over its drawn height. The whole-picture sphere put the eye inside every nearby tree and ended
              // each ray at 0 m (Claude, live, 2026-10-18).
              // Low plants (under LOW_FLAT_M) have no collision in this game: the player walks through them, and a body
              // sees over them. Only taller flats (trees, standing stones) hide what is behind.
              if (b.size.h < LOW_FLAT_M) continue;
              const base = pts[i+1]+t[1]+lift-b.size.h/2;
              const near = cylinderEntry(o, d, Math.min(flatMax, best?.dist ?? max), pts[i]+t[0], pts[i+2]+t[2], Math.max(0.25, b.size.w/6), base, base+b.size.h);
              if (near !== null) take({dist: near, ends: 'unknown'}, 'flat');
            }
          }
          continue;
        }
        // A whole batch's sphere with the eye INSIDE it (the grass or rocks the player stands among) places nothing:
        // ending every ray at 0 m there blinded the outdoor scan (Claude, live, 2026-10-18). Only an entry ahead counts.
        const near = sphereEntry(o, d, Math.min(flatMax, best?.dist ?? max), ...sphere);
        if (near !== null && near > 0) take({dist: near, ends: 'unknown'}, 'batch');
      }
    }
    for (const w of local?.waterQuads ?? []) {
      if (--budget.candidates < 0) return { ends: 'unknown', dist: 0 };
      const t = (w.y - o[1]) / d[1], q = point(o, d, t);
      if (t > 0 && t <= max && q[0] >= w.x && q[0] <= w.x + w.size && q[2] >= w.z && q[2] <= w.z + w.size) take({ dist: t, ends: 'water', normal: [0, 1, 0] }, 'water');
    }
    // Outdoors a missing terrain pixel is an unobserved region, not a clear horizon.
    return best ?? { ends: mode === 'exterior' && !pixels.length ? 'unknown' : 'open', dist: max };
  };
}

/** A lazy, rate-limited clock, also ticked by the installed bridge. Polls within one period share the exact sample. */
export function createCameraScan({ source, now = () => performance.now(), limits = SCAN_LIMITS, page = generation }) {
  let cached = null, id = 0, lastPose = '', movingUntil = -Infinity, requested = false;
  const visibleFloor = createVisibleFloor();
  const seenGround = new Map();
  const emptyBudget = () => ({ queries: limits.queries, cells: limits.cells, candidates: limits.candidates });
  function read() {
    const s = source(), time = now(), poseKey = JSON.stringify([s.cam.pos, s.cam.yaw, s.cam.pitch, s.direction]);
    if (cached && cached.frame!==s.frame) seenGround.clear();
    const changed = lastPose && poseKey !== lastPose;
    if (changed || s.moving || requested) movingUntil = time + 200;
    lastPose = poseKey;
    const blocked = s.blocked || !s.picture;
    const period = s.outdoors ? 1000 / (time <= movingUntil ? OUTDOOR_MOVING_HZ : OUTDOOR_STILL_HZ)
      : time <= movingUntil ? 100 : 500;
    if (cached && cached.frame === s.frame && cached.blocked === !!blocked && !requested && time - cached.time < period) return cached;
    requested = false;
    if (!blocked) Object.assign(s, s.prepare?.());
    const pic = s.picture, c = s.compensation ?? [0, 0, 0];
    const groundKey=(at) => `${Math.round((at[0]-c[0])*4)},${Math.round((at[1]-c[1])*4)},${Math.round((at[2]-c[2])*4)}`;
    for (const [key,when] of seenGround) if (time-when>3000) seenGround.delete(key);
    // Independent reserves: shape and remaining actor/far work cannot spend footing's allowance.
    const footingBudget = emptyBudget(), shapeBudget = emptyBudget(), remainingBudget = emptyBudget();
    const continuous = (p) => p.map((x, i) => rounded(x - c[i]));
    const rays = [], footing = [], far = [];
    const trace = s.trace;
    const cast = (dir, max, budget = shapeBudget) => {
      if (!trace || --budget.queries < 0) return { ends: 'unknown', dist: 0, at: null, normal: null };
      const hit = trace(pic.eye, dir, max, budget) ?? { ends: 'unknown', dist: 0 };
      let ends = hit.ends, dist = Math.min(max, Math.max(0, hit.dist));
      // Fog closes coverage before it can reveal a hidden surface. Full darkness is the first unlit half metre.
      if (s.fogLimit < dist) { dist = s.fogLimit; ends = 'unknown'; }
      if (!s.light.outdoorsOrIndoors) {
        for (let t = DARK_SIGHT + 0.5; t < dist; t += 0.5) {
          if (!isLit(point(pic.eye, dir, t), s.light)) { dist = t - 0.5; ends = 'dark'; break; }
        }
        if (dist > DARK_SIGHT && !isLit(point(pic.eye, dir, dist), s.light)) {
          dist = Math.max(DARK_SIGHT, Math.floor(dist * 2) / 2); ends = 'dark';
        }
      }
      const supported = ['wall', 'tree/prop', 'door', 'ground', 'water'].includes(ends);
      return { ends, dist: rounded(dist), at: supported ? continuous(point(pic.eye, dir, dist)) : null,
        normal: supported && hit.normal ? hit.normal.map(rounded) : null };
    };
    let columns = 0, missing = 0;
    if (!blocked) {
      const left = Math.atan((-1 + pic.projection[8]) / pic.projection[0]);
      const right = Math.atan((1 + pic.projection[8]) / pic.projection[0]);
      // DFO mirrors the projection's x row. Keep screen order and measure the angular span by magnitude.
      columns = Math.ceil(Math.abs(right - left) / (2.5 * DEG)) + 1;
      const yaw = s.direction ?? s.cam.yaw, width = s.width ?? CAPSULE_RADIUS * 2;
      const supported = new Map(s.outdoors ? [0, -width / 2, width / 2].map((side) => [side, { height: s.feet[1] - c[1], station: 0 }]) : []);
      for (let station = 1; station <= 32; station++) for (const side of [0, -width / 2, width / 2]) {
        const reach = station * 0.25;
        const target = [s.feet[0] + Math.sin(yaw) * reach + Math.cos(yaw) * side, s.feet[1], s.feet[2] + Math.cos(yaw) * reach - Math.sin(yaw) * side];
        let hit = { ends: 'unknown', dist: 0, at: null, normal: null };
        if (footing.length < limits.footing && s.outdoors) {
          const measured = outdoorFooting(s, pic, target, footingBudget,(at) => seenGround.has(groundKey(at)));
          if (measured.at && measured.pictured) seenGround.set(groundKey(measured.at),time);
          hit = { ...hit, ...measured, at: measured.at ? continuous(measured.at) : null };
        } else if (footing.length < limits.footing) {
          // A horizontal target hits a rising floor SHORT of the station. Re-aim using only the normal/point
          // just seen, then verify with another eye ray. Never query a hidden floor height or cast from above it.
          const aimed = [...target];
          for (let attempt = 0; attempt < 3 && inPicture(pic, aimed); attempt++) {
            hit = cast(unit(aimed.map((x, i) => x - pic.eye[i])), Math.min(pic.far, distance(pic.eye, aimed) + 8), footingBudget);
            if (hit.ends !== 'ground' || !hit.at || !(hit.normal?.[1] > 0.5)) break;
            const at = hit.at.map((v, i) => v + c[i]);
            if (Math.hypot(at[0]-target[0], at[2]-target[2]) <= 0.13) break;
            aimed[1] = at[1] - (hit.normal[0]*(target[0]-at[0]) + hit.normal[2]*(target[2]-at[2]))/hit.normal[1];
          }
        }
        const at = hit.at, normal = hit.normal;
        let ends = hit.ends === 'ground' && at && Math.hypot(at[0] + c[0] - target[0], at[2] + c[2] - target[2]) <= 0.13 ? 'ground'
          : hit.ends === 'water' ? 'water' : 'unknown';
        const previous = supported.get(side);
        if (hit.ends === 'ground' && at && previous?.station === station - 1 && (s.outdoors
          ? at[1] - previous.height > 0.3 + 1e-6 || previous.height - at[1] > 0.5 + 1e-6
          : normal?.[1] > 0.8 && at[1] < previous.height - 0.5)) ends = 'ledge';
        if (ends === 'ground' || s.outdoors && ends !== 'unknown') supported.set(side, { height: at[1], station });
        footing.push({ station, side, reach, ends, height: ends !== 'unknown' ? at?.[1] ?? null : null,
          at: ends !== 'unknown' ? at : null, normal: ends !== 'unknown' ? normal : null,
          // Three sight points are not a verified swept patch or a clearance test.
          usable: false });
      }
      for (const row of [0, -0.7, 0.7]) for (let col = 0; col < columns; col++) {
        const a = left + (right - left) * col / (columns - 1), x = Math.tan(a) * pic.projection[0] - pic.projection[8];
        if (rays.length >= limits.rays) { missing++; continue; }
        const dir = pictureRay(pic, x, row), hit = cast(dir, s.range ?? pic.far);
        rays.push({ row, column: col, bearing: rounded(relative(pic.eye, s.cam.yaw, point(pic.eye, dir, 1)).bearing), ...hit });
      }
      if (s.outdoors) for (const ray of rays) {
        if (ray.ends !== 'wall' || ray.dist < 60) continue;
        const bearing = Math.round(ray.bearing / 5) * 5;
        if (!far.some((f) => f.bearing === bearing)) far.push({ kind: 'buildings', bearing, width: 5, dist: Math.round(ray.dist / 50) * 50 });
      }
    }
    // Dense floor shares shape's remaining allowance; footing was already sampled with its reserve first.
    const {floor,water} = visibleFloor(s,shapeBudget,(at,spent) => {
      if (!inPicture(pic,at) || !isLit(at,s.light) || shapeBudget.queries<=0) return false;
      const len=distance(pic.eye,at);
      shapeBudget.queries--; spent();
      const hit=s.collider.raycastHit(pic.eye,unit(at.map((v,i) => v-pic.eye[i])),len);
      return hit && (hit.dist===Infinity || Number.isFinite(hit.dist) && hit.dist>=len-0.03);
    });
    const visible = (at, ownKey = null) => {
      const budget = remainingBudget;
      if (blocked || !inPicture(pic, at)) return false;
      const len = distance(pic.eye, at);
      if (len > s.fogLimit || (len > DARK_SIGHT && !isLit(at, s.light)) || !trace || --budget.queries < 0) return false;
      const hit = trace(pic.eye, unit(at.map((x, i) => x - pic.eye[i])), len, budget);
      return hit && hit.ends !== 'unknown' && (hit.dist >= len - 0.1 || ownKey != null && hit.key === ownKey);
    };
    // Candidates come from engine lists, never sparse ray hits. Test near things first, before the query cap.
    const candidates=(s.things ?? []).filter((t) => distance(pic.eye,t.at)<=(s.thingRange ?? pic?.far ?? 0))
      .sort((a,b) => distance(pic.eye,a.at)-distance(pic.eye,b.at));
    const things = blocked ? [] : candidates.slice(0, 128).filter((t) => visible(t.at,t.key)).map((t) => {
      const r = relative(s.feet, s.cam.yaw, t.at), at = continuous(t.at);
      return { kind: t.kind, ...(t.observedId?{targetId:t.observedId()}:{}), dist: rounded(r.dist), bearing: rounded(r.bearing), x: at[0], y: at[1], z: at[2] };
    }).sort((a, b) => a.dist - b.dist).slice(0, 12);
    const foes = blocked ? [] : (s.foes ?? []).slice(0, 128).filter((f) => visible(f.at))
      .map((f) => typeof f.value === 'function' ? f.value() : f.value).sort((a, b) => a.dist - b.dist);
    cached = { version: 1, page, frame: s.frame, id: ++id, time, blocked: !!blocked,
      pose: { eye: pic ? continuous(pic.eye) : continuous(s.cam.pos), feet: continuous(s.feet), yaw: s.cam.yaw, pitch: s.cam.pitch,
        right: pic?.right ?? null, up: pic?.up ?? null, forward: pic?.forward ?? null,
        projection: pic?.projection ?? null, viewport: pic?.viewport ?? null, direction: s.direction ?? s.cam.yaw },
      coverage: { columns, rows: [0, -0.7, 0.7], missing, sampled: rays.length,
        unknown: rays.filter((r) => r.ends === 'unknown').length, footingUnknown: footing.filter((p) => p.ends === 'unknown').length,
        actorsLimited: (s.things?.length ?? 0) > 128 || (s.foes?.length ?? 0) > 128,
        exhausted: [footingBudget, shapeBudget, remainingBudget].some((b) => Object.values(b).some((n) => n < 0)), patches: false },
      rays, footing, floor, water, far: far.slice(0, 16), things, foes };
    return cached;
  }
  return { read, wake() { const time = now(); if (time > movingUntil) requested = true; movingUntil = time + 200; }, fresh(sample, frame, time = now()) {
    return !!sample && !sample.blocked && sample.page === page && sample.frame === frame && time >= sample.time && time - sample.time <= 200;
  } };
}
