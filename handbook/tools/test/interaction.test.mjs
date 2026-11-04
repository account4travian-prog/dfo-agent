import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadSite } from '../site.mjs';
import { createTemplates } from '../templates.mjs';
import { build } from '../build.mjs';
import { renderMarkdown } from '../markdown.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const options = { contentDir: join(fixtures, 'content'), stagesFile: join(fixtures, 'stages.json') };
const theme = file => readFile(new URL(`../../theme/${file}`, import.meta.url), 'utf8');
const cssRule = (css, selector) => {
  const start = css.indexOf(`\n${selector} {`);
  assert.notEqual(start, -1, `Missing CSS rule: ${selector}`);
  return css.slice(start + 1).split('}')[0];
};
const cssMedia = (css, query) => {
  const start = css.indexOf(query);
  assert.notEqual(start, -1, `Missing media block: ${query}`);
  return css.slice(start, css.indexOf('\n}', start));
};

test('every markdown table header cell claims its column', () => {
  const html = renderMarkdown('| A | B | C |\n| :--- | :---: | ---: |\n| 1 | 2 | 3 |').html;
  assert.equal((html.match(/<th scope="col"/g) || []).length, 3);
  assert.doesNotMatch(html, /<th(?! scope="col")(?= class|>)/);
  assert.doesNotMatch(html, /<td scope=/);
});

test('articles render one in-page ToC as a details list; other pages render none', async () => {
  const { dist } = await build({ ...options, dist: join(await mkdtemp(join(fixtures, 'toc-')), 'dist') });
  try {
    const article = await readFile(join(dist, 'begin/first-steps/index.html'), 'utf8');
    assert.match(article, /<div class="site-layout has-toc">/);
    assert.equal((article.match(/class="toc"/g) || []).length, 1);
    const toc = article.match(/<details class="toc" open>[\s\S]*?<\/details>/)?.[0];
    assert.ok(toc, 'article has an open details ToC');
    assert.match(toc, /<summary>On this page<\/summary>/);
    assert.match(toc, /<nav aria-label="On this page">/);
    const anchors = [...toc.matchAll(/<a href="#([^"]+)"/g)].map(match => match[1]);
    const headings = [...article.matchAll(/<h2 id="([^"]+)"/g)].map(match => match[1]).filter(id => id !== 'sources');
    assert.deepEqual(anchors, headings);
    assert.ok(anchors.length > 0);
    assert.match(article, /<nav class="page-pager"[^>]*data-page-navigation>/);
    const home = await readFile(join(dist, 'index.html'), 'utf8');
    assert.doesNotMatch(home, /has-toc|class="toc"/);
    const stage = await readFile(join(dist, 'begin/index.html'), 'utf8');
    assert.doesNotMatch(stage, /has-toc|class="toc"/);
  } finally {
    await rm(join(dist, '..'), { recursive: true, force: true });
  }
});

test('the compact ToC is available below 1200px and reordered above the article on phones', async () => {
  const css = await theme('handbook.css');
  // Desktop keeps the side rail, with the summary hidden so the details always reads as a list.
  assert.match(cssRule(css, '.toc > summary'), /display: none/);
  assert.match(cssRule(css, '.toc a'), /display: block/);
  const narrow = cssMedia(css, '@media(max-width:1200px) {');
  assert.doesNotMatch(narrow, /\.toc \{\s*display: none/);
  assert.match(narrow, /\.site-layout\.has-toc > \.toc \{\s*grid-column: 2;\s*grid-row: 1;/);
  assert.match(narrow, /\.site-layout\.has-toc > main \{\s*grid-column: 2;\s*grid-row: 2;/);
  assert.match(narrow, /\.toc > summary \{[^}]*display: flex;[^}]*min-height: 44px;/s);
  assert.match(narrow, /\.toc nav \{[^}]*position: static;[^}]*grid-template-columns: repeat\(auto-fill,minmax\(13rem,1fr\)\);/s);
  assert.match(narrow, /\.toc a \{[^}]*min-height: 44px;/s);
  assert.match(narrow, /\.toc\[open\] > summary::after/);
  const phone = cssMedia(css, '@media(max-width:800px) {');
  assert.match(phone, /\.site-layout\.has-toc \{\s*display: flex;\s*flex-direction: column;/);
  assert.match(phone, /\.site-layout\.has-toc>\.toc \{\s*order: 2;/);
  assert.match(phone, /\.site-layout\.has-toc>main \{\s*order: 3;/);
});

test('touch-sized screens give footer, pager and nav controls 44px hit areas', async () => {
  const css = await theme('handbook.css');
  const touch = cssMedia(css, '@media (max-width: 800px), (pointer: coarse) {');
  for (const selector of ['.site-footer a', '.page-pager a', '[data-page-navigation] a', '.navigation>summary', '.navigation a', '.theme-toggle', '.search input', '.stage-control select', '.search-result', '.toc a']) {
    assert.ok(touch.includes(selector), `touch rules cover ${selector}`);
  }
  assert.match(touch, /min-height: 44px/);
  assert.match(touch, /\.site-footer a \{\s*display: inline-flex;\s*align-items: center;/);
  assert.match(touch, /\.navigation a,\s*\.search-result,\s*\.search-suggestion \{\s*display: flex;\s*align-items: center;/);
});

test('diagram figures get a vellum plate, site border and caption spacing in both themes', async () => {
  const css = await theme('handbook.css');
  const image = cssRule(css, '.prose img[src*="diagram-"]');
  assert.match(image, /max-width: 100%/);
  assert.match(image, /width: 100%/);
  assert.match(image, /height: auto/);
  assert.match(image, /border: 1px solid var\(--line\)/);
  assert.match(image, /border-radius: var\(--radius-md\)/);
  assert.match(image, /background: #FBF7EE/);
  assert.match(cssRule(css, '.prose figure:has(img[src*="diagram-"])'), /margin: 2\.25rem 0/);
  assert.match(cssRule(css, '.prose figure:has(img[src*="diagram-"]) figcaption'), /margin-top: \.75rem/);
});

test('reference side-panel keeps the desktop Ctrl/Cmd path and never captures a plain tap', async () => {
  const reading = await theme('reading.mjs');
  const chrome = await theme('handbook.js');
  // A plain tap is left to the browser so the link navigates; only Ctrl/Cmd opens the side reader.
  assert.match(reading, /if \(!inPanel && !\(event\.ctrlKey \|\| event\.metaKey\)\) return false;/);
  assert.match(reading, /\[data-page-navigation\]/);
  // Sidebar links preview on click (committed design); modifier-clicks keep the browser's own navigation.
  assert.match(chrome, /\.sidebar a\[href\]/);
  assert.match(chrome, /event\.ctrlKey \|\| event\.metaKey \|\| event\.shiftKey \|\| event\.altKey/);
  assert.match(chrome, /event\.preventDefault\(\);\s*if \(origin === link && !popover\.hidden\)/);
  const templates = await readFile(new URL('../templates.mjs', import.meta.url), 'utf8');
  assert.match(templates, /<details class="toc" open>/);
  const build = await readFile(new URL('../build.mjs', import.meta.url), 'utf8');
  assert.match(build, /data-page-navigation/);
});

test('templates expose the compact ToC without duplicating the h2 list', async () => {
  const site = await loadSite(options);
  const { chrome } = createTemplates(site, {});
  const toc = '<a href="#one">One</a><a href="#two">Two</a>';
  const html = chrome('begin/first-steps/index.html', { title: 'Test', description: 'Test', toc }, '');
  assert.match(html, /class="site-layout has-toc"/);
  assert.equal((html.match(/class="toc"/g) || []).length, 1);
  assert.equal((html.match(/<a href="#one">/g) || []).length, 1);
  assert.equal((html.match(/<a href="#two">/g) || []).length, 1);
  assert.match(html, /<details class="toc" open><summary>On this page<\/summary><nav aria-label="On this page">/);
  const without = chrome('index.html', { title: 'Test', description: 'Test' }, '');
  assert.doesNotMatch(without, /has-toc|class="toc"/);
});
