// @ts-check
// AGENT11/12: leaf event seam. No game imports and no information is sent to a playing role. Producers report
// completed actions here; the sole public sense is an opaque spatial-frame revision (a player's change of view).
const listeners = new Set();
let frame = 0;
export const journeyFrame = () => frame;
export function onJourneyEvent(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export const journeyObserved = () => listeners.size > 0;
export function journeyEvent(kind, data = null) {
  if (kind === 'frame') frame++;
  for (const fn of listeners) { try { fn(kind, data); } catch { /* recording cannot interrupt play */ } }
}
export function journeyMode(previous, next) { if (previous !== next) journeyEvent('frame'); }
