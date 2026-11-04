import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
// Set the lane before importing any settings-dependent DFO module.
export function sourceContext(src = process.env.DFO_SRC) {
  globalThis.location = {
    search: '?online'
  };
  const root = resolve(src || 'upstream/daggerfall-js-source/src');
  const pathFor = file => {
    const path = resolve(root, file);
    if (!path.startsWith(root + sep)) throw Error(`Source path escapes DFO_SRC: ${file}`);
    return path;
  };
  const dfo = file => import (pathToFileURL(pathFor(file)).href);
  dfo.text = file => readFile(pathFor(file), 'utf8');
  return dfo;
}
