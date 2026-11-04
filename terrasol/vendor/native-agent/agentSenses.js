// @ts-check
// AGENT2 - THE AGENT'S EYES (a fork's patch; the workspace's docs/09 section 5). What an ordinary player can make out
// on the screen, as data: no more, and since the experiment's correction (docs/07 4.6), no less.
//
//   - A VIEW CONE ahead (VIEW_HALF either side of the facing). Things behind the player are not in view; turning
//     to look is how a player sees them, and the agent's Body does the same.
//   - LINES OF SIGHT through the mode's own collider: nothing through a wall.
//   - LIGHT. At night and indoors only what is lit can be seen beyond DARK_SIGHT: by the player's own light
//     (systems/playerTorch.js: a lit source's range, off its item template) or by the dungeon's lamps
//     (dungeonContext.js `lights`, each with its range). Lighting a torch therefore really does show more.
//     Daylight follows the sky clock; street and interior lamps come from the rendered light set.
//   - WHAT IS OBVIOUS AT A GLANCE: doors, exit doors, loot piles and people. Mechanisms that hide in plain sight - a
//     lever, a wall that moves - are not listed; a player finds them by walking up and reading the World Tooltips
//     plaque, and so does the agent (agentBridge.js `ahead`).
import { objectAabb } from '../player/activate.js';
import { isActionDoorObject } from '../world/actionSystem.js';
import { EYE_HEIGHT } from '../player/motor.js';
import { doorWorldPosition } from '../player/enterExit.js';
import { isShop } from '../systems/shopStock.js';
import { isBookshelfBuilding } from '../systems/bookshelf.js';
import { BUILDING_TYPES } from '../world/buildingNames.js';
import { isNight, daylightScale } from '../world/worldClock.js';

export const VIEW_HALF = 45;      // degrees either side of the facing
export const VIEW_RANGE = 30;     // metres: indoors and underground, how far the view's rays and names reach
// Outdoors in daylight a player sees a city wall hundreds of metres off (the first city test: the agent's 30 m view
// read "open" with the wall plainly on screen). The rays reach far; a thing is NAMED only near enough to make out.
export const OUTDOOR_RAY_RANGE = 150;    // metres: walls, buildings, the lie of the land
export const OUTDOOR_NAME_RANGE = 60;    // metres: a door or a person, near enough to tell what it is
export const DARK_SIGHT = 3;      // metres: shapes you can make out in the dark, right beside you
export const RAY_STEP = 15;       // degrees between the view's depth rays
const LIGHT_REACH = 0.85;         // a lamp lights well inside its range, not to its very edge

/** AGENT7: worldClock.js: "return hour < DAWN_HOUR || hour >= DUSK_HOUR;" (06:00 / 18:00),
 *  "return isNight(minuteOfDay) ? 0 : SUN_RIG_INTENSITY * daylightScale(minuteOfDay);".
 *  world.js dims the frame with "exteriorAmbient(minute, getFloat('Enhancements', 'NightAmbientLightScale', 0, 1), wxNow.sun)".
 *  The curve reaches zero at dusk (full dark at 18:00), and starts at zero at dawn. No invented twilight hour. */
export function isDaylit(minute) {
  return Number.isFinite(minute) && !isNight(minute) && daylightScale(minute) > 0;
}

const centre = (b) => [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];

/** Degrees off the facing to a point, positive to the right, and its ground distance (agentBridge.js's law). */
export function relative(p, yaw, at) {
  const dx = at[0] - p[0], dz = at[2] - p[2];
  const s = Math.sin(yaw), c = Math.cos(yaw);
  return { bearing: (Math.atan2(dx * c - dz * s, dx * s + dz * c) * 180) / Math.PI, dist: Math.hypot(dx, dz) };
}

/**
 * Is a point lit enough to see from afar.
 * @param {number[]} at
 * @param {{ outdoorsOrIndoors: boolean, lights: Array<{x:number,y:number,z:number,range:number}>, torch: { at: number[], range: number } | null }} light
 */
export function isLit(at, light) {
  if (light.outdoorsOrIndoors) return true;
  if (light.torch && Math.hypot(at[0] - light.torch.at[0], at[1] - light.torch.at[1], at[2] - light.torch.at[2]) <= light.torch.range * LIGHT_REACH) return true;
  for (const l of light.lights ?? []) if (Math.hypot(at[0] - l.x, at[1] - l.y, at[2] - l.z) <= l.range * LIGHT_REACH) return true;
  return false;
}

/** Can the player see a point: a clear line from the eye, and light enough (or close enough). */
export function canSee(eye, at, light, collider) {
  const ex = at[0] - eye[0], ey = at[1] - eye[1], ez = at[2] - eye[2];
  const el = Math.hypot(ex, ey, ez) || 1;
  if (collider?.raycast) {
    const hit = collider.raycast(eye, [ex / el, ey / el, ez / el], el);
    if (Number.isFinite(hit) && hit < el - 0.1) return false;
  }
  return el <= DARK_SIGHT || isLit(at, light);
}

/**
 * The depth of the view: one ray every RAY_STEP degrees across the cone, level at the eye. Each says how far the
 * player can tell it goes: to a WALL it can see, OPEN past the view's range, or DARK where the light gives out.
 */
export function viewRays(feet, yaw, light, collider, range = VIEW_RANGE) {
  const eye = [feet[0], feet[1] + EYE_HEIGHT, feet[2]];
  const out = [];
  for (let b = -VIEW_HALF; b <= VIEW_HALF; b += RAY_STEP) {
    const a = yaw + (b * Math.PI) / 180;
    const dir = [Math.sin(a), 0, Math.cos(a)];
    const hit = collider?.raycast ? collider.raycast(eye, dir, range) : Infinity;
    const far = Number.isFinite(hit) ? hit : range;
    // walk out along the ray: the light can give out before the wall does
    let seen = 0;
    for (let d = 0.5; d <= far; d += 0.5) {
      const p = [eye[0] + dir[0] * d, eye[1], eye[2] + dir[2] * d];
      if (d > DARK_SIGHT && !isLit(p, light)) break;
      seen = d;
    }
    const lastLit = seen >= far - 0.5;
    out.push({ bearing: b, dist: Math.round((lastLit ? far : Math.max(seen, Math.min(far, DARK_SIGHT))) * 10) / 10,
      ends: lastLit ? (Number.isFinite(hit) ? 'wall' : 'open') : 'dark' });
  }
  return out;
}

/** A dungeon's obvious things: its doors, its exits, its loot, its people. Each `{ kind, at }`. */
export function dungeonThings(dc) {
  const out = [];
  for (const o of dc?.actions?.objects?.values?.() ?? []) {
    if (!isActionDoorObject(o)) continue;
    const box = objectAabb(o);
    if (box) out.push({ kind: 'door', source:o, at: centre(box), ...(o.key != null ? {key:o.key} : {}) });
  }
  for (const d of dc?.exitDoors ?? []) if (d?.matrix) out.push({ kind: 'exit door', source:d, at: d.centre ? doorWorldPosition(d) : [d.matrix[12], d.matrix[13] + 1, d.matrix[14]] });
  for (const r of (typeof dc?.loot === 'function' ? dc.loot() : []) ?? []) if (r?.pos) out.push({ kind: 'loot', source:r, at: [r.pos[0], r.pos[1], r.pos[2]] });   // full or empty looks the same from afar: the crosshair's plaque says "empty" up close, as it does to a player
  for (const p of dc?.people ?? []) {
    const at = p?.feet ?? p?.pos ?? (p?.matrix ? [p.matrix[12], p.matrix[13], p.matrix[14]] : null);
    if (at) out.push({ kind: 'person', source:p, at: [at[0], at[1] + 1, at[2]] });
  }
  return out;
}

/** AGENT5: the street's obvious things, from the host's rendered/activatable lists, never a building's contents.
 *  scenes/world.js bootWorld supplies shiftedDoor's world-frame doors and framePopulation's live person seats.
 *  Its pixel NPCs (characters/exteriorNpcs.js exteriorNpcRecord, characters/staticNpc.js staticNpcData) remain
 *  pixel-local: apply the LIVE pixel translation, as bootWorld's npcTargets does. Do not read the population pool:
 *  systems/townPopulation.js TownPopulation.update keeps inactive and not-yet-visible walkers off the street.
 *  Loot/corpses are activation targets (scenes/droppedLoot.js createDroppedLoot), so no inventory is read here. */
export function exteriorThings(ec) {
  const out = [];
  for (const d of ec?.doors ?? []) out.push({ kind: 'door', source:d, anchor:d.matrix?[d.matrix[12],d.matrix[13],d.matrix[14]]:null, at: doorWorldPosition(d) });
  for (const seat of ec?.people ?? []) {
    const at = seat.pos;
    if (at) out.push({ kind: 'person', source:seat, at: [at[0], at[1] + 1, at[2]] });
  }
  for (const p of ec?.pixels ?? []) {
    const t = ec.pixelTranslation(p.px, p.py);
    for (const pn of p.npcs ?? []) {
      if (!pn.active || !pn.width) continue;
      out.push({ kind: 'person', source:pn, at: [pn.x + t[0], pn.y + t[1] + 1, pn.z + t[2]] });
    }
  }
  for (const [kind, targets] of [['loot', ec?.loot], ['corpse', ec?.corpses]]) {
    for (const target of targets ?? []) {
      const box = objectAabb(target);
      if (box) out.push({ kind, source:target, at: centre(box) });
    }
  }
  return out;
}

/** AGENT5: a building's visible furnishings and people, already in the player's world frame:
 *  scenes/interiorContext.js buildInteriorContext parents doors, people and furniture at construction. Swing doors
 *  use their live ActionSystem matrices, as scenes/worldModes.js createWorldModes does for activation. Hidden
 *  furniture and inactive/unbuilt people do not draw; stock and hidden mechanisms are never inspected. Shelf
 *  models are usable only under createWorldModes' shelvesAct rule (shop, library/guild/temple, or Hall of Records).
 *  This reads the world host's mode context only; scenes/exterior.js bootExterior and scenes/dungeonContext.js
 *  buildDungeonContext keep their existing wiring and behaviour. */
export function interiorThings(ic, buildingType = null, hallOfRecords = false) {
  const out = [];
  for (const d of ic?.doors ?? []) out.push({ kind: 'exit door', source:d, at: doorWorldPosition(d) });
  for (const o of ic?.actions?.objects?.values?.() ?? []) {
    if (!isActionDoorObject(o)) continue;
    const box = objectAabb(o);
    if (box) out.push({ kind: 'door', source:o, at: centre(box), ...(o.key != null ? {key:o.key} : {}) });
  }
  for (const pn of ic?.people ?? []) {
    if (!pn.active || !pn.width) continue;
    out.push({ kind: 'person', source:pn, at: [pn.x, pn.y + 1, pn.z] });
  }
  const shelves = isShop(buildingType) || isBookshelfBuilding(buildingType) || (buildingType === BUILDING_TYPES.Palace && hallOfRecords) ? ic?.shelves : [];
  for (const [kind, furnishings] of [['container', ic?.containers], ['shelf', shelves]]) {
    for (const o of furnishings ?? []) {
      if (o.hidden) continue;
      const box = objectAabb(o);
      if (box) out.push({ kind, source:o, at: centre(box) });
    }
  }
  return out;
}

/** The things in view: in the cone, in sight, lit; nearest first, with where they stand. */
export function thingsInView(feet, yaw, things, light, collider, range = VIEW_RANGE, compensation = [0, 0, 0]) {
  const eye = [feet[0], feet[1] + EYE_HEIGHT, feet[2]];
  const out = [];
  for (const t of things) {
    const { bearing, dist } = relative(feet, yaw, t.at);
    if (dist > range || Math.abs(bearing) > VIEW_HALF) continue;
    if (!canSee(eye, t.at, light, collider)) continue;
    out.push({ kind: t.kind, dist: Math.round(dist * 10) / 10, bearing: Math.round(bearing), x: Math.round((t.at[0] - compensation[0]) * 10) / 10, z: Math.round((t.at[2] - compensation[2]) * 10) / 10 });
  }
  return out.sort((a, b) => a.dist - b.dist).slice(0, 12);
}
