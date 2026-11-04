// Save the legacy place-memory rendering under the current run's artifact folder.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { drawPlace, mapCaption } from '../../vendor/legacy-agent/mind/mapImage.mjs';

export function createMapPicture({ runDir } = {}) {
  if (typeof runDir !== 'string' || !runDir.trim()) throw new TypeError('map picture needs a run folder');
  const file = path.join(runDir, 'map-picture.png');
  return {
    async write(place, automap = null, edges = []) {
      const rendered = drawPlace(place, automap, edges);
      if (!rendered) return null;
      await fs.mkdir(runDir, { recursive: true });
      await fs.writeFile(file, rendered.png);
      const sha256 = createHash('sha256').update(rendered.png).digest('hex');
      return { path: file, sha256, caption: mapCaption(rendered), ...rendered, png: undefined };
    },
  };
}
