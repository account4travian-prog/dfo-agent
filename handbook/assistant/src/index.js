import INDEX from '../data/index.json';
import { createRetriever, contextOf } from './retrieve.js';
import { routeQuestion, MODELS } from './route.js';
import { parseModelOutput, verifyAnswer } from './verify.js';

const retriever = createRetriever(INDEX.docs);
const NEURONS_PER_USD = 90909.09;
const NEURONS_PER_M_INPUT = 4625;
const NEURONS_PER_M_OUTPUT = 30475;
const DEFAULT_DAILY = 20;
const DEFAULT_MONTHLY = 200;
const MAX_QUESTION = 500;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({
        ok: true,
        service: 'dfo-handbook-assistant',
        corpus: INDEX.corpus,
        models: MODELS,
        budget: { monthlyUsd: Number(env.MONTHLY_BUDGET_USD ?? 5), enforced: env.BUDGET_ENFORCE !== 'false' },
        quota: { daily: Number(env.FREE_DAILY ?? DEFAULT_DAILY), monthly: Number(env.FREE_MONTHLY ?? DEFAULT_MONTHLY) }
      });
    }
    if (url.pathname === '/api/request-answer' && request.method === 'POST') return contribution(request, env, 'answer');
    if (url.pathname === '/api/request-update' && request.method === 'POST') return contribution(request, env, 'update');
    if (url.pathname === '/api/manuscript' && request.method === 'POST') return contribution(request, env, 'manuscript');
    if (url.pathname !== '/api/ask' || request.method !== 'POST') {
      return json({ ok: false, error: 'Use POST /api/ask or GET /api/health.' }, 404);
    }
    try {
      const body = await request.json();
      const question = String(body?.question ?? '').trim().slice(0, MAX_QUESTION);
      if (!question) return json({ ok: false, error: 'A question is required.' }, 400);
      const user = await identityOf(request, env);
      const hits = retriever.search(question, 4);
      const route = routeQuestion(question, hits, { allowEscalation: env.ALLOW_ESCALATION === 'true' });
      if (route.kind === 'refuse' || route.kind === 'invalid' || route.kind === 'static') {
        return json(staticResponse(question, hits, route, INDEX.corpus), 200, route.kind === 'invalid' ? 'invalid' : 'static');
      }

      const quota = await checkQuota(env, user);
      if (!quota.allowed) return json(staticResponse(question, hits, { ...route, kind: 'static', reason: quota.reason }, INDEX.corpus, { fallback: quota.reason }), 200, 'static');
      if (!env.AI) return json(staticResponse(question, hits, { ...route, kind: 'static', reason: 'AI binding unavailable' }, INDEX.corpus, { fallback: 'AI binding unavailable' }), 200, 'static');

      const model = MODELS[route.kind] ?? MODELS.qwen;
      const prompt = buildPrompt(question, hits);
      const estimate = estimateNeurons(prompt);
      const budget = await reserveBudget(env, estimate);
      if (!budget.allowed) return json(staticResponse(question, hits, { ...route, kind: 'static', reason: 'monthly budget reached' }, INDEX.corpus, { fallback: 'monthly budget reached' }), 200, 'static');

      const result = await env.AI.run(model, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 700,
        temperature: 0.2
      });
      const rawText = result?.response ?? result?.result?.response ?? result?.choices?.[0]?.message?.content ?? '';
      const text = typeof rawText === 'string' ? rawText : JSON.stringify(rawText);
      const parsed = parseModelOutput(text);
      if (!parsed && env.DEBUG_RAW === 'true') return json({ ok: true, mode: 'static', route, model, question, answer: null, citations: [], cards: cardsOf(hits), fallback: 'unparseable answer', debugRaw: text.slice(0, 2000), corpus: INDEX.corpus }, 200, 'static');
      const verified = parsed ? verifyAnswer(parsed, hits, INDEX.facts) : { ok: false, reason: 'unparseable answer' };
      if (!verified.ok) return json(staticResponse(question, hits, { ...route, kind: 'static', reason: 'answer failed verification' }, INDEX.corpus, { fallback: verified.reason }), 200, 'static');

      const citations = verified.noCoverage ? [] : verified.citations.map(hit => ({
        title: hit.doc.title,
        url: hit.doc.url,
        anchor: hit.section?.slug ?? null,
        stage: hit.doc.stage,
        gate: hit.doc.gate,
        status: hit.doc.status
      }));
      return json({
        ok: true,
        mode: verified.noCoverage ? 'no-coverage' : 'model',
        route,
        model,
        question,
        answer: parsed.answer,
        citations,
        cards: cardsOf(hits),
        fallback: null,
        corpus: INDEX.corpus,
        usage: { estimatedNeurons: estimate, budgetUsedUsd: budget.usedUsd, budgetLimitUsd: budget.limitUsd },
        persona: { name: 'The Archivist' }
      }, 200, 'model');
    } catch (error) {
      return json({ ok: false, error: 'The guide assistant could not answer that request.', debug: env.DEBUG_RAW === 'true' ? String(error) : undefined }, 500);
    }
  }
};

async function contribution(request, env, kind) {
  if (!env.ASSISTANT_KV) return json({ ok: false, error: 'Submission storage is unavailable.' }, 503);
  const user = await identityOf(request, env);
  const day = new Date().toISOString().slice(0, 10);
  const rateKey = 'contrib:' + user + ':' + day;
  const used = Number(await env.ASSISTANT_KV.get(rateKey) ?? 0);
  if (used >= 20) return json({ ok: false, error: 'Too many submissions today; try again tomorrow.' }, 429);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON.' }, 400); }
  const clean = value => String(value ?? '').replace(/<[^>]*>/g, '').trim();
  const question = clean(body?.question).slice(0, 500);
  const page = clean(body?.page).slice(0, 300);
  const title = clean(body?.title).slice(0, 160);
  if (kind === 'answer' && !question) return json({ ok: false, error: 'A question is required.' }, 400);
  if (kind === 'update' && !page) return json({ ok: false, error: 'A page is required.' }, 400);
  const note = clean(body?.note).slice(0, 2000);
  const manuscript = clean(body?.body).slice(0, 20000);
  const sources = clean(body?.sources).slice(0, 4000);
  const contact = clean(body?.contact).slice(0, 200);
  if (kind === 'manuscript' && (title.length < 3 || manuscript.length < 20)) {
    return json({ ok: false, error: 'A title and a draft of at least 20 characters are required.' }, 400);
  }
  const id = kind + '-' + Date.now() + '-' + user.slice(0, 8);
  await env.ASSISTANT_KV.put(
    'feedback:' + kind + ':' + id,
    JSON.stringify({ id, kind, question, page, title, note, manuscript, sources, contact, createdAt: new Date().toISOString(), user: user.slice(0, 16) }),
    { expirationTtl: 180 * 86400 }
  );
  await env.ASSISTANT_KV.put(rateKey, String(used + 1), { expirationTtl: 2 * 86400 });
  return json({ ok: true, id });
}

const SYSTEM_PROMPT = `You are The Archivist, the guide assistant of The DFO Online Handbook. You are a careful librarian, not a game character. Answer only from the CONTEXT supplied by the user. Do not use outside knowledge.

Rules:
- If the context does not answer the question, answer exactly: "The guide does not cover that." with no citations.
- Never invent a URL, quest name, item name, price, number, patch date or game rule.
- Every number in your answer must appear in the context.
- Cite one to three source pages by their exact URL from the context.
- Be concise: 2-4 short sentences, plain English. Do not roleplay or add lore.
- Return JSON only, in this shape: {"answer":"...","citations":["url"],"confidence":"high|medium|low"}`;

function buildPrompt(question, hits) {
  return `QUESTION: ${question}\n\nCONTEXT:\n${contextOf(hits)}\n\nReturn the JSON answer now.`;
}

function cardsOf(hits) {
  return hits.slice(0, 3).map(hit => ({
    title: hit.doc.title,
    url: hit.doc.url,
    anchor: hit.section?.slug ?? null,
    section: hit.section?.title ?? null,
    stage: hit.doc.stage,
    gate: hit.doc.gate,
    status: hit.doc.status,
    excerpt: hit.excerpt
  }));
}

function staticResponse(question, hits, route, corpus, extra = {}) {
  return {
    ok: true,
    mode: 'static',
    route,
    model: null,
    question,
    answer: null,
    citations: [],
    cards: cardsOf(hits),
    fallback: extra.fallback ?? null,
    corpus,
    persona: { name: 'The Archivist' }
  };
}

function estimateNeurons(prompt) {
  const inputTokens = Math.ceil((prompt.length + SYSTEM_PROMPT.length) / 4);
  return Math.ceil(inputTokens / 1_000_000 * NEURONS_PER_M_INPUT + 700 / 1_000_000 * NEURONS_PER_M_OUTPUT) + 5;
}

async function reserveBudget(env, estimate) {
  const limitUsd = Number(env.MONTHLY_BUDGET_USD ?? 5);
  const limitNeurons = Math.floor(limitUsd * NEURONS_PER_USD);
  if (env.BUDGET_ENFORCE === 'false' || !env.ASSISTANT_KV) return { allowed: true, usedUsd: 0, limitUsd };
  const key = `budget:${monthKey()}`;
  const current = Number(await env.ASSISTANT_KV.get(key) ?? 0);
  if (current + estimate > limitNeurons) return { allowed: false, usedUsd: current / NEURONS_PER_USD, limitUsd };
  await env.ASSISTANT_KV.put(key, String(current + estimate), { expirationTtl: 40 * 86400 });
  return { allowed: true, usedUsd: (current + estimate) / NEURONS_PER_USD, limitUsd };
}

async function checkQuota(env, user) {
  if (env.QUOTA_ENFORCE === 'false' || !env.ASSISTANT_KV) return { allowed: true };
  const daily = Number(env.FREE_DAILY ?? DEFAULT_DAILY);
  const monthly = Number(env.FREE_MONTHLY ?? DEFAULT_MONTHLY);
  const day = new Date().toISOString().slice(0, 10);
  const dailyKey = `quota:${user}:${day}`;
  const monthlyKey = `quota:${user}:${monthKey()}`;
  const [dailyUsed, monthlyUsed] = await Promise.all([
    env.ASSISTANT_KV.get(dailyKey).then(v => Number(v ?? 0)),
    env.ASSISTANT_KV.get(monthlyKey).then(v => Number(v ?? 0))
  ]);
  if (dailyUsed >= daily) return { allowed: false, reason: 'daily free limit reached' };
  if (monthlyUsed >= monthly) return { allowed: false, reason: 'monthly free limit reached' };
  await Promise.all([
    env.ASSISTANT_KV.put(dailyKey, String(dailyUsed + 1), { expirationTtl: 2 * 86400 }),
    env.ASSISTANT_KV.put(monthlyKey, String(monthlyUsed + 1), { expirationTtl: 40 * 86400 })
  ]);
  return { allowed: true };
}

async function identityOf(request, env) {
  const email = request.headers.get('cf-access-authenticated-user-email');
  if (email) return hash(email);
  const jwt = request.headers.get('cf-access-jwt-assertion');
  if (jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.email || payload?.sub) return hash(String(payload.email ?? payload.sub));
    } catch { /* fall through */ }
  }
  if (env.ALLOW_TEST_USER === 'true') return hash(request.headers.get('x-test-user') ?? 'test-user');
  return hash(request.headers.get('cf-connecting-ip') ?? 'anonymous');
}

async function hash(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

function monthKey() {
  return new Date().toISOString().slice(0, 7);
}

function json(value, status = 200, route = 'static') {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-assistant-route': route
    }
  });
}
