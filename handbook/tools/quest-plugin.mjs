/**
 * The complete quest browser.
 *
 * The quest index (handbook/quests/quests.json) is generated from the pinned DFU quest pack. This plugin adds the
 * special page and copies the index + browser assets. The page is a normal static page: the index is also embedded in
 * the search index, so a quest name is findable even before JavaScript runs.
 */
import { access, cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dataPath = join(root, 'handbook/quests/quests.json');
const themePath = join(root, 'handbook/theme/quests');

export async function questPlugin(options = {}) {
  if (options.quests === false) return { html: '', records: [] };
  let data;
  try {
    data = JSON.parse(await readFile(dataPath, 'utf8'));
    await access(join(themePath, 'quests.js'));
    await access(join(themePath, 'quests.css'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw Error('Quest guide data is missing. Run `node handbook/tools/build-quest-index.mjs` after extracting the quest pack.');
  }
  const categories = data.categories.map(c => `<button type="button" class="qb-chip" data-category="${c.id}" aria-pressed="false">${escape(c.label)} <span>${data.counts[c.id] ?? 0}</span></button>`).join('');
  const categoryOptions = data.categories.map(c => `<option value="${c.id}">${escape(c.label)} (${data.counts[c.id] ?? 0})</option>`).join('');
  const fallback = data.quests.map(q => `<li><a href="#${escape(q.id)}">${escape(q.name)}</a> — ${escape(q.group)}</li>`).join('');
  const html = `<section class="quest-browser" data-assets="../quests/" aria-label="Quest guide">
<header class="qb-intro"><p class="eyebrow">QUEST GUIDE · ${data.quests.length} QUESTS</p>
<h2>Find a quest</h2>
<p class="qb-lead">The journal tells you what to do; this guide tells you what the quest will ask, what it pays, and where players get stuck. Start with a name, a guild or the main story. Generated quests name a different place every time — read the journal before you travel.</p>
<p class="qb-overview"><a href="../reference/main-quest/">Read the main-story overview →</a></p>
<nav class="qb-featured" aria-label="Featured guides"><span>Featured guides</span><a href="../reference/main-quest/">Main story</a><a href="../reference/the-court-crafter/">Court Crafter</a><a href="../reference/the-burning-doors/">Burning Doors</a><a href="../reference/fighters-guild-hunts/">Fighters hunts</a><a href="../reference/mages-guild-fetches/">Mages fetches</a><a href="../reference/temple-errands/">Temple errands</a></nav>
<div class="qb-note"><strong>First complete pass.</strong> The index and facts are source-checked at ${escape(String(data.sourceCommit).slice(0, 8))}. Generated quests use pattern guides; named main-quest and questline steps have their own objective lists. <a href="../reference/how-this-guide-is-checked/">How this guide is checked</a>.</div></header>
<nav class="qb-intents" aria-label="Ways to start"><button type="button" class="qb-intent" data-category="main">Start the main story <span>35</span></button><button type="button" class="qb-intent" data-category="questlines">Follow a questline <span>39</span></button><button type="button" class="qb-intent" data-category="fighters">Find guild work <span>21</span></button></nav>
<details class="qb-help"><summary>How to read a quest in DFO</summary><ul><li>The journal is the map. It names the region, place, person or target; generated quests choose a different site for every character.</li><li>Read the offer twice and write down the place and time. The journal does not always repeat the region, place, person and clock together.</li><li>A quest dungeon can be opened as your private instance. Use it when the door asks Public or Your instance.</li><li>Online, a failed quest costs no faction standing; a deliberate betrayal or crime still has its own consequences.</li><li>The <a href="../reference/quest-rewards/">quest rewards</a> page explains the gear choice and tiers; the <a href="../reference/questline-ladder/">questline ladder</a> explains line gates.</li></ul></details>
<div class="qb-controls"><label class="qb-search">Search a quest, giver or place<input id="qb-search" type="search" placeholder="Bank, Lysandus, Mages Guild…" autocomplete="off" aria-label="Search quests"></label>
<label>Category<select id="qb-category"><option value="">All categories</option>${categoryOptions}</select></label>
<label>Type<select id="qb-kind"><option value="">All types</option><option value="main">Main quest</option><option value="questline">Questline</option><option value="generated">Generated / side quest</option><option value="cure">Cure</option><option value="tutorial">Tutorial</option></select></label>
<span class="qb-count" id="qb-count" role="status"></span></div>
<div class="qb-chips" aria-label="Quest categories">${categories}</div>
<div class="qb-layout"><nav class="qb-list" aria-label="Quest results"><ul id="qb-results"></ul></nav>
<article class="qb-detail" id="qb-detail" aria-live="polite"><h2>Choose a quest</h2><p>Search or pick a category to begin.</p></article></div>
<noscript><details class="qb-noscript"><summary>All quests</summary><ul>${fallback}</ul></details></noscript>
</section>`;
  return {
    html,
    data,
    publish: async dist => {
      await cp(dataPath, join(dist, 'quests/quests.json'));
      await cp(themePath, join(dist, 'theme/quests'), { recursive: true });
    },
    records: data.quests.map(q => ({
      url: `quests/#${q.id}`,
      title: q.name,
      summary: `${q.group}: ${q.requirement}. ${q.gold ? 'Pays gold.' : ''} ${q.where ? `Where: ${q.where}.` : ''}`,
      stage: 'Quest guide',
      stageId: 'reference',
      gate: 'Always available',
      tags: ['quest', q.category, q.kind, ...q.tags],
      status: 'draft',
      excerpt: `${q.name} is a ${q.kind === 'generated' ? 'generated side quest' : q.kind} in ${q.group}. ${q.where ? `It sends you to a ${q.where}.` : ''}`,
      sections: {},
      headings: ['Quest guide'],
      body: `${q.search} ${q.requirement} ${q.timeLimit} ${q.reward}`
    }))
  };
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
