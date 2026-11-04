import { mkdir, writeFile, cp, rm, access, readFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSite, handbookRoot, relativeUrl, gateLabel, pageOptions, readJson } from './site.mjs';
import { renderMarkdown, escapeHtml as e, plainText } from './markdown.mjs';
import { extractPreviews } from './previews.mjs';
import { prepareTables } from './tables.mjs';
import { mapPlugin } from './map-plugin.mjs';
import { plannerPlugin } from './planner-plugin.mjs';
import { questPlugin } from './quest-plugin.mjs';
import { assistantPlugin } from './assistant-plugin.mjs';
import { createTemplates, statusBadge, plannedCard } from './templates.mjs';
import { stageArt, stageTileArt } from './theme-assets.mjs';
// Coordinate validation, data gates and publication in a reviewable order.
export async function build(options = {}) {
  const site = await loadSite(options), root = options.root || handbookRoot, dist = resolve(options.dist || join(root, 'dist'));
  if (site.errors.length) throw Error(`Build refused invalid content:\n${site.errors.join('\n')}`);
  // Refuse accidental cleanup outside this handbook or into source directories.
  const rel = relative(resolve(root), dist);
  if (!rel || rel.startsWith('..') || resolve(dist) === resolve(root, 'content') || !/(?:^|[\\/])(?:dist|fixture-dist)$/.test(dist)) throw Error('Output must be a dist or fixture-dist directory within the handbook root');
  const config = await readJson(join(root, 'site.config.json'), {});
  if (config.editBaseUrl && !/^https:\/\/github\.com\/[^/]+\/[^/]+\/edit\//.test(config.editBaseUrl)) throw Error('editBaseUrl must be an HTTPS GitHub edit URL');
  for (const key of ['baseUrl', 'sourceUrl', 'communityUrl', 'issuesUrl', 'feedbackUrl']) if (typeof config[key] === 'string' && config[key] && !/^https?:\/\//i.test(config[key])) throw Error(`${key} must be an absolute HTTP(S) URL`);
  const tableHtml = await prepareTables(new Set(site.pages.filter(p => p.meta.status !== 'planned').flatMap(p => p.render.tableIds)), { ...options, factsCommit: site.factData.commit });
  const localMap = await mapPlugin(options);
  const localPlanner = await plannerPlugin(options);
  const localQuests = await questPlugin({ ...options, quests: options.quests !== false && !options.contentDir });
  const localAssistant = await assistantPlugin({ ...options, assistant: options.assistant !== false && !options.contentDir });
  const index = buildIndex(site);
  await prepareOutput(root, dist, localMap, localPlanner, localQuests, localAssistant);
  const {
    stageNo, plate, badge, card, chrome
  } = createTemplates(site, config);
  const write = async (file, html) => {
    await mkdir(join(dist, file, '..'), {
      recursive: true
    });
    await writeFile(join(dist, file), html);
  };
  // Select illustrations from the copied assets, even while new originals arrive.
  await publishHome(site, {
    artRoot: dist, write, stageNo, plate, card, chrome, config, hasMap: Boolean(localMap.publish),
    hasPlanner: Boolean(localPlanner.publish), hasQuests: Boolean(localQuests.publish), hasAssistant: Boolean(localAssistant.publish)
  });
  await publishStages(site, {
    artRoot: dist, write, plate, badge, card, chrome
  });
  await publishArticles(site, {
    write, plate, badge, chrome, tableHtml
  });
  await publishReference({
    write, chrome, localMap, localPlanner, localQuests, localAssistant, plate, referenceStage: site.stages.find(s => s.id === 'reference')
  });
  await publishIndexes(dist, index, Boolean(localMap.publish), Boolean(localPlanner.publish), Boolean(localQuests.publish), Boolean(localAssistant.publish), localQuests.records || []);
  await publishDiscovery(site, dist, config, { hasMap: Boolean(localMap.publish), hasPlanner: Boolean(localPlanner.publish), hasQuests: Boolean(localQuests.publish), hasAssistant: Boolean(localAssistant.publish) });
  console.log(`Built ${site.pages.length} articles and ${site.stages.length} stage pages, plus home, previews${localPlanner.publish ? ', planner' : ''}${localQuests.publish ? ', quest guide' : ''}${localAssistant.publish ? ', ask the guide' : ''} and local atlas state.`);
  return {
    site, dist, index
  };
}
// Search and preview records are derived from the same validated pages.
function buildIndex(site) {
  const index = site.pages.map(p => ({
    url: p.url.replace(/index\.html$/, ''),
    title: p.meta.title,
    summary: p.meta.summary,
    stage: p.stage.title,
    stageId: p.stage.id,
    gate: gateLabel(p.meta.gate),
    tags: p.meta.tags,
    status: p.meta.status || 'published',
    ...(p.meta.status === 'planned' ? {
      excerpt: p.meta.summary, sections: {}
    }
    : extractPreviews(p.resolved)),
    headings: p.render.headings.filter(h => h.text !== 'Sources').map(h => h.text),
    body: p.meta.status === 'planned' ? p.meta.summary: plainText(p.resolved.split(/^## Sources\s*$/m)[0]).slice(0, 16000)
  }));
  index.push(...site.stages.map(s => ({
    url: `${s.id}/`,
    title: s.title,
    summary: s.promise,
    stage: s.title,
    stageId: s.id,
    gate: gateLabel(s.gate),
    tags: [],
    excerpt: s.promise,
    sections: {},
    headings: [],
    body: s.promise
  })));
  return index;
}
// Replace stale generated output only after validation and data preparation succeed.
async function prepareOutput(root, dist, localMap, localPlanner, localQuests, localAssistant) {
  // Clear stale routes only after all source validation succeeds.
  await rm(dist, {
    recursive: true, force: true
  });
  await mkdir(join(dist, 'theme'), {
    recursive: true
  });
  await Promise.all(['handbook.css', 'handbook.js', 'reading.mjs', 'peek.mjs', 'search.mjs', 'icons.svg'].map(file => cp(join(root, 'theme', file), join(dist, 'theme', file))));
  if (localMap.publish) await localMap.publish(dist);
  if (localPlanner.publish) await localPlanner.publish(dist);
  if (localQuests.publish) await localQuests.publish(dist);
  if (localAssistant.publish) await localAssistant.publish(dist);
  try {
    await access(join(root, 'theme/art'));
    await cp(join(root, 'theme/art'), join(dist, 'theme/art'), {
      recursive: true, filter: s => !s.endsWith('.md')
    });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
// The home page presents the progression path before the reference shelf.
async function publishHome(site, {
  artRoot, write, stageNo, plate, card, chrome, config = {}, hasMap = false, hasPlanner = false, hasQuests = false, hasAssistant = false
}) {
  const tiles = [];
  for (const s of site.stages) {
    const art = await stageTileArt(artRoot, s, 'index.html', stageNo(s));
    const id = `tile-${s.id}`;
    tiles.push(`<li><a class="stage-tile" data-stage="${e(s.id)}" href="${e(s.id)}/" aria-labelledby="${e(id)}-title ${e(id)}-gate" aria-describedby="${e(id)}-promise">${art}<div class="stage-tile-body"><span class="tile-number plate-number" aria-hidden="true">${stageNo(s)}</span><h3 id="${e(id)}-title">${e(s.title)}</h3><span class="tile-gate" id="${e(id)}-gate">${e(s.gate)}</span><span class="tile-promise" id="${e(id)}-promise">${e(s.promise)}</span></div></a></li>`);
  }
  const start = site.pages.find(p => p.meta.stage === 'begin'), creation = site.pages.find(p => p.meta.stage === 'creation');
  const creationLink = creation || site.stages.some(stage => stage.id === 'creation') ? `<a href="${creation ? e(relativeUrl('index.html', creation.url)) : 'creation/'}">Creating your character &rarr;</a>`: '';
  // Until the owner supplies a handbook feedback URL, point mistakes at Discord or the issue tracker.
  const reports = config.feedbackUrl ? [`<a href="${e(config.feedbackUrl)}">send feedback</a>`]: [config.communityUrl ? `<a href="${e(config.communityUrl)}">tell us on Discord</a>`: '', config.issuesUrl ? `<a href="${e(config.issuesUrl)}">open an issue</a>`: ''].filter(Boolean);
  const archivistPortrait = hasAssistant ? await readFile(join(handbookRoot, 'theme/assistant/archivist.svg'), 'utf8') : '';
  const archivistFloat = hasAssistant ? `<div class="archivist-float" data-archivist-float data-archivist-state="reading">
<button type="button" class="archivist-head" aria-expanded="false" aria-controls="archivist-chat" aria-label="Ask the Archivist">
<span class="archivist-head-frame" aria-hidden="true">${archivistPortrait}</span>
<span class="archivist-head-tag">Ask the Archivist</span>
</button>
<section class="archivist-chat" id="archivist-chat" role="dialog" aria-modal="false" aria-labelledby="archivist-chat-title" hidden>
<header class="archivist-chat-head"><span class="archivist-chat-mark" aria-hidden="true">A</span><div><strong id="archivist-chat-title">The Archivist</strong><span>Guide assistant</span></div><div class="archivist-chat-controls"><button type="button" data-minimize aria-label="Minimize the Archivist">–</button><button type="button" data-close aria-label="Close the Archivist">×</button></div></header>
<div class="archivist-chat-body"><p>Ask about a rule, place, service or quest. I answer from the handbook's own pages.</p><form class="archivist-chat-form"><label class="sr-only" for="archivist-chat-query">Ask the Archivist</label><div class="archivist-chat-row"><input id="archivist-chat-query" type="search" placeholder="Where is the bank?" autocomplete="off"><button type="submit">Ask</button></div></form><p class="archivist-chat-hint">Quoted passages; opens the full assistant.</p><div class="archivist-chat-results" hidden></div><p class="archivist-chat-status" role="status"></p></div>
<footer class="archivist-chat-foot"><a href="/ask/">Open the full guide assistant <span aria-hidden="true">→</span></a></footer>
</section>
</div>
<button class="archivist-reopen" type="button" data-archivist-reopen hidden aria-label="Open the Archivist">Ask the Archivist</button>` : '';
  const draftNote = `<p class="draft-note">Pages marked <strong>Draft</strong> are checked against the game source, but not yet read through end to end. Spotted a mistake? ${reports.length ? reports.join(' or ') : 'The site owner would like to hear about it'}.</p>`;
  await write('index.html', chrome('index.html', {
    title: 'Find your way through the Iliac Bay',
    description: 'A source-checked, build-agnostic player’s handbook for DFO Online.',
    wide: true,
    home: true
  }, `
<section class="hero"><div class="hero-copy"><p class="eyebrow">THE ONLINE WORLD, IN PLAY ORDER</p><h1>A vast world.<br><em>A clearer path.</em></h1><p class="hero-summary">Find your way through DFO Online. Understand your choices, learn the rules, and discover the Iliac Bay at your own pace.</p><div class="hero-actions"><a class="button" href="${start?e(relativeUrl('index.html',start.url)):'begin/'}">Begin your journey <span aria-hidden="true">→</span></a>${hasMap ? '<a class="button button-secondary" href="reference/bay-map/">Explore the map <span aria-hidden="true">→</span></a>' : ''}${hasPlanner ? '<a class="button button-secondary" href="reference/character-planner/">Plan a character <span aria-hidden="true">→</span></a>' : ''}${hasQuests ? '<a class="button button-secondary" href="quests/">Browse the quest guide <span aria-hidden="true">→</span></a>' : ''}</div><p class="hero-caption">For every class. For every way to play.</p></div><div class="atlas-art" aria-hidden="true"><span class="atlas-north">N</span><div class="atlas-ring"></div><div class="atlas-needle">✧</div><span class="atlas-label">THE ILIAC BAY</span><span class="atlas-coordinate">A PLAYER’S FIELD ATLAS</span></div></section>${archivistFloat}
<section class="start-card"><span class="start-icon" aria-hidden="true">I /</span><div><p class="eyebrow">START HERE</p><h2>Your first steps, in good company.</h2><p>Get ready to play, then build a character you understand.</p><div class="start-links"><a href="${start?e(relativeUrl('index.html',start.url)):'begin/'}">Before you begin →</a>${creationLink}</div></div></section>
<section aria-labelledby="path-title" class="path-section"><div class="section-heading"><div><p class="eyebrow">FOLLOW THE PATH, OR FIND YOUR PLACE</p><h2 id="path-title">The journey ahead</h2></div><p>${site.stages.filter(s=>s.number!==null).length} stages. One world to make your own.</p></div><ol class="stage-tiles" role="list" aria-label="Stages in play order, then reference">${tiles.join('')}</ol></section>
<section class="reference-section"><p class="eyebrow stage-eyebrow">${site.stages.some(s=>s.id==='reference')?plate(site.stages.find(s=>s.id==='reference')):''} KEEP IT CLOSE</p><h2>Look something up</h2>${hasMap ? '<p><a href="reference/bay-map/">Explore the Iliac Bay map &rarr;</a></p>' : ''}${hasPlanner ? '<p><a href="reference/character-planner/">Plan a character &rarr;</a></p>' : ''}${hasQuests ? '<p><a href="quests/">Browse the complete quest guide &rarr;</a></p>' : ''}${hasAssistant ? '<p><a href="ask/">Ask the guide &rarr;</a></p>' : ''}<p>Terms, commands, caps and answers for the moment you need them.</p>${draftNote}<div class="page-grid">${site.pages.filter(p=>p.meta.stage==='reference').map(p=>card(p,'index.html')).join('')||'<a class="page-card" href="reference/"><h3>Open the reference →</h3><p>Your companion for quick answers.</p></a>'}</div></section><script type="module" src="theme/assistant/home.js"></script>`));
}
// Stage pages expose both finished articles and explicitly planned destinations.
async function publishStages(site, {
  artRoot, write, plate, badge, card, chrome
}) {
  for (const stage of site.stages) {
    const from = `${stage.id}/index.html`, pages = site.pages.filter(p => p.meta.stage === stage.id);
    await write(from, chrome(from, {
      title: stage.title,
      description: stage.promise,
      stageId: stage.id,
      current: stage.id,
      wide: true
    }, `<nav class="breadcrumbs" aria-label="Breadcrumbs"><a href="../">Handbook</a><span aria-hidden="true">›</span><span aria-current="page">${e(stage.title)}</span></nav><header class="stage-heading"><p class="eyebrow stage-eyebrow">${plate(stage)}<span>${stage.number===null?'THE REFERENCE':'STAGE'}</span></p><h1>${e(stage.title)}</h1><p class="badge">${badge(stage.gate, from)}</p><p class="summary">${e(stage.promise)}</p>${await stageArt(artRoot, stage, from, true)}</header><p class="ahead-note" hidden>This stage is further along your path. You can read ahead, or return when you reach it.</p><section id="pages"><h2>In this stage</h2><div class="page-grid">${pages.map(p=>card(p,from)).join('')||'<p class="empty-state">These pages are being prepared. Explore another stage or return to the handbook.</p>'}</div></section>`));
  }
}
// Article rendering keeps sources collapsible and all navigation relative.
async function publishArticles(site, {
  write, plate, badge, chrome, tableHtml
}) {
  for (const [i, p] of site.pages.entries()) {
    const rendered = renderMarkdown(p.resolved, {
      ...pageOptions(p, site), iconSprite: relativeUrl(p.url, 'theme/icons.svg'), table: id => tableHtml.get(id)
    });
    const sourceHeading = rendered.headings.find(h => h.level === 2 && h.text === 'Sources'), sourceStart = sourceHeading ? rendered.html.indexOf(`<h2 id="${sourceHeading.id}">`): - 1;
    const sources = sourceStart < 0 ? '': rendered.html.slice(sourceStart).replace(/^<h2[^>]*>Sources<\/h2>\n?/, ''), body = sourceStart < 0 ? rendered.html: rendered.html.slice(0, sourceStart);
    const automatic = p.usedFacts.size ? `<h3>Facts used on this page</h3><ul class="fact-sources">${[...p.usedFacts].map(id=>{const f=site.factData.facts[id];return `<li><strong>${e(f.label)}</strong>: ${e(f.value)}${f.unit?' '+e(f.unit):''}<br><code>${e(f.source)}</code> · <code>${e(f.symbol)}</code></li>`;}).join('')}</ul>`: '';
    const pager = (page, direction) => page ? `<a href="${e(relativeUrl(p.url,page.url))}"><span class="eyebrow">${direction}</span><strong>${e(page.meta.title)} ${direction==='Next'?'→':'←'}</strong></a>`: '<span></span>';
    const toc = rendered.headings.filter(h => h.level === 2 && h.text !== 'Sources').map(h => `<a href="#${e(h.id)}">${e(h.text)}</a>`).join('');
    await write(p.url, chrome(p.url, {
      title: p.meta.title,
      description: p.meta.summary,
      stageId: p.meta.stage,
      current: p.url,
      toc,
      verified: p.meta.verified,
      source: p.source,
      type: 'article'
    }, `<nav class="breadcrumbs" aria-label="Breadcrumbs"><a href="../../">Handbook</a><span aria-hidden="true">›</span><a href="../">${e(p.stage.title)}</a><span aria-hidden="true">›</span><span aria-current="page">${e(p.meta.title)}</span></nav><article><header class="article-heading"><p class="eyebrow stage-eyebrow">${plate(p.stage)}<span>${p.stage.number===null?'REFERENCE':`STAGE &middot; ${e(p.stage.title)}`}</span></p><h1>${e(p.meta.title)}</h1>${statusBadge(p)}<span class="badge">${badge(p.meta.gate, p.url)}</span><p class="summary">${e(p.meta.summary)}</p></header><p class="ahead-note" hidden>This page is further along your path. Read ahead if you’re curious; you can return when you reach this stage.</p><div class="prose">${p.meta.status === 'planned' ? plannedCard(p) : body}${p.meta.status === 'planned' ? '' : `<details class="sources" id="${sourceHeading?.id||'sources'}"><summary>Sources &amp; checked facts</summary>${sources}${automatic}</details>`}</div></article><details class="request-update"><summary>Request an update to this page</summary><form data-request-update data-page="${e(p.url)}" data-title="${e(p.meta.title)}"><label>What is out of date?<textarea name="note" rows="3" required maxlength="2000" placeholder="A rule, number, service or link that changed."></textarea></label><button type="submit">Send update request</button><p class="request-update-status" role="status"></p></form></details><nav class="page-pager" aria-label="Previous and next pages" data-page-navigation>${pager(site.pages[i-1],'Previous')}${pager(site.pages[i+1],'Next')}</nav>`));
  }
}
// The atlas has a useful public state even without the optional local plugin.
async function publishReference({
  write, chrome, localMap = {}, localPlanner = {}, localQuests = {}, localAssistant = {}, plate, referenceStage
}) {
  // The map is drawn from the player's own game files, so public builds have no map page at all.
  if (localMap.publish) await write('reference/bay-map/index.html', chrome('reference/bay-map/index.html', {
    title: 'Explore the Iliac Bay',
    description: 'Find places, services and town layouts across the Iliac Bay.',
    stageId: 'reference',
    wide: true
  }, `<header class="stage-heading"><p class="eyebrow stage-eyebrow">${referenceStage ? plate(referenceStage) : ''}<span>ATLAS</span></p><h1>Explore the Iliac Bay</h1></header>${localMap.html}`));
  if (localPlanner.publish) await write('reference/character-planner/index.html', chrome('reference/character-planner/index.html', {
    title: 'Plan a character',
    description: 'Plan a DFO Online character, see how the rules treat it, and export a custom class the game can import.',
    stageId: 'reference',
    wide: true
  }, `<header class="stage-heading"><p class="eyebrow stage-eyebrow">${referenceStage ? plate(referenceStage) : ''}<span>PLANNER</span></p><h1>Plan a character</h1><p class="summary">Follow DFO's creation screens, see how the rules treat the build, and export a class the game can import.</p></header>${localPlanner.html}`));
  if (localQuests.publish) await write('quests/index.html', chrome('quests/index.html', {
    title: 'Quest guide',
    description: 'Every DFO Online quest: givers, gates, generated locations, walkthrough patterns, rewards and recovery.',
    stageId: 'reference',
    wide: true
  }, `<link rel="stylesheet" href="../theme/quests/quests.css"><header class="stage-heading"><p class="eyebrow stage-eyebrow">${referenceStage ? plate(referenceStage) : ''}<span>QUEST GUIDE</span></p><h1>Every quest, and how to run it</h1></header>${localQuests.html}<script type="module" src="../theme/quests/quests.js"></script>`));
  if (localAssistant.publish) await write('ask/index.html', chrome('ask/index.html', {
    title: 'Ask the guide',
    description: 'Search the handbook in your own words and read the passages it found.',
    stageId: 'reference',
    wide: true
  }, `<link rel="stylesheet" href="../theme/assistant/assistant.css"><header class="stage-heading"><p class="eyebrow stage-eyebrow">${referenceStage ? plate(referenceStage) : ''}<span>ASK THE GUIDE</span></p><h1>Ask the guide</h1><p class="summary">Quoted guide passages always; an optional written answer from the Archivist when the model layer is available.</p></header>${localAssistant.html}<script type="module" src="../theme/assistant/assistant.js"></script>`));
  if (localAssistant.publish) await write('contribute/index.html', chrome('contribute/index.html', {
    title: 'Submit a manuscript',
    description: 'Send a guide or correction to the handbook editor for review.',
    stageId: 'reference',
    wide: false
  }, `<link rel="stylesheet" href="../theme/assistant/assistant.css"><header class="stage-heading"><p class="eyebrow stage-eyebrow">${referenceStage ? plate(referenceStage) : ''}<span>CONTRIBUTE</span></p><h1>Submit a manuscript</h1><p class="summary">Write the guide you wish existed. We will edit for factual correctness, readability and house style before publishing.</p></header><form class="contribute-form" data-contribute-form><label>Manuscript title<input name="title" required maxlength="160" placeholder="The missing guide to…"></label><label>Question or topic it answers<input name="question" maxlength="500" placeholder="What should this cover?"></label><label>Your manuscript<textarea name="body" required minlength="20" maxlength="20000" rows="12" placeholder="Write the guide, walkthrough or explanation. Cite the game source where you can."></textarea></label><label>Sources you checked<textarea name="sources" rows="3" maxlength="4000" placeholder="Files, symbols, pages or builds you checked."></textarea></label><label>Contact (optional)<input name="contact" maxlength="200" placeholder="Discord name or email, if you want a reply."></label><p class="contribute-note">Submissions go to the editor queue. We may edit, merge, split or decline a manuscript to keep the guide accurate and readable. Do not paste copied game text or assets.</p><button type="submit">Submit manuscript</button><p class="contribute-status" role="status"></p></form><script type="module" src="../theme/assistant/contribute.js"></script>`));
  // The site deploys at the domain root: absolute chrome keeps a missing deep URL styled.
  await write('404.html', chrome('404.html', {
    title: 'Page not found', description: 'Find your way back to the handbook.', rootAbsolute: true, noindex: true
  }, '<section class="stage-heading"><p class="eyebrow">A TURN OFF THE PATH</p><h1>Let’s find your bearings.</h1><p>This page could not be found. Use the stage navigation, search, or return to the <a href="/">handbook home</a>.</p></section>'));
}
// Generated landing pages also receive quoted hover previews.
async function publishIndexes(dist, index, hasMap, hasPlanner, hasQuests, hasAssistant, questRecords = []) {
  if (hasQuests) index.push({
    url: 'quests/',
    title: 'Quest guide',
    summary: 'Every player-facing DFO Online quest: givers, gates, generated locations, rewards and recovery.',
    stage: 'Reference',
    stageId: 'reference',
    gate: 'Always available',
    tags: ['quests', 'quest', 'guide', 'index'],
    status: 'draft',
    excerpt: 'Search every quest, read the pattern guide for generated quests, and see the sheet objectives for the main story and questlines.',
    sections: {},
    headings: ['Every quest, and how to run it'],
    body: 'quest guide quest browser every quest giver gate generated location reward recovery main story questline'
  });
  if (hasMap) index.push({
    url: 'reference/bay-map/',
    title: 'Explore the Iliac Bay',
    summary: 'Find places, services and town layouts across the Iliac Bay.',
    stage: 'Reference',
    stageId: 'reference',
    gate: 'Always available',
    tags: ['map', 'places', 'services', 'atlas'],
    status: 'published',
    excerpt: 'Search places, filter by service and open any town to see its buildings.',
    sections: {},
    headings: ['Explore the Iliac Bay'],
    body: 'map atlas bay places services towns map'
  });
  if (hasAssistant) index.push({
    url: 'contribute/',
    title: 'Submit a manuscript',
    summary: 'Send a guide or correction to the handbook editor for review.',
    stage: 'Reference',
    stageId: 'reference',
    gate: 'Always available',
    tags: ['contribute', 'manuscript', 'feedback'],
    status: 'draft',
    excerpt: 'Write the guide you wish existed; submissions are edited and moderated before publication.',
    sections: {},
    headings: ['Submit a manuscript'],
    body: 'submit manuscript contribute guide correction feedback editor'
  });
  if (hasAssistant) index.push({
    url: 'ask/',
    title: 'Ask the guide',
    summary: 'Search the handbook in your own words; read the quoted passages and the page they came from.',
    stage: 'Reference',
    stageId: 'reference',
    gate: 'Always available',
    tags: ['assistant', 'search', 'ask', 'guide'],
    status: 'draft',
    excerpt: 'A static, extractive guide assistant: it searches the handbook and quotes the closest passages with their sources.',
    sections: {},
    headings: ['Ask the guide'],
    body: 'ask the guide assistant search question answer page source extractive'
  });
  if (hasQuests) index.push(...questRecords);
  if (hasPlanner) index.push({
    url: 'reference/character-planner/',
    title: 'Plan a character',
    summary: 'Plan a DFO Online character, see how the rules treat it, and export a custom class the game can import.',
    stage: 'Reference',
    stageId: 'reference',
    gate: 'Always available',
    tags: ['planner', 'build', 'character', 'class'],
    status: 'published',
    excerpt: 'Follow DFO’s creation screens, see how the rules treat the build, and export a class the game can import.',
    sections: {},
    headings: ['Plan a character'],
    body: 'Character planner build class custom class race attributes skills biography export import share plan'
  });
  await writeFile(join(dist, 'search-index.json'), JSON.stringify(index));
  const previews = [
    ...index,
    {
      url: './',
      title: 'Find your way through the Iliac Bay',
      stage: 'The handbook',
      gate: 'Available from the start',
      excerpt: 'Find your way through DFO Online. Understand your choices, learn the rules, and discover the Iliac Bay at your own pace.',
      sections: {}
    },
    ...(hasMap ? [{
      url: 'reference/bay-map/',
      title: 'Explore the Iliac Bay',
      stage: 'Reference',
      gate: 'Always available',
      excerpt: 'Search the Iliac Bay, filter places by service, and open any town to see every building by name.',
      sections: {}
    }] : []),
    ...(hasQuests ? [{
      url: 'quests/',
      title: 'Quest guide',
      stage: 'Reference',
      gate: 'Always available',
      excerpt: 'Search every quest, read the pattern guide for generated quests, and see the sheet objectives for the main story and questlines.',
      sections: {}
    }] : []),
    ...(hasAssistant ? [{
      url: 'ask/',
      title: 'Ask the guide',
      stage: 'Reference',
      gate: 'Always available',
      excerpt: 'Search the handbook in your own words; read the quoted passages and the page they came from.',
      sections: {}
    }] : []),
    ...(hasPlanner ? [{
      url: 'reference/character-planner/',
      title: 'Plan a character',
      stage: 'Reference',
      gate: 'Always available',
      excerpt: 'Follow DFO’s creation screens, see how the rules treat the build, and export a class the game can import.',
      sections: {}
    }] : [])
  ];
  await writeFile(join(dist, 'previews.json'), JSON.stringify(previews));
}
// Sitemap and robots use absolute URLs because the handbook deploys at the domain root.
async function publishDiscovery(site, dist, config, { hasMap = false, hasPlanner = false, hasQuests = false, hasAssistant = false } = {}) {
  const base = typeof config.baseUrl === 'string' && /^https?:\/\//i.test(config.baseUrl) ? config.baseUrl.replace(/\/+$/, ''): '';
  if (base) {
    const special = [...(hasMap ? ['reference/bay-map/'] : []), ...(hasPlanner ? ['reference/character-planner/'] : []), ...(hasQuests ? ['quests/'] : []), ...(hasAssistant ? ['ask/', 'contribute/'] : [])];
    const locs = [`${base}/`, ...site.stages.map(stage => `${base}/${stage.id}/`), ...site.pages.map(page => `${base}/${page.url.replace(/index\.html$/, '')}`), ...special.map(path => `${base}/${path}`)];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.map(loc=>`  <url><loc>${loc}</loc></url>`).join('\n')}\n</urlset>\n`;
    await writeFile(join(dist, 'sitemap.xml'), sitemap);
  }
  await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${base?`\nSitemap: ${base}/sitemap.xml\n`:''}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) build({
  map: process.argv.includes('--map'), planner: process.argv.includes('--planner'), gameData: process.argv.includes('--game-data')
}).catch (error => {
  console.error(error.message);
  process.exitCode = 1;
});


