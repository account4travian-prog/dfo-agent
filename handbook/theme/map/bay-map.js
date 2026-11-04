import { createPathLayers, strokePathLayers } from './path-layers.mjs';
import { hasService as placeHasService, findNearest, loadPin, savePin } from './map-location.mjs';
// Reused from planner/tools/build-world-map.mjs browserMap; local builds only.
const root = document.querySelector('.world-map');
const data = JSON.parse(root.querySelector('.map-data').textContent);
const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
const search = root.querySelector('input[type=search]'), results = root.querySelector('.map-results'), detail = root.querySelector('.map-detail');
const regions = data.regions.map(([name, path, anchor]) => ({
  name, path: new Path2D(path), anchor
}));
const locations = data.locations.map(([name, region, x, y, kind, family, tier, port, ring, jungle, services, mapId]) => ({
  name,
  region,
  x: x + .5,
  y: y + .5,
  kind,
  family,
  tier,
  port,
  ring,
  jungle,
  services,
  mapId
}));
const zonePaths = data.zone.rings.map(r => new Path2D(r.path));
const junglePath = new Path2D(data.jungle.path), nearPath = new Path2D(data.zone.nearPath);
const layer = Object.fromEntries([...root.querySelectorAll('[data-layer]')].map(e => [e.dataset.layer, e.checked]));
let markers = data.markers, selected = null, width = 0, height = 0, zoom = 1, cx = 500, cy = 250, hits = [], colours;
const activeServices = new Set(), forcedLayers = new Set();
let pin = loadPin(), nearest = [], nearestMatches = [], nearestLimit = 5, nearestTarget = null, nearestActive = false, droppingPin = false;
const pinStatus = root.querySelector('.map-pin-status'), nearestStatus = root.querySelector('.map-nearest-status');
const dropButton = root.querySelector('[data-pin-drop]'), removeButton = root.querySelector('[data-pin-remove]');
// One search box replaces the old multi-select service chips: choose one service, find its nearest places.
const serviceEntries = data.services.map(([key, name, why]) => ({
  key, name, why
}));
const aliases = new Map([
  ['banker', 'bank'], ['store', 'generalStore'], ['shop', 'generalStore'], ['general', 'generalStore'],
  ['armour', 'armorer'], ['armor', 'armorer'], ['cart', 'carriage'], ['travel', 'carriage'],
  ['inn', 'tavern'], ['ship', 'port'], ['boat', 'port'], ['horse', 'stable'], ['wagon', 'stable'],
  ['smith', 'weaponSmith'], ['weapons', 'weaponSmith'], ['fighter', 'fightersGuild'],
  ['mages', 'magesGuild'], ['magic', 'magesGuild'], ['chapel', 'temple'], ['church', 'temple']
]);
const finder = document.createElement('section');
finder.className = 'map-finder';
finder.setAttribute('aria-label', 'Find the nearest');
const findLabel = document.createElement('label');
findLabel.htmlFor = 'map-find';
findLabel.textContent = 'What are you looking for?';
const findRow = document.createElement('div');
findRow.className = 'map-find-row';
const findInput = document.createElement('input');
findInput.id = 'map-find';
findInput.type = 'search';
findInput.placeholder = 'Bank, general store, armorer, carriage…';
findInput.autocomplete = 'off';
findInput.setAttribute('list', 'map-find-options');
const findList = document.createElement('datalist');
findList.id = 'map-find-options';
for (const entry of serviceEntries) {
  const option = document.createElement('option');
  option.value = entry.name;
  option.label = entry.why;
  findList.append(option);
}
const findButton = document.createElement('button');
findButton.type = 'button';
findButton.textContent = 'Find nearest';
const clearButton = document.createElement('button');
clearButton.type = 'button';
clearButton.textContent = 'Clear';
const findStatus = document.createElement('p');
findStatus.className = 'map-find-status';
findStatus.setAttribute('role', 'status');
findRow.append(findInput, findList, findButton, clearButton);
finder.append(findLabel, findRow, findStatus);
const mapLocation = root.querySelector('.map-location');
root.querySelector('.map-services')?.remove();
mapLocation?.querySelector('.map-near')?.remove();
mapLocation?.querySelector('[data-nearest-carriage]')?.remove();
[...mapLocation?.children ?? []].find(node => node.tagName === 'P' && node.textContent.startsWith('Choose one or more services'))?.remove();
const nearestResults = root.querySelector('.map-nearest-results');
if (typeof pinStatus?.after === 'function') pinStatus.after(finder);
const pinButton = document.createElement('button');
pinButton.type = 'button';
pinButton.className = 'map-player-pin';
pinButton.setAttribute('aria-label', 'You are here. Arrow keys move the pin; Shift moves ten squares.');
pinButton.setAttribute('aria-describedby', 'map-pin-help');
pinButton.innerHTML = '<span class="map-pin-label">You are here</span><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M16 38C13 30 3 22 3 15a13 13 0 0 1 26 0c0 7-10 15-13 23Z"/><circle cx="16" cy="15" r="4"/></svg>';
root.querySelector('.map-stage').append(pinButton);
// All hover text comes from the same extracted place records as the tap detail panel.
const hover = document.createElement('div');
hover.className = 'map-hover';
hover.hidden = true;
hover.setAttribute('role', 'tooltip');
hover.id = 'map-hover-card';
root.append(hover);
function hoverCard(l, x, y, control = canvas) {
  const linked = l.kind !== 'region' && l.placement !== 'region anchor' ? locations.find(p => p.x === l.x && p.y === l.y && (p.name === (l.resolvedAs ?? l.name) || p.name + ' port' === l.name)): null;
  const p = linked ?? l, lines = [];
  lines.push(p.family ? p.family + ' dungeon · danger tier ' + (p.tier ?? 'unconfirmed'): (p.kind ?? 'Guide marker').replaceAll('_', ' '));
  if (p.region != null) lines.push(regions[p.region]?.name ?? p.region);
  if (p.services != null) lines.push('Services: ' + (data.services.filter(([k]) => hasService(p, k)).map(s => s[1]).join(', ') || 'none recorded'));
  if (p.port) lines.push('Port');
  if (p.ring) lines.push('Open Zone: ' + data.zone.rings[p.ring - 1].name);
  if (p.jungle) lines.push('Jungle of Bantha');
  if (l.name === data.zone.name || l.resolvedAs === data.zone.name) lines.push('Open PvP · stronger foes · four loot rings');
  if (l.name === data.jungle.name || l.resolvedAs === data.jungle.name) lines.push('Jungle on the southeastern Bay shore');
  if (l.where && !/(?:src|bible|server|planner)\//.test(String(l.where))) lines.push(String(l.where).split(/\n/)[0]);
  hover.replaceChildren();
  const title = document.createElement('strong'), text = document.createElement('p');
  title.textContent = l.name;
  text.textContent = lines.join(' · ');
  hover.append(title);
  hover.append(text);
  hover.hidden = false;
  const r = hover.getBoundingClientRect();
  hover.style.left = Math.max(16, Math.min(x + 14, innerWidth - r.width - 16)) + 'px';
  hover.style.top = Math.max(16, Math.min(y + 16, innerHeight - r.height - 16)) + 'px';
  control.setAttribute('aria-describedby', hover.id);
}
function hideHover() {
  hover.hidden = true;
  root.querySelectorAll('[aria-describedby="map-hover-card"]').forEach(n => n.removeAttribute('aria-describedby'));
}
function hoverButton(button, l) {
  button.addEventListener('focus', () => {
    const r = button.getBoundingClientRect();
    hoverCard(l, r.left, r.bottom, button);
  });
  button.addEventListener('blur', hideHover);
  button.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'touch') hoverCard(l, e.clientX, e.clientY, button);
  });
  button.addEventListener('pointerleave', hideHover);
}
window.addEventListener('scroll', hideHover, {
  passive: true
});
root.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideHover();
});
let queued = false;
const request = () => {
  if (!queued) {
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  }
};
const css = name => getComputedStyle(root).getPropertyValue(name).trim();
const scale = () => Math.min(width / 1000, height / 500) * zoom;
const screen = (x, y) => [(x - cx) * scale() + width / 2, (y - cy) * scale() + height / 2];
const world = (x, y) => [(x - width / 2) / scale() + cx, (y - height / 2) / scale() + cy];
const tierKey = tier => tier <= 5 ? 'low': tier <= 9 ? 'mid': tier <= 14 ? 'high': 'deadly';
const glyphs = {
  city: 'M-6,5V-4H-4V-7H-1V-4H2V-7H5V-4H6V5ZM-2,5V0H2V5',
  village: 'M-6,0L0,-6L6,0M-4,-2V5H4V-2',
  hamlet: 'M-5,0L0,-5L5,0M-3,-2V4H3V-2',
  temple: 'M-6,5H6M-5,-3L0,-6L5,-3ZM-3,-3V5M3,-3V5',
  port: 'M0,-6V5M-5,0Q-5,6 0,6Q5,6 5,0M-4,-3H4',
  other: 'M0,-5L5,0L0,5L-5,0Z',
  guide: 'M0,-9L2,-2L9,0L2,2L0,9L-2,2L-9,0L-2,-2Z',
  cave: 'M-6,5Q-5,-6 0,-6Q5,-6 6,5ZM-2,5V0H2V5',
  keep: 'M-6,5V-5H-3V-2H3V-5H6V5ZM-1,5V1H1V5',
  orc: 'M-6,5V-5H-3V-2H3V-5H6V5ZM-3,1L-1,4L0,1L1,4L3,1',
  human: 'M-6,5V-3H6V5ZM0,-3V-8L5,-6L0,-5',
  barbarian: 'M-5,-6L5,6M5,-6L-5,6M-5,-6L-7,-2L-2,-3M5,-6L7,-2L2,-3',
  giant: 'M-6,6V-3H-3V-8H3V-3H6V6ZM-1,6V1H1V6',
  ruin: 'M-6,5V-5L-2,-2L0,-5L1,1L6,-2V5ZM-2,5V2H1V5',
  crypt: 'M-6,5H6M-4,5V-2Q0,-7 4,-2V5M0,-2V3M-2,0H2',
  spider: 'M-6,-5L6,5M6,-5L-6,5M-6,0H6M0,-6V6',
  scorpion: 'M-5,5L-2,1L-5,-2M5,5L2,1L5,-2M-2,1H2V-4Q2,-8 -3,-6L-1,-4',
  harpy: 'M-7,-4L-3,3L0,-1L3,3L7,-4L3,-2L0,-6L-3,-2Z',
  cemetery: 'M-6,5H6M-5,4V-2H-2V4M1,4V-5H5V4',
  dragon: 'M-6,5L-3,-6L0,0L3,-6L6,5L0,2Z',
  cult: 'M0,-6L6,5H-6ZM0,-1V2M0,4V4.2',
  vampire: 'M-7,-4L0,-1L7,-4L4,4L0,1L-4,4Z',
  laboratory: 'M-2,-6H2M-1,-6V-1L-5,5H5L1,-1V-6M-3,2H3',
  prison: 'M-5,-5H5V5H-5ZM-2,-5V5M2,-5V5',
  mine: 'M-6,-3Q0,-7 6,-3M0,-5L-3,6',
  volcano: 'M-7,6L-2,-3L2,-3L7,6ZM0,-5V-8M-4,-5L-6,-7M4,-5L6,-7',
  tavern: 'M-5,-4H3V5H-5ZM3,-2H6V2H3M-6,6H5',
  farm: 'M-6,6V-2L0,-7L6,-2V6ZM-2,6V1H2V6M-5,-1H5',
  home: 'M-6,0L0,-6L6,0M-4,-2V5H4V-2M0,5V1H2',
  ship: 'M-7,3H7L4,6H-4ZM0,3V-7L6,1H0'
};
const paths = Object.fromEntries(Object.entries(glyphs).map(([k, p]) => [k, new Path2D(p)]));
function familyGlyph(f) {
  if (/Cemetery/.test(f)) return 'cemetery';
  if (/Crypt/.test(f)) return 'crypt';
  if (/Spider/.test(f)) return 'spider';
  if (/Scorpion/.test(f)) return 'scorpion';
  if (/Harpy/.test(f)) return 'harpy';
  if (/Dragon/.test(f)) return 'dragon';
  if (/Volcanic/.test(f)) return 'volcano';
  if (/Mine/.test(f)) return 'mine';
  if (/Cave/.test(f)) return 'cave';
  if (/Temple|Coven/.test(f)) return 'cult';
  if (/Vampire/.test(f)) return 'vampire';
  if (/Laboratory/.test(f)) return 'laboratory';
  if (/Prison/.test(f)) return 'prison';
  if (/Orc/.test(f)) return 'orc';
  if (/Human/.test(f)) return 'human';
  if (/Barbarian/.test(f)) return 'barbarian';
  if (/Giant/.test(f)) return 'giant';
  if (/Ruined/.test(f)) return 'ruin';
  return 'keep';
}
function icon(key, x, y, colour, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = colours.halo;
  ctx.lineJoin = 'round';
  ctx.stroke(paths[key] ?? paths.other);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = colour;
  ctx.stroke(paths[key] ?? paths.other);
  ctx.restore();
}
const hasService = (l, k) => placeHasService(l, k, data.services);
function visible(l) {
  if (activeServices.size) return [...activeServices].every(k => hasService(l, k));
  if (l === selected || nearest.includes(l)) return true;
  if (l.port && layer.ports && (zoom >= 3 || forcedLayers.has('ports'))) return true;
  if (l.family) return layer[tierKey(l.tier)] && (zoom >= 6 || forcedLayers.has(tierKey(l.tier)));
  if (['city', 'hamlet', 'village'].includes(l.kind)) return layer.settlements && (forcedLayers.has('settlements') || zoom >= (l.kind === 'city' ? 1: l.kind === 'hamlet' ? 3: 6));
  return layer.other && (zoom >= 6 || forcedLayers.has('other'));
}
function draw() {
  if (!width || !height) return;
  colours = {
    halo: css('--map-halo'),
    fg: css('--fg'),
    muted: css('--muted'),
    accent: css('--accent'),
    line: css('--line'),
    sea: css('--sea')
  };
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = css('--map-water');
  ctx.fillRect(0, 0, width, height);
  const s = scale();
  hits = [];
  drawLand(s);
  drawNetworks(s);
  drawRegionLabels();
  drawPlaces();
  drawZonePins();
  drawGuideMarkers();
  drawSelection();
  drawPlayerPin();
  root.querySelector('.map-scale').textContent = 'N up | ' + zoom.toFixed(1) + 'x | ' + Math.round(width / s) + ' map pixels across';
}
// Draw terrain and danger overlays in world coordinates.
function drawLand(s) {
  ctx.save();
  ctx.translate(width / 2 - cx * s, height / 2 - cy * s);
  ctx.scale(s, s);
  regions.forEach((r, i) => {
    ctx.fillStyle = css(i % 2 ? '--map-land': '--map-land-alt');
    ctx.fill(r.path, 'evenodd');
    ctx.strokeStyle = colours.line;
    ctx.lineWidth = .65 / s;
    ctx.stroke(r.path);
  });
  if (layer.zones) {
    ctx.fillStyle = css('--map-jungle');
    ctx.fill(junglePath, 'evenodd');
    zonePaths.forEach((p, i) => {
      ctx.fillStyle = css('--map-ring' + (i + 1));
      ctx.fill(p, 'evenodd');
      ctx.strokeStyle = css('--map-deadly');
      ctx.lineWidth = .8 / s;
      ctx.stroke(p);
    });
    ctx.strokeStyle = css('--map-high');
    ctx.lineWidth = 1 / s;
    ctx.setLineDash([4 / s, 4 / s]);
    ctx.stroke(nearPath);
    ctx.setLineDash([]);
  }
  ctx.restore();
}
// Geometry is compiled once, then stroked in world coordinates each frame.
let networkPaths = null;
function drawNetworks(s) {
  ctx.save();
  ctx.translate(width / 2 - cx * s, height / 2 - cy * s);
  ctx.scale(s, s);
  strokePathLayers(ctx, networkPaths, layer, s, css('--map-road'), colours.sea);
  ctx.restore();
}
async function loadNetworks() {
  try {
    const response = await fetch(new URL('paths.json', new URL(root.dataset.assets, document.baseURI)));
    if (!response.ok) throw Error(`Paths: HTTP ${response.status}`);
    networkPaths = createPathLayers(await response.json());
    request();
  } catch (error) {
    const note = document.createElement('p');
    note.className = 'map-path-error';
    note.setAttribute('role', 'status');
    note.textContent = 'Roads and waterways could not be loaded. Reload the page to try again.';
    root.querySelector('.map-foot').prepend(note);
    console.error('Bay map paths failed to load', error);
  }
}
loadNetworks();
// Keep region labels readable without overlapping each other.
function drawRegionLabels() {
  const labelBoxes = [];
  if (layer.labels) regions.forEach(r => {
    if (!r.anchor) return;
    const [x, y] = screen(...r.anchor);
    if (x < 10 || x > width - 10 || y < 14 || y > height - 10) return;
    ctx.font = '600 ' + (zoom < 2 ? 10: 12) + 'px Segoe UI,sans-serif';
    const tw = ctx.measureText(r.name).width;
    const b = [x - tw / 2, y - 7, x + tw / 2, y + 7];
    if (labelBoxes.some(a => b[0] < a[2] + 4 && b[2] > a[0] - 4 && b[1] < a[3] + 4 && b[3] > a[1] - 4)) return;
    labelBoxes.push(b);
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = colours.halo;
    ctx.strokeText(r.name, x, y);
    ctx.fillStyle = colours.muted;
    ctx.fillText(r.name, x, y);
  });
}
// Draw visible places and retain their pointer hit targets.
function drawPlaces() {
  const occupied = new Set();
  for (const l of locations) {
    if (!visible(l)) continue;
    const [x, y] = screen(l.x, l.y);
    if (x < - 10 || y < - 10 || x > width + 10 || y > height + 10) continue;
    const gap = zoom < 3 ? 54: zoom < 6 ? 28: 15;
    const cell = Math.floor(x / gap) + ',' + Math.floor(y / gap);
    if (occupied.has(cell) && l !== selected && zoom < 12) continue;
    occupied.add(cell);
    let colour = l.family ? css('--map-' + tierKey(l.tier)): colours.fg;
    const key = l.port && layer.ports ? 'port': l.family ? familyGlyph(l.family): ({
      'wealthy home': 'home', cult: 'cult', coven: 'cult', graveyard: 'cemetery'
    }
    [l.kind] ?? l.kind);
    icon(key, x, y, colour, l === selected ? 1.4: zoom < 3 ? .65: .85);
    hits.push({
      x, y, l
    });
  }
}
// Mark the two named world overlays.
function drawZonePins() {
  if (layer.zones) for (const [z, key] of[[data.zone, 'cult'], [data.jungle, 'other']]) {
    const [x, y] = screen(...z.anchor);
    icon(key, x, y, colours.accent, 1.4);
    hits.push({
      x,
      y,
      l: {
        ...z, x: z.anchor[0], y: z.anchor[1], kind: 'DFO zone'
      }
    });
  }
}
// Draw optional guide pins at the current level of detail.
function drawGuideMarkers() {
  if (layer.markers && !activeServices.size) {
    const pinCells = new Set();
    for (const m of markers) {
      if (zoom < 3 && (m.placement === 'region anchor' || m.kind === 'port_network')) continue;
      const [x, y] = screen(m.x, m.y);
      if (x < 0 || y < 0 || x > width || y > height) continue;
      const cell = Math.floor(x / 18) + ',' + Math.floor(y / 18);
      if (zoom < 5 && pinCells.has(cell)) continue;
      pinCells.add(cell);
      icon('guide', x, y, colours.accent, zoom < 2 ? .7: 1.1);
      hits.push({
        x, y, l: m
      });
    }
  }
}
// Highlight the origin and nearest service results.
function drawSelection() {
  if (pin && nearestTarget) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...screen(pin.x, pin.y));
    ctx.lineTo(...screen(nearestTarget.x, nearestTarget.y));
    ctx.strokeStyle = colours.sea;
    ctx.globalAlpha = .5;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
  }
  for (const l of nearest) {
    const [x, y] = screen(l.x, l.y);
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = colours.sea;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (selected) {
    const [x, y] = screen(selected.x, selected.y);
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = colours.accent;
    ctx.stroke();
  }
}
function drawPlayerPin() {
  const [x, y] = pin ? screen(pin.x, pin.y) : [-100, -100];
  pinButton.hidden = !pin || x < 0 || y < 0 || x > width || y > height;
  pinButton.style.left = x + 'px';
  pinButton.style.top = y + 'px';
  pinButton.classList.toggle('map-pin-at-top', y < 78);
  // The connector marks the pin while a result is selected; the label could cover that result.
  pinButton.classList.toggle('map-pin-quiet', !!nearestTarget);
  pinButton.style.setProperty('--pin-label-offset', Math.max(58 - x, Math.min(0, width - 58 - x)) + 'px');
}
// Region and guide-marker notes supplement the same selected-place record.
function appendPlaceNotes(l) {
  if (l.kind === 'region' || l.placement === 'region anchor') {
    const link = document.createElement('a');
    link.href = '#regions';
    link.dataset.ref = 'regions';
    link.textContent = 'Read The World, Region by Region';
    if (document.getElementById('regions')) detail.append(link);
  }
  if (l.where) {
    const note = document.createElement('details'), summary = document.createElement('summary'), text = document.createElement('p');
    summary.textContent = 'Guide marker note';
    text.textContent = typeof l.where === 'string' ? l.where: JSON.stringify(l.where);
    note.append(summary, text);
    detail.append(note);
  }
}
function show(l, centre = false) {
  selected = l;
  nearestTarget = nearest.includes(l) ? l : null;
  if (centre) {
    cx = l.x;
    cy = l.y;
    zoom = Math.max(zoom, 8);
  }
  const linked = l.kind !== 'region' && l.placement !== 'region anchor' ? locations.find(p => p.x === l.x && p.y === l.y && (p.name === (l.resolvedAs ?? l.name) || p.name + ' port' === l.name)): null;
  const place = linked ?? l;
  detail.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = l.name;
  detail.append(title);
  const lines = [];
  if (place.region != null) lines.push(regions[place.region]?.name ?? place.region);
  lines.push(place.family ? place.family + ' dungeon | danger tier ' + (place.tier ?? 'unconfirmed'): place.kind ?? 'Guide point');
  if (place.services != null) lines.push('Services: ' + data.services.filter(([k]) => hasService(place, k)).map(s => s[1]).join(', '));
  if (place.port) lines.push('Coastal port');
  if (place.ring) lines.push('Open Zone | ' + data.zone.rings[place.ring - 1].name);
  if (place.jungle) lines.push('Jungle of Bantha');
  if (l.name === data.zone.name || l.resolvedAs === data.zone.name) lines.push('Open PvP | four loot rings | stronger foes');
  lines.push('Map pixel ' + Math.floor(l.x) + ', ' + Math.floor(l.y));
  const p = document.createElement('p');
  p.textContent = lines.join(' | ');
  detail.append(p);
  appendPlaceNotes(l);
  const setPin = document.createElement('button');
  setPin.type = 'button';
  setPin.textContent = 'Set pin here';
  setPin.addEventListener('click', () => setLocation(place));
  detail.append(setPin);
  if (['city', 'hamlet', 'village', 'temple', 'tavern', 'wealthy home', 'home'].includes(place.kind) && place.mapId != null) {
    const openTown = document.createElement('button');
    openTown.type = 'button';
    openTown.textContent = 'Open town';
    openTown.addEventListener('click', () => root.dispatchEvent(new CustomEvent('place-selected', {
      detail: { ...place, regionName: regions[place.region]?.name }
    })));
    detail.append(openTown);
  }
  hideHover();
  root.dispatchEvent(new CustomEvent('place-selected', {
    detail: {
      ...place, regionName: regions[place.region]?.name, openTown: false
    }
  }));
  request();
}
function zoomAt(f, x = width / 2, y = height / 2) {
  const before = world(x, y);
  zoom = Math.max(1, Math.min(48, zoom * f));
  const after = world(x, y);
  cx += before[0] - after[0];
  cy += before[1] - after[1];
  request();
}
const reset = () => {
  cx = 500;
  cy = 250;
  zoom = 1;
  request();
};
root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => b.dataset.action === 'reset' ? reset(): zoomAt(b.dataset.action === 'in' ? 1.6: 1 / 1.6)));
root.querySelectorAll('[data-layer]').forEach(e => e.addEventListener('change', () => {
  layer[e.dataset.layer] = e.checked;
  if (e.checked) forcedLayers.add(e.dataset.layer);
  else forcedLayers.delete (e.dataset.layer);
  request();
}));
function resolveService(value) {
  const query = value.trim().toLowerCase();
  if (!query) return null;
  const exact = serviceEntries.find(entry => entry.name.toLowerCase() === query);
  if (exact) return exact;
  const partial = serviceEntries.find(entry => entry.name.toLowerCase().startsWith(query) || entry.name.toLowerCase().includes(query));
  if (partial) return partial;
  const key = aliases.get(query);
  return key ? serviceEntries.find(entry => entry.key === key) : null;
}
function findService(entry) {
  activeServices.clear();
  if (entry) activeServices.add(entry.key);
  nearestActive = Boolean(entry);
  nearestLimit = 5;
  nearestTarget = null;
  findStatus.textContent = entry ? entry.why : 'Choose a service from the suggestions.';
  updateNearest();
  request();
}
function applyFind() {
  const entry = resolveService(findInput.value);
  if (!entry) {
    findStatus.textContent = 'Choose a service from the suggestions.';
    findInput.focus();
    return;
  }
  findInput.value = entry.name;
  findService(entry);
}
findButton.addEventListener('click', applyFind);
findInput.addEventListener('change', applyFind);
findInput.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  applyFind();
});
clearButton.addEventListener('click', () => {
  findInput.value = '';
  findStatus.textContent = '';
  activeServices.clear();
  nearestActive = false;
  nearest = [];
  nearestMatches = [];
  nearestTarget = null;
  nearestStatus.textContent = '';
  nearestResults.replaceChildren();
  request();
  findInput.focus();
});
function updateNearest() {
  const out = root.querySelector('.map-nearest-results');
  out.replaceChildren();
  nearest = [];
  nearestMatches = [];
  if (!pin) {
    nearestStatus.textContent = 'Drop your location pin on the map first, then choose what you are looking for.';
    return;
  }
  if (!activeServices.size) {
    nearestStatus.textContent = 'Type what you are looking for above, then press Enter.';
    return;
  }
  nearestMatches = findNearest(locations, pin, activeServices, data.services, data.mapSquareKm);
  const shown = nearestMatches.slice(0, nearestLimit);
  nearest = shown.map(row => row.place);
  if (!nearest.includes(nearestTarget)) nearestTarget = null;
  nearestStatus.textContent = nearestMatches.length ? 'Showing ' + shown.length + ' of ' + nearestMatches.length + ' matching places, ordered by straight-line distance from your pin.' : 'No places offer that service in the Bay.';
  for (const { place: l, squares, km, direction } of shown) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.name + ' (' + regions[l.region].name + ') - straight-line distance: ' + squares.toFixed(1) + ' map squares / ' + km.toFixed(1) + ' km ' + direction;
    b.setAttribute('aria-pressed', String(l === nearestTarget));
    b.addEventListener('click', () => {
      show(l, true);
      out.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button === b)));
      detail.scrollIntoView({ block: 'nearest' });
    });
    out.append(b);
  }
  if (shown.length < nearestMatches.length) {
    const more = document.createElement('button');
    more.type = 'button';
    more.textContent = 'Show more';
    more.addEventListener('click', () => {
      const previousCount = shown.length;
      nearestLimit += 5;
      updateNearest();
      out.querySelectorAll('button')[previousCount]?.focus();
      request();
    });
    out.append(more);
  }
}
function setDropping(value) {
  droppingPin = value;
  dropButton.setAttribute('aria-pressed', String(value));
  canvas.classList.toggle('map-dropping-pin', value);
  pinStatus.textContent = value ? 'Click or tap the Bay map to place your pin. Escape cancels.' : pin ? 'Your location: ' + pin.x.toFixed(1) + ', ' + pin.y.toFixed(1) + '.' : 'No location pin set.';
}
function setLocation(point, persist = true) {
  pin = point ? { x: Math.max(0, Math.min(999.999, point.x)), y: Math.max(0, Math.min(499.999, point.y)) } : null;
  nearestTarget = null;
  nearestLimit = 5;
  removeButton.disabled = !pin;
  const saved = !persist || savePin(pin);
  setDropping(false);
  if (persist && saved && pin) pinStatus.textContent += ' Saved in this browser.';
  if (!saved) pinStatus.textContent = pin ? 'Your pin is set for this visit. Browser storage is unavailable.' : 'Pin removed for this visit. Browser storage is unavailable.';
  if (nearestActive) updateNearest();
  request();
}
dropButton.addEventListener('click', () => {
  setDropping(!droppingPin);
  if (droppingPin) canvas.focus();
});
root.querySelector('[data-pin-centre]').addEventListener('click', () => {
  setLocation({ x: cx, y: cy });
  cx = pin.x;
  cy = pin.y;
  drawPlayerPin();
  pinButton.focus();
});
removeButton.addEventListener('click', () => {
  setLocation(null);
  dropButton.focus();
});
root.addEventListener('keydown', e => {
  if (e.key === 'Escape' && droppingPin) setDropping(false);
});
pinButton.addEventListener('keydown', e => {
  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!delta || !pin) return;
  e.preventDefault();
  const step = e.shiftKey ? 10 : 1;
  setLocation({ x: pin.x + delta[0] * step, y: pin.y + delta[1] * step });
  cx = pin.x;
  cy = pin.y;
});
let pinDrag = null;
pinButton.addEventListener('pointerdown', e => {
  if (e.button !== 0 || pinDrag !== null) return;
  e.preventDefault();
  pinButton.focus();
  pinButton.setPointerCapture(e.pointerId);
  // Preserve the offset between the finger and the pin's tip while dragging.
  const [x, y] = world(...local(e));
  pinDrag = { id: e.pointerId, dx: pin.x - x, dy: pin.y - y };
});
pinButton.addEventListener('pointermove', e => {
  if (pinDrag?.id !== e.pointerId) return;
  const [x, y] = world(...local(e));
  setLocation({ x: x + pinDrag.dx, y: y + pinDrag.dy }, false);
});
function finishPinDrag(e) {
  if (pinDrag?.id !== e.pointerId) return;
  pinDrag = null;
  setLocation(pin);
}
pinButton.addEventListener('pointerup', finishPinDrag);
pinButton.addEventListener('pointercancel', finishPinDrag);
pinButton.addEventListener('lostpointercapture', finishPinDrag);
setLocation(pin, false);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  zoomAt(Math.exp(- e.deltaY * .0015), e.clientX - r.left, e.clientY - r.top);
}, {
  passive: false
});
const pointers = new Map();
let moved = false, start = null;
const local = e => {
  const r = canvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
};
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  hideHover();
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, local(e));
  start = local(e);
  moved = false;
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || pointers.size) return;
  const p = local(e);
  let best = null, d = 18;
  for (const h of hits) {
    const n = Math.hypot(p[0] - h.x, p[1] - h.y);
    if (n < d) {
      d = n;
      best = h.l;
    }
  }
  if (!best && layer.zones) {
    const w = world(...p);
    if (areaHit(new Path2D(data.zone.path), w)) best = {
      ...data.zone, kind: 'DFO zone'
    };
    else if (areaHit(junglePath, w)) best = {
      ...data.jungle, kind: 'DFO zone'
    };
  }
  if (best) hoverCard(best, e.clientX, e.clientY);
  else hideHover();
});
canvas.addEventListener('pointerleave', hideHover);
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  const old = [...pointers.values()], prev = pointers.get(e.pointerId), p = local(e);
  pointers.set(e.pointerId, p);
  if (Math.hypot(p[0] - start[0], p[1] - start[1]) > 5) moved = true;
  if (pointers.size === 1) {
    if (!droppingPin) {
      cx -= (p[0] - prev[0]) / scale();
      cy -= (p[1] - prev[1]) / scale();
    }
  } else {
    moved = true;
    const now = [...pointers.values()], dist = a => Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
    const a = [(old[0][0] + old[1][0]) / 2, (old[0][1] + old[1][1]) / 2], b = [(now[0][0] + now[1][0]) / 2, (now[0][1] + now[1][1]) / 2];
    if (dist(old) > 0) zoomAt(dist(now) / dist(old), ...a);
    cx -= (b[0] - a[0]) / scale();
    cy -= (b[1] - a[1]) / scale();
  }
  request();
});
function areaHit(path, point) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const hit = ctx.isPointInPath(path, ...point, 'evenodd');
  ctx.restore();
  return hit;
}
canvas.addEventListener('pointerup', e => {
  const p = local(e);
  if (!moved && pointers.size === 1 && droppingPin) {
    const [x, y] = world(...p);
    setLocation({ x, y });
  } else if (!moved && pointers.size === 1) {
    let best = null, d = 20;
    for (const h of hits) {
      const n = Math.hypot(p[0] - h.x, p[1] - h.y);
      if (n < d) {
        d = n;
        best = h;
      }
    }
    if (best) show(best.l);
    else if (layer.zones) {
      const w = world(...p);
      if (areaHit(new Path2D(data.zone.path), w)) show({
        ...data.zone, x: w[0], y: w[1], kind: 'DFO zone'
      });
      else if (areaHit(junglePath, w)) show({
        ...data.jungle, x: w[0], y: w[1], kind: 'DFO zone'
      });
    }
  }
  pointers.delete (e.pointerId);
});
canvas.addEventListener('pointercancel', e => pointers.delete (e.pointerId));
canvas.addEventListener('keydown', e => {
  const step = 60 / scale();
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(e.key)) e.preventDefault();
  if (e.key === 'ArrowLeft') cx -= step;
  if (e.key === 'ArrowRight') cx += step;
  if (e.key === 'ArrowUp') cy -= step;
  if (e.key === 'ArrowDown') cy += step;
  if (['+', '='].includes(e.key)) zoomAt(1.6);
  if (e.key === '-') zoomAt(1 / 1.6);
  if (e.key === 'Home') reset();
  request();
});
const normalize = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
search.addEventListener('input', () => {
  hideHover();
  results.replaceChildren();
  const q = normalize(search.value);
  if (q.length < 2) return;
  const candidates = [
    ...locations,
    ...[data.zone, data.jungle].map(z => ({
      ...z, x: z.anchor[0], y: z.anchor[1], kind: 'DFO zone'
    })),
    ...regions.filter(r => r.anchor).map(r => ({
      name: r.name, x: r.anchor[0], y: r.anchor[1], kind: 'region'
    }))
  ];
  const found = candidates.filter(l => normalize(l.name).includes(q)).sort((a, b) => (normalize(a.name) !== q) - (normalize(b.name) !== q)).slice(0, 20);
  for (const l of found) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.name + ' | ' + (l.region != null ? regions[l.region].name: l.kind);
    hoverButton(b, l);
    b.addEventListener('click', () => {
      hideHover();
      show(l, true);
      results.replaceChildren();
      canvas.focus();
    });
    results.append(b);
  }
  if (!found.length) results.textContent = 'No matching places.';
});
search.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    results.querySelector('button')?.click();
    e.preventDefault();
  }
  if (e.key === 'Escape') results.replaceChildren();
});
// Embedding contract: root.setMarkers(list) resolves exact names; root.setResolvedMarkers(list) accepts build output.
// Both return unresolved entries so the guide can report missing/ambiguous pins.
root.setResolvedMarkers = list => {
  markers = list.filter(m => Number.isFinite(m.x) && Number.isFinite(m.y));
  request();
  return list.filter(m => !markers.includes(m));
};
root.setMarkers = list => {
  const pins = [], unresolved = [];
  for (const m of list) {
    const n = normalize(m.name);
    const z = [data.zone, data.jungle].find(z => normalize(z.name) === n || normalize('The ' + z.name) === n || (m.kind === 'open_zone' && z === data.zone && n === normalize(regions[z.region].name)));
    if (z) {
      pins.push({
        ...m, x: z.anchor[0], y: z.anchor[1]
      });
      continue;
    }
    if (m.kind === 'region') {
      const r = regions.find(r => normalize(r.name) === n);
      if (r?.anchor) pins.push({
        ...m, x: r.anchor[0], y: r.anchor[1]
      });
      else unresolved.push(m);
      continue;
    }
    if (m.kind === 'port_network' && n === 'iliacbayports') {
      for (const l of locations.filter(l => l.port)) pins.push({
        ...m, name: l.name + ' port', x: l.x, y: l.y
      });
      continue;
    }
    const matches = locations.filter(l => (normalize(l.name).replace(/^the/, '') === n.replace(/^the/, '')) && (m.region == null || m.region === '' || String(l.region) === String(m.region) || normalize(regions[l.region].name) === normalize(m.region)));
    if (matches.length === 1) pins.push({
      ...m, x: matches[0].x, y: matches[0].y
    });
    else unresolved.push(m);
  }
  markers = pins;
  request();
  return unresolved;
};
new ResizeObserver(() => {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  width = r.width;
  height = r.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  request();
}).observe(canvas);
new MutationObserver(request).observe(document.documentElement, {
  attributes: true, attributeFilter: ['data-theme', 'class', 'style']
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', request);
