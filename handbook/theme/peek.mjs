import { shouldPeek, initChecklists } from './reading.mjs';
// The side reader never navigates or scrolls the original document.
export function initPeek({
  root, storage, dismissPreview
}) {
  const panel = document.getElementById('peek-panel');
  const state = {
    root,
    storage,
    dismissPreview,
    panel,
    body: panel.querySelector('.peek-body'),
    crumbs: panel.querySelector('.peek-breadcrumbs'),
    back: panel.querySelector('[data-peek-back]'),
    promote: panel.querySelector('[data-peek-page]'),
    stack: [],
    sequence: 0,
    returnFocus: null
  };
  bindPeek(state);
  return {
    open: (url, source, title) => open(state, url, source, title), close: () => close(state)
  };
}
// Apply interception only after modifier, preference and target checks pass.
function bindPeek(state) {
  state.panel.querySelector('[data-peek-close]').addEventListener('click', () => close(state));
  state.back.addEventListener('click', () => {
    state.stack.pop();
    paint(state);
  });
  document.addEventListener('keydown', event => keyboard(state, event));
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!shouldPeek(event, link, location, state.root, !!link?.closest('.peek-body'))) return;
    event.preventDefault();
    open(state, new URL(link.href), link);
  });
}
// Invalidate pending requests and return focus without scrolling the page.
function close(state) {
  const pagePosition = [scrollX, scrollY];
  state.sequence++;
  state.panel.hidden = true;
  document.body.classList.remove('has-peek');
  state.stack.length = 0;
  state.dismissPreview();
  state.returnFocus?.focus({
    preventScroll: true
  });
  scrollTo(...pagePosition);
}
// Only the latest request may paint a fetched reference.
async function paint(state) {
  const item = state.stack.at(- 1);
  if (!item) return close(state);
  const request =++ state.sequence;
  showLoading(state, item);
  try {
    item.main ||= await fetchMain(item.url);
    if (request !== state.sequence) return;
    state.body.replaceChildren(item.main.cloneNode(true));
    prepareClone(state.body, item.url, request);
    initChecklists(state.body, state.storage);
    renderCrumbs(state);
    position(state, item);
  } catch {
    if (request !== state.sequence) return;
    state.body.innerHTML = '<div class="peek-state"><h2>This reference could not be loaded.</h2><p>Your page is still here. Try again, or use “Open as page”.</p><button type="button" data-peek-retry>Try again</button></div>';
    state.body.querySelector('button').addEventListener('click', () => paint(state));
  } finally {
    if (request === state.sequence) state.body.removeAttribute('aria-busy');
  }
}
// Reflow beside the page without changing the main document's scroll offset.
function showLoading(state, item) {
  const pagePosition = [scrollX, scrollY];
  state.dismissPreview();
  state.panel.hidden = false;
  document.body.classList.add('has-peek');
  state.promote.href = item.url.href;
  state.back.disabled = state.stack.length < 2;
  renderCrumbs(state);
  state.body.innerHTML = '<p class="peek-state" role="status">Opening reference…</p>';
  state.body.setAttribute('aria-busy', 'true');
  state.body.focus({
    preventScroll: true
  });
  scrollTo(...pagePosition);
}
// Breadcrumbs truncate the same history that Back uses.
function renderCrumbs(state) {
  state.crumbs.replaceChildren();
  state.stack.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.main?.querySelector('h1')?.textContent || item.title;
    if (index === state.stack.length - 1) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
      state.stack.at(- 1).scroll = state.body.scrollTop;
      state.stack.length = index + 1;
      paint(state);
    });
    state.crumbs.append(button);
  });
}
// Scroll the panel itself, never the original document.
function position(state, item) {
  state.body.scrollTop = item.scroll || 0;
  if (item.scroll != null || !item.url.hash) return;
  let id;
  try {
    id = decodeURIComponent(item.url.hash.slice(1));
  } catch {
    return;
  }
  const target = [...state.body.querySelectorAll('[data-original-id]')].find(node => node.dataset.originalId === id);
  if (!target) return;
  if (target.tagName === 'DETAILS') target.open = true;
  state.body.scrollTop += target.getBoundingClientRect().top - state.body.getBoundingClientRect().top - 20;
}
// Push a new reference while retaining the previous panel position.
function open(state, url, source, title) {
  if (!state.stack.length) state.returnFocus = source.returnFocus || (source.closest('.search-results') ? document.getElementById('search') : source);
  else state.stack.at(- 1).scroll = state.body.scrollTop;
  state.stack.push({
    url, title: (title || source.textContent).replace(/\s*[•·]\s*$/,'').trim() || 'Reference'
  });
  paint(state);
}
// Escape closes; the mobile sheet contains keyboard focus.
function keyboard(state, event) {
  if (state.panel.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close(state);
  }
  if (event.key !== 'Tab' || !matchMedia('(max-width:800px)').matches) return;
  const nodes = [...state.panel.querySelectorAll('a[href],button:not(:disabled),input,[tabindex="0"]')].filter(node => node.getClientRects().length);
  const first = nodes[0], last = nodes.at(- 1);
  if (!state.panel.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last: first)?.focus();
    return;
  }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === state.body)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
// Fetch only built HTML from the same site, then discard page chrome and active content.
async function fetchMain(url) {
  const response = await fetch(url, {
    credentials: 'same-origin'
  });
  if (!response.ok) throw Error('Reference unavailable');
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
  const main = doc.querySelector('main');
  if (!main) throw Error('Missing main column');
  main.querySelectorAll('script,style,iframe,object,embed,.page-pager,.breadcrumbs').forEach(node => node.remove());
  const content = document.createElement('div');
  content.className = 'peek-content';
  content.append(...main.childNodes);
  return content;
}
// Make URLs absolute before rehoming; namespace IDs and their accessibility references.
function prepareClone(scope, url, sequence) {
  const ids = new Map();
  scope.querySelectorAll('[id]').forEach(node => {
    const original = node.id;
    node.dataset.originalId = original;
    node.id = `peek-${sequence}-${original}`;
    ids.set(original, node.id);
  });
  scope.querySelectorAll('[href],[src]').forEach(node => {
    for (const attr of['href', 'src']) if (node.hasAttribute(attr)) node.setAttribute(attr, new URL(node.getAttribute(attr), url).href);
  });
  scope.querySelectorAll('[for],[aria-labelledby],[aria-describedby],[aria-controls]').forEach(node => {
    for (const attr of['for', 'aria-labelledby', 'aria-describedby', 'aria-controls']) {
      if (node.hasAttribute(attr)) node.setAttribute(attr, node.getAttribute(attr).split(/\s+/).map(id => ids.get(id) || id).join(' '));
    }
  });
  // Maps have a dedicated page lifecycle; never duplicate their canvas runtime in a reference.
  const map = scope.querySelector('.world-map');
  if (map) {
    map.querySelectorAll('button,input,select').forEach(control => { control.disabled = true; });
    const note = document.createElement('p');
    note.textContent = 'Use “Open as page” to explore the interactive map.';
    map.prepend(note);
  }
}
