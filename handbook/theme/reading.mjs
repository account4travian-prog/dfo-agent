// A plain click follows the link in this window. Ctrl+click (Cmd+click on a Mac) opens it beside the page instead;
// inside the reference panel a plain click stays in the panel, so delving never loses the reader's place.
// Shift and Alt clicks, middle clicks, downloads and page exits keep the browser's behaviour.
export function shouldPeek(event, link, current, root, inPanel = false) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.shiftKey || event.altKey) return false;
  if (!inPanel && !(event.ctrlKey || event.metaKey)) return false;
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return false;
  if (link.closest('[data-page-navigation],.skip-link,.toc,.peek-toolbar,.peek-breadcrumbs')) return false;
  const url = new URL(link.href, current);
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname) || url.search) return false;
  if (!/\/$|\/index\.html$/.test(url.pathname)) return false;
  return !!(inPanel || url.pathname.replace(/index\.html$/, '') !== current.pathname.replace(/index\.html$/, '') || link.classList.contains('glossary-term'));
}
// UTC weeks begin Monday; a single key per checklist avoids accumulating daily storage records.
export function checklistPeriod(period, date = new Date()) {
  const start = new Date(date);
  if (period === 'weekly') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start.toISOString().slice(0, 10);
}
// Rehydrate newly fetched panels and existing pages from the same browser-local record.
export function initChecklists(scope, storage) {
  scope.querySelectorAll('[data-checklist]').forEach(list => {
    const key = `dfo-checklist:${list.dataset.checklist}`;
    const restore = () => {
      let saved;
      try {
        saved = JSON.parse(storage.get(key) || 'null');
      } catch {
        saved = null;
      }
      const period = checklistPeriod(list.dataset.period);
      list.querySelectorAll('[data-check]').forEach(input => {
        input.disabled = false;
        input.checked = saved?.period === period && Array.isArray(saved.checked) && saved.checked.includes(input.dataset.check);
      });
    };
    restore();
    list.addEventListener('change', () => {
      const checked = [...list.querySelectorAll('[data-check]:checked')].map(input => input.dataset.check);
      storage.set(key, JSON.stringify({
        period: checklistPeriod(list.dataset.period), checked
      }));
    });
    list.restoreChecks = restore;
  });
}
// Reset open checklists at midnight/week boundaries and after background-tab suspension.
export function refreshChecklists(scope) {
  scope.querySelectorAll('[data-checklist]').forEach(list => list.restoreChecks?.());
}
