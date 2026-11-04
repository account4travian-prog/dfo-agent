import { decodeTownGrid, townField, townBuildingPoint, townKind, townColours } from './town-layout.mjs';
// Inlined after town-layout.mjs by build-guide-page.mjs. All game records arrive by relative fetch.
'use strict';
const root = document.querySelector('.world-map');
const $ = s => root.querySelector(s);
const world = JSON.parse($('.map-data').textContent);
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}
[c]));
const words = s => String(s).replace(/([a-z])([A-Z])/g, '$1 $2');
const source = s => `<p><em>Sources: ${escape(s)}</em></p>`;
const layoutSources = 'src/ui/ink/inkTown.js (townBytes, sheetY); src/ui/nameplateLayout.js (nameplateAnchor); src/world/buildingNames.js (BUILDING_TYPES, generateBuildingName); src/world/water/waterCorners.js (WATER_DRAW_MASK_TABLE, waterCoverage); src/world/rmbLayout.js (buildGroundTilemap).';
const names = ['Town', 'Buildings', 'Selected building', 'Guide notes'];
const shortNames = ['Town', 'Buildings', 'Selected', 'Notes'];
const keys = ['town', 'buildings', 'selected', 'notes'];
const shell = document.createElement('section');
shell.className = 'town-shell';
shell.hidden = true;
shell.setAttribute('aria-label', 'Local town map');
shell.innerHTML = `<div class="town-nav"><button type="button" class="town-back">Back to the Bay</button><h3 tabindex="-1"></h3></div>
    <div class="town-toolbar" role="toolbar" aria-label="Town windows">${names.map((n, i) => `<button type="button" data-window="${keys[i]}" aria-label="${n}" aria-controls="town-window-${keys[i]}" aria-pressed="true"><span class="town-wide-label">${n}</span><span class="town-short-label">${shortNames[i]}</span></button>`).join('')}</div>
    <div class="town-stage"><canvas tabindex="0" role="img" aria-label="Local map. Drag to pan, wheel or pinch to zoom. Arrow keys pan, plus and minus zoom. Use Buildings to select every building by name."></canvas>
    <div class="town-controls"><button type="button" data-town-zoom="in" aria-label="Zoom town map in">+</button><button type="button" data-town-zoom="out" aria-label="Zoom town map out">−</button><button type="button" data-town-zoom="fit">Fit town</button></div>
    ${names.map((n, i) => `<section class="town-window" id="town-window-${keys[i]}" data-panel="${keys[i]}" role="region" aria-label="${n}"><header><button class="town-handle" type="button" title="Drag to move. Arrow keys move this window; Shift moves further." aria-label="Move ${n} window">${n}</button><button type="button" data-panel-action="minimise" aria-label="Minimise ${n}" aria-expanded="true">−</button><button type="button" data-panel-action="enlarge" aria-label="Enlarge ${n}" aria-pressed="false">↗</button><button type="button" data-panel-action="close" aria-label="Close ${n}">×</button></header><div class="town-body"></div></section>`).join('')}
    <div class="town-message" role="status" hidden></div><div class="town-hover" role="tooltip" hidden></div></div>
    <div class="town-legend">${Object.entries(townColours).map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}<span><i style="background:#639ebc"></i>Water</span><span><i style="background:#dce1cf"></i>Street / ground</span></div>
    <p class="town-caption">North up. Every building is in Buildings, including residences and walls. Zoom for labels; hover or tap for a name. Gate markers identify carriage gate blocks, not the driver's exact position. Installed base layout: online replacements, locale, quest names and player names can differ.</p>`;
$('.map-stage').before(shell);
shell.querySelector('.town-caption').insertAdjacentHTML('afterend', source(layoutSources));
const stage = shell.querySelector('.town-stage'), canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
const title = shell.querySelector('h3'), message = shell.querySelector('.town-message'), hover = shell.querySelector('.town-hover');
const windows = new Map(keys.map(k => [k, shell.querySelector(`[data-panel="${k}"]`)]));
const body = k => windows.get(k).querySelector('.town-body');
const toolbar = k => shell.querySelector(`[data-window="${k}"]`);
const narrow = () => shell.clientWidth <= 680;
let active = 'town', z = 3, town = null, place = null, field = null, image = null, selected = - 1;
let width = 0, height = 0, cx = 0, cy = 0, zoom = 1, requestId = 0, queued = false, lastFocus = null;
let indexPromise = null, buildingsQuery = '', buildingsKind = '', labelHits = [];
let previousNarrow = null;
const cache = new Map();
const request = () => {
  if (!queued) {
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  }
};
const fitScale = () => field ? Math.min(Math.max(120, width - (narrow() ? 30: 480)) / field.w, Math.max(150, height - (narrow() ? 320: 90)) / field.h): 1;
const scale = () => fitScale() * zoom;
const screen = (x, y) => [(x - cx) * scale() + width / 2, (y - cy) * scale() + (narrow() ? (height - 290) / 2: height / 2)];
const local = e => {
  const r = canvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
};
const point = (x, y) => [(x - width / 2) / scale() + cx, (y - (narrow() ? (height - 290) / 2: height / 2)) / scale() + cy];
const colour = name => getComputedStyle(root).getPropertyValue(name).trim();
function clampPanel(panel) {
  if (narrow() || shell.hidden) return;
  panel.style.left = Math.max(0, Math.min(parseFloat(panel.style.left) || 0, stage.clientWidth - panel.offsetWidth)) + 'px';
  panel.style.top = Math.max(0, Math.min(parseFloat(panel.style.top) || 0, stage.clientHeight - panel.offsetHeight)) + 'px';
}
function arrange() {
  keys.forEach((k, i) => {
    const p = windows.get(k);
    p.style.left = (i % 2 ? stage.clientWidth - 260: 10) + 'px';
    p.style.top = (i < 2 ? 66: stage.clientHeight - 234) + 'px';
    clampPanel(p);
  });
}
function activate(key, focus = false) {
  active = key;
  for (const [k, panel] of windows) {
    panel.classList.toggle('active', k === key);
    // On a phone the toolbar is also the sheet's set of tabs.
    toolbar(k).setAttribute('aria-pressed', String(!panel.hidden && (!narrow() || k === key)));
  }
  const panel = windows.get(key);
  panel.style.zIndex =++ z;
  if (focus) panel.querySelector('.town-handle').focus({
    preventScroll: true
  });
}
function reopen(key, focus = false) {
  const panel = windows.get(key);
  panel.hidden = false;
  panel.classList.remove('minimised');
  panel.querySelector('[data-panel-action=minimise]').setAttribute('aria-expanded', 'true');
  panel.querySelector('[data-panel-action=minimise]').setAttribute('aria-label', `Minimise ${names[keys.indexOf(key)]}`);
  panel.querySelector('[data-panel-action=minimise]').textContent = '−';
  clampPanel(panel);
  activate(key, focus);
}
for (const [key, panel] of windows) {
  toolbar(key).addEventListener('click', () => reopen(key, true));
  panel.addEventListener('pointerdown', () => activate(key));
  panel.addEventListener('focusin', () => {
    if (active !== key) activate(key);
  });
  const handle = panel.querySelector('.town-handle');
  let drag = null;
  handle.addEventListener('pointerdown', e => {
    if (narrow()) return;
    handle.setPointerCapture(e.pointerId);
    drag = [e.clientX, e.clientY, parseFloat(panel.style.left) || 0, parseFloat(panel.style.top) || 0];
  });
  handle.addEventListener('pointermove', e => {
    if (!drag) return;
    panel.style.left = drag[2] + e.clientX - drag[0] + 'px';
    panel.style.top = drag[3] + e.clientY - drag[1] + 'px';
    clampPanel(panel);
  });
  for (const event of['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(event, () => {
    drag = null;
  });
  handle.addEventListener('keydown', e => {
    if (narrow() || !e.key.startsWith('Arrow')) return;
    e.preventDefault();
    const amount = e.shiftKey ? 40: 10;
    panel.style.left = (parseFloat(panel.style.left) || 0) + (e.key === 'ArrowRight' ? amount: e.key === 'ArrowLeft' ? - amount: 0) + 'px';
    panel.style.top = (parseFloat(panel.style.top) || 0) + (e.key === 'ArrowDown' ? amount: e.key === 'ArrowUp' ? - amount: 0) + 'px';
    clampPanel(panel);
  });
  panel.querySelector('header').addEventListener('click', e => {
    const button = e.target.closest('[data-panel-action]');
    if (!button) return;
    const action = button.dataset.panelAction;
    if (action === 'close') {
      panel.hidden = true;
      toolbar(key).setAttribute('aria-pressed', 'false');
      toolbar(key).focus();
      const next = keys.find(k => !windows.get(k).hidden);
      if (next) activate(next);
    } else if (action === 'minimise') {
      const min = panel.classList.toggle('minimised');
      button.setAttribute('aria-expanded', String(!min));
      button.setAttribute('aria-label', `${min ? 'Restore' : 'Minimise'} ${names[keys.indexOf(key)]}`);
      button.textContent = min ? '+': '−';
      clampPanel(panel);
    } else {
      const large = panel.classList.toggle('enlarged');
      panel.classList.remove('minimised');
      panel.querySelector('[data-panel-action=minimise]').setAttribute('aria-expanded', 'true');
      panel.querySelector('[data-panel-action=minimise]').setAttribute('aria-label', `Minimise ${names[keys.indexOf(key)]}`);
      panel.querySelector('[data-panel-action=minimise]').textContent = '−';
      panel.style.width = large ? Math.min(460, stage.clientWidth) + 'px': '250px';
      panel.style.height = large ? Math.min(510, stage.clientHeight - 10) + 'px': key === 'buildings' ? '340px': '224px';
      button.setAttribute('aria-pressed', String(large));
      button.setAttribute('aria-label', `${large ? 'Reduce' : 'Enlarge'} ${names[keys.indexOf(key)]}`);
      clampPanel(panel);
    }
  });
}
function status(text, retry = false) {
  message.replaceChildren();
  const p = document.createElement('p');
  p.textContent = text;
  message.append(p);
  message.hidden = false;
  if (retry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Retry loading';
    button.addEventListener('click', () => open(place));
    message.append(button);
  }
}
async function fetchJSON(path, gzip = false) {
  const response = await fetch(new URL(path, new URL(root.dataset.assets, location.href)));
  if (!response.ok) throw Error('HTTP ' + response.status);
  if (!gzip) return response.json();
  if (!globalThis.DecompressionStream) throw Error('This browser cannot decompress town files. Use a current browser.');
  // Base64 text of a gzip file: the artifact host serves text, not .gz.
  const bytes = Uint8Array.from(atob((await response.text()).trim()), c => c.charCodeAt(0));
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
}
async function regionData(region) {
  if (!cache.has(region)) {
    const pending = fetchJSON(`towns/${region}.gz.txt`, true).then(data => {
      if (data.regionIndex !== region || !Array.isArray(data.locations)) throw Error('Invalid region data');
      return data;
    }).catch (error => {
      cache.delete (region);
      throw error;
    });
    cache.set(region, pending);
  }
  return cache.get(region);
}
async function open(p) {
  const sequence =++ requestId;
  beginTown(p);
  try {
    if (!indexPromise) indexPromise = fetchJSON('towns/index.json').catch (error => {
      indexPromise = null;
      throw error;
    });
    const index = await indexPromise;
    if (sequence !== requestId) return;
    const entry = index.locations.find(t => t.regionIndex === p.region && t.mapId === p.mapId);
    if (!entry) {
      status('No local layout is available for this place. Back to the Bay returns to the world map.');
      return;
    }
    const data = await regionData(entry.regionIndex);
    if (sequence !== requestId) return;
    town = data.locations.find(t => t.mapId === entry.mapId && t.name === entry.name);
    if (!town) throw Error('Town missing from region file');
    shell.dataset.mapId = String(town.mapId);
    field = townField(town);
    selected = - 1;
    buildingsQuery = '';
    buildingsKind = '';
    paintTownImage();
    showTown();
  } catch (error) {
    if (sequence === requestId) status(`Town map could not load. ${error.message}. Check that towns/index.json and this region's .gz.txt were published beside the page.`, true);
  }
}
// Open the town shell before requesting its local records.
function beginTown(p) {
  place = p;
  town = null;
  field = null;
  image = null;
  selected = - 1;
  delete shell.dataset.mapId;
  lastFocus = document.activeElement;
  root.classList.add('town-open');
  shell.hidden = false;
  shell.scrollIntoView({
    block: 'start', behavior: 'instant'
  });
  title.textContent = p.name;
  canvas.setAttribute('aria-label', p.name + ' local map. Drag to pan; wheel or pinch to zoom. Arrow keys pan; plus and minus zoom. Buildings lists every name.');
  title.focus({
    preventScroll: true
  });
  for (const panel of windows.values()) panel.hidden = true;
  for (const key of keys) toolbar(key).disabled = true;
  hover.hidden = true;
  request();
  status(`Loading ${p.regionName ?? ''} town maps…`);
}
// Convert the extracted town grid to a reusable canvas bitmap.
function paintTownImage() {
  image = document.createElement('canvas');
  image.width = field.w;
  image.height = field.h;
  const imageContext = image.getContext('2d'), pixels = imageContext.createImageData(field.w, field.h);
  const rgb = hex => hex.match(/[0-9a-f]{2}/gi).map(v => parseInt(v, 16));
  for (let i = 0; i < field.bytes.length; i++) {
    const value = field.bytes[i];
    const hex = value > 0 && value <= 25 ? townColours[townKind(value - 1)]: field.water[i] ? '#639ebc': value === 251 ? '#b6c49e': '#dce1cf';
    pixels.data.set([...rgb(hex), 255], i * 4);
  }
  imageContext.putImageData(pixels, 0, 0);
}
// Refresh the floating windows after a successful load.
function showTown() {
  message.hidden = true;
  for (const panel of windows.values()) panel.hidden = false;
  for (const key of keys) toolbar(key).disabled = false;
  townInfo();
  buildingList();
  selectedInfo();
  guideNotes();
  arrange();
  activate('town');
  fit();
  request();
}
function back() {
  ++ requestId;
  shell.hidden = true;
  root.classList.remove('town-open');
  hover.hidden = true;
  const target = lastFocus?.isConnected && !shell.contains(lastFocus) ? lastFocus: $('.map-stage canvas');
  $('.map-stage').scrollIntoView({
    block: 'start', behavior: 'instant'
  });
  target.focus({
    preventScroll: true
  });
}
shell.querySelector('.town-back').addEventListener('click', back);
root.addEventListener('place-selected', e => {
  const p = e.detail;
  if (p.openTown === false) {
    if (!shell.hidden) back();
    return;
  }
  if (['city', 'hamlet', 'village', 'temple', 'tavern', 'wealthy home', 'home'].includes(p.kind)) open(p);
  else if (!shell.hidden) back();
});
function townInfo() {
  const services = [
    ...new Set(town.buildings.filter(b => !['Residence', 'Wall / gate', 'Other'].includes(townKind(b.t))).map(b => b.factionName && b.t === 11 ? b.factionName: words(b.type)))
  ];
  const nearby = world.locations.filter(l => l[5] && Math.hypot(l[2] + .5 - place.x, l[3] + .5 - place.y) > 0).sort((a, b) => Math.hypot(a[2] + .5 - place.x, a[3] + .5 - place.y) - Math.hypot(b[2] + .5 - place.x, b[3] + .5 - place.y)).slice(0, 3);
  body('town').innerHTML = `<dl><dt>Type</dt><dd>${escape(town.type)}</dd><dt>Region</dt><dd>${escape(town.region)}</dd><dt>Seat</dt><dd>${escape(town.flags.seat ?? 'None recorded')}</dd><dt>Carriage</dt><dd>${town.flags.carriage ? 'Gate marked on map' : 'No carriage gate recorded'}</dd><dt>Port</dt><dd>${place.port ? 'Coastal port' : 'No coastal port recorded'}</dd></dl>
      <p><b>Services</b><br>${escape(services.join(', ') || 'None recorded')}</p>
      <p><b>Nearby dungeons</b><br>${nearby.map(l => `${escape(l[0])}: ${escape(l[5])}, tier ${escape(l[6] ?? 'unconfirmed')}`).join('<br>')}</p>
      <p>These are the nearest named dungeons in a straight line. This is not a safe route. ${place.ring ? 'This place is in the Open Zone.' : ''}.</p>
      ${source('src/world/immersiveTravelGates.js (hasCarriageGate, IT_GATE_FILE); src/systems/town/townSeats.js (deriveTownSeats, seatAtMapId); src/world/portSites.js (portTownOnSea); src/systems/loot/lootRarity.js (DUNGEON_RARITY_TIER).')}`;
}
function buildingList() {
  body('buildings').innerHTML = `<label>Search buildings<input type="search" aria-label="Search buildings" placeholder="Name, guild or kind" value="${escape(buildingsQuery)}"></label><label>Kind<select aria-label="Filter buildings by kind"><option value="">All kinds</option>${[...new Set(town.buildings.map(b => townKind(b.t)))].sort().map(k => `<option ${buildingsKind === k ? 'selected' : ''}>${escape(k)}</option>`).join('')}</select></label><p class="town-building-count" role="status"></p><div class="town-buildings"></div>${source('src/systems/talk/talkTopics.js (mergeNamedBuildings); src/world/buildingNames.js (generateBuildingName, BUILDING_TYPES); src/formats/blocksFile.js (readBuildingData).')}`;
  body('buildings').querySelector('input').addEventListener('input', e => {
    buildingsQuery = e.target.value;
    listRows();
  });
  body('buildings').querySelector('select').addEventListener('change', e => {
    buildingsKind = e.target.value;
    listRows();
  });
  listRows();
}
function listRows() {
  const list = body('buildings').querySelector('.town-buildings');
  list.replaceChildren();
  let count = 0;
  const priority = b => ['Residence', 'Wall / gate', 'Other'].includes(townKind(b.t)) ? 1: 0;
  town.buildings.map((b, i) => ({
    b, i
  })).sort((a, b) => priority(a.b) - priority(b.b) || a.b.name.localeCompare(b.b.name) || a.i - b.i).forEach(({
    b, i
  }) => {
    if (buildingsKind && townKind(b.t) !== buildingsKind) return;
    if (!`${b.name} ${words(b.type)} ${b.factionName ?? ''}`.toLowerCase().includes(buildingsQuery.toLowerCase())) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.building = i;
    button.setAttribute('aria-pressed', String(selected === i));
    button.innerHTML = `${escape(b.name)}<small>${escape(words(b.type))} · block ${b.block.join(',')} / record ${b.record}</small>`;
    button.addEventListener('click', () => selectBuilding(i, true));
    list.append(button);
    count++;
  });
  body('buildings').querySelector('.town-building-count').textContent = `${count} of ${town.buildings.length} buildings`;
}
function selectedInfo() {
  const b = town.buildings[selected];
  if (!b) {
    body('selected').innerHTML = '<p>Select a footprint or a name in Buildings.</p>';
    return;
  }
  body('selected').innerHTML = `<p><b>${escape(b.name)}</b></p><dl><dt>Kind</dt><dd>${escape(words(b.type))}</dd><dt>Guild / divine</dt><dd>${escape(b.factionName ?? 'None recorded')}</dd><dt>Quality</dt><dd>${escape(b.q)} (source value)</dd><dt>Record</dt><dd>Block ${b.block.join(',')} / ${b.record}</dd></dl>${source('src/world/buildingNames.js; src/systems/talk/talkTopics.js; src/formats/blocksFile.js')}`;
}
function guideNotes() {
  body('notes').innerHTML = '<p>These buildings come from your installed base records. Mods can replace a town layout. Distances on the Bay map are straight lines, not safe routes.</p>';
}
function selectBuilding(i, centre = false) {
  selected = i;
  const b = town.buildings[i];
  if (centre) {
    [cx, cy] = townBuildingPoint(town, b);
    zoom = Math.max(zoom, 3);
  }
  selectedInfo();
  reopen('selected', true);
  hover.hidden = true;
  body('buildings').querySelectorAll('[data-building]').forEach(button => button.setAttribute('aria-pressed', String(+ button.dataset.building === i)));
  request();
}
function fit() {
  if (!field) return;
  cx = field.w / 2;
  cy = field.h / 2;
  zoom = 1;
  request();
}
function zoomAt(factor, x = width / 2, y = narrow() ? (height - 290) / 2: height / 2) {
  if (!field) return;
  const before = point(x, y);
  zoom = Math.max(.5, Math.min(32, zoom * factor));
  const after = point(x, y);
  cx += before[0] - after[0];
  cy += before[1] - after[1];
  hover.hidden = true;
  request();
}
shell.querySelectorAll('[data-town-zoom]').forEach(b => b.addEventListener('click', () => b.dataset.townZoom === 'fit' ? fit(): zoomAt(b.dataset.townZoom === 'in' ? 1.5: 1 / 1.5)));
function draw() {
  if (shell.hidden || !width || !height) return;
  ctx.fillStyle = colour('--map-land');
  ctx.fillRect(0, 0, width, height);
  labelHits = [];
  if (!image || !field) return;
  const [ox, oy] = screen(0, 0), s = scale();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, ox, oy, field.w * s, field.h * s);
  drawBuildings();
  drawCarriage();
  drawTownScale();
}
// Label visible buildings with collision avoidance.
function drawBuildings() {
  const boxes = [];
  const order = town.buildings.map((b, i) => ({
    b, i
  })).sort((a, b) => (b.i === selected) - (a.i === selected) || (townKind(a.b.t) === 'Residence') - (townKind(b.b.t) === 'Residence'));
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = `${zoom >= 4 ? 13 : 11}px Segoe UI,sans-serif`;
  for (const {
    b, i
  }
  of order) {
    const [x, y] = screen(...townBuildingPoint(town, b));
    if (x < - 10 || y < - 10 || x > width + 10 || y > height + 10) continue;
    if (i === selected) {
      ctx.strokeStyle = colour('--focus');
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();
    }
    const isHouse = ['Residence', 'Wall / gate'].includes(townKind(b.t)), text = b.name, tw = ctx.measureText(text).width;
    const box = [x - tw / 2 - 3, y - 8, x + tw / 2 + 3, y + 8];
    if (i !== selected && ((isHouse && zoom < 4) || boxes.some(a => box[0] < a[2] && box[2] > a[0] && box[1] < a[3] && box[3] > a[1]))) continue;
    boxes.push(box);
    ctx.strokeStyle = '#f6f8f1';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#20323b';
    ctx.fillText(text, x, y);
    labelHits.push({
      box, i
    });
  }
}
// Mark the gate records used by local carriage travel.
function drawCarriage() {
  if (town.flags.carriage) for (const block of town.blocks.filter(b => /^WALLAA(?:08|09|10|11)(?:\.|$)/i.test(b.n))) {
    const [x, y] = screen(block.p[0] * 64 + 32, field.h - 1 - (block.p[1] * 64 + 32));
    ctx.fillStyle = '#20323b';
    ctx.fillRect(x - 7, y - 7, 14, 14);
    ctx.strokeStyle = '#f6f8f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 7, y - 7, 14, 14);
    ctx.font = 'bold 12px Segoe UI,sans-serif';
    ctx.strokeStyle = '#f6f8f1';
    ctx.lineWidth = 3;
    ctx.strokeText('Carriage gate', x, y - 17);
    ctx.fillText('Carriage gate', x, y - 17);
  }
}
// Keep orientation and zoom visible over the local grid.
function drawTownScale() {
  ctx.textAlign = 'left';
  ctx.font = '12px Segoe UI,sans-serif';
  ctx.fillStyle = colour('--surface');
  ctx.fillRect(10, height - 29, 125, 20);
  ctx.fillStyle = colour('--fg');
  ctx.fillText(`N ↑ · ${zoom.toFixed(1)}× town`, 16, height - 18);
}
function hit(x, y) {
  if (!town || !field) return - 1;
  const label = labelHits.find(h => x >= h.box[0] && x <= h.box[2] && y >= h.box[1] && y <= h.box[3]);
  if (label) return label.i;
  let best = - 1, distance = Math.max(10, 7 * scale());
  town.buildings.forEach((b, i) => {
    const p = screen(...townBuildingPoint(town, b)), d = Math.hypot(x - p[0], y - p[1]);
    if (d < distance) {
      distance = d;
      best = i;
    }
  });
  return best;
}
const pointers = new Map();
let moved = false, origin = null;
canvas.addEventListener('pointerdown', e => {
  canvas.focus({
    preventScroll: true
  });
  canvas.setPointerCapture(e.pointerId);
  const p = local(e);
  pointers.set(e.pointerId, p);
  origin = p;
  moved = pointers.size > 1;
  hover.hidden = true;
});
canvas.addEventListener('pointermove', e => {
  const p = local(e);
  if (!pointers.has(e.pointerId)) {
    if (e.pointerType === 'touch' || !town) return;
    const i = hit(...p);
    if (i < 0) {
      hover.hidden = true;
      return;
    }
    hover.textContent = town.buildings[i].name + ' · ' + words(town.buildings[i].type);
    hover.hidden = false;
    hover.style.left = Math.max(4, Math.min(p[0] + 12, width - hover.offsetWidth - 4)) + 'px';
    hover.style.top = Math.max(4, Math.min(p[1] + 18, height - hover.offsetHeight - 4)) + 'px';
    return;
  }
  const old = [...pointers.values()];
  pointers.set(e.pointerId, p);
  const now = [...pointers.values()];
  if (origin && Math.hypot(p[0] - origin[0], p[1] - origin[1]) > 4) moved = true;
  if (now.length === 1 && field) {
    cx -= (now[0][0] - old[0][0]) / scale();
    cy -= (now[0][1] - old[0][1]) / scale();
    request();
  } else if (now.length === 2 && old.length === 2) {
    moved = true;
    const distance = ps => Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]);
    const oldMiddle = [(old[0][0] + old[1][0]) / 2, (old[0][1] + old[1][1]) / 2], middle = [(now[0][0] + now[1][0]) / 2, (now[0][1] + now[1][1]) / 2];
    if (field) {
      cx -= (middle[0] - oldMiddle[0]) / scale();
      cy -= (middle[1] - oldMiddle[1]) / scale();
    }
    zoomAt(distance(now) / Math.max(1, distance(old)), ...middle);
  }
});
canvas.addEventListener('pointerup', e => {
  if (!moved && pointers.size === 1) {
    const i = hit(...local(e));
    if (i >= 0) selectBuilding(i);
  }
  pointers.delete (e.pointerId);
});
for (const event of['pointercancel', 'lostpointercapture']) canvas.addEventListener(event, e => {
  pointers.delete (e.pointerId);
  moved = true;
});
canvas.addEventListener('pointerleave', () => {
  hover.hidden = true;
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoomAt(Math.exp(- e.deltaY * .0015), ...local(e));
}, {
  passive: false
});
canvas.addEventListener('keydown', e => {
  if (!field) return;
  if (['+', '=', '-', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) e.preventDefault();
  if (e.key === '+' || e.key === '=') zoomAt(1.5);
  else if (e.key === '-') zoomAt(1 / 1.5);
  else if (e.key === 'Home') fit();
  else {
    const step = 40 / scale();
    if (e.key === 'ArrowLeft') cx -= step;
    if (e.key === 'ArrowRight') cx += step;
    if (e.key === 'ArrowUp') cy -= step;
    if (e.key === 'ArrowDown') cy += step;
    request();
  }
});
shell.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    hover.hidden = true;
    canvas.focus();
  }
});
new ResizeObserver(() => {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  width = r.width;
  height = r.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (previousNarrow !== narrow()) {
    previousNarrow = narrow();
    arrange();
  }
  for (const p of windows.values()) clampPanel(p);
  activate(active);
  request();
}).observe(stage);
new MutationObserver(request).observe(document.documentElement, {
  attributes: true, attributeFilter: ['data-theme', 'class', 'style']
});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change', request);
