// @ts-check
// AGENT13: fixture setup only, before play. The host keeps the actual travel/standing rules.
import { getLocationTerrainTileOrigin } from '../world/terrain/terrainTiles.js';
import { RMB_SIDE } from '../world/locationLayout.js';
import { REPOSITION } from '../systems/ship.js';

/** The dev camera's original placement, moved out to pay for the fixture's wiring. */
export function bootLocationCamera(cam, playerPixel, startLoc, tileSide, terrainSize) {
  if (!playerPixel.location) return;
  const tilePos = getLocationTerrainTileOrigin(startLoc);
  const extentZ = startLoc.exterior.exteriorData.height * RMB_SIDE;
  cam.pos = [
    tilePos.x * tileSide + startLoc.exterior.exteriorData.width * RMB_SIDE / 2,
    playerPixel.avgY + 30,
    Math.min(tilePos.y * tileSide + extentZ + 120, terrainSize - 1),
  ];
}

/** Never replace a load, classic dungeon birth, online start or a missing location. */
export async function travelLanding(params, location, pixel, teleport) {
  if (params.get('landing') !== 'travel' || !params.has('agent') || params.has('online') ||
      params.has('load') || params.has('classicload') || params.has('classic') || !location?.exterior?.exteriorData) return false;
  await teleport(pixel.x, pixel.y, null, { reposition: REPOSITION.RandomStartMarker });
  return true;
}
