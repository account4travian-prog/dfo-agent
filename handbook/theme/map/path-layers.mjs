// Compile once after loading. Panning, zooming and theme changes reuse these four paths.
export function createPathLayers(data) {
  return Object.fromEntries(Object.entries(data.layers).map(([key, lines]) => {
    const path = new Path2D();
    for (const line of lines) {
      path.moveTo(line[0], line[1]);
      for (let i = 2; i < line.length; i += 2) path.lineTo(line[i], line[i + 1]);
    }
    return [key, path];
  }));
}

// Called in map coordinates, above terrain/zone fills and below labels and icons.
export function strokePathLayers(ctx, paths, layers, scale, roadColour, waterColour) {
  if (!paths) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [key, toggle, colour, min, max, factor] of [
    ['streams', 'waterways', waterColour, .35, 1.3, .35],
    ['rivers', 'waterways', waterColour, .65, 2.8, .65],
    ['tracks', 'roads', roadColour, .35, 1.5, .35],
    ['roads', 'roads', roadColour, .6, 2.6, .6],
  ]) {
    if (!layers[toggle] || !paths[key]) continue;
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.min(max, Math.max(min, factor * Math.sqrt(scale))) / scale;
    ctx.setLineDash(key === 'tracks' ? [3 / scale, 2.5 / scale] : []);
    ctx.stroke(paths[key]);
  }
  ctx.restore();
}
