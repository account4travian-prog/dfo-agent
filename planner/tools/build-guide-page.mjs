#!/usr/bin/env node
// No installs. Only the ignored output contains locally extracted game geography.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { publishTownData } from './publish-town-data.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(root, 'docs/build');
const template = readFileSync(join(root, 'docs/23-playing-online.html'), 'utf8');
const map = readFileSync(join(out, 'world-map.html'), 'utf8');
const markers = JSON.parse(readFileSync(join(out, 'world-markers.json'), 'utf8'));
const marker = '<!-- WORLD-MAP -->';
assert.equal(template.split(marker).length, 2, 'Template must have exactly one WORLD-MAP marker');
assert(!template.includes('class="map-data"'), 'Committed template must not contain extracted geography');
assert(!/<!doctype|<\/?(?:html|head|body)\b/i.test(template + map), 'Page and component must be fragments');
assert(Array.isArray(markers.resolved), 'Build the map and its resolved markers first');
assert.equal((map.match(/class="map-data"/g) ?? []).length, 1);
// Resolve the marker payload at build time, including a safe script boundary.
const safe = x => JSON.stringify(x).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const resolvedMap = map.replace(/(<script type="application\/json" class="map-data">)([\s\S]*?)(<\/script>)/,
  (_, before, json, after) => before + safe({ ...JSON.parse(json), markers: markers.resolved }) + after)
  .replace(/<meta name="viewport"[^>]*>\s*/, '')
  // the map's own footer links to the guide's files; on the published page they are its sections
  .replace('href="23-playing-online.html"', 'href="#play-guide" data-ref="play-guide"').replace('href="24-whats-new-2026-10.md"', 'href="#whats-new" data-ref="whats-new"');
const towns = publishTownData(join(out, 'towns'));
const townLayout = readFileSync(join(root, 'planner/guide/town-layout.mjs'), 'utf8').replace(/^export /gm, '');
const townView = `<style>${readFileSync(join(root, 'planner/guide/town-map.css'), 'utf8')}</style><script>(()=>{${townLayout}\n${readFileSync(join(root, 'planner/guide/town-map.js'), 'utf8')}\n})();</script>`;
const html = template.replace(marker, () => resolvedMap + townView)
  .replace(/<p class="map-fallback">[\s\S]*?<\/p>/, '');
assert(Buffer.byteLength(html) < 3_000_000, 'Built field guide must stay below 3 MB');
assert(!/<iframe\b|\b(?:src|href)="https?:\/\/(?!fonts\.googleapis\.com\/)/i.test(html), 'Only Google Fonts may be external');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'field-guide.html'), html, 'utf8');
writeFileSync(join(out, 'publish-files.json'), JSON.stringify({ 'field-guide.html': join(out, 'field-guide.html'), ...towns.files }, null, 2) + '\n');
console.log(`docs/build/field-guide.html: ${Buffer.byteLength(html).toLocaleString()} bytes; ${markers.resolved.length} resolved map markers`);
console.log(`Town data: ${towns.regions} regions; ${towns.rawBytes.toLocaleString()} raw bytes; ${towns.gzipBytes.toLocaleString()} gzip bytes. Publish files: docs/build/towns/manifest.json`);
if (markers.unresolved.length) console.log(`${markers.unresolved.length} unplaced marker entries remain in world-markers.json; no guessed coordinates.`);
