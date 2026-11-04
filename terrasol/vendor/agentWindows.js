// @ts-check
// AGENT4 - THE AGENT'S HANDS IN A WINDOW (a fork's patch; the workspace's docs/09). Nearly everything a player does
// past walking happens in a window: the pack, a shop, talk, a guild's services, the quest log, character creation.
// On the enhanced skin those windows are the page's own controls - buttons, tabs, fields - which is why the pad's
// cursor can press them (ui/plusPad.js interactiveAt: "UNDER PLUS THE CURSOR CLICKS THE PAGE"). This lists the ones
// a player could see and press right now, each by the words on it, and presses one the way a mouse would.
//
// WHAT A PLAYER COULD PRESS, AND NOTHING ELSE: visible, not disabled, not covered by something drawn over it (the
// page's own hit test at its middle), and not part of the always-on HUD (the hotbar, the compass, the tooltip plaque).
// A press is the mouse's own sequence of events on the control; a typed answer goes into a field as keystrokes would
// leave it. No window's internals are called.

import { t } from '../systems/textManager.js';

const CONTROLS = 'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="option"], '
  + '[role="menuitem"], [role="checkbox"], [role="switch"], [role="radio"]';
/** Always on screen and never a window's: the HUD, the hotbar, the World Tooltips plaque, the crash overlay. */
const NOT_A_WINDOW = '.hud, .hb, .wplaque, #crash';

const squeeze = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** The words a player reads on a control. */
export function labelOf(el) {
  // The pack's grid hides .itemname. Inspect just this visible tile's native hover, never the hidden name node.
  if (el.matches?.('.itemrow')) {
    const tile = tileWords(el);
    return tile ? tile.count > 1 ? `${tile.name} ×${tile.count}` : tile.name : '';
  }
  const img = el.querySelector?.('img[alt]');
  const drawn = el.ownerDocument?.createRange ? renderedWords(el, el.ownerDocument) : el.innerText || el.textContent;
  const text = el.getAttribute?.('aria-label') || drawn
    || (el.tagName === 'SELECT' ? el.selectedOptions?.[0]?.text : '')
    || (el.tagName === 'INPUT' && /^(button|submit)$/i.test(el.type ?? '') ? el.value : '')
    || el.getAttribute?.('title') || el.getAttribute?.('placeholder') || img?.getAttribute?.('alt') || '';
  return squeeze(text);
}

function tileWords(el) {
  if (!el.matches?.('.itemrow')) return null;
  const tile = el.querySelector?.('.tile'), d = el.ownerDocument;
  if (!tile || !visibleBox(tile, tile.getBoundingClientRect?.(), d, true)) return null;
  const name = squeeze(tile.getAttribute?.('title') ?? tile.title).replace(/\s+—\s+TEXTURE\.\d+\s+record\s+\d+/, '');
  const count = el.querySelector?.('.count');
  const words = count && visibleBox(count, count.getBoundingClientRect?.(), d, true) ? renderedWords(count, d) : '';
  return name ? { name, count: /^\d+$/.test(words) && Number(words) > 0 ? Number(words) : 1 } : null;
}

// AGENT10: read the rendered Enhanced panel, never its model, quest data or hidden DOM prose. Text ranges are
// clipped against the viewport and every scrolling ancestor, then checked against the page's own paint hit test.
// A word cut at the edge is omitted until scrolled into view. Classic canvas windows keep their existing reader.
// Inventory's pack and loot are two panes in one .pack-shell; neither uses .px-win. Status/ordinary boxes use the
// Enhanced notice painter. Toasts are HUD news, not the window being read.
const PANELS = '.px-win, .pack-shell, .notice:not(.notice-toast), #enhanced-travelmap';
const OVERWORLD = '#travel-view';
const paintedWords = new WeakMap();
/** A painter supplies only the strings and CSS rectangles it actually painted, with no model or mark ids. */
export function setPaintedWords(canvas, words) { if (canvas) paintedWords.set(canvas, words); }
export function overworldPanel(d = globalThis.document) {
  const el = d?.querySelector?.(OVERWORLD) ?? d?.querySelectorAll?.(OVERWORLD)?.[0];
  return el?.matches?.(OVERWORLD) && shown(el) && el.getBoundingClientRect?.().width > 0 ? el : null;
}
const styleOf = (el) => el?.ownerDocument?.defaultView?.getComputedStyle?.(el) ?? globalThis.getComputedStyle?.(el) ?? {};
function layerOf(el) {
  let z = 0;
  for (let p = el; p; p = p.parentElement) z = Math.max(z, Number(styleOf(p).zIndex) || 0);
  return z;
}

function shown(el) {
  for (let p = el; p; p = p.parentElement) {
    const s = styleOf(p);
    if (p.hidden || s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse' || Number(s.opacity) === 0) return false;
  }
  return true;
}

function visibleBox(el, box, d, whole = false) {
  if (!box || !(box.width > 0 && box.height > 0) || !shown(el)) return null;
  const v = d.defaultView;
  let left = Math.max(0, box.left), top = Math.max(0, box.top);
  let right = Math.min(v?.innerWidth ?? Infinity, box.right ?? box.left + box.width);
  let bottom = Math.min(v?.innerHeight ?? Infinity, box.bottom ?? box.top + box.height);
  for (let p = el.parentElement; p; p = p.parentElement) {
    const s = styleOf(p), r = p.getBoundingClientRect?.();
    if (!r) continue;
    const x = /(auto|scroll|hidden|clip)/.test(s.overflowX || s.overflow || '');
    const y = /(auto|scroll|hidden|clip)/.test(s.overflowY || s.overflow || '');
    const x0 = r.left + (p.clientLeft ?? 0), y0 = r.top + (p.clientTop ?? 0);
    if (x) { left = Math.max(left, x0); right = Math.min(right, x0 + (p.clientWidth ?? r.width)); }
    if (y) { top = Math.max(top, y0); bottom = Math.min(bottom, y0 + (p.clientHeight ?? r.height)); }
  }
  if (!(right > left && bottom > top)) return null;
  if (whole && (left > box.left + 0.5 || top > box.top + 0.5 || right < box.left + box.width - 0.5 || bottom < box.top + box.height - 0.5)) return null;
  const insetX = Math.min(1, (right - left) / 4), insetY = Math.min(1, (bottom - top) / 4);
  const samples = [[(left + right) / 2, (top + bottom) / 2]];
  if (whole) samples.push([left + insetX, top + insetY], [right - insetX, top + insetY],
    [left + insetX, bottom - insetY], [right - insetX, bottom - insetY]);
  for (const [x, y] of samples) {
    const hit = d.elementFromPoint?.(x, y);
    if (d.elementFromPoint && (!hit || (hit !== el && !el.contains?.(hit)))) {
      // The notice painter is intentionally pointer-transparent. Its visible ink still sits above the game's
      // canvas; accept only that higher painted layer, never an underlying word behind another panel.
      if (styleOf(el).pointerEvents !== 'none' || !hit || layerOf(el) <= layerOf(hit)) return null;
    }
  }
  return { left, top, right, bottom };
}

/** Last painted Enhanced panel with a visible face; null means the Classic reader may be used. */
export function activePanel(d = globalThis.document) {
  const panels = Array.from(d?.querySelectorAll?.(PANELS) ?? []).sort((a, b) => layerOf(a) - layerOf(b));
  for (const panel of panels.reverse()) {
    if (!panel.matches?.(PANELS)) continue;
    if (visibleBox(panel, panel.getBoundingClientRect?.(), d)) return panel;
    // A pack/loot shell has transparent space between its panes: its middle need not itself be painted.
    if (panel.matches('.pack-shell') && Array.from(panel.querySelectorAll('button, input, h2, p')).some((el) => visibleBox(el, el.getBoundingClientRect?.(), d))) return panel;
  }
  return overworldPanel(d);
}

/** Visible words in DOM reading order, grouped by rendered line; null if no Enhanced panel is up. */
export function renderedWindowText(d = globalThis.document) {
  return renderedWindowObservation(d)?.text ?? null;
}

/** Evidence sidecar: spans are half-open UTF-16 offsets in text, never DOM/engine identifiers. */
export function renderedWindowObservation(d = globalThis.document) {
  const root = activePanel(d);
  if (!root) return null;
  const content = renderedContent(root, d);
  const words = content.words;
  let text = content.text;
  if (root.matches?.(OVERWORLD)) {
    // Travel Options is a sibling while undocked. Read only its painted DOM, with the same clipping checks.
    const travel = d.querySelector?.('#enhanced-travel') ?? d.querySelectorAll?.('#enhanced-travel')?.[0];
    const extra = travel && !root.contains(travel) ? renderedWords(travel, d) : '';
    const labels = [];
    for (const canvas of root.querySelectorAll('canvas')) {
      const ink = paintedWords.get(canvas) ?? [];
      for (let i = 0; i < ink.length; i++) {
        const w = ink[i], a = w.box;
        const covered = ink.slice(i + 1).some(({ box: b }) => a.left < b.left + b.width && b.left < a.left + a.width
          && a.top < b.top + b.height && b.top < a.top + a.height);
        if (!covered && visibleBox(canvas, w.box, d, true)) labels.push(w.text);
      }
    }
    text = [text, extra, ...labels].filter(Boolean).join('\n');
  }
  const heading = Array.from(root.querySelectorAll('h1, h2, h3, h4, .tut-title, .tview-title, [role="heading"]'))
    .find((el) => words.some((w) => el.contains(w.el)));
  const headingWords = heading ? words.filter((w) => heading.contains(w.el)) : [];
  const start = headingWords[0]?.start, end = headingWords.at(-1)?.end;
  const title = start != null ? text.slice(start, end) : null;
  const body = start != null ? (text.slice(0, start) + text.slice(end)).replace(/^\n|\n$/g, '').replace(/\n\n/g, '\n') : text;
  const groups = new Map();
  for (const word of words) {
    const row = word.el.closest?.('li, [role="option"], [role="row"], .notice-row, .talk-row, .talk-entry, button, dt, dd');
    if (!row || !root.contains(row) || (heading && heading.contains(word.el))) continue;
    const span = groups.get(row);
    if (span) span[1] = word.end; else groups.set(row, [word.start, word.end]);
  }
  return { title, body, text, rows: [...groups.values()].map((span) => ({ text: text.slice(span[0], span[1]), span })) };
}

function renderedWords(root, d) {
  return renderedContent(root, d).text;
}

function renderedContent(root, d) {
  const lines = [];
  const words = [];
  let length = 0;
  let lastY = null, lastBlock = null;
  function walk(node) {
    if (node.nodeType === 3) {
      const el = node.parentElement;
      if (!el || !shown(el) || !d.createRange || el.closest?.('script, style, noscript, option')) return;
      const matches = String(node.nodeValue ?? '').matchAll(/\S+/g);
      for (const match of matches) {
        const range = d.createRange();
        range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
        const rects = Array.from(range.getClientRects());
        if (!rects.length || !rects.every((r) => visibleBox(el, r, d, true))) continue;
        const y = Math.round(rects[0].top), block = el.closest?.('p, h1, h2, h3, h4, li, button, label, dt, dd');
        if (lines.length) length++; // one newline or space between adjacent rendered words
        if (!lines.length || y !== lastY || block !== lastBlock) lines.push(match[0]);
        else lines[lines.length - 1] += ` ${match[0]}`;
        words.push({ el, start: length, end: length + match[0].length });
        length += match[0].length;
        lastY = y; lastBlock = block;
      }
      return;
    }
    if (node.nodeType === 1 && (!shown(node) || /^(SCRIPT|STYLE|NOSCRIPT|OPTION)$/.test(node.tagName))) return;
    for (const child of node.childNodes ?? []) walk(child);
  }
  walk(root);
  return { text: lines.join('\n'), words };
}

function headingOf(el, d) {
  const group = el.closest?.('section, fieldset, .packside, .talk-topics, .hmpair, .packlists > *, [role="group"]');
  const heading = group?.querySelector?.('legend, h1, h2, h3, h4, .hmpair-k, [role="heading"]');
  return heading && visibleBox(heading, heading.getBoundingClientRect?.(), d, true) ? labelOf(heading) : '';
}

/** Structural address plus visible meaning: a replacement node at the same place with the same words is safe;
 *  a different row, heading or panel is not. No hidden DOM identifiers or item ids are returned. */
function controlKey(c, d) {
  const path = [];
  for (let el = c.el; el && el !== d.body; el = el.parentElement) {
    path.push(`${el.tagName}:${el.parentElement ? Array.from(el.parentElement.children ?? []).indexOf(el) : 0}`);
  }
  const root = c.el.closest?.(PANELS);
  const title = root?.querySelector?.('h1, h2, h3');
  const words = title && visibleBox(title, title.getBoundingClientRect?.(), d, true) ? labelOf(title) : '';
  return JSON.stringify([path, words, c.label, c.kind, headingOf(c.el, d)]);
}

/** What kind of control it is, in a player's words. */
export function kindOf(el) {
  const tag = String(el.tagName ?? '').toLowerCase();
  const role = el.getAttribute?.('role');
  if (tag === 'textarea' || (tag === 'input' && !/^(button|submit|checkbox|radio|range)$/i.test(el.type ?? 'text'))) return 'field';
  if (tag === 'select') return 'list';
  if (role === 'tab') return 'tab';
  if (role === 'checkbox' || role === 'switch' || el.type === 'checkbox') return 'checkbox';
  if (role === 'option' || role === 'radio' || el.type === 'radio') return 'option';
  return 'button';
}

/** Every control a player could see and press now, in page order: [{ el, label, kind }]. */
export function listControls(d = globalThis.document) {
  if (!d?.querySelectorAll) return [];
  const out = [];
  const panel = activePanel(d);
  for (const el of /** @type {NodeListOf<HTMLElement & { disabled?: boolean }>} */ (d.querySelectorAll(CONTROLS))) {
    if (el.disabled || el.getAttribute?.('aria-disabled') === 'true' || el.closest?.(NOT_A_WINDOW)) continue;
    if (panel && !panel.contains(el) && !(panel.matches?.(OVERWORLD) && el.closest?.('#enhanced-travel'))) continue;
    const r = el.getBoundingClientRect?.();
    if (!r || !(r.width > 0) || !(r.height > 0)) continue;
    if (!visibleBox(el, r, d, true)) continue;
    const kind = kindOf(el);
    const label = labelOf(el);
    if (!label && kind !== 'field') continue;
    out.push({ el, label: label || '(empty field)', kind });
  }
  return out;
}

/** Only words on the visible HUD face. Tooltips, needs, clocks and survival calculations are not read. */
export function visibleHud(d = globalThis.document) {
  const conditions = [];
  for (const el of d?.querySelectorAll?.('.hst-cell') ?? []) {
    const text = renderedWords(el, d);
    if (text) conditions.push(text);
  }
  const temperatures = Array.from(d?.querySelectorAll?.('.hud-temp') ?? []).map((el) => renderedWords(el, d)).filter(Boolean);
  return { conditions, temperature: temperatures.join(' / ') || null };
}

/** The plaque's DOM is pointer-transparent. Read its visible ink, including the title's intentional line breaks. */
export function visiblePlaque(d = globalThis.document) {
  const el = d?.querySelector?.('.wplaque') ?? d?.querySelectorAll?.('.wplaque')?.[0];
  return el && el.matches?.('.on') ? renderedWords(el, d).replace(/\n/g, ' / ') || null : null;
}

/**
 * The control a request names: by its number in the latest list AND its words (both must agree, so a window that
 * changed in between is never pressed by mistake), or by its words alone - exact first, then the one label that
 * contains them. Words that name two controls exactly name neither: which one is meant is the chooser's to say, by
 * number (Sol's R9). Answers { control } or { why }.
 */
export function findControl(list, { id = null, label = '' } = {}) {
  const want = squeeze(label).toLowerCase();
  if (id != null) {
    const c = list[id];
    // the words on it NOW, not as they were when the list was read: that is the whole point of naming both
    const now = c?.el ? labelOf(c.el).toLowerCase() : c?.label.toLowerCase();
    if (c && (!want || now === want)) return { control: c };
    return { why: `control ${id} is no longer "${label}": the window changed; read it again` };
  }
  if (!want) return { why: 'name a control by its words' };
  const exact = list.filter((c) => c.label.toLowerCase() === want);
  if (exact.length === 1) return { control: exact[0] };
  if (exact.length > 1) return { why: `"${label}" names ${exact.length} controls: choose one by its number (${exact.map((c) => `#${list.indexOf(c)}`).join(', ')})` };
  const part = list.filter((c) => c.label.toLowerCase().includes(want));
  if (part.length === 1) return { control: part[0] };
  return { why: part.length ? `"${label}" matches ${part.length} controls: ${part.slice(0, 5).map((c) => `"${c.label}"`).join(', ')}` : `no control reads "${label}"` };
}

/** Press a control as a mouse does: down, up, click - whichever of them the window listens for, it hears once. */
export function press(el) {
  const r = el.getBoundingClientRect?.() ?? { left: 0, top: 0, width: 0, height: 0 };
  const at = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
  // a pointer event's own fields; where PointerEvent is missing, a MouseEvent carries them harmlessly
  const P = /** @type {typeof PointerEvent} */ (globalThis.PointerEvent ?? globalThis.MouseEvent);
  const M = globalThis.MouseEvent;
  if (P) el.dispatchEvent?.(new P('pointerdown', { ...at, pointerId: 1, isPrimary: true, buttons: 1 }));
  if (M) el.dispatchEvent?.(new M('mousedown', { ...at, buttons: 1 }));
  if (P) el.dispatchEvent?.(new P('pointerup', { ...at, pointerId: 1, isPrimary: true, buttons: 0 }));
  if (M) el.dispatchEvent?.(new M('mouseup', { ...at, buttons: 0 }));
  el.click?.();
}

/** Type into a field: focus it, set its words, and tell the window as typing would (input, then change). */
export function typeInto(el, text) {
  el.focus?.();
  el.value = String(text ?? '');
  const E = globalThis.Event;
  if (E) { el.dispatchEvent?.(new E('input', { bubbles: true })); el.dispatchEvent?.(new E('change', { bubbles: true })); }
}

/** The driver the bridge stands: the list as data (no elements leave the page), a choice, a typed answer. */
export function createWindowDriver(docOf = () => globalThis.document) {
  let last = [];
  const addresses = new Map();
  let nextAddress = 0;
  function address(c, d) {
    const key = controlKey(c, d);
    if (!addresses.has(key)) addresses.set(key, `control-${++nextAddress}`);
    return addresses.get(key);
  }
  function scrollList(d) {
    const root = activePanel(d);
    if (!root) return [];
    return [root, ...root.querySelectorAll('*')].filter((el) => {
      const s = styleOf(el);
      return /(auto|scroll)/.test(s.overflowY || s.overflow || '') && el.scrollHeight > el.clientHeight
        && visibleBox(el, el.getBoundingClientRect?.(), d);
    });
  }
  function scrollAddress(el, d) { return address({ el, label: '', kind: 'scroll' }, d).replace('control-', 'panel-'); }
  function read() {
    const d = docOf();
    return listControls(d).map((c) => ({ ...c, address: address(c, d) }));
  }
  function resolve(spec) {
    const requested = spec.address ?? (typeof spec.id === 'string' ? spec.id : null);
    if (requested) {
      const c = read().find((c) => c.address === requested);
      if (!c || (spec.label && squeeze(spec.label).toLowerCase() !== c.label.toLowerCase())) return { why: t('agent.window.changed', 'The window changed; read it again.') };
      return { control: c };
    }
    const result = findControl(spec.id != null ? last : read(), spec);
    if (spec.id != null && result.control && !read().some((c) => c.el === result.control.el)) {
      return { why: `control ${spec.id} can no longer be pressed: read the window again` };
    }
    return result;
  }
  return {
    windowText() { return renderedWindowText(docOf()); },
    // A sidecar read must not replace the numeric choice snapshot kept in `last`.
    observationState() {
      return listControls(docOf()).map(({ el, label, kind }) => ({ label, kind,
        value: kind === 'field' ? el.type === 'password' ? '•'.repeat(String(el.value ?? '').length) : String(el.value ?? '')
          : kind === 'list' ? String(el.selectedOptions?.[0]?.label ?? el.selectedOptions?.[0]?.text ?? '') : null,
        checked: el.getAttribute?.('aria-checked') ?? el.checked ?? null,
        selected: el.getAttribute?.('aria-selected') ?? el.getAttribute?.('aria-pressed')
          ?? (el.matches?.('.on, .selected, .active') ? true : null) }));
    },
    controls() {
      const d = docOf();
      last = read();
      const panels = scrollList(d);
      return last.map((c, id) => {
        const el = c.el, checked = el.getAttribute?.('aria-checked'), selected = el.getAttribute?.('aria-selected') ?? el.getAttribute?.('aria-pressed');
        const panel = panels.filter((p) => p.contains(el)).at(-1);
        return { id, address: c.address, label: c.label, kind: c.kind, heading: headingOf(el, d), ...tileWords(el),
          value: c.kind === 'list' ? String(el.selectedOptions?.[0]?.label ?? el.selectedOptions?.[0]?.text ?? '')
            : c.kind === 'field' ? el.type === 'password' ? '•'.repeat(String(el.value ?? '').length) : String(el.value ?? '') : null,
          checked: checked != null ? checked === 'true' : /^(checkbox|radio)$/i.test(el.type ?? '') ? !!el.checked : null,
          selected: selected != null ? selected === 'true' : el.matches?.('option') ? !!el.selected
            : el.matches?.('.on, .selected, .active') ? true : null,
          scroll: panel ? scrollAddress(panel, d) : null };
      });
    },
    choose(spec = {}) {
      const { control, why } = resolve(spec);
      if (!control) return { ok: false, why };
      // resolve rechecks visibility/enabled state as well as meaning for every kind of address (R9).
      if (control.kind === 'field') return { ok: false, why: `"${control.label}" is a field: type into it` };
      press(control.el);
      return { ok: true, pressed: control.label };
    },
    type(spec = {}, text = '') {
      const fields = listControls(docOf()).filter((c) => c.kind === 'field');
      const { control, why } = spec.address || spec.id != null ? resolve(spec) : spec.label ? findControl(fields, { label: spec.label }) : fields.length === 1 ? { control: fields[0] } : { why: fields.length ? `${fields.length} fields: name one` : 'no field to type into' };
      if (!control) return { ok: false, why };
      if (control.kind !== 'field') return { ok: false, why: t('agent.window.field', 'Choose a text field.') };
      typeInto(control.el, text);
      return { ok: true, field: control.label };
    },
    scrollPanels() {
      const d = docOf();
      return scrollList(d).map((el) => ({ panel: scrollAddress(el, d), heading: headingOf(el, d),
        top: el.scrollTop, height: el.clientHeight, total: el.scrollHeight }));
    },
    scroll({ id = null, panel = null, by = 0 } = {}) {
      if (!Number.isFinite(by) || by === 0) return { ok: false, why: t('agent.window.scrollAmount', 'Give a non-zero number of vertical pixels.') };
      const d = docOf(), panels = scrollList(d);
      let el;
      if (id != null) {
        const { control } = resolve({ id });
        el = control && panels.filter((p) => p.contains(control.el)).at(-1);
      } else el = panel ? panels.find((p) => scrollAddress(p, d) === panel) : panels.length === 1 ? panels[0] : null;
      if (!el) return { ok: false, why: t('agent.window.scrollTarget', 'Name a visible scroll panel or a control inside it.') };
      const before = el.scrollTop;
      const amount = Math.max(-el.clientHeight, Math.min(el.clientHeight, by));
      el.scrollTop = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, before + amount));
      // Setting scrollTop uses the browser's real scroll event, as a wheel does; no list/model methods are invoked.
      return { ok: true, panel: scrollAddress(el, d), before, after: el.scrollTop };
    },
  };
}
