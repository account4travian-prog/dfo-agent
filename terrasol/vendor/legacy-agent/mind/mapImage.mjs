// THE MAP PICTURE: a place's memory (memory.mjs) drawn small, for a model that reads images. Its cost stays the same
// however much has been explored, where a text map grows with every room.
//
//   slate blue    the floor the game's own map shows revealed, at your level (the M screen's knowledge)
//   grey squares  the ground covered          yellow line  the route
//   green dot     where you started           red dot      where you are
//   blue          a way seen but not tried     (a line from where it was seen, to where it leads)
//   squares       things: orange door, purple exit door, gold loot, cyan person; dimmed once used
//
// Up is +z (heading 0°), right is +x (heading 90°), as the agent's own headings read. Plain PNG, written here with
// node's zlib, so the workspace needs no packages.
import { deflateSync } from 'node:zlib';

const PX = 6;          // pixels per metre
const MAX_SIDE = 420;  // the picture never grows past this: a bigger place is drawn smaller
const PAD = 4;         // metres of margin around what is remembered

const COLOURS = {
  ground: [24, 24, 28], floor: [58, 66, 88], cell: [120, 120, 128], route: [235, 200, 60], start: [60, 200, 90], here: [235, 60, 60],
  lead: [80, 150, 255], door: [240, 140, 40], 'exit door': [180, 90, 230], loot: [230, 200, 40], person: [60, 210, 220],
  other: [200, 200, 200], edge: [250, 250, 250],
  support: [65, 140, 90], wall: [170, 170, 180], tree: [90, 115, 65], prop: [170, 170, 180], water: [35, 90, 210], ledge: [220, 65, 170], open:[80,150,255], unknown: [24, 24, 28],
  // the town map's own colours for its buildings, muted so the agent's own marks stay on top
  temple: [70, 90, 150], shop: [150, 110, 60], tavern: [140, 60, 60], house: [90, 80, 70], unclassified: [80, 80, 80],
};

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** An RGB image as PNG bytes. */
export function encodePng(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/**
 * Draw a place's memory, over the game's own map of it when there is one. Returns { png, width, height, bounds:
 * { minX, maxX, minZ, maxZ }, metresPerPixel, floor }, or null when there is nothing remembered yet.
 * @param {ReturnType<ReturnType<typeof import('./memory.mjs').createPlaceMemory>['snapshot']>} snap
 * @param {{ cell: number, cells: number[][] } | null} [automap]  the agent mode's map(): revealed floor cells
 */
export function drawPlace(snap, automap = null, edges = []) {
  if (!snap?.start) return null;
  const pts = [snap.start, ...(snap.route ?? []), ...(snap.last ? [snap.last] : [])];
  for (const [ix, iz] of automap?.cells ?? []) pts.push([ix * automap.cell, iz * automap.cell], [(ix + 1) * automap.cell, (iz + 1) * automap.cell]);
  for (const [cx, cz] of snap.cells) pts.push([cx * snap.cell, cz * snap.cell], [(cx + 1) * snap.cell, (cz + 1) * snap.cell]);
  for (const l of snap.leads) pts.push([l.fromX, l.fromZ], [l.x, l.z]);
  for (const o of snap.openings ?? []) if (o.level===snap.level) pts.push([o.x,o.z],[o.x+Math.sin(o.heading)*o.reach,o.z+Math.cos(o.heading)*o.reach]);
  for (const t of snap.things) pts.push([t.x, t.z]);
  for (const s of snap.surfaces ?? []) if (s.level===snap.level) pts.push([s.ix*0.5,s.iz*0.5]);
  for (const b of snap.town?.buildings ?? []) {
    pts.push([b.x, b.z]);
    for (const [z,x,w] of b.rows) pts.push([x,z],[x+w,z+b.cell]);
  }
  const bounds=pts.reduce((b,p) => [Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity]);
  const crop = false;
  const minX = bounds[0] - PAD, maxX = bounds[2] + PAD;
  const minZ = bounds[1] - PAD, maxZ = bounds[3] + PAD;
  const scale = Math.min(PX, MAX_SIDE / (maxX - minX), MAX_SIDE / (maxZ - minZ));
  const width = Math.min(MAX_SIDE,Math.max(16, Math.ceil((maxX - minX) * scale))), height = Math.min(MAX_SIDE,Math.max(16, Math.ceil((maxZ - minZ) * scale)));
  const rgb = Buffer.alloc(width * height * 3);
  const px = (x) => Math.round((x - minX) * scale), py = (z) => Math.round((maxZ - z) * scale);   // +z is up
  const set = (x, y, c) => { if (x < 0 || y < 0 || x >= width || y >= height) return; const i = (y * width + x) * 3; rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2]; };
  const rect = (x0, y0, x1, y1, c) => { for (let y = Math.max(0,Math.min(y0, y1)); y <= Math.min(height-1,Math.max(y0, y1)); y++) for (let x = Math.max(0,Math.min(x0, x1)); x <= Math.min(width-1,Math.max(x0, x1)); x++) set(x, y, c); };
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c); };
  const dot = (x, z, r, c) => { const cx = px(x), cy = py(z); for (let y = -r; y <= r; y++) for (let xx = -r; xx <= r; xx++) if (xx * xx + y * y <= r * r) set(cx + xx, cy + y, c); };
  const dim = (c) => c.map((v) => Math.round(v * 0.45));

  rect(0, 0, width - 1, height - 1, COLOURS.ground);
  // the town map underneath everything: each building's footprint, a row at a time ([z, x, width], one cell deep)
  for (const b of snap.town?.buildings ?? []) {
    const c = COLOURS[b.kind] ?? COLOURS.unclassified;
    for (const [z, x, w] of b.rows) rect(px(x), py(z + b.cell), Math.max(px(x), px(x + w) - 1), Math.max(py(z + b.cell), py(z) - 1), c);
  }
  // the game's own map first, underneath: the floor the player has revealed by looking
  for (const [ix, iz] of automap?.cells ?? []) rect(px(ix * automap.cell), py((iz + 1) * automap.cell), px((ix + 1) * automap.cell) - 1, py(iz * automap.cell) - 1, COLOURS.floor);
  for (const [cx, cz] of snap.cells) rect(px(cx * snap.cell), py((cz + 1) * snap.cell), px((cx + 1) * snap.cell) - 1, py(cz * snap.cell) - 1, COLOURS.cell);
  const route = [...snap.route, ...(snap.last ? [snap.last] : [])];
  for (let i = 1; i < route.length; i++) line(px(route[i - 1][0]), py(route[i - 1][1]), px(route[i][0]), py(route[i][1]), COLOURS.route);
  for (const l of snap.leads) { line(px(l.fromX), py(l.fromZ), px(l.x), py(l.z), dim(COLOURS.lead)); dot(l.x, l.z, 3, COLOURS.lead); }
  for (const o of snap.openings ?? []) if (o.level===snap.level) line(px(o.x),py(o.z),px(o.x+Math.sin(o.heading)*o.reach),py(o.z+Math.cos(o.heading)*o.reach),dim(COLOURS.lead));
  for (const t of snap.things) {
    const c = COLOURS[t.kind] ?? COLOURS.other;
    rect(px(t.x) - 3, py(t.z) - 3, px(t.x) + 3, py(t.z) + 3, t.used ? dim(c) : c);
  }
  for (const e of edges) dot(e.x, e.z, 2, COLOURS.edge);
  // Current hazards paint over old floor/routes/player-map marks. A point colours its cell as
  // uncertain evidence; only full certified coverage is solid green.
  for (const s of snap.surfaces ?? []) if (s.level===snap.level) {
    const old=(snap.time ?? 0)-s.time>200;
    const c=s.kind==='support' && !s.usable ? COLOURS.unknown : COLOURS[s.kind] ?? COLOURS.unknown;
    rect(px(s.ix*0.5),py((s.iz+1)*0.5),px((s.ix+1)*0.5)-1,py(s.iz*0.5)-1,old?dim(c):c);
  }
  // Door/exit marks stay legible at the whole-place scale, above the geometry layer.
  for (const t of snap.things) if (['door','exit door','opening'].includes(t.kind)) {
    const c=COLOURS[t.kind] ?? COLOURS.lead;
    rect(px(t.x)-3,py(t.z)-3,px(t.x)+3,py(t.z)+3,t.used?dim(c):c);
  }
  dot(snap.start[0], snap.start[1], 4, COLOURS.start);
  if (snap.last) dot(snap.last[0], snap.last[1], 4, COLOURS.here);
  if (snap.last) {const a=(snap.heading ?? 0)*Math.PI/180;line(px(snap.last[0]),py(snap.last[1]),Math.round(px(snap.last[0])+8*Math.sin(a)),Math.round(py(snap.last[1])-8*Math.cos(a)),COLOURS.here);}
  // Small compass inset: remembered bearings at their observation origin, never remote centres.
  if (crop && snap.far?.length) {
    rect(width-55,0,width-1,54,COLOURS.ground);
    for (const f of snap.far) { const a=f.heading*Math.PI/180; line(width-28,28,Math.round(width-28+22*Math.sin(a)),Math.round(28-22*Math.cos(a)),dim(COLOURS.other)); }
  }
  return { png: encodePng(width, height, rgb), width, height, bounds: { minX, maxX, minZ, maxZ }, metresPerPixel: 1 / scale, crop, level:snap.level, heading:snap.heading ?? 0, floor: (automap?.cells?.length ?? 0) > 0, edges: edges.length > 0, town: (snap.town?.buildings?.length ?? 0) > 0 };
}

/** The words that go with the picture, so its edges and colours can be read. */
export function mapCaption(m) {
  const r = (v) => Math.round(v);
  return `Session map, level ${m.level ?? 0}, facing ${r(m.heading ?? 0)}°${m.crop?' (local crop; inset: old bearings at their observation origins)':''}. Up +z/0°, right +x/90°. Left edge is x ${r(m.bounds.minX)}, right x ${r(m.bounds.maxX)}; top z ${r(m.bounds.maxZ)}, bottom z ${r(m.bounds.minZ)}; ${m.metresPerPixel.toFixed(2)} m/pixel. Black unknown; green supported (bright dot=start), grey walked, yellow walked route, red dot=you; pale grey wall/prop, olive tree, blue water, magenta ledge, orange door; dim=old (>0.2 s). Point hits never certify floor. ${m.floor?"Slate blue: player-map marks; no footing proof. ":''}${m.town?'Muted buildings: town map, no footing proof. ':''}Small squares: door/exit/loot/person (orange/purple/gold/cyan); blue rays: untried sight only.${m.edges?' White dots: supported frontier; observation needed.':''}`;
}
