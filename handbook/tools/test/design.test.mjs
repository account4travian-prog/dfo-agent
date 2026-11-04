import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { stageArt, stageTileArt } from '../theme-assets.mjs';
import { icon, iconNames, gateIcon } from '../icons.mjs';
import { createTemplates } from '../templates.mjs';
import { loadSite } from '../site.mjs';
import { renderMarkdown } from '../markdown.mjs';
import { build } from '../build.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const options = { contentDir: join(fixtures, 'content'), stagesFile: join(fixtures, 'stages.json') };

test('stage art prefers SVG, falls back to WebP, then a decorative compass at every depth', async () => {
  const root = await mkdtemp(join(fixtures, 'design-art-'));
  const stage = { id: 'begin' };
  try {
    await mkdir(join(root, 'theme/art'), { recursive: true });
    const fallback = await stageArt(root, stage, 'begin/index.html', true);
    assert.match(fallback, /stage-overview-art/);
    assert.match(fallback, /stage-art-fallback/);
    assert.doesNotMatch(fallback, /<img/);
    const tileFallback = await stageTileArt(root, stage, 'index.html', 'I');
    assert.match(tileFallback, /class="stage-art stage-tile-art" aria-hidden="true"/);
    assert.match(tileFallback, /class="tile-art-number">I<\/span>/);
    assert.doesNotMatch(tileFallback, /<img|<svg|stage-art-fallback/);
    assert.match(await stageTileArt(root, { id: 'reference' }, 'index.html', 'R'), /tile-art-number">R</);
    await writeFile(join(root, 'theme/art/stage-begin.webp'), 'fixture');
    assert.match(await stageArt(root, stage, 'index.html'), /src="theme\/art\/stage-begin.webp" alt=""/);
    assert.match(await stageTileArt(root, stage, 'index.html', 'I'), /stage-begin.webp" alt="" loading="lazy" width="600" height="600"/);
    await writeFile(join(root, 'theme/art/stage-begin.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    for (const [from, prefix] of [['index.html',''], ['begin/index.html','../'], ['begin/article/index.html','../../']]) {
      const html = await stageArt(root, stage, from);
      assert.ok(html.includes(`src="${prefix}theme/art/stage-begin.svg"`));
      assert.doesNotMatch(html, /stage-begin.webp/);
      const tile = await stageTileArt(root, stage, from, 'I');
      assert.ok(tile.includes(`src="${prefix}theme/art/stage-begin.svg"`));
      assert.doesNotMatch(tile, /tile-art-number|stage-begin.webp/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('Field Atlas uses Roman plates from I through X, plus R, with one font stylesheet and an accessible wordmark', async () => {
  const site = await loadSite();
  const { stageNo, plate, chrome } = createTemplates(site, {});
  assert.deepEqual(site.stages.map(stageNo), ['I','II','III','IV','V','VI','VII','VIII','IX','X','R']);
  assert.match(plate(site.stages[0]), /plate-number">I<\/span>/);
  assert.match(plate(site.stages[0]), /plate-rule" aria-hidden="true"/);
  const html = chrome('begin/article/index.html', { title: 'Test', description: 'Test' }, '');
  assert.equal((html.match(/rel="stylesheet" href="https:\/\/fonts.googleapis.com/g) || []).length, 1);
  for (const face of ['Cormorant+Garamond', 'Source+Serif+4', 'Inter']) assert.ok(html.includes(face));
  assert.match(html, /rel="icon" type="image\/svg\+xml" href="..\/..\/theme\/art\/mark.svg"/);
  assert.match(html, /aria-label="The DFO Online Handbook"><svg class="wordmark-art" aria-hidden="true"/);
});

test('every requested icon has a clean 24px symbol; callout and gate labels remain unchanged', async () => {
  const sprite = await readFile(new URL('../../theme/icons.svg', import.meta.url), 'utf8');
  assert.equal(iconNames.length, 20);
  const ids = [...sprite.matchAll(/<symbol id="([^"]+)" viewBox="0 0 24 24"/g)].map(m => m[1]);
  assert.deepEqual(ids, iconNames);
  assert.doesNotMatch(sprite, /<(?:image|text|script|foreignObject)\b|data:|https?:\/\/(?!www.w3.org)/);
  assert.throws(() => icon('untrusted'), /Unknown handbook icon/);
  for (const kind of ['tip','warning','online','example','note']) {
    const html = renderMarkdown(`> [!${kind}] Same title\n> Same body`, { iconSprite: '../../theme/icons.svg' }).html;
    assert.ok(html.includes(`aria-label="${kind}"`));
    assert.ok(html.includes(`href="../../theme/icons.svg#${kind}"`));
    assert.match(html, /aria-hidden="true" focusable="false"/);
    assert.match(html, />Same title<\/p><p>Same body<\/p>/);
  }
  for (const [gate, symbol] of [['level 2','level'], ['Levels 2-3','level'], ['renown 5','renown'], ['registered','registered'], ['quest "Title"','quest'], ['other "Condition"','other'], ['none','other']]) assert.equal(gateIcon(gate), symbol);
});

test('built home, stage and article publish plates, art and icons at the correct relative URLs', async () => {
  const dir = await mkdtemp(join(fixtures, 'design-build-'));
  try {
    const { dist } = await build({ ...options, dist: join(dir, 'dist') });
    const home = await readFile(join(dist, 'index.html'), 'utf8');
    assert.match(home, /<ol class="stage-tiles" role="list" aria-label="Stages in play order, then reference"/);
    assert.doesNotMatch(home, /stage-map|stage-waypoint|stage-card|card-action/);
    const tiles = [...home.matchAll(/<li><a class="stage-tile"[^>]*>[\s\S]*?<\/a><\/li>/g)].map(m => m[0]);
    assert.equal(tiles.length, 3);
    const site = await loadSite(options);
    for (const [i, stage] of site.stages.entries()) {
      const tile = tiles[i], id = `tile-${stage.id}`;
      assert.equal((tile.match(/<a\b/g) || []).length, 1);
      assert.ok(tile.includes(`data-stage="${stage.id}" href="${stage.id}/"`));
      assert.ok(tile.includes(`aria-labelledby="${id}-title ${id}-gate" aria-describedby="${id}-promise"`));
      assert.ok(tile.includes(`<h3 id="${id}-title">${stage.title}</h3>`));
      assert.ok(tile.includes(`class="tile-gate" id="${id}-gate">${stage.gate}</span>`));
      assert.ok(tile.includes(`class="tile-promise" id="${id}-promise">${stage.promise}</span>`));
      assert.ok(tile.includes(`class="tile-number plate-number" aria-hidden="true">${['I','II','R'][i]}</span>`));
    }
    assert.match(tiles[0], /class="stage-art stage-tile-art"[^>]*><img src="theme\/art\/stage-begin.svg"/);
    assert.match(tiles[1], /class="tile-art-number">II<\/span>/);
    for (const [file, plate, depth] of [['begin/index.html', 'I', '../'], ['begin/first-steps/index.html', 'I', '../../'], ['reference/index.html', 'R', '../']]) {
      const html = await readFile(join(dist, file), 'utf8');
      assert.ok(html.includes(`plate-number">${plate}</span>`));
      assert.ok(html.includes(`${depth}theme/icons.svg#other`));
      if (file.endsWith('first-steps/index.html')) assert.match(html, /class="eyebrow stage-eyebrow"/);
      else assert.match(html, /class="stage-art stage-overview-art"/);
    }
    assert.equal(await readFile(join(dist, 'theme/icons.svg'), 'utf8'), await readFile(new URL('../../theme/icons.svg', import.meta.url), 'utf8'));
    for (const file of ['wordmark.svg','mark.svg']) assert.ok((await readFile(join(dist, 'theme/art', file))).length);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('tile grid keeps square art, 4/3/2 columns, equal row heights and legible interactive descriptions', async () => {
  const css = await readFile(new URL('../../theme/handbook.css', import.meta.url), 'utf8');
  const js = await readFile(new URL('../../theme/handbook.js', import.meta.url), 'utf8');
  const rule = selector => {
    const start = css.indexOf(`\n${selector} {`);
    assert.notEqual(start, -1, `Missing CSS rule: ${selector}`);
    return css.slice(start + 1).split('}')[0];
  };
  assert.match(rule('.stage-tiles'), /grid-template-columns: repeat\(4,minmax\(0,1fr\)\)/);
  for (const [width, columns] of [[1200,3], [600,2]]) {
    assert.ok(css.includes(`@media (max-width: ${width}px) {\n  .stage-tiles { grid-template-columns: repeat(${columns},minmax(0,1fr)); }`));
  }
  assert.match(rule('.stage-tile'), /display: flex;[\s\S]*flex-direction: column;[\s\S]*height: 100%/);
  assert.match(rule('.stage-tile .stage-tile-art'), /aspect-ratio: 1 \/ 1/);
  assert.match(rule('.stage-tile .stage-tile-art'), /background: var\(--surface\)/);
  assert.match(rule('.stage-tile-art > img'), /object-position: center/);
  assert.match(rule('.stage-art>img'), /object-fit: cover/);
  assert.match(rule('.stage-tile-body::before'), /width: 2\.5rem;[\s\S]*background: var\(--brass\)/);
  assert.match(rule('.tile-gate'), /var\(--font-ui\)/);
  assert.match(rule('.tile-gate'), /color: var\(--muted\)/);
  assert.match(rule('.tile-promise'), /position: absolute;[\s\S]*background: var\(--surface\);[\s\S]*color: var\(--ink\);[\s\S]*opacity: 0/);
  assert.match(rule('.stage-tile:hover .tile-promise,.stage-tile:focus-visible .tile-promise'), /opacity: 1/);
  assert.match(rule('.stage-tile:focus-visible'), /outline: 3px solid var\(--focus\)/);
  assert.match(rule('.is-later .stage-art'), /opacity: \.6/);
  assert.doesNotMatch(css, /\.is-later\s*\{[^}]*opacity/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:root\[data-theme="dark"\] .stage-art img \{ filter: invert\(0\.86\) hue-rotate\(180deg\)/);
  assert.match(js, /a\.closest\('\.search-results,#link-preview,\.stage-tile,\.sidebar'\)/);
  assert.match(js, /\.sidebar a\[href\]/);
  assert.match(js, /show\(link, true\)/);
  assert.match(js, /origin === link && !popover\.hidden/);
  assert.doesNotMatch(css, /stage-map|stage-waypoint|stage-card|card-action/);
});
