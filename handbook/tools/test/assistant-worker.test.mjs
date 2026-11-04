import test from 'node:test';
import assert from 'node:assert/strict';
import { createRetriever, contextOf } from '../../assistant/src/retrieve.js';
import { routeQuestion, MODELS } from '../../assistant/src/route.js';
import { parseModelOutput, verifyAnswer } from '../../assistant/src/verify.js';

const docs = [
  {
    url: 'feet/renown/', title: 'Renown', summary: 'Online progression.', stage: 'Finding your feet',
    gate: 'always', status: 'draft', tags: ['renown'], headings: ['A second level'],
    body: 'Renown is earned by play. The second level costs 10 Renown.',
    sections: { 'a-second-level': { title: 'A second level', excerpt: 'The second level costs 10 Renown.' } }
  },
  {
    url: 'reference/quests/', title: 'Quest guide', summary: 'Every quest.', stage: 'Reference',
    gate: 'always', status: 'draft', tags: ['quest'], headings: ['Main story'],
    body: 'The quest guide lists the main story and guild work.',
    sections: { 'main-story': { title: 'Main story', excerpt: 'Start with Lady Brisienna.' } }
  }
];
const retriever = createRetriever(docs);
const facts = {
  'renown.secondLevel': { value: 10, label: 'Renown for the second level', unit: 'Renown', source: 'src/renown.js', symbol: 'SECOND' }
};

test('retrieval ranks a matching page and section', () => {
  const hits = retriever.search('how much Renown for the second level', 4);
  assert.ok(hits.length > 0);
  assert.equal(hits[0].doc.url, 'feet/renown/');
  assert.equal(hits[0].section.slug, 'a-second-level');
  assert.match(contextOf(hits), /URL: feet\/renown\//);
});

test('the router sends lookup and live questions to static or refusal, not a model', () => {
  const lookup = routeQuestion('where is the renown page', retriever.search('renown page'), {});
  assert.equal(lookup.kind, 'static');
  const live = routeQuestion('who is the best player online now', retriever.search('renown'), {});
  assert.equal(live.kind, 'refuse');
  const explain = routeQuestion('why does the second level cost renown', retriever.search('second level renown'), {});
  assert.equal(explain.kind, 'qwen');
  assert.match(MODELS.qwen, /qwen3-30b/);
});

test('model JSON is parsed and citations/numbers are checked', () => {
  const hits = retriever.search('how much renown second level');
  const parsed = parseModelOutput('Here: {"answer":"The second level costs 10 Renown.","citations":["feet/renown/"],"confidence":"high"}');
  assert.ok(parsed);
  const checked = verifyAnswer(parsed, hits, facts);
  assert.equal(checked.ok, true);
  assert.equal(checked.citations[0].doc.url, 'feet/renown/');
});

test('unverified citations, numbers and missing answers fall back', () => {
  const hits = retriever.search('how much renown second level');
  const badCitation = verifyAnswer({ answer: 'The second level costs 10 Renown.', citations: ['made/up/'], confidence: 'high' }, hits, facts);
  assert.equal(badCitation.ok, false);
  const badNumber = verifyAnswer({ answer: 'The second level costs 99 Renown.', citations: ['feet/renown/'], confidence: 'high' }, hits, facts);
  assert.equal(badNumber.ok, false);
  const noCitation = verifyAnswer({ answer: 'The second level costs 10 Renown.', citations: [], confidence: 'high' }, hits, facts);
  assert.equal(noCitation.ok, false);
  const missing = verifyAnswer({ answer: 'The guide does not cover that.', citations: [], confidence: 'low' }, hits, facts);
  assert.equal(missing.noCoverage, true);
});
