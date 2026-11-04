import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  normalizeText, tokenize, stem, queryTerms, synonymVariants, editDistance, stageBoost, scorePage, search, suggestCorrections
} from '../../theme/search.mjs';

// A compact stand-in for the handbook index: the same fields, weights and stage ids as the real build, with
// the pages the contract queries are about. Tests against the live dist index live in the report script.
const stageOrder = ['begin', 'creation', 'hold', 'town', 'travel', 'feet', 'gear', 'bay', 'rivals', 'late'];
const page = (title, url, stageId, { summary = '', tags = [], headings = [], body = '' } = {}) => ({ title, url, stageId, stage: stageId, summary, tags, headings, body, sections: {} });
const index = [
  page('Horses', 'travel/horses/', 'travel', {
    summary: 'Buy a horse at a Stable, use its speed and gallop carefully, and keep it fed when you travel together.',
    tags: ['horses', 'stable', 'gallop', 'travel'],
    headings: ['Choose a horse', 'What a horse costs'],
    body: 'Visit a Stable to compare the horses offered that day. A horse costs gold; compare its price with your purse. A horse is not a companion.',
  }),
  page('Companions', 'rivals/companions/', 'rivals', {
    summary: 'Sworn revenants: their own star sky, loyalty, gear, missions and the Dread.',
    tags: ['companions', 'revenants', 'loyalty', 'missions'],
    headings: ['Open the roster', 'Loyalty and missions'],
    body: 'In the pause menu open Holdings, then Companions. A card offers Call, Send away, Gear, Mission, Stars and Release.',
  }),
  page('The NPC guilds', 'town/npc-guilds/', 'town', {
    summary: 'Guild halls where you apply to join a guild, and the services each one opens.',
    tags: ['guilds', 'membership', 'services'],
    headings: ['Joining a guild', 'Services'],
    body: 'Apply at a guild hall. A guild hall takes an application when your skills qualify; joining a guild is not a fee at every hall.',
  }),
  page('Player guilds', 'rivals/player-guilds/', 'rivals', {
    summary: 'Found or join a player guild, and what a guild can do for its members.',
    tags: ['guilds', 'founding', 'membership'],
    headings: ['Founding a guild', 'Membership'],
    body: 'An existing guild invites you to join. Founding a player guild costs gold and Renown.',
  }),
  page('What changed', 'reference/what-changed/', 'reference', {
    summary: 'Player-facing changes in the latest sync, plus the archived notes from the previous one.',
    tags: ['updates', 'sync', 'changes', 'patch notes'],
    headings: ['What changed in this sync', 'Archive'],
    body: 'The latest update list for the current sync, and the older notes.',
  }),
  page('Questions new players ask', 'reference/questions/', 'reference', {
    summary: "Short answers to new players' questions, from the first session to the late game.",
    tags: ['questions', 'new player', 'help', 'first session'],
    headings: ['Is DFO Online free?', 'Does it run on Mac, Linux or a phone?', 'How does saving work, and is my progress safe?'],
    body: 'The client is free and open source. The browser client runs in a current desktop browser or on a phone, and the desktop app ships for Windows, macOS and Linux. Saving happens as you go.',
  }),
  page('Playing in the browser', 'begin/playing-in-the-browser/', 'begin', {
    summary: 'Open the web client, provide your own Daggerfall data when prompted, and get past the common startup problems.',
    tags: ['browser', 'setup', 'graphics', 'install'],
    headings: ['Start a game', 'If the page stays blank'],
    body: 'The official site recommends free sources. On a phone you can hand over a zip instead. The game is free.',
  }),
  page('Saving and returning', 'begin/saving-and-returning/', 'begin', {
    summary: 'Know where your progress lives, what closing the tab does, and how to return safely.',
    tags: ['saving', 'persistence', 'log out', 'returning'],
    headings: ['Where your progress lives', 'Returning later'],
    body: 'Offline saves stay in browser storage. Log out and return later; an online character saves as you go.',
  }),
  page('Renown', 'feet/renown/', 'feet', {
    summary: "Online's own ladder from 1 to 50: what earns it, its caps, and what it unlocks.",
    tags: ['renown', 'experience', 'online progression'],
    headings: ['Earning Renown', 'Caps'],
    body: 'Renown rises as you play online; its cap and hourly limits are separate from character level.',
  }),
  page('Hired carriages', 'travel/hired-carriages/', 'travel', {
    summary: 'Pay a carriage to travel between towns, and compare the fee with riding.',
    tags: ['carriage', 'travel', 'fees'],
    headings: ['Fares'],
    body: 'A hired carriage costs silver; a horse is faster but needs feeding.',
  }),
];
const run = (query, options = {}) => search(index, query, { stageOrder, ...options });

test('normalisation folds accents, case, apostrophes and punctuation', () => {
  assert.equal(normalizeText("What's NEW?"), 'whats new');
  assert.equal(normalizeText('Café — 2× iPhone’s'), 'cafe 2 iphones');
  assert.equal(normalizeText('  The   DFO   Online  '), 'the dfo online');
  assert.equal(normalizeText(null), '');
  assert.deepEqual(tokenize('How much does a horse cost?'), ['how', 'much', 'does', 'a', 'horse', 'cost']);
});

test('light stemming joins plurals and common verb endings', () => {
  assert.equal(stem('horses'), 'hors');
  assert.equal(stem('horse'), 'hors');
  assert.equal(stem('companions'), 'companion');
  assert.equal(stem('guilds'), 'guild');
  assert.equal(stem('levels'), 'level');
  assert.equal(stem('save'), stem('saving'));
  assert.equal(stem('save'), stem('saved'));
  assert.equal(stem('running'), 'run');
  assert.equal(stem('dying'), 'dy');
  assert.equal(stem('is'), 'is');
});

test('query terms drop question and stop words and expand synonyms', () => {
  assert.deepEqual(queryTerms('How much does a horse cost?').map(term => term.word), ['horse', 'cost']);
  assert.deepEqual(queryTerms('the of and').map(term => term.word), []);
  const deaths = synonymVariants('die');
  assert.ok(deaths.has(stem('death')) && deaths.has(stem('died')));
  const money = synonymVariants('money');
  assert.ok(money.has(stem('gold')) && money.has(stem('marks')) && money.has(stem('earn')));
  const saved = queryTerms('does it save')[0];
  assert.ok(saved.variants.has(stem('progress')) && saved.variants.has(stem('logout')));
  const ship = synonymVariants('ship');
  assert.ok(ship.has(stem('boat')) && ship.has(stem('vessel')));
  const companion = synonymVariants('companion');
  assert.ok(companion.has(stem('hireling')));
  const levels = synonymVariants('level');
  assert.ok(levels.has(stem('levels')));
  assert.deepEqual(queryTerms('level up').map(term => term.word), ['level']);
});

test('contract query: how much does a horse cost → Horses', () => {
  const result = run('how much does a horse cost');
  assert.ok(result.total >= 1);
  assert.equal(result.matches[0].title, 'Horses');
});

test('contract query: how do I get a companion → Companions first, not Horses', () => {
  const result = run('how do I get a companion');
  assert.equal(result.matches[0].title, 'Companions');
  assert.notEqual(result.matches[0].title, 'Horses');
  const horsesRank = result.matches.findIndex(match => match.title === 'Horses');
  assert.ok(horsesRank === -1 || horsesRank > 0);
});

test('contract query: how do I join a guild → the NPC guilds ahead of player guilds', () => {
  for (const selectedStage of ['all', 'town']) {
    const result = run('how do I join a guild', { selectedStage });
    const npc = result.matches.findIndex(match => match.title === 'The NPC guilds');
    const player = result.matches.findIndex(match => match.title === 'Player guilds');
    assert.notEqual(npc, -1, `NPC guilds present for ${selectedStage}`);
    assert.notEqual(player, -1, `player guilds present for ${selectedStage}`);
    assert.ok(npc < player, `NPC guilds before player guilds for ${selectedStage}`);
  }
});

test("contract query: what's new → What changed", () => {
  const result = run("what's new");
  assert.equal(result.matches[0].title, 'What changed');
});

test('contract query: is it free → the FAQ answer, and the browser page also ranks', () => {
  const result = run('is it free');
  assert.equal(result.matches[0].title, 'Questions new players ask');
  assert.ok(result.matches.some(match => match.title === 'Playing in the browser'));
});

test('contract query: does it save → Saving and returning', () => {
  const result = run('does it save');
  assert.equal(result.matches[0].title, 'Saving and returning');
});

test('contract query: mac and mobile → the platform FAQ / browser page', () => {
  const mac = run('mac');
  assert.equal(mac.matches[0].title, 'Questions new players ask');
  const mobile = run('mobile');
  assert.equal(mobile.matches[0].title, 'Questions new players ask');
  assert.ok(mobile.matches.some(match => match.title === 'Playing in the browser'));
});

test('typo fallback: renewn offers Renown and the corrected query finds the page', () => {
  const typo = run('renewn');
  assert.equal(typo.total, 0);
  assert.deepEqual(typo.matches, []);
  assert.equal(typo.suggestions[0].term, 'renewn');
  assert.equal(typo.suggestions[0].suggestion, 'renown');
  const corrected = run(typo.suggestions[0].suggestion);
  assert.equal(corrected.matches[0].title, 'Renown');
  assert.equal(editDistance('renewn', 'renown'), 1);
  assert.equal(editDistance('same', 'same'), 0);
  assert.ok(editDistance('kitten', 'sitting') > 1);
  assert.deepEqual(suggestCorrections('renewn', []), []);
  assert.deepEqual(suggestCorrections('renewn', index).map(s => s.suggestion), ['renown']);
});

test('title beats body: field weights and coverage rank correctly', () => {
  const titleMatch = page('Companion guide', 'a/', 'begin', { tags: ['companion'] });
  const bodyMatch = page('Travel notes', 'b/', 'begin', { body: 'A companion rides with you.' });
  const context = { normalized: 'companion', terms: queryTerms('companion') };
  assert.ok(scorePage(titleMatch, context) > scorePage(bodyMatch, context));
  const both = page('Companion guide', 'c/', 'begin', { body: 'horse' });
  assert.ok(scorePage(both, { normalized: 'companion horse', terms: queryTerms('companion horse') }) > scorePage(both, context));
});

test('stage proximity lifts early pages for a reader in a later stage', () => {
  const early = page('Guild basics', 'e/', 'begin', { tags: ['guild'] });
  const late = page('Guild basics', 'l/', 'late', { tags: ['guild'] });
  const pair = [early, late];
  assert.ok(scorePage(early, { normalized: 'guild', terms: queryTerms('guild') }, { stageOrder, selectedStage: 'hold' }) >
    scorePage(late, { normalized: 'guild', terms: queryTerms('guild') }, { stageOrder, selectedStage: 'hold' }));
  assert.equal(stageBoost('hold', { stageOrder, selectedStage: 'hold' }), 10);
  assert.equal(stageBoost('begin', { stageOrder, selectedStage: 'hold' }), 8);
  assert.equal(stageBoost('late', { stageOrder, selectedStage: 'hold' }), -18);
  assert.equal(stageBoost('reference', { stageOrder, selectedStage: 'hold' }), 4);
  assert.equal(stageBoost('late', { stageOrder, selectedStage: 'all' }), 0);
  assert.equal(stageBoost('late', {}), 0);
  const ranked = search(pair, 'guild', { stageOrder, selectedStage: 'hold' });
  assert.equal(ranked.matches[0].url, 'e/');
});

test('the display cap keeps the real total and reports the limit', () => {
  const many = Array.from({ length: 12 }, (_, i) => page(`Guild page ${i}`, `g/${i}/`, 'town', { tags: ['guild'] }));
  const result = search(many, 'guild');
  assert.equal(result.total, 12);
  assert.equal(result.matches.length, 8);
  assert.equal(result.limited, true);
  const small = search(index, 'horse');
  assert.equal(small.total, small.matches.length);
  assert.equal(small.limited, false);
});

test('empty and failed searches stay safe', () => {
  assert.deepEqual(search([], 'horse').matches, []);
  assert.equal(search([], 'horse').total, 0);
  assert.equal(search(null, 'horse').total, 0);
  assert.equal(search(index, '   ').total, 0);
  assert.equal(search(index, 'the of and').total, 0);
  assert.deepEqual(search(index, 'the of and').suggestions, []);
  assert.deepEqual(search(index, 'zzzzqqq').suggestions, []);
  assert.equal(scorePage(null, { normalized: 'x', terms: [] }), null);
});

test('the site chrome imports the search module and the build publishes it', async () => {
  const chrome = await readFile(new URL('../../theme/handbook.js', import.meta.url), 'utf8');
  assert.match(chrome, /import \{ search as searchHandbook \} from '\.\/search\.mjs';/);
  assert.doesNotMatch(chrome, /function scorePage/);
  assert.match(chrome, /Showing \$\{matches\.length\} of \$\{found\.total\} matches/);
  assert.match(chrome, /className = 'search-suggestion'/);
  const build = await readFile(new URL('../build.mjs', import.meta.url), 'utf8');
  assert.match(build, /'search\.mjs'/);
});
