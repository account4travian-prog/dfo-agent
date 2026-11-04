// @ts-check
// AGENT3 - THE AGENT'S MAP (a fork's patch; the workspace's docs/09). The game's own automap (systems/automap.js,
// Daggerfall Unity's Automap.cs ported) records which pieces of a dungeon or building the player has REVEALED by
// looking at them - exactly what the M screen draws. This reads that record and lays the revealed floors flat on a
// grid at the player's level: the floor plan a player sees on their map. Nothing the map would not show: an
// unrevealed piece stays blank however close it is.
//
// The reveal model (systems/automapModel.js) keeps, per piece, references to its CPU mesh (positions, indices) and
// its placement matrix. Floors are the up-facing triangles near the height of the player's feet; each covers the grid
// cells whose centres it holds.
import { automapInstance } from '../systems/automap/automap.js';

export const MAP_CELL = 1;                  // metres per grid cell
export const FLOOR_BAND = [-1.6, 1.2];      // metres below/above the feet that count as this level's floor
const UP = 0.7;                             // a triangle this flat (|normal.y|) is floor

/** A point by a column-major 4x4 (the draw list's placement matrices). */
function place(m, x, y, z) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}

/** Lay one triangle's footprint on the grid: the cells whose centres it holds, or its centroid's cell if it is small. */
function rasterTriangle(a, b, c, cell, out, heights) {
  const minX = Math.floor(Math.min(a[0], b[0], c[0]) / cell), maxX = Math.floor(Math.max(a[0], b[0], c[0]) / cell);
  const minZ = Math.floor(Math.min(a[2], b[2], c[2]) / cell), maxZ = Math.floor(Math.max(a[2], b[2], c[2]) / cell);
  const area = (b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2]);
  if (area === 0) return;
  let any = false;
  for (let ix = minX; ix <= maxX; ix++) {
    for (let iz = minZ; iz <= maxZ; iz++) {
      const px = (ix + 0.5) * cell, pz = (iz + 0.5) * cell;
      const w0 = ((b[0] - px) * (c[2] - pz) - (c[0] - px) * (b[2] - pz)) / area;
      const w1 = ((c[0] - px) * (a[2] - pz) - (a[0] - px) * (c[2] - pz)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 >= -1e-6 && w1 >= -1e-6 && w2 >= -1e-6) {
        out.add(`${ix},${iz}`); any = true;
        heights?.set(`${ix},${iz}`, w0*a[1]+w1*b[1]+w2*c[1]);
      }
    }
  }
  if (!any) {
    const key = `${Math.floor((a[0] + b[0] + c[0]) / 3 / cell)},${Math.floor((a[2] + b[2] + c[2]) / 3 / cell)}`;
    out.add(key); heights?.set(key,(a[1]+b[1]+c[1])/3);
  }
}

/**
 * The revealed floor at the player's level, as grid cells "ix,iz" (cell * ix = world x). Null when there is no live
 * automap (outdoors, where the game's map is a different thing).
 * @param {{ rec: { revealed: Set<string> }, model: { rows: any[] } } | null} live
 * @param {number} feetY
 */
export function revealedFloorCells(live, feetY, cell = MAP_CELL, compensation = [0, 0, 0], heights = null) {
  if (!live?.rec?.revealed || !live?.model?.rows) return null;
  const lo = feetY + FLOOR_BAND[0], hi = feetY + FLOOR_BAND[1];
  const out = new Set();
  for (const row of live.model.rows) {
    if (!live.rec.revealed.has(row.key)) continue;
    const { min, max } = row.aabb ?? {};
    if (!min || max[1] < lo || min[1] > hi) continue;
    const { positions: p, indices: idx, matrix: m } = row;
    if (!p || !idx || !m) continue;
    for (let i = 0; i + 2 < idx.length; i += 3) {
      const a = place(m, p[idx[i] * 3], p[idx[i] * 3 + 1], p[idx[i] * 3 + 2]);
      const b = place(m, p[idx[i + 1] * 3], p[idx[i + 1] * 3 + 1], p[idx[i + 1] * 3 + 2]);
      const c = place(m, p[idx[i + 2] * 3], p[idx[i + 2] * 3 + 1], p[idx[i + 2] * 3 + 2]);
      const y = (a[1] + b[1] + c[1]) / 3;
      if (y < lo || y > hi) continue;
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz);
      if (!len || Math.abs(ny) / len < UP) continue;
      // Translate before rasterising: fractional terrain widths cannot be rounded into whole-cell shifts.
      for (const p of [a, b, c]) for (let axis = 0; axis < 3; axis++) p[axis] -= compensation[axis];
      rasterTriangle(a, b, c, cell, out, heights);
    }
  }
  return out;
}

/** The map as the agent mode hands it out, cached while nothing new is revealed and the level is the same. */
export function createMapReader(liveOf = automapInstance, compensationOf = () => [0, 0, 0]) {
  let cache = null;
  return (feetY) => {
    const live = liveOf();
    if (!live) return null;
    const level = Math.round(feetY);
    const size = live.rec?.revealed?.size ?? 0;
    const compensation = Array.from(compensationOf());
    if (cache && cache.live === live && cache.size === size && cache.level === level
      && compensation.every((v, i) => v === cache.compensation[i])) return cache.out;
    const heights = new Map();
    const cells = revealedFloorCells(live, feetY, MAP_CELL, compensation, heights);
    const out = cells ? { cell: MAP_CELL, cells: [...cells].map((k) => k.split(',').map(Number)), revealedPieces: size,
      floors: [...heights].map(([key,height]) => { const [ix,iz]=key.split(',').map(Number); return {ix,iz,height:Math.round(height*1000)/1000}; }) } : null;
    cache = { live, size, level, compensation, out };
    return out;
  };
}
