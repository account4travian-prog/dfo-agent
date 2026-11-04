// @ts-check
// AGENT6: the OPEN town map, in the body's world frame. No scene/quest directory is read here.
// ui/exteriorAutomapWindow.js namedBuildings and ui/townSheet.js createTownSheet.names own the name laws.
// ui/inkTown.js townBytes and ui/townQuarters.js quarterOf own the footprint and colour laws.
import { ExteriorAutomapWindow } from '../ui/exteriorAutomapWindow.js';
import { townBytes } from '../ui/ink/inkTown.js';
import { WORLD_PER_PX } from '../ui/nameplateLayout.js';
import { quarterOf, isShowAllByte, GROUND_FLAT_BYTE } from '../ui/town/townQuarters.js';

/** A painted pixel's visible kind, following buildExteriorLayout; the enhanced sheet draws only quarters. */
function paintedKind(byte, mode) {
  const quarter = quarterOf(byte);
  if (quarter) return quarter;
  if (mode === 'sheet' || !byte || (byte === GROUND_FLAT_BYTE && mode !== 'all')) return null;
  if (isShowAllByte(byte)) return mode === 'original' ? null : 'house';
  return 'unclassified'; // classic's debug colour conveys no building kind
}

/**
 * Connected painted silhouettes, not hidden building identities: the bitmap has TYPE pixels, no building keys.
 * Touching silhouettes of the same colour can be one footprint. Each row is [worldZ, worldX, width], one cell deep
 * toward +Z. Labels keep their own map anchors, even when an anchor falls outside a coloured silhouette.
 */
export function townFootprints(field, origin, mode = 'sheet') {
  const { w, h, bytes } = field;
  const cell = WORLD_PER_PX;
  const kinds = Array.from(bytes, (b) => paintedKind(b, mode));
  const seen = new Uint8Array(bytes.length);
  const buildings = [], streets = [];
  const worldRow = (x, y, length) => [origin[2] + (h - 1 - y) * cell, origin[0] + x * cell, length * cell];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w;) {
      if (kinds[y * w + x]) { x++; continue; }
      const start = x++;
      while (x < w && !kinds[y * w + x]) x++;
      streets.push(worldRow(start, y, x - start));
    }
  }
  for (let seed = 0; seed < bytes.length; seed++) {
    const kind = kinds[seed];
    if (!kind || seen[seed]) continue;
    const queue = [seed], pixels = [];
    seen[seed] = 1;
    let minX = w, maxX = 0, minY = h, maxY = 0;
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head], x = i % w, y = Math.floor(i / w);
      pixels.push(i);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (const n of [x > 0 ? i - 1 : -1, x + 1 < w ? i + 1 : -1, i - w, i + w]) {
        if (n < 0 || n >= bytes.length || seen[n] || kinds[n] !== kind) continue;
        seen[n] = 1; queue.push(n);
      }
    }
    pixels.sort((a, b) => a - b);
    const rows = [];
    for (let p = 0; p < pixels.length;) {
      const start = pixels[p++], y = Math.floor(start / w);
      let end = start;
      while (p < pixels.length && pixels[p] === end + 1 && Math.floor(pixels[p] / w) === y) end = pixels[p++];
      rows.push(worldRow(start % w, y, end - start + 1));
    }
    buildings.push({ kind, pos: [origin[0] + (minX + maxX + 1) * cell / 2, origin[1],
      origin[2] + (h - 1 - (minY + maxY) / 2 + 0.5) * cell], footprint: { cell, rows }, labels: [] });
  }
  return { buildings, streets };
}

/**
 * Only the current window's town sheet is readable. A player must press AutoMap first; wilderness, a closed map,
 * another window or another sheet yields null. The whole plan and its permitted names are what pan/zoom/hover
 * can read, not just the current viewport. Neither map has a separate gate/street-name layer.
 */
export function readTownMap(win, origin, marker) {
  if (!win || win.done || !origin) return null;
  let field, names, mode;
  if (win instanceof ExteriorAutomapWindow) {
    field = townBytes(win.deps.gridW, win.deps.gridH, win.deps.blocks ?? []);
    names = win.namedBuildings().map((n) => ({ text: n.text, x: n.x, z: n.y }));
    mode = win.mode;
  } else {
    const sheet = win._sheet;
    if (sheet?.id !== 'town') return null;
    field = sheet.field;
    names = sheet.names().map((n) => ({ text: n.text, x: n.x, z: field.h - 1 - n.y }));
    mode = 'sheet';
  }
  const { buildings, streets } = townFootprints(field, origin, mode);
  const cell = WORLD_PER_PX;
  const labels = names.map((n) => ({ text: n.text, pos: [origin[0] + n.x * cell, origin[1], origin[2] + n.z * cell] }));
  for (const label of labels) {
    const [x, , z] = label.pos;
    const building = buildings.find((b) => b.footprint.rows.some(([rz, rx, width]) => x >= rx && x < rx + width && z >= rz && z < rz + cell));
    if (building) building.labels.push(label);
  }
  return { townMapNeedsOpen: true, marker, buildings, labels, streets, cell };
}
