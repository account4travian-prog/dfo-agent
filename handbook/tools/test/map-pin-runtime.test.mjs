import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { hasService as placeHasService, findNearest, loadPin, savePin, PIN_STORAGE_KEY } from '../../theme/map/map-location.mjs';

// Exercise real runtime event handlers without opening a browser. This models no layout or accessibility tree.
async function runtime({ stored = null, blocked = false } = {}) {
  let focused = null, resize;
  class Element {
    constructor() {
      this.events = {}; this.children = []; this.attrs = {}; this.dataset = {}; this.hidden = false;
      this.style = { setProperty(k, v) { this[k] = v; } };
      this.classList = { toggle() {} };
    }
    addEventListener(type, fn) { (this.events[type] ??= []).push(fn); }
    dispatchEvent(e) { e.preventDefault ??= () => {}; for (const fn of this.events[e.type] ?? []) fn(e); }
    fire(type, values = {}) { this.dispatchEvent({ type, ...values }); }
    click() { this.fire('click'); }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren() { this.children = []; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    removeAttribute(k) { delete this.attrs[k]; }
    focus() { focused = this; }
    setPointerCapture() {}
    getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 500 }; }
    querySelectorAll(selector) { return selector === 'button' ? this.children.filter(n => n.type === 'button') : []; }
    scrollIntoView() {}
  }
  const root = new Element(), nodes = new Map();
  for (const selector of ['canvas', 'input[type=search]', '.map-results', '.map-detail', '.map-stage', '.map-data', '.map-pin-status', '.map-nearest-status', '.map-nearest-results', '.map-service-note', '.map-scale', '[data-pin-drop]', '[data-pin-centre]', '[data-pin-remove]', '[data-nearest]', '[data-nearest-carriage]', '[data-clear]']) nodes.set(selector, new Element());
  const services = [['carriage', 'Carriage'], ['bank', 'Bank'], ['fighters', 'Fighters Guild']];
  const chips = services.map(([service]) => Object.assign(new Element(), { dataset: { service } }));
  const data = {
    services, mapSquareKm: .8192, regions: [['Test region', '', [500,250]]], markers: [],
    zone: { rings: [], nearPath: '', path: '', anchor: [0,0] }, jungle: { path: '', anchor: [0,0] },
    locations: Array.from({ length: 12 }, (_, i) => ['Town ' + i, 0, 500 + i, 250, 'city', null, null, false, 0, false, i === 0 ? 2 : 7, i])
  };
  nodes.get('.map-data').textContent = JSON.stringify(data);
  root.querySelector = selector => nodes.get(selector);
  root.querySelectorAll = selector => selector === '[data-service]' ? chips : [];
  root.dataset.assets = '../../map-data/';
  const strokes = [], ctx = new Proxy({ stroke() { strokes.push(this.globalAlpha); } }, { get: (target, key) => key in target ? target[key] : () => {} });
  nodes.get('canvas').getContext = () => ctx;
  const frames = [];
  let value = stored;
  const storage = { getItem: () => { if (blocked) throw Error('Denied'); return value; }, setItem: (k,v) => { if (blocked) throw Error('Denied'); assert.equal(k, PIN_STORAGE_KEY); value = v; }, removeItem: () => { if (blocked) throw Error('Denied'); value = null; } };
  const code = (await readFile(new URL('../../theme/map/bay-map.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gm, '');
  const sandbox = {
    document: { querySelector: () => root, createElement: () => new Element(), getElementById: () => null, documentElement: new Element(), baseURI: 'https://example.test/reference/bay-map/' },
    window: new Element(), Path2D: class {}, URL, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} }, MutationObserver: class { observe() {} },
    matchMedia: () => new Element(), devicePixelRatio: 1, requestAnimationFrame: fn => frames.push(fn),
    getComputedStyle: () => ({ getPropertyValue: () => '#123456' }),
    fetch: async () => ({ ok: true, json: async () => ({ layers: {} }) }), createPathLayers: () => ({}), strokePathLayers() {},
    placeHasService, findNearest, loadPin: () => loadPin(() => storage), savePin: pin => savePin(pin, () => storage), console
  };
  vm.runInNewContext(code, sandbox);
  resize();
  const flush = () => { while (frames.length) frames.shift()(); };
  flush();
  const stage = nodes.get('.map-stage'), pin = stage.children[0];
  return { root, nodes, chips, pin, strokes, flush, storage: () => value, focused: () => focused, ctx };
}

test('runtime places, nudges, drags, restores and removes the pin through its public controls', async () => {
  const r = await runtime(), get = s => r.nodes.get(s), canvas = get('canvas');
  assert.equal(r.pin.hidden, true);
  get('[data-pin-drop]').click();
  canvas.fire('pointerdown', { pointerId: 1, button: 0, clientX: 500, clientY: 250 });
  canvas.fire('pointerup', { pointerId: 1, clientX: 500, clientY: 250 });
  assert.deepEqual(JSON.parse(r.storage()), { x: 500, y: 250 });
  r.flush();
  assert.equal(r.pin.hidden, false);
  r.pin.fire('keydown', { key: 'ArrowRight' });
  r.pin.fire('keydown', { key: 'ArrowUp', shiftKey: true });
  assert.deepEqual(JSON.parse(r.storage()), { x: 501, y: 240 });
  r.flush();
  r.pin.fire('pointerdown', { pointerId: 2, button: 0, clientX: 500, clientY: 230 });
  r.pin.fire('pointermove', { pointerId: 2, clientX: 530, clientY: 250 });
  r.pin.fire('pointerup', { pointerId: 2 });
  assert.deepEqual(JSON.parse(r.storage()), { x: 531, y: 260 });
  const restored = await runtime({ stored: r.storage() });
  assert.equal(restored.pin.hidden, false);
  const search = get('input[type=search]');
  search.value = 'Town 4';
  search.fire('input');
  get('.map-results').children[0].click();
  get('.map-detail').children.find(n => n.textContent === 'Set pin here').click();
  assert.deepEqual(JSON.parse(r.storage()), { x: 504.5, y: 250.5 }, 'Set pin here snaps to the place centre');
  get('[data-pin-remove]').click();
  r.flush();
  assert.equal(r.storage(), null);
  assert.equal(r.pin.hidden, true);
  assert.equal(get('[data-pin-remove]').disabled, true);
});

test('runtime handles blocked storage, cancellation and centre placement', async () => {
  const r = await runtime({ blocked: true }), get = s => r.nodes.get(s);
  get('[data-pin-drop]').click();
  r.root.fire('keydown', { key: 'Escape' });
  assert.equal(get('[data-pin-drop]').attrs['aria-pressed'], 'false');
  get('[data-pin-centre]').click();
  assert.equal(r.focused(), r.pin);
  assert.match(get('.map-pin-status').textContent, /storage is unavailable/);
  get('[data-pin-remove]').click();
  assert.equal(get('[data-pin-remove]').disabled, true);
});
