import { relativeUrl, gateLabel, formatDate, commitDate } from './site.mjs';
import { escapeHtml as e } from './markdown.mjs';
import { readFileSync } from 'node:fs';
import { icon, gateIcon } from './icons.mjs';
const wordmark = readFileSync(new URL('../theme/art/wordmark.svg', import.meta.url), 'utf8')
  .replace('<svg ', '<svg class="wordmark-art" aria-hidden="true" focusable="false" ');
// The official game entry points are launch metadata for the guide, not game assets.
const PLAY_URL = 'https://daggerfalljs.dev/play/';
// The site deploys at the domain root, so a 404 served from a deep missing path needs root-absolute URLs.
const rootUrl = target => '/' + target.replace(/index\.html$/, '');
const HTTPS = /^https?:\/\//i;
// Shared chrome and cards use one consistent relative-URL policy, except the root-absolute 404.
export function createTemplates(site, config = {}) {
  // Plate numbers start at I even though the source stage sequence starts at zero.
  const stageNo = s => s.number === null ? 'R' : roman(site.stages.filter(t => t.number !== null).findIndex(t => t.id === s.id) + 1);
  const plate = s => `<span class="stage-plate" aria-hidden="true"><span class="plate-number">${stageNo(s)}</span><span class="plate-rule" aria-hidden="true"></span></span>`;
  const badge = (gate, from, label = gateLabel(gate)) => `${icon(gateIcon(gate), relativeUrl(from, 'theme/icons.svg'))}${e(label)}`;
  const card = (p, from) => `<a class="page-card" href="${e(relativeUrl(from,p.url))}" data-preview="${e(p.url.replace(/index\.html$/,''))}"><span class="eyebrow gate-label">${badge(p.meta.gate, from)}</span><h3>${e(p.meta.title)} ${statusBadge(p)} <span aria-hidden="true">↗</span></h3><p>${e(p.meta.summary)}</p></a>`;
  // Draft and planned markers share one hidden legend, so link names stay clean.
  const LEGEND = 'Pages marked with a dot are drafts: checked against the game source, not yet read through end to end. Pages marked with a ring are planned and not written yet.';
  const sidebar = (url, current) => `<details class="navigation" open><summary>Explore the handbook</summary><nav aria-label="Handbook stages" aria-describedby="nav-status-legend"><p class="sr-only" id="nav-status-legend">${e(LEGEND)}</p>${site.stages.map(s=>`<div class="nav-stage" data-stage="${e(s.id)}"><a class="stage-link" href="${e(url(`${s.id}/index.html`))}"${current===s.id?' aria-current="page"':''}><span class="nav-number" aria-hidden="true">${stageNo(s)}</span>${e(s.title)}</a>${site.pages.filter(p=>p.meta.stage===s.id).map(p=>`<a class="page-link" href="${e(url(p.url))}"${current===p.url?' aria-current="page"':''}>${sidebarTitle(p)}</a>`).join('')}</div>`).join('')}</nav></details>`;
  const chrome = (from, {
    title,
    description,
    stageId = '',
    current = '',
    toc = '',
    verified = '',
    source = '',
    wide = false,
    rootAbsolute = false,
    home = false,
    noindex = false,
    type = 'website'
  }, body) => {
    const url = rootAbsolute ? rootUrl : target => relativeUrl(from, target), edit = config.editBaseUrl && source ? `<a href="${e(config.editBaseUrl.replace(/\/$/,'')+'/'+source.split('/').map(encodeURIComponent).join('/'))}">Edit this page on GitHub ↗</a>`: '';
    const base = typeof config.baseUrl === 'string' && HTTPS.test(config.baseUrl) ? config.baseUrl.replace(/\/+$/, ''): '';
    const canonical = base ? `${base}/${from.replace(/index\.html$/, '')}`: '';
    const sync = site.syncData || {};
    // Two clocks: numbers follow the source snapshot, page prose was reviewed at an older commit.
    const sourceText = sync.sourceCommit ? `Numbers checked against DFO <code>${e(sync.sourceCommit)}</code>${sync.sourceDate ? ` (${e(formatDate(sync.sourceDate))})`: ''}`: '';
    const guideText = sync.guideCommit ? `Pages reviewed at <code>${e(sync.guideCommit)}</code>${sync.guideDate ? ` (${e(formatDate(sync.guideDate))}${sync.commitsBehind !== null ? `; ${sync.commitsBehind} commits before` : ''})`: ''}`: '';
    const provenance = [sourceText, guideText].filter(Boolean).join(' · ');
    const verifiedDate = verified ? commitDate(sync, verified): '';
    const verifiedText = verified ? `Page verified <code>${e(verified)}</code>${verifiedDate ? ` (${e(formatDate(verifiedDate))})`: ''}`: '';
    const guidePage = site.bySource?.get?.('reference/how-this-guide-is-checked.md');
    const footerLink = (href, label) => href ? `<a href="${e(href)}">${e(label)}</a>`: '';
    const footerLinks = [footerLink(PLAY_URL, 'Play DFO Online'), footerLink(config.communityUrl, 'Discord'), footerLink(config.sourceUrl, 'Source'), footerLink(config.issuesUrl, 'Report a game issue'), guidePage ? footerLink(url(guidePage.url), 'How this guide is checked') : ''].filter(Boolean).join(' · ');
    // og:image stays absent until original raster art exists; do not point at a placeholder.
    const head = [
      canonical ? `<link rel="canonical" href="${e(canonical)}">`: '',
      `<meta property="og:type" content="${e(type)}">`,
      '<meta property="og:site_name" content="The DFO Online Handbook">',
      `<meta property="og:title" content="${e(title)}">`,
      `<meta property="og:description" content="${e(description)}">`,
      canonical ? `<meta property="og:url" content="${e(canonical)}">`: '',
      '<meta name="twitter:card" content="summary">',
      '<meta name="theme-color" content="#FBF7EE" media="(prefers-color-scheme: light)">',
      '<meta name="theme-color" content="#1B2025" media="(prefers-color-scheme: dark)">',
      noindex ? '<meta name="robots" content="noindex">': '',
      home && base ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'The DFO Online Handbook',
        url: `${base}/`,
        description
      })}</script>`: ''
    ].filter(Boolean).join('');
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="${e(description)}"><title>${e(title)} · The DFO Online Handbook</title>${head}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&amp;family=Inter:wght@400;500;600&amp;family=Source+Serif+4:ital,wght@0,400;0,600;1,400&amp;display=swap"><link rel="icon" type="image/svg+xml" href="${e(url('theme/art/mark.svg'))}"><link rel="stylesheet" href="${e(url('theme/handbook.css'))}"><script type="module" src="${e(url('theme/handbook.js'))}"></script></head>
<body data-root="${e(url('index.html'))}" data-stage="${e(stageId)}"><a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><a class="wordmark" href="${e(url('index.html'))}" aria-label="The DFO Online Handbook">${wordmark}</a><div class="header-tools"><div class="search" hidden><label class="sr-only" for="search">Search the handbook</label><input id="search" type="search" placeholder="Find your bearings…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list"><kbd aria-hidden="true">/</kbd><div id="search-results" class="search-results" role="listbox" aria-label="Search results" hidden></div><span class="sr-only" id="search-status" role="status"></span></div><button class="theme-toggle" type="button" hidden aria-label="Switch colour theme">◐ <span>Theme</span></button></div></header>
<div class="reader-bar"><span>YOUR COMPANION, FROM THE HOLD TO THE HORIZON</span><label class="stage-control" hidden>Where are you? <select id="reader-stage"><option value="all">Show every stage</option>${site.stages.filter(s=>s.number!==null).map(s=>`<option value="${e(s.id)}">${stageNo(s)} · ${e(s.title)}</option>`).join('')}</select></label></div>
<div class="site-layout${wide?' wide':''}${toc?' has-toc':''}"><aside class="sidebar">${sidebar(url,current)}</aside><main id="main" tabindex="-1">${body}</main>${toc?`<details class="toc" open><summary>On this page</summary><nav aria-label="On this page"><p class="eyebrow">On this page</p>${toc}</nav></details>`:''}</div>
<footer class="site-footer"><a class="footer-brand" href="${e(url('index.html'))}">The DFO Online Handbook</a><p>${provenance}${verifiedText?` · ${verifiedText}`:''}</p><p>${edit}${edit?' · ':''}<a href="${e(url('reference/index.html'))}">Reference</a> · An independent player’s handbook. Original artwork only.</p>${footerLinks?`<p class="footer-links">${footerLinks}</p>`:''}</footer><div id="link-preview" class="link-preview" role="dialog" aria-label="Link preview" hidden></div>${peekShell()}</body></html>`;
  };
  return {
    stageNo, plate, badge, card, chrome, LEGEND
  };
}
function roman(number) {
  let result = '';
  for (const [value, mark] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]) {
    while (number >= value) { result += mark; number -= value; }
  }
  return result;
}
// Keep the marker beside the final word even when a long sidebar title wraps.
function sidebarTitle(page) {
  const status = page.meta.status;
  const title = e(page.meta.title);
  if (!['planned', 'draft'].includes(status)) return title;
  const explanation = status === 'planned' ? 'Planned: this page is being written': 'Draft: checked against the game source, not yet read through end to end';
  // The shared legend carries the meaning; the dot is decoration for sighted readers.
  const marker = `<span class="nav-status nav-status-${status}" aria-hidden="true" title="${e(explanation)}">${status === 'planned' ? '&#9675;' : '&#8226;'}</span>`;
  return title.replace(/(\S+)$/, `<span class="nav-title-end">$1&nbsp;${marker}</span>`);
}
// Small shared fragments keep page-state presentation consistent across navigation.
export function statusBadge(page) {
  const status = page.meta.status;
  if (!['planned', 'draft'].includes(status)) return '';
  const label = status === 'planned' ? 'Planned' : 'Draft';
  const explanation = status === 'planned' ? 'Planned: this page is being written': 'Draft: checked against the game source, not yet read through end to end';
  return `<span class="status-badge" title="${e(explanation)}">${label}<span class="sr-only"> — ${e(explanation)}</span></span>`;
}
export function plannedCard(page) {
  return `<section class="planned-card"><span aria-hidden="true">&#10023;</span><h2>This page is being written</h2><p>${e(page.meta.summary)}</p><p>Keep exploring the stage navigation while this guide takes shape.</p></section>`;
}
function peekShell() {
  return `<aside id="peek-panel" class="peek-panel" aria-label="Reference reader" hidden><div class="peek-toolbar"><button type="button" data-peek-back>&larr; Back</button><a data-peek-page href="#">Open as page &#8599;</a><button type="button" data-peek-close aria-label="Close reference reader">Close &times;</button></div><nav class="peek-breadcrumbs" aria-label="Reference trail"></nav><div class="peek-body" tabindex="-1"></div></aside>`;
}
