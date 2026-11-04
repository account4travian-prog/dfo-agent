#!/usr/bin/env node
// Headless browser integration checks against a local static server; never opens the game.
// PLAYWRIGHT_MODULE can name an existing Playwright index.mjs without installing dependencies.
// node planner/tools/check-town-browser.mjs [http://127.0.0.1:5194/docs/build/field-guide.html]
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const moduleName = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(moduleName ? pathToFileURL(resolve(moduleName)).href : 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1560, height: 1100 }, reducedMotion: 'reduce', hasTouch: true });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [], requests = [], checks = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { if (/towns\//.test(r.url())) requests.push(r.url()); });
const url = process.argv[2] ?? 'http://127.0.0.1:5194/docs/build/field-guide.html';
const townShell = page.locator('.town-shell'), stage = page.locator('.town-stage');
const panel = k => page.locator(`[data-panel="${k}"]`);
const bar = k => page.locator(`[data-window="${k}"]`);
async function openTown(name, region) {
  await page.locator('.map-search input').fill(name);
  await page.locator('.map-results').getByRole('button', { name: `${name} | ${region}`, exact: true }).click();
  await page.locator('.town-shell h3').filter({ hasText: name }).waitFor();
  await page.locator('.town-message').waitFor({ state: 'hidden' });
  await page.locator('[data-panel="buildings"] .town-building-count').waitFor({ state: 'attached' });
}
async function contained() {
  const bounds = await stage.boundingBox();
  for (const p of await page.locator('.town-window:visible').all()) {
    const r = await p.boundingBox();
    assert(r.x >= bounds.x - 1 && r.y >= bounds.y - 1 && r.x + r.width <= bounds.x + bounds.width + 1 && r.y + r.height <= bounds.y + bounds.height + 1, 'Window stays inside map: ' + JSON.stringify({ panel: await p.getAttribute('data-panel'), r, bounds, margin: await p.evaluate(n => getComputedStyle(n).margin) }));
  }
}
try {
  await page.goto(url + '#map');
  assert.equal(requests.length, 0, 'No town data fetched before opening a town'); checks.push('lazy load');
  await openTown('Daggerfall', 'Daggerfall');
  assert.equal(requests.filter(r => /17\.gz\.txt/.test(r)).length, 1);
  assert(await panel('town').innerText().then(t => t.includes('crown')));
  await contained();
  await page.locator('.town-shell').screenshot({ path: 'docs/build/town-desktop.png' });
  checks.push('Daggerfall region decompresses; crown, services and four panels visible');
  await panel('buildings').getByLabel('Search buildings').fill('Fighters');
  const fighter = panel('buildings').locator('[data-building]').first();
  await fighter.click();
  assert((await panel('selected').innerText()).includes('past 50'));
  assert.equal(await fighter.getAttribute('aria-pressed'), 'true'); checks.push('search, selection, training advice');
  await panel('buildings').getByLabel('Search buildings').fill('');
  await panel('buildings').getByLabel('Filter buildings by kind').selectOption('Residence');
  assert((await panel('buildings').locator('[data-building]').count()) > 0);
  await panel('buildings').getByLabel('Filter buildings by kind').selectOption('');
  const handle = panel('town').locator('.town-handle');
  await handle.focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowDown'); await contained();
  const a = await handle.boundingBox(), r = await stage.boundingBox();
  await page.mouse.move(a.x + 25, a.y + 20); await page.mouse.down(); await page.mouse.move(r.x + r.width + 400, r.y + r.height + 400, { steps: 6 }); await page.mouse.up(); await contained();
  await panel('town').getByRole('button', { name: 'Minimise Town', exact: true }).click();
  assert.equal(await panel('town').locator('.town-body').isVisible(), false);
  await bar('town').click(); assert.equal(await panel('town').locator('.town-body').isVisible(), true);
  await panel('town').getByRole('button', { name: 'Enlarge Town', exact: true }).click(); await contained();
  assert((await panel('town').boundingBox()).width > 250);
  await panel('town').getByRole('button', { name: 'Close Town', exact: true }).click();
  assert.equal(await panel('town').isVisible(), false); await bar('town').click(); await contained();
  checks.push('keyboard move, drag containment, minimise, enlarge, close and reopen');
  await page.locator('.town-back').click();
  const bayCanvas = page.locator('.map-stage canvas'), bayBox = await bayCanvas.boundingBox();
  await bayCanvas.click({ position: { x: bayBox.width / 2, y: bayBox.height / 2 } });
  await page.locator('.town-message').waitFor({ state: 'hidden' });
  assert(await townShell.isVisible());
  checks.push('clicking the Bay settlement opens its local map');
  await page.locator('.town-back').click(); await openTown('Gothway Garden', 'Daggerfall');
  assert.equal(requests.filter(r => /17\.gz\.txt/.test(r)).length, 1); checks.push('region cache reused across towns');
  await page.locator('.town-back').click();
  const localRegion = JSON.parse(readFileSync('docs/build/towns/17.json', 'utf8'));
  const duplicate = localRegion.locations.find(t => localRegion.locations.filter(other => other.name === t.name).length > 1);
  const repeated = localRegion.locations.filter(t => t.name === duplicate.name);
  await page.locator('.map-search input').fill(duplicate.name);
  await page.locator('.map-results').getByRole('button', { name: `${duplicate.name} | Daggerfall`, exact: true }).nth(1).click();
  await page.locator('.town-message').waitFor({ state: 'hidden' });
  assert.equal(await townShell.getAttribute('data-map-id'), String(repeated[1].mapId));
  assert.equal(await panel('buildings').locator('.town-building-count').innerText(), `${repeated[1].buildings.length} of ${repeated[1].buildings.length} buildings`);
  checks.push('duplicate place names resolve by mapId');
  await page.locator('.town-back').click();
  await page.route('**/23.gz.txt', route => route.fulfill({ status: 404, body: 'Missing' }));
  await page.locator('.map-search input').fill('Wayrest');
  await page.locator('.map-results').getByRole('button', { name: 'Wayrest | Wayrest', exact: true }).click();
  await page.getByRole('button', { name: 'Retry loading', exact: true }).waitFor();
  assert((await page.locator('.town-message').innerText()).includes('HTTP 404')); checks.push('failed region shows clear retry');
  await page.unroute('**/23.gz.txt');
  await page.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await page.locator('.town-message').waitFor({ state: 'hidden' });
  await page.locator('.town-back').click(); await openTown('Sentinel', 'Sentinel');
  checks.push('failed request retries successfully; Wayrest and Sentinel load');
  // Phone layout, touch sheet tabs, keyboard controls, no horizontal overflow.
  await page.setViewportSize({ width: 390, height: 844 });
  await contained();
  await bar('buildings').tap();
  assert.equal(await panel('buildings').isVisible(), true);
  assert.equal(await panel('town').isVisible(), false);
  await panel('buildings').getByLabel('Search buildings').fill('Bank');
  await panel('buildings').locator('[data-building]').first().click();
  assert.equal(await panel('selected').isVisible(), true); await contained();
  await townShell.evaluate(n => n.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.screenshot({ path: 'docs/build/town-phone.png' });
  await page.locator('.town-stage canvas').focus(); await page.keyboard.press('+'); await page.keyboard.press('ArrowRight');
  const beforePan = await stage.screenshot();
  const phoneCanvas = await page.locator('.town-stage canvas').boundingBox();
  const session = await context.newCDPSession(page);
  const touch = (type, points) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  const tx = phoneCanvas.x + phoneCanvas.width / 2, ty = phoneCanvas.y + 170;
  await touch('touchStart', [[tx - 35, ty], [tx + 35, ty]]);
  await touch('touchMove', [[tx - 65, ty + 10], [tx + 65, ty + 10]]);
  await touch('touchEnd', []);
  await page.locator('.town-stage canvas').press('ArrowLeft');
  assert(!(await stage.screenshot()).equals(beforePan), 'Touch pinch and keyboard pan redraw the map');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert(!overflow); checks.push('390px phone sheet tabs, selection, pan/zoom and overflow');
  await page.locator('#guide-theme').click();
  await page.screenshot({ path: 'docs/build/town-phone-dark.png' });
  await page.setViewportSize({ width: 1560, height: 1100 });
  await contained(); checks.push('phone-to-desktop resize contains panels');
  // Existing wiki reference preview still starts with content and has the article note.
  await page.goto(url + '#play-guide');
  const ref = page.locator('#play-guide [data-ref]').first(); await ref.focus();
  await page.locator('#reference-preview').waitFor({ state: 'visible' });
  const preview = await page.locator('#reference-preview').innerText();
  assert(!preview.includes('Sources:') && !preview.includes('Studied 2026-10-21'));
  assert((await page.locator('#play-guide .about-article').evaluate(n => getComputedStyle(n, '::before').content)).includes('About this article'));
  checks.push('wiki preview and About this article regression');
  assert.deepEqual(errors, [], 'No browser script errors');
  writeFileSync('docs/build/town-browser-checks.json', JSON.stringify({ checks, requests, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ checks, errors, townRequests: requests.length }, null, 2));
} catch (error) {
  await page.screenshot({ path: 'docs/build/town-check-failure.png', fullPage: true });
  console.error({ errors, requests }); throw error;
} finally { await browser.close(); }
