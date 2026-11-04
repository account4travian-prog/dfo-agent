import { initPeek } from './peek.mjs';
import { initChecklists, refreshChecklists } from './reading.mjs';
import { search as searchHandbook } from './search.mjs';
/* Progressive enhancement only: reading and every navigation link work without JS. */
const $ = s => document.querySelector(s), root = new URL(document.body.dataset.root, location.href);
const sessionStorageFallback = new Map();
const read = key => {
  try {
    return localStorage.getItem(key);
  } catch {
    return sessionStorageFallback.get(key) || null;
  }
};
const save = (key, value) => {
  sessionStorageFallback.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode still works for this visit. */
  }
};
const themeButton = $('.theme-toggle'), storedTheme = read('dfo-handbook-theme');
if (['light', 'dark'].includes(storedTheme)) document.documentElement.dataset.theme = storedTheme;
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches);
const labelTheme = () => {
  themeButton.setAttribute('aria-label', `Switch to ${isDark()?'light':'dark'} theme`);
  themeButton.querySelector('span').textContent = isDark() ? 'Light': 'Dark';
};
themeButton.hidden = false;
labelTheme();
themeButton.addEventListener('click', () => {
  const theme = isDark() ? 'light': 'dark';
  document.documentElement.dataset.theme = theme;
  save('dfo-handbook-theme', theme);
  labelTheme();
});
matchMedia('(prefers-color-scheme:dark)').addEventListener('change', labelTheme);
const navigation = $('.navigation'), narrow = matchMedia('(max-width:800px)');
const updateNav = () => {
  navigation.open = !narrow.matches;
};
updateNav();
narrow.addEventListener('change', updateNav);
navigation.addEventListener('click', event => {
  if (event.target.closest('summary') && !narrow.matches) event.preventDefault();
});
const stage = $('#reader-stage'), ids = [...stage.options].map(o => o.value).filter(id => id !== 'all');
const selected = read('dfo-handbook-stage');
if (ids.includes(selected)) stage.value = selected;
function applyStage() {
  const current = stage.value === 'all' ? Infinity: ids.indexOf(stage.value);
  document.querySelectorAll('[data-stage]').forEach(el => {
    if (el === document.body) return;
    const n = ids.indexOf(el.dataset.stage);
    el.classList.toggle('is-later', n >= 0 && n > current);
  });
  const page = ids.indexOf(document.body.dataset.stage);
  const note = $('.ahead-note');
  if (note) note.hidden = !(page >= 0 && page > current);
}
$('.stage-control').hidden = false;
applyStage();
stage.addEventListener('change', () => {
  save('dfo-handbook-stage', stage.value);
  applyStage();
});
let index = [], byUrl = new Map();
const search = $('#search'), results = $('#search-results'), status = $('#search-status');
const searchKey = url => new URL(url, root).pathname.replace(/index\.html$/, '');
const closeSearch = () => {
  results.hidden = true;
  search.setAttribute('aria-expanded', 'false');
  search.removeAttribute('aria-activedescendant');
};
let active = - 1, matches = [];
const selectResult = n => {
  const nodes = [...results.querySelectorAll('[role="option"]')];
  if (!nodes.length) return;
  active = (n + nodes.length) % nodes.length;
  nodes.forEach((el, i) => el.setAttribute('aria-selected', String(i === active)));
  search.setAttribute('aria-activedescendant', nodes[active].id);
  nodes[active].scrollIntoView({
    block: 'nearest'
  });
};
// Build one keyboard-selectable result with a clear title and stage.
function appendSearchResult(page, i) {
  const a = document.createElement('a');
  a.className = 'search-result';
  a.id = `search-option-${i}`;
  a.href = new URL(page.url, root).href;
  a.setAttribute('role', 'option');
  a.setAttribute('aria-selected', 'false');
  a.tabIndex = - 1;
  const title = document.createElement('strong'), summary = document.createElement('small');
  title.textContent = page.title;
  summary.textContent = `${page.stage} · ${page.summary}`;
  a.append(title, summary);
  results.append(a);
}
// The empty and short states offer a way out of search and back to the stage tiles.
const browseStages = () => {
  const a = document.createElement('a');
  a.href = root.href;
  a.textContent = 'Browse all stages';
  return a;
};
const noteLine = () => {
  const p = document.createElement('p');
  p.className = 'search-empty';
  return p;
};
// A query with no hits keeps the 8-row list untouched and offers one-edit corrections instead.
function appendSuggestions(suggestions) {
  const p = noteLine();
  p.append(document.createTextNode('Did you mean: '));
  suggestions.forEach((suggestion, i) => {
    if (i) p.append(document.createTextNode(' or '));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-suggestion';
    button.textContent = suggestion.suggestion;
    // The click replaces the panel's children; stop the document-level outside-click check seeing a detached target.
    button.addEventListener('click', event => {
      event.stopPropagation();
      search.value = suggestion.suggestion;
      search.focus();
      searchPages();
    });
    p.append(button);
  });
  p.append(document.createTextNode('?'));
  results.append(p);
}
// Keep the real match count visible even though the list itself shows at most eight rows.
function appendResultCount(found) {
  const p = noteLine();
  p.append(document.createTextNode(`Showing ${found.matches.length} of ${found.total} matches · `), browseStages());
  results.append(p);
}
// Search and render the best eight matches without touching page navigation.
function searchPages() {
  const value = search.value.trim();
  results.replaceChildren();
  active = - 1;
  search.removeAttribute('aria-activedescendant');
  if (!value) {
    closeSearch();
    return;
  }
  const found = searchHandbook(index, value, {
    limit: 8,
    selectedStage: stage.value,
    stageOrder: ids
  });
  matches = found.matches;
  if (!found.total) {
    const note = noteLine();
    note.textContent = 'No pages found. Try a shorter term, or browse the stages.';
    results.append(note);
    if (found.suggestions.length) appendSuggestions(found.suggestions);
    const browse = noteLine();
    browse.append(browseStages());
    results.append(browse);
  } else {
    matches.forEach(appendSearchResult);
    appendResultCount(found);
  }
  results.hidden = false;
  search.setAttribute('aria-expanded', 'true');
  status.textContent = found.total ? `Showing ${matches.length} of ${found.total} matches`: 'No matches found';
}
search.addEventListener('input', searchPages);
search.addEventListener('focus', () => {
  if (search.value) searchPages();
});
search.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeSearch();
    return;
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (results.hidden) searchPages();
    selectResult(active + (event.key === 'ArrowDown' ? 1: - 1));
  }
  if (event.key === 'Enter' && active >= 0 && matches[active]) {
    event.preventDefault();
    results.querySelectorAll('a')[active]?.click();
    closeSearch();
  }
});
results.addEventListener('pointermove', event => {
  const a = event.target.closest('[role="option"]');
  if (a) selectResult(Number(a.id.split('-').pop()));
});
results.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeSearch();
    search.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.search')) closeSearch();
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input,textarea,select,[contenteditable="true"]') && !$('.search').hidden) {
    event.preventDefault();
    search.focus();
  }
});
// Only site-local JSON is requested. Failed loading leaves plain navigation intact.
fetch(new URL('search-index.json', root)).then(response => {
  if (!response.ok) throw Error('Index unavailable');
  return response.json();
}).then(data => {
  index = data;
  byUrl = new Map(index.map(p => [searchKey(p.url), p]));
  fetch(new URL('previews.json', root)).then(response => {
    if (!response.ok) throw Error('Previews unavailable');
    return response.json();
  }).then(previews => {
    byUrl = new Map(previews.map(page => [searchKey(page.url), page]));
  }).catch (() => {});
  $('.search').hidden = false;
}).catch (() => {
  status.textContent = 'Search is unavailable. Browse the stages instead.';
});
const popover = $('#link-preview');
let origin = null, hideTimer = null, showTimer = null;
function dismiss(restore = false) {
  clearTimeout(hideTimer);
  clearTimeout(showTimer);
  popover.hidden = true;
  if (origin) {
    origin.removeAttribute('aria-describedby');
    if (restore) origin.focus();
  }
  origin = null;
}
function show(link, fromSidebar = false) {
  const definition = link.dataset.definition, page = definition ? null: byUrl.get(searchKey(link.dataset.preview || link.href));
  if (!page && !definition) return;
  dismiss();
  origin = link;
  popover.replaceChildren();
  if (page) {
    const meta = document.createElement('p'), title = document.createElement('h3'), summary = document.createElement('p');
    meta.className = 'eyebrow';
    meta.textContent = `${page.stage} · ${page.gate}`;
    title.textContent = page.title;
    const hash = new URL(link.href).hash;
    let anchor = '';
    try {
      anchor = decodeURIComponent(hash.slice(1));
    } catch {}
    const section = page.sections?.[anchor];
    if (section) title.textContent += ' · ' + section.title;
    summary.textContent = (section?.excerpt || page.excerpt) ? '“' + (section?.excerpt || page.excerpt) + '”': page.summary;
    popover.append(meta, title, summary);
  } else {
    const title = document.createElement('h3'), p = document.createElement('p');
    title.textContent = link.textContent;
    p.textContent = definition;
    popover.append(title, p);
  }
  const follow = document.createElement('a');
  follow.href = link.href;
  follow.returnFocus = link;
  follow.textContent = definition ? 'Read glossary entry →': 'Read this page →';
  // Ctrl+click (Cmd+click on a Mac) opens the reference beside the page; say so where readers look.
  // A sidebar preview opens on click, so its hint describes entering this box instead.
  const hint = document.createElement('p');
  hint.className = 'preview-hint';
  hint.textContent = fromSidebar
    ? 'Choose “Read this page” to visit, or press ↓ to enter the preview.'
    : /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘-click a link to open it beside this page' : 'Ctrl+click a link to open it beside this page';
  popover.append(follow, hint);
  popover.hidden = false;
  const rect = link.getBoundingClientRect(), box = popover.getBoundingClientRect();
  popover.style.left = `${Math.min(Math.max(12,rect.left),innerWidth-box.width-12)}px`;
  popover.style.top = `${rect.bottom+box.height+12<innerHeight?rect.bottom+8:Math.max(12,rect.top-box.height-8)}px`;
  link.setAttribute('aria-describedby', 'link-preview');
}
const previewLink = target => {
  const a = target.closest?.('a[href]');
  // Stage tiles carry their own promise on hover/focus and a stable description; sidebar links open
  // their preview box on click instead of popping one while the pointer travels through the navigation.
  if (!a || a.closest('.search-results,#link-preview,.stage-tile,.sidebar') || a.origin !== location.origin) return null;
  return a;
};
document.addEventListener('pointerover', event => {
  if (event.pointerType !== 'mouse') return;
  const link = previewLink(event.target);
  if (!link || link === origin) return;
  clearTimeout(hideTimer);
  clearTimeout(showTimer);
  showTimer = setTimeout(() => show(link), 220);
});
document.addEventListener('pointerout', event => {
  if (!previewLink(event.target)) return;
  clearTimeout(showTimer);
  hideTimer = setTimeout(() => {
    if (!popover.matches(':hover') && !popover.contains(document.activeElement) && document.activeElement !== origin) dismiss();
  }, 180);
});
document.addEventListener('focusin', event => {
  const link = previewLink(event.target);
  if (link) show(link);
  else if (!popover.contains(event.target)) dismiss();
});
popover.addEventListener('pointerenter', () => clearTimeout(hideTimer));
popover.addEventListener('pointerleave', () => {
  if (!popover.contains(document.activeElement)) hideTimer = setTimeout(() => dismiss(), 180);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !popover.hidden) {
    event.preventDefault();
    dismiss(popover.contains(document.activeElement));
  } else if (event.key === 'ArrowDown' && origin === document.activeElement && !popover.hidden) {
    event.preventDefault();
    popover.querySelector('a').focus();
  }
});
document.addEventListener('click', event => {
  if (!popover.contains(event.target) && !previewLink(event.target) && !event.target.closest?.('.sidebar a[href]')) dismiss();
});
const storage = {
  get: read, set: save
};
initPeek({
  root, storage, dismissPreview: dismiss
});
// The left navigation previews on click, not on hover: a plain click opens the page's preview box and
// its "Read this page" link visits the page. Modifier-clicks keep the browser's own behaviour.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.('.sidebar a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  if (new URL(link.href).origin !== location.origin) return;
  event.preventDefault();
  if (origin === link && !popover.hidden) {
    dismiss(true);
    return;
  }
  show(link, true);
});
initChecklists(document, storage);
setInterval(() => refreshChecklists(document), 30000);
document.addEventListener('visibilitychange', () => refreshChecklists(document));
addEventListener('storage', () => refreshChecklists(document));
addEventListener('resize', () => dismiss());
addEventListener('scroll', () => {
  if (!popover.contains(document.activeElement)) dismiss();
}, {
  passive: true
});

// A page-level correction request goes to the Worker's feedback queue.
document.addEventListener('submit', async event => {
  const form = event.target.closest?.('form[data-request-update]');
  if (!form) return;
  event.preventDefault();
  const status = form.querySelector('.request-update-status');
  const note = form.elements.note?.value.trim();
  if (!note) { status.textContent = 'Describe what is out of date first.'; form.elements.note?.focus(); return; }
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    const response = await fetch('/api/request-update', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page: form.dataset.page, title: form.dataset.title, note })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) throw Error(result?.error ?? 'request failed');
    status.textContent = 'Request sent to the editor queue. Thank you.';
    form.reset();
  } catch (error) {
    status.textContent = 'Could not send the request. Try the Discord link in the footer.';
  } finally {
    button.disabled = false;
  }
});
