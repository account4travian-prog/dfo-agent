// Layout coordinates follow src/ui/ink/inkTown.js (townBytes, sheetY),
// src/ui/nameplateLayout.js (nameplateAnchor) and src/formats/blocksFile.js (getBlockAutoMap).
// No geography, names or artwork are stored here.
export function decodeTownGrid(encoded) {
  if (typeof encoded === 'string') {
    const raw = atob(encoded);
    if (raw.length !== 4096) throw Error('Incomplete town block');
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }
  const bytes = new Uint8Array(4096);
  let at = 0;
  for (let i = 0; i < encoded.length; i += 2) {
    const n = encoded[i], v = encoded[i + 1];
    if (!Number.isInteger(n) || n <= 0 || at + n > bytes.length || !Number.isInteger(v) || v < 0 || v > 255) throw Error('Invalid town block');
    bytes.fill(v, at, at + n);
    at += n;
  }
  if (at !== bytes.length) throw Error('Incomplete town block');
  return bytes;
}
export function townField(town) {
  const w = town.grid[0] * 64, h = town.grid[1] * 64;
  if (!(w > 0 && h > 0 && w <= 1024 && h <= 1024)) throw Error('Invalid town grid');
  const bytes = new Uint8Array(w * h), water = new Uint8Array(w * h);
  for (const block of town.blocks) {
    const bx = block.p[0] * 64, by = (town.grid[1] - 1 - block.p[1]) * 64;
    if (bx < 0 || by < 0 || bx + 64 > w || by + 64 > h) throw Error('Town block outside grid');
    const grid = decodeTownGrid(block.map), wet = block.water ? decodeTownGrid(block.water): null;
    for (let y = 0; y < 64; y++) {
      bytes.set(grid.subarray(y * 64, y * 64 + 64), (by + y) * w + bx);
      if (wet) water.set(wet.subarray(y * 64, y * 64 + 64), (by + y) * w + bx);
    }
  }
  return {
    w, h, bytes, water
  };
}
export const townBuildingPoint = (town, b) => [b.p[0], town.grid[1] * 64 - 1 - b.p[1]];
// BUILDING_TYPES IDs, src/world/buildingNames.js. Colours are this guide's own palette.
export function townKind(type) {
  if (type === 11) return 'Guild hall';
  if (type === 14) return 'Temple';
  if (type === 15) return 'Tavern';
  if (type === 16) return 'Palace';
  if (type === 3) return 'Bank';
  if (type === 23) return 'Wall / gate';
  if (type === 24) return 'Ship';
  if (type === 1 || (type >= 17 && type <= 22)) return 'Residence';
  if ([0, 2, 5, 6, 7, 8, 9, 10, 12, 13].includes(type)) return 'Shop';
  return 'Other';
}
export const townColours = {
  Shop: '#cc984f',
  'Guild hall': '#ab85c7',
  Temple: '#d3bf87',
  Tavern: '#7cba9a',
  Palace: '#d48887',
  Bank: '#bcb172',
  Residence: '#9aa7ab',
  'Wall / gate': '#576b77',
  Ship: '#639ebc',
  Other: '#91a185',
};
