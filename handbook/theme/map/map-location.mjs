// Map coordinates run east/south from the northwest corner. One square is 819.2 m.
export const MAP_SQUARE_KM = .8192;
export const PIN_STORAGE_KEY = 'handbook.bay-map.location.v1';
export const validPin = pin => pin != null && Number.isFinite(pin.x) && Number.isFinite(pin.y) &&
  pin.x >= 0 && pin.x < 1000 && pin.y >= 0 && pin.y < 500;

export function hasService(place, key, services) {
  const index = services.findIndex(([k]) => k === key);
  return index >= 0 && place.services != null && !!(place.services & (2 ** index));
}

export function distanceFrom(origin, place, squareKm = MAP_SQUARE_KM) {
  const dx = place.x - origin.x, dy = place.y - origin.y, squares = Math.hypot(dx, dy);
  const direction = squares === 0 ? 'here' : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(Math.atan2(dx, -dy) / (Math.PI / 4) + 8) % 8];
  return { squares, km: squares * squareKm, direction };
}

export function findNearest(locations, origin, keys, services, squareKm = MAP_SQUARE_KM) {
  const wanted = [...keys];
  if (!validPin(origin) || !wanted.length) return [];
  return locations.filter(l => wanted.every(k => hasService(l, k, services)))
    .map(place => ({ place, ...distanceFrom(origin, place, squareKm) }))
    .sort((a, b) => a.squares - b.squares || a.place.name.localeCompare(b.place.name) || a.place.region - b.place.region);
}

// A getter also catches browsers that throw when accessing localStorage itself.
export function loadPin(storage = () => globalThis.localStorage) {
  try {
    const pin = JSON.parse(storage().getItem(PIN_STORAGE_KEY));
    return validPin(pin) ? { x: pin.x, y: pin.y } : null;
  } catch { return null; }
}

export function savePin(pin, storage = () => globalThis.localStorage) {
  try {
    if (pin === null) storage().removeItem(PIN_STORAGE_KEY);
    else if (validPin(pin)) storage().setItem(PIN_STORAGE_KEY, JSON.stringify({ x: pin.x, y: pin.y }));
    else return false;
    return true;
  } catch { return false; }
}
