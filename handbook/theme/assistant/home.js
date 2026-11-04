import { buildSearchIndex, findPassages } from './widget-search.js';

const float = document.querySelector('[data-archivist-float]');
const head = float?.querySelector('.archivist-head');
const chat = float?.querySelector('.archivist-chat');
const form = float?.querySelector('.archivist-chat-form');
const input = form?.querySelector('input');
const results = float?.querySelector('.archivist-chat-results');
const status = float?.querySelector('.archivist-chat-status');
const fullLink = float?.querySelector('.archivist-chat-foot a');
const reopen = document.querySelector('[data-archivist-reopen]');
const STORAGE = 'dfo-archivist-float-v2';
let drag = null;
let suppressClick = false;
let state = { x: null, y: null, closed: false };
let corpus = null;
let corpusPromise = null;
let querySeq = 0;
let abortModel = null;

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const rootHref = (url, anchor) => String(url ?? '') + (anchor ? `#${anchor}` : '');

function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { /* storage can be denied */ }
}

function setPortrait(next) {
  if (float) float.dataset.archivistState = next;
}

function clampPosition(x, y) {
  const margin = 70;
  return {
    x: Math.max(margin, Math.min(innerWidth - margin, x)),
    y: Math.max(margin, Math.min(innerHeight - margin, y))
  };
}

function place(x, y) {
  const p = clampPosition(x, y);
  state.x = p.x;
  state.y = p.y;
  float.style.left = `${p.x}px`;
  float.style.top = `${p.y}px`;
  positionChat();
}

function positionChat() {
  if (!float || !chat || !head) return;
  const r = head.getBoundingClientRect();
  const below = r.top < 340;
  chat.classList.toggle('is-below', below);
  chat.style.maxHeight = below
    ? `${Math.max(240, innerHeight - r.bottom - 24)}px`
    : `${Math.max(240, r.top - 80)}px`;
}

function initialPlace() {
  if (!float) return;
  if (Number.isFinite(state.x) && Number.isFinite(state.y)) { place(state.x, state.y); return; }
  const copy = document.querySelector('.hero-copy');
  const art = document.querySelector('.atlas-art');
  if (copy && art) {
    const c = copy.getBoundingClientRect(), a = art.getBoundingClientRect();
    place((c.right + a.left) / 2, c.top + c.height * .46);
  } else {
    place(innerWidth * .61, innerHeight * .46);
  }
}

function openChat(open) {
  if (!chat || !head) return;
  chat.hidden = !open;
  head.setAttribute('aria-expanded', String(open));
  float.classList.toggle('is-open', open);
  float.classList.remove('is-minimized');
  if (open) {
    setPortrait('reading');
    positionChat();
    setTimeout(() => input?.focus(), 30);
  } else {
    setPortrait('reading');
  }
}

function showOpen() {
  if (!float) return;
  float.classList.remove('is-closed');
  state.closed = false;
  save();
  if (reopen) reopen.hidden = true;
  openChat(true);
}

function closeWidget() {
  if (!float) return;
  openChat(false);
  float.classList.add('is-closed');
  state.closed = true;
  save();
  if (reopen) reopen.hidden = false;
}

function minimize() {
  openChat(false);
  float?.classList.add('is-minimized');
}

async function loadCorpus() {
  if (corpus) return corpus;
  if (!corpusPromise) {
    corpusPromise = fetch('/search-index.json')
      .then(response => response.ok ? response.json() : [])
      .then(docs => { corpus = buildSearchIndex(Array.isArray(docs) ? docs : []); return corpus; })
      .catch(error => { corpusPromise = null; throw error; });
  }
  return corpusPromise;
}

function contributeBlock(query) {
  const href = `/contribute/?q=${encodeURIComponent(query)}`;
  return `<div class="widget-contribute"><p>If the guide should cover this, you can help:</p><div class="widget-contribute-actions"><a href="${escapeHtml(href)}">Submit a Manuscript</a><button type="button" data-widget-request data-question="${escapeHtml(query)}">Request answer</button></div><p>Manuscripts are edited and moderated; requests go to the guide-expansion queue.</p></div>`;
}

function renderStatic(query, found) {
  if (!results) return;
  if (!found.ranked.length) {
    if (status) status.textContent = `No passage matched “${query}”. The guide may not cover this yet.`;
    results.innerHTML = `<div class="widget-empty"><h3>No match</h3><p>Try a game system, item, quest or place name. The guide does not answer live player, price or account questions.</p>${contributeBlock(query)}</div>`;
    return;
  }
  if (!found.strong) {
    if (status) status.textContent = 'No strong match in the guide. It may not cover this yet.';
    results.innerHTML = `<div class="widget-empty"><h3>No strong match</h3><p>Try a game system, item, quest or place name. The guide does not answer live player, price or account questions.</p>${contributeBlock(query)}</div>`;
    return;
  }
  if (status) status.textContent = `${found.ranked.length} of the closest passages in the guide.`;
  const cards = found.ranked.map(({ doc, section, excerpt }) => {
    const href = rootHref(doc.url, section?.slug);
    return `<article class="widget-card"><p class="widget-card-kicker">${escapeHtml(doc.stage ?? '')}</p><h3><a href="${escapeHtml(href)}">${escapeHtml(doc.title)}</a></h3>${section?.title ? `<p class="widget-card-section">${escapeHtml(section.title)}</p>` : ''}<p>${escapeHtml(excerpt)}</p><a class="widget-card-link" href="${escapeHtml(href)}">Read this page →</a></article>`;
  }).join('');
  results.innerHTML = `<div class="widget-results-head"><h3>Closest passages</h3><span>${found.ranked.length} sources</span></div>${cards}`;
}

function renderModelLoading() {
  if (!results) return;
  const box = document.createElement('div');
  box.className = 'widget-model';
  box.dataset.widgetModel = '';
  box.innerHTML = '<div class="widget-model-head"><span>The Archivist</span><span class="widget-model-dot" aria-hidden="true"></span></div><p class="widget-model-loading">Reading the guide…</p>';
  results.append(box);
}

function renderModel(data, query, seq) {
  if (!results || seq !== querySeq) return;
  const box = results.querySelector('[data-widget-model]');
  if (!box) return;
  if (data?.mode === 'model' && data.answer) {
    const paragraphs = String(data.answer).split(/\n{2,}/).map(part => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('');
    const citations = (data.citations ?? []).map(citation => {
      const href = rootHref(citation.url);
      return `<a href="${escapeHtml(href)}">${escapeHtml(citation.title ?? citation.url)}</a>`;
    }).join('');
    box.innerHTML = `<div class="widget-model-head"><span>The Archivist</span><span class="widget-model-status">checked</span></div>${paragraphs}${citations ? `<p class="widget-model-cites">Sources: ${citations}</p>` : ''}`;
    setPortrait('speaking');
  } else if (data?.mode === 'no-coverage') {
    box.innerHTML = '<div class="widget-model-head"><span>The Archivist</span></div><p>The guide does not cover that question.</p><p class="widget-model-note">The quoted passages above are the closest records.</p>';
    setPortrait('reading');
  } else {
    box.innerHTML = '<div class="widget-model-head"><span>The Archivist</span></div><p class="widget-model-note">The written answer is unavailable, so the quoted passages above are the answer.</p>';
    setPortrait('reading');
  }
  if (fullLink) fullLink.href = `/ask/?q=${encodeURIComponent(query)}`;
}

async function askModel(query, seq) {
  renderModelLoading();
  if (abortModel) abortModel.abort();
  abortModel = new AbortController();
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: query }),
      signal: abortModel.signal
    });
    if (response.redirected || response.url.includes('cloudflareaccess')) throw Error('access');
    const data = await response.json().catch(() => null);
    renderModel(data, query, seq);
  } catch (error) {
    if (error.name === 'AbortError') return;
    renderModel({ fallback: 'unavailable' }, query, seq);
  }
}

async function runQuery(query) {
  const seq = ++querySeq;
  chat?.classList.add('is-large');
  setPortrait('reading');
  if (status) status.textContent = 'Searching the guide…';
  if (results) {
    results.hidden = false;
    results.innerHTML = '<p class="widget-searching">Searching the handbook…</p>';
  }
  if (fullLink) fullLink.href = `/ask/?q=${encodeURIComponent(query)}`;
  positionChat();
  try {
    const index = await loadCorpus();
    if (seq !== querySeq) return;
    const found = findPassages(index, query, 3);
    renderStatic(query, found);
    askModel(query, seq);
  } catch {
    if (seq !== querySeq) return;
    if (status) status.textContent = 'The guide index could not be loaded. Try again.';
    if (results) results.innerHTML = '';
  }
}

head?.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: state.x ?? float.getBoundingClientRect().left, top: state.y ?? float.getBoundingClientRect().top, moved: 0 };
  head.setPointerCapture?.(event.pointerId);
  head.classList.add('is-dragging');
});
head?.addEventListener('pointermove', event => {
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
  if (drag.moved > 4) {
    event.preventDefault();
    place(drag.left + dx, drag.top + dy);
  }
});
head?.addEventListener('pointerup', event => {
  if (!drag || drag.id !== event.pointerId) return;
  head.releasePointerCapture?.(event.pointerId);
  head.classList.remove('is-dragging');
  const moved = drag.moved;
  drag = null;
  if (moved > 4) {
    suppressClick = true;
    save();
    positionChat();
    setTimeout(() => { suppressClick = false; }, 0);
  } else {
    openChat(chat?.hidden ?? true);
  }
});
head?.addEventListener('click', event => {
  if (suppressClick) { event.preventDefault(); suppressClick = false; return; }
  if (event.detail === 0) openChat(chat?.hidden ?? true);
});

form?.addEventListener('submit', event => {
  event.preventDefault();
  const query = input?.value.trim();
  if (!query) { input?.focus(); return; }
  runQuery(query);
});

results?.addEventListener('click', async event => {
  const button = event.target.closest?.('[data-widget-request]');
  if (!button) return;
  const question = button.dataset.question;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Sending…';
  try {
    const response = await fetch('/api/request-answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, page: 'home-widget' })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw Error(data?.error ?? 'request failed');
    button.textContent = 'Request received';
  } catch {
    button.disabled = false;
    button.textContent = original;
    if (status) status.textContent = 'The request could not be sent; use the Discord link in the footer.';
  }
});

float?.querySelector('[data-minimize]')?.addEventListener('click', minimize);
float?.querySelector('[data-close]')?.addEventListener('click', closeWidget);
reopen?.addEventListener('click', showOpen);
document.addEventListener('pointerdown', event => {
  if (chat && !chat.hidden && !float.contains(event.target)) openChat(false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !chat || chat.hidden) return;
  openChat(false);
  head?.focus();
});
addEventListener('resize', () => {
  if (state.x !== null && state.y !== null) place(state.x, state.y);
  positionChat();
});

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE) ?? 'null');
  if (saved && typeof saved === 'object') {
    state.x = Number.isFinite(saved.x) ? saved.x : null;
    state.y = Number.isFinite(saved.y) ? saved.y : null;
    state.closed = Boolean(saved.closed);
  }
} catch { /* ignore malformed storage */ }
initialPlace();
if (state.closed) {
  float?.classList.add('is-closed');
  if (reopen) reopen.hidden = false;
  setPortrait('reading');
} else {
  setPortrait('reading');
}
