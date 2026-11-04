import { readFile, cp, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const theme = fileURLToPath(new URL('../theme/map/', import.meta.url));
const localNote = '<section class="planned-card"><h2>A map for your local build</h2><p>The interactive Bay and town maps use data extracted from your own game files. They are available in local builds.</p><p>Build with <code>--map --game-data</code> after preparing the map files in <code>docs/build/</code>.</p></section>';
// Both explicit flags are required. The default build never touches extracted map data.
export async function mapPlugin(options = {}) {
  // The owner approved publishing the Bay and town maps (2026-10-22); --map alone turns them on.
  // Other game-file data (the class base-stats table) still needs --game-data.
  if (!options.map) return {
    html: localNote
  };
  const input = resolve(options.mapDir || 'docs/build');
  let fragment;
  try {
    fragment = await readFile(join(input, 'world-map.html'), 'utf8');
    await readFile(join(input, 'world-map.json'), 'utf8');
    await readFile(join(input, 'paths.json'), 'utf8');
    await readFile(join(input, 'towns/index.json'), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return {
      html: localNote + '<p class="local-build-note">Local map or town data is missing. Prepare it with the private guide’s map tools, then rebuild.</p>'
    };
  }
  const start = fragment.indexOf('<section class="world-map"');
  if (start < 0) throw Error('Local map component is invalid');
  fragment = fragment.slice(start).replace(/<script(?![^>]*type="application\/json")[^>]*>[\s\S]*?<\/script>/gi, '');
  fragment = fragment.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // The standalone map embeds the network; the handbook loads it once as a separate asset.
  fragment = fragment.replace(/<script[^>]*class="map-path-data"[^>]*>[\s\S]*?<\/script>/gi, '');
  fragment = fragment.replace('class="world-map"', 'class="world-map" data-assets="../../map-data/"');
  // The extracted component still carries the standalone map's service-chip panel and its own nearest
  // controls. Replace that whole panel with the handbook's one pin + one typed finder layout.
  const mapLocation = `<section class="map-location" aria-label="Your map location">
    <strong>You are here</strong><div class="map-pin-controls">
    <button type="button" data-pin-drop aria-pressed="false">Drop my location pin</button>
    <button type="button" data-pin-centre>Place pin at map centre</button>
    <button type="button" data-pin-remove disabled>Remove pin</button></div>
    <p id="map-pin-help">Drop a pin with a click or tap, or place it at the map centre. Drag the pin to adjust. When the pin is focused, arrow keys move it one map square; Shift moves ten. Escape cancels dropping.</p>
    <p class="map-pin-status" role="status"></p>
    <p class="map-nearest-status" role="status"></p>
    <p>Straight-line distances, not road routes or safe journeys. 1 map square = 819.2 m. Yards mark eligible towns, not verified free ground. Buildings are the installed base records; replacements can differ.</p>
    <div class="map-nearest-results" aria-live="polite"></div></section>`;
  const stageAt = fragment.indexOf('<div class="map-stage"');
  const servicesAt = fragment.indexOf('<div class="map-services"');
  if (servicesAt >= 0 && stageAt > servicesAt) {
    fragment = fragment.slice(0, servicesAt) + mapLocation + fragment.slice(stageAt);
  } else if (stageAt >= 0) {
    fragment = fragment.slice(0, stageAt) + mapLocation + fragment.slice(stageAt);
  }
  fragment = fragment.replace(/<a href="(?:23-playing-online\.html|24-whats-new-2026-10\.md)">([^<]+)<\/a>/g, '$1');
  // The source list is for checking a claim, not for scrolling past: fold it like an article's Sources.
  fragment = fragment.replace(/<p><em>Sources:([\s\S]*?)<\/em><\/p>/, '<details class="map-sources"><summary>Sources &amp; checked facts</summary><p><em>Sources:$1</em></p></details>');
  fragment = fragment.replace(/<p>Progression and travel advice: the online guide\. Recent additions: what(?:'|&#39;)s new\.<\/p>/, '');
  const html = `<link rel="stylesheet" href="../../theme/map/bay-map.css"><link rel="stylesheet" href="../../theme/map/town-map.css">${fragment}<script type="module" src="../../theme/map/bay-map.js"></script><script type="module" src="../../theme/map/town-map.js"></script>`;
  return {
    html, publish: dist => publishMap(dist, input)
  };
}
// Publish only required records, never the reports or personal field-guide pages.
async function publishMap(dist, input) {
  await cp(theme, join(dist, 'theme/map'), {
    recursive: true
  });
  const target = join(dist, 'map-data');
  await mkdir(target, {
    recursive: true
  });
  await cp(join(input, 'world-map.json'), join(target, 'world-map.json'));
  await cp(join(input, 'paths.json'), join(target, 'paths.json'));
  await cp(join(input, 'towns'), join(target, 'towns'), {
    recursive: true,
    filter: file => !/\.[^/\\]+$/.test(file) || /(?:index\.json|\d+\.gz\.txt)$/.test(file),
  });
}
