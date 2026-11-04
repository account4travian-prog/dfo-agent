// Answer verification: the model cannot invent links, and any number it writes must occur in the supplied context
// or in the source-checked facts. A failed check falls back to the extractive cards.
const NO_COVER = /(does not cover|doesn't cover|not covered|no information (?:in|from) the guide|the guide does not say|cannot answer from the guide)/i;
const NUMBER = /\b\d[\d,]*(?:\.\d+)?\b/g;

export function parseModelOutput(text) {
  const raw = String(text ?? '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (typeof parsed.answer !== 'string') return null;
    return {
      answer: parsed.answer.trim(),
      citations: Array.isArray(parsed.citations) ? parsed.citations.filter(c => typeof c === 'string') : [],
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low'
    };
  } catch {
    return null;
  }
}

const baseUrl = value => String(value ?? '').split('#')[0];
const normalizeNumber = value => String(value ?? '').replaceAll(',', '');

export function verifyAnswer(answer, hits, facts) {
  if (!answer || typeof answer.answer !== 'string') return { ok: false, reason: 'no answer' };
  const text = answer.answer.trim();
  if (text.length < 8 || text.length > 1400) return { ok: false, reason: 'answer length' };
  if (NO_COVER.test(text)) return { ok: true, noCoverage: true, citations: [] };
  if (!answer.citations.length) return { ok: false, reason: 'no citations' };
  const allowed = new Map(hits.map(hit => [baseUrl(hit.doc.url), hit]));
  const citations = [...new Set(answer.citations.map(baseUrl))];
  if (!citations.every(url => allowed.has(url))) return { ok: false, reason: 'unknown citation' };
  const context = hits.map(hit => `${hit.doc.title} ${hit.doc.body} ${hit.excerpt}`).join(' ')
    + ' ' + Object.values(facts ?? {}).map(f => `${f.value} ${f.label ?? ''} ${f.unit ?? ''}`).join(' ');
  const contextNumbers = new Set((context.match(NUMBER) ?? []).map(normalizeNumber));
  const answerNumbers = [...new Set(text.match(NUMBER) ?? [])].map(normalizeNumber);
  for (const number of answerNumbers) {
    if (!contextNumbers.has(number)) return { ok: false, reason: `number not in context: ${number}` };
  }
  return {
    ok: true,
    citations: citations.map(url => allowed.get(url)),
    noCoverage: false
  };
}
