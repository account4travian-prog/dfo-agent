// @ts-check
// AGENT13: private quantity lineage. No property is added to an item or a save; no stacking rule changes.
import { journeyObserved } from './agentJourneyEvents.js';
const stacks = new WeakMap();
let nextOrigin = 0;
let purchase = null;
const countOf = (item) => Math.max(0, item?.stackCount ?? 1);
const copy = (rows) => rows.map((r) => ({ ...r }));
function store(item, rows) {
  if (purchase && !purchase.has(item)) purchase.set(item, stacks.has(item) ? copy(stacks.get(item)) : null);
  stacks.set(item, rows);
}
function lot(kind, count) { return { origin: `origin-${++nextOrigin}`, kind, count }; }
export function itemProvenance(item) {
  if (!item || !journeyObserved()) return [];
  let rows = copy(stacks.get(item) ?? []), total = rows.reduce((n, r) => n + r.count, 0);
  const count = countOf(item);
  if (total < count) rows.push(lot('unknown', count - total));
  // An unobserved consumption loses found units first; it must never turn bought goods into found evidence.
  if (total > count) {
    rows.sort((a, b) => Number(b.kind === 'found') - Number(a.kind === 'found'));
    for (const r of rows) { const n = Math.min(r.count, total - count); r.count -= n; total -= n; }
  }
  rows = rows.filter((r) => r.count > 0);
  store(item, rows);
  return copy(rows);
}
export function markJourneyOrigin(item, kind, replace = false) {
  if (!item || !journeyObserved()) return;
  const rows = itemProvenance(item);
  store(item, replace ? [lot(kind, countOf(item))] : rows.map((r) => r.kind === 'unknown' ? { ...r, kind } : r));
}
export function mergeJourneyItems(held, item) {
  if (journeyObserved()) store(held, [...itemProvenance(held), ...itemProvenance(item)]);
}
export function splitJourneyItem(stack, picked, countBefore) {
  if (!journeyObserved()) return;
  // Called before the game's remainder count changes. Attribute the less certain units first.
  const rows = itemProvenance(stack).sort((a, b) => Number(a.kind === 'found') - Number(b.kind === 'found'));
  let left = countOf(picked);
  const taken = [], rest = [];
  for (const r of rows) {
    const n = Math.min(left, r.count); left -= n;
    if (n) taken.push({ ...r, count: n });
    if (r.count > n) rest.push({ ...r, count: r.count - n });
  }
  if (rows.reduce((n, r) => n + r.count, 0) === countBefore) { store(picked, taken); store(stack, rest); }
}
/** Mark before the commit so a merge carries the purchase. A refused/throwing commit rolls the sidecar back. */
export function withJourneyPurchase(items, commit) {
  const previous = purchase, changes = new Map(); purchase = changes;
  let committed = false;
  try {
    for (const item of items) markJourneyOrigin(item, 'bought', true);
    const result = commit(); committed = result !== false; return result;
  } finally {
    purchase = previous;
    if (!committed) for (const [item, rows] of changes) { if (rows) stacks.set(item, rows); else stacks.delete(item); }
  }
}
