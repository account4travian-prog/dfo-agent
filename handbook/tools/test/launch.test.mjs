import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadSite, normalizeSync, formatDate, commitDate } from '../site.mjs';
import { createTemplates, statusBadge } from '../templates.mjs';
import { build } from '../build.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const options = { contentDir: join(fixtures, 'content'), stagesFile: join(fixtures, 'stages.json') };
const readJson = async url => JSON.parse((await readFile(url, 'utf8')).replace(/^\uFEFF/, ''));
const sync = await readJson(new URL('../../facts/sync.json', import.meta.url));
const config = await readJson(new URL('../../site.config.json', import.meta.url));
const base = config.baseUrl.replace(/\/$/, '');
const articlePath = 'begin/first-steps/index.html';
const articleUrl = `${base}/begin/first-steps/`;

// Each test builds its own throwaway fixture dist, so parallel test files never share output.
async function buildFixture(t) {
  const dir = await mkdtemp(join(fixtures, 'launch-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return build({ ...options, dist: join(dir, 'dist') });
}
const read = (dist, file) => readFile(join(dist, file), 'utf8');

test('sync record turns commits into readable dates and falls back to the facts commit', () => {
  assert.equal(formatDate('2026-10-24'), '24 October 2026');
  assert.equal(formatDate('2026-02-01'), '1 February 2026');
  assert.equal(formatDate('not-a-date'), '');
  assert.equal(formatDate(undefined), '');
  const data = normalizeSync(sync, sync.sourceCommit);
  assert.equal(data.sourceCommit, sync.sourceCommit);
  assert.equal(data.sourceDate, sync.sourceDate);
  assert.equal(data.guideCommit, sync.guideCommit);
  assert.equal(data.guideDate, sync.guideDate);
  assert.equal(data.commitsBehind, sync.commitsBehind);
  assert.equal(data.checkedAt, sync.checkedAt);
  assert.equal(data.configured, true);
  assert.equal(data.commitDates[sync.guideCommit], sync.guideDate);
  assert.equal(commitDate(data, sync.guideCommit), sync.guideDate);
  // An absent record keeps only the facts commit; nothing invents a review date.
  const fallback = normalizeSync(null, 'e4f093166');
  assert.equal(fallback.sourceCommit, 'e4f093166');
  assert.equal(fallback.sourceDate, '');
  assert.equal(fallback.guideCommit, '');
  assert.equal(fallback.commitsBehind, null);
  assert.equal(commitDate(fallback, 'e4f093166'), '');
  assert.equal(fallback.configured, false);
  // Invalid values are dropped instead of rendered.
  const sanitized = normalizeSync({ sourceCommit: 'nope', commitsBehind: -2, sourceDate: '24/10/2026', commitDates: { bad: 'x', '0df2d87eb': '2026-10-21' } }, 'abc1234');
  assert.equal(sanitized.sourceCommit, 'abc1234');
  assert.equal(sanitized.sourceDate, '');
  assert.equal(sanitized.commitsBehind, null);
  assert.deepEqual(sanitized.commitDates, { '0df2d87eb': '2026-10-21' });
});

test('footer shows source and review clocks, per-page verification and the game links', async () => {
  const site = await loadSite(options);
  assert.equal(site.syncData.sourceCommit, sync.sourceCommit);
  const { chrome } = createTemplates(site, config);
  const html = chrome(articlePath, { title: 'First steps', description: 'Sample', verified: '0df2d87eb' }, '');
  assert.ok(html.includes(`Numbers checked against DFO <code>${sync.sourceCommit}</code> (${formatDate(sync.sourceDate)})`));
  assert.ok(html.includes(`Pages reviewed at <code>${sync.guideCommit}</code> (${formatDate(sync.guideDate)}; ${sync.commitsBehind} commits before)`));
  assert.ok(html.includes(`Page verified <code>0df2d87eb</code> (${formatDate(sync.guideDate)})`));
  assert.match(html, /<a href="https:\/\/daggerfalljs\.dev\/play\/">Play DFO Online<\/a>/);
  assert.match(html, /<a href="https:\/\/discord\.gg\/jM2JdwSM8w">Discord<\/a>/);
  assert.match(html, /<a href="https:\/\/github\.com\/Lattymoy\/daggerfall-js-source">Source<\/a>/);
  assert.match(html, /<a href="https:\/\/github\.com\/Lattymoy\/daggerfall-js-source\/issues">Report a game issue<\/a>/);
  assert.match(html, /Reference<\/a> · An independent player’s handbook\. Original artwork only\./);
  // "How this guide is checked" links only when that page exists in the build.
  assert.doesNotMatch(html, /How this guide is checked/);
  const withGuide = await loadSite(options);
  withGuide.bySource.set('reference/how-this-guide-is-checked.md', { url: 'reference/how-this-guide-is-checked/index.html' });
  const linked = createTemplates(withGuide, config).chrome(articlePath, { title: 'First steps', description: 'Sample' }, '');
  assert.match(linked, /<a href="\.\.\/\.\.\/reference\/how-this-guide-is-checked\/">How this guide is checked<\/a>/);
});

test('a missing sync record still renders the page hash without a made-up date', async () => {
  const site = await loadSite(options);
  const factsCommit = site.factData.commit;
  site.syncData = normalizeSync(null, factsCommit);
  const html = createTemplates(site, config).chrome(articlePath, { title: 'First steps', description: 'Sample', verified: '0df2d87eb' }, '');
  assert.ok(html.includes(`Numbers checked against DFO <code>${factsCommit}</code>`));
  assert.doesNotMatch(html, /\(24 October 2026\)/);
  assert.ok(html.includes('Page verified <code>0df2d87eb</code>'));
  assert.doesNotMatch(html, /Page verified <code>0df2d87eb<\/code> \(/);
  assert.doesNotMatch(html, /Pages reviewed at/);
});

test('home and article carry canonical, Open Graph, Twitter and theme metadata', async t => {
  const { dist } = await buildFixture(t);
  const home = await read(dist, 'index.html');
  assert.ok(home.includes(`<link rel="canonical" href="${base}/">`));
  assert.match(home, /<meta property="og:type" content="website">/);
  assert.match(home, /<meta property="og:site_name" content="The DFO Online Handbook">/);
  assert.match(home, /<meta property="og:title" content="Find your way through the Iliac Bay">/);
  assert.match(home, /<meta property="og:description" content="A source-checked, build-agnostic player’s handbook for DFO Online\.">/);
  assert.ok(home.includes(`<meta property="og:url" content="${base}/">`));
  assert.match(home, /<meta name="twitter:card" content="summary">/);
  assert.equal((home.match(/<meta name="theme-color" content="#[A-F0-9]{6}" media="\(prefers-color-scheme: (?:light|dark)\)">/g) || []).length, 2);
  const jsonLd = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLd, 'home has JSON-LD');
  const structured = JSON.parse(jsonLd[1]);
  assert.equal(structured['@type'], 'WebSite');
  assert.equal(structured.url, `${base}/`);
  assert.equal(structured.name, 'The DFO Online Handbook');
  const article = await read(dist, articlePath);
  assert.ok(article.includes(`<link rel="canonical" href="${articleUrl}">`));
  assert.ok(article.includes(`<meta property="og:url" content="${articleUrl}">`));
  assert.match(article, /<meta property="og:type" content="article">/);
  assert.match(article, /<meta property="og:title" content="First steps">/);
  assert.doesNotMatch(article, /application\/ld\+json/);
  const stage = await read(dist, 'begin/index.html');
  assert.ok(stage.includes(`<link rel="canonical" href="${base}/begin/">`));
  // No raster art exists yet; og:image must stay pending rather than point at a placeholder.
  for (const html of [home, article, stage]) assert.doesNotMatch(html, /og:image/);
  const missing = await read(dist, '404.html');
  assert.ok(missing.includes(`<link rel="canonical" href="${base}/404.html">`));
  assert.match(missing, /<meta name="robots" content="noindex">/);
});

test('sitemap and robots describe every public route with absolute URLs', async t => {
  const { dist, site } = await buildFixture(t);
  const sitemap = await read(dist, 'sitemap.xml');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">\n/);
  assert.match(sitemap, /\n<\/urlset>\n$/);
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(locs[0], `${base}/`);
  for (const stage of site.stages) assert.ok(locs.includes(`${base}/${stage.id}/`), `sitemap stage ${stage.id}`);
  for (const page of site.pages) assert.ok(locs.includes(`${base}/${page.url.replace(/index\.html$/, '')}`), `sitemap page ${page.url}`);
  assert.equal(locs.length, new Set(locs).size);
  assert.ok(locs.every(loc => loc.startsWith(`${base}/`)));
  assert.ok(!locs.includes(`${base}/404.html`));
  const robots = await read(dist, 'robots.txt');
  assert.match(robots, /^User-agent: \*\nAllow: \/\n/);
  assert.match(robots, new RegExp(`Sitemap: ${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`));
});

test('404 chrome uses root-absolute assets and navigation; other pages stay relative', async t => {
  const { dist } = await buildFixture(t);
  const missing = await read(dist, '404.html');
  const head = missing.match(/<head>[\s\S]*?<\/head>/)[0], body = missing.match(/<body[^>]*>[\s\S]*?<\/body>/)[0];
  assert.match(head, /<link rel="stylesheet" href="\/theme\/handbook\.css">/);
  assert.match(head, /<script type="module" src="\/theme\/handbook\.js"><\/script>/);
  assert.match(head, /<link rel="icon" type="image\/svg\+xml" href="\/theme\/art\/mark\.svg">/);
  assert.doesNotMatch(head, /(?:href|src)="\.\.?\//);
  assert.match(body, /data-root="\/"/);
  assert.ok(body.includes('<a class="wordmark" href="/"'));
  assert.ok(body.includes('<div class="nav-stage" data-stage="begin"><a class="stage-link" href="/begin/">'));
  assert.ok(body.includes('<a class="stage-link" href="/reference/">'));
  assert.ok(body.includes('return to the <a href="/">handbook home</a>'));
  assert.doesNotMatch(body, /(?:href|src)="\.\.?\//);
  const article = await read(dist, articlePath);
  assert.match(article, /<link rel="stylesheet" href="\.\.\/\.\.\/theme\/handbook\.css">/);
  assert.match(article, /<script type="module" src="\.\.\/\.\.\/theme\/handbook\.js"><\/script>/);
  assert.match(article, /data-root="\.\.\/\.\.\/"/);
  assert.doesNotMatch(article, /(?:href|src)="\/theme/);
  const stage = await read(dist, 'begin/index.html');
  assert.match(stage, /<link rel="stylesheet" href="\.\.\/theme\/handbook\.css">/);
  assert.match(stage, /data-root="\.\.\/"/);
  const home = await read(dist, 'index.html');
  assert.match(home, /<link rel="stylesheet" href="theme\/handbook\.css">/);
  assert.match(home, /data-root="\.\/"/);
});

test('draft states carry an explanation and the sidebar keeps one shared legend', async () => {
  const site = await loadSite({ ...options, contentDir: join(fixtures, 'reader') });
  const { chrome } = createTemplates(site, config);
  const html = chrome('index.html', { title: 'Test', description: 'Test' }, '');
  const sidebar = html.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[1];
  assert.match(sidebar, /<nav aria-label="Handbook stages" aria-describedby="nav-status-legend">/);
  assert.match(sidebar, /<p class="sr-only" id="nav-status-legend">Pages marked with a dot are drafts: checked against the game source, not yet read through end to end\. Pages marked with a ring are planned and not written yet\.<\/p>/);
  for (const status of ['planned', 'draft']) {
    assert.ok(sidebar.includes(`class="nav-status nav-status-${status}" aria-hidden="true" title="`), `${status} dot is decorative`);
  }
  assert.match(sidebar, /title="Draft: checked against the game source, not yet read through end to end">&#8226;<\/span>/);
  assert.doesNotMatch(sidebar, /aria-label="Draft"|aria-label="Planned"|role="img"/);
  assert.doesNotMatch(sidebar, />Draft<|>Planned</);
  const draft = site.pages.find(page => page.meta.status === 'draft');
  const badge = statusBadge(draft);
  assert.equal(badge, '<span class="status-badge" title="Draft: checked against the game source, not yet read through end to end">Draft<span class="sr-only"> — Draft: checked against the game source, not yet read through end to end</span></span>');
  const planned = site.pages.find(page => page.meta.status === 'planned');
  assert.match(statusBadge(planned), /title="Planned: this page is being written">Planned<span class="sr-only">/);
});

test('the home page explains Draft and offers a way to report mistakes', async t => {
  const { dist } = await buildFixture(t);
  const home = await read(dist, 'index.html');
  assert.match(home, /<p class="draft-note">Pages marked <strong>Draft<\/strong> are checked against the game source, but not yet read through end to end\. Spotted a mistake\? /);
  assert.ok(home.includes(`<a href="${config.communityUrl}">tell us on Discord</a>`));
  assert.ok(home.includes(`<a href="${config.issuesUrl}">open an issue</a>`));
  assert.doesNotMatch(home, /How this guide is checked/);
});

test('mobile search results become a fixed sheet inside the 390px viewport', async () => {
  const { handbookRoot } = await import('../site.mjs');
  const css = await readFile(join(handbookRoot, 'theme/handbook.css'), 'utf8');
  const baseRule = css.slice(css.indexOf('\n.search-results {') + 1).split('}')[0];
  assert.match(baseRule, /position: absolute/);
  assert.match(baseRule, /right: 0/);
  assert.match(baseRule, /width: min\(31rem,calc\(100vw - 2rem\)\)/);
  const block = css.slice(css.indexOf('@media(max-width:520px) {'));
  assert.notEqual(block.indexOf('.search-results {'), -1, 'the 520px block styles search results');
  const sheet = block.slice(block.indexOf('.search-results {') + 1).split('}')[0];
  assert.match(sheet, /position: fixed/);
  assert.match(sheet, /left: 1rem/);
  assert.match(sheet, /right: 1rem/);
  assert.match(sheet, /width: auto/);
  assert.match(sheet, /top: calc\(var\(--header-height\) \+ 5\.5rem\)/);
  assert.match(sheet, /max-height: min\(60vh,24rem\)/);
  assert.match(sheet, /z-index: 40/);
});
