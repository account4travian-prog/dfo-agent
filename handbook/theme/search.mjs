/**
 * Handbook search, kept free of the DOM so it can be tested in Node.
 *
 * One query is normalised, stripped of stop and question words, lightly stemmed and expanded through a small
 * synonym map. Pages are ranked with the weights the first search used (title 25, tags 12, summary 8, headings 6,
 * body 1), plus a coverage bonus and a boost from the reader's chosen stage. When nothing matches, indexed terms
 * within one edit are offered as "Did you mean" suggestions. No dependencies, no network, no browser globals.
 */

// Words that carry no search signal in a question ("how much does a horse cost" → horse, cost).
export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 'too', 'very', 'really', 'just', 'also',
  'of', 'to', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'as', 'into', 'over', 'about', 'after', 'before',
  'again', 'out', 'up', 'down', 'off', 'per', 'via', 'vs',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am', 'do', 'does', 'did', 'doing', 'done',
  'have', 'has', 'had', 'having', 'can', 'could', 'will', 'would', 'should', 'may', 'might', 'must', 'shall',
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'it', 'its',
  'he', 'him', 'his', 'she', 'her', 'hers', 'they', 'them', 'their', 'theirs',
  'this', 'that', 'these', 'those', 'there', 'here', 'where', 'when', 'why', 'who', 'whom', 'whose', 'which',
  'how', 'what', 'whats', 'whatever', 'whoever', 'whenever', 'wherever',
  'some', 'any', 'no', 'not', 'none', 'much', 'many', 'more', 'most', 'few', 'less', 'least',
  'get', 'gets', 'got', 'getting', 'gotten', 'make', 'makes', 'made', 'making', 'use', 'uses', 'used', 'using',
  'need', 'needs', 'needed', 'want', 'wants', 'wanted', 'like', 'likes', 'one', 'ones', 'thing', 'things',
  'please', 'tell', 'show', 'find', 'know', 'knows', 'go', 'goes', 'going', 'went', 'gone', 'way', 'ways',
]);

// Question words are already in STOP_WORDS; kept named so the intent is explicit and testable.
export const QUESTION_WORDS = new Set(['how', 'what', 'whats', 'when', 'where', 'why', 'who', 'whom', 'whose', 'which', 'can', 'do', 'does', 'did', 'is', 'are', 'will', 'would', 'should', 'could']);

// Groups of words a player uses for the same idea. Order is not significant; the union is the expansion.
export const SYNONYM_GROUPS = [
  ['die', 'dies', 'died', 'dying', 'death', 'deaths', 'dead', 'kill', 'kills', 'killed', 'killing'],
  ['join', 'joins', 'joined', 'joining', 'apply', 'applies', 'applied', 'applying', 'application', 'applications', 'enlist', 'signup'],
  ['money', 'moneys', 'gold', 'golds', 'mark', 'marks', 'earn', 'earns', 'earned', 'earning', 'earnings', 'silver', 'coin', 'coins', 'pay', 'pays', 'paid', 'payment', 'income', 'profit', 'profits'],
  ['save', 'saves', 'saved', 'saving', 'savings', 'progress', 'logout', 'quit', 'quitting', 'persist', 'persists', 'persisted', 'persistence', 'persistent'],
  ['ship', 'ships', 'shipping', 'shipped', 'boat', 'boats', 'vessel', 'vessels', 'sail', 'sails', 'sailing', 'sailed'],
  ['level', 'levels', 'levelling', 'leveling', 'levelled', 'leveled', 'levelup', 'xp'],
  ['guild', 'guilds', 'guildhall', 'guildhalls'],
  ['companion', 'companions', 'hireling', 'hirelings', 'follower', 'followers', 'henchman', 'henchmen', 'mercenary', 'mercenaries'],
  ['cost', 'costs', 'costing', 'price', 'prices', 'priced', 'value', 'values', 'worth'],
  ['new', 'newest', 'newer', 'change', 'changes', 'changed', 'changing', 'update', 'updates', 'updated', 'updating', 'patch', 'patches', 'patched', 'latest', 'news'],
  ['mobile', 'mobiles', 'phone', 'phones', 'tablet', 'tablets', 'android', 'iphone', 'ipad', 'ios'],
];

const SYNONYM_BY_WORD = new Map();
const SYNONYM_BY_STEM = new Map();
for (const group of SYNONYM_GROUPS) {
  const variants = new Set(group.map(word => stem(word)));
  for (const word of group) {
    SYNONYM_BY_WORD.set(word, variants);
    SYNONYM_BY_STEM.set(stem(word), variants);
  }
}

// Multi-word idioms mean something more specific than their words. "What's new" asks what changed, not for
// pages containing "new", so the phrase replaces the literal word it contains.
export const PHRASE_SYNONYMS = Object.freeze([
  ['whats new', ['change', 'update', 'latest', 'patch']],
]);

// Field order and weights are the first search's contract; keep them stable and testable.
export const FIELD_WEIGHTS = Object.freeze([
  ['title', 25],
  ['summary', 8],
  ['tags', 12],
  ['headings', 6],
  ['body', 1],
]);

const APOSTROPHES = /[\u2018\u2019\u02bc\u201b'`´]/g;
const PUNCTUATION = /[^\p{L}\p{N}]+/gu;

// One comparison form: decomposed, unaccented, lower case, no apostrophes, punctuation turned into spaces.
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .replace(PUNCTUATION, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function tokenize(value) {
  const text = normalizeText(value);
  return text ? text.split(' ') : [];
}

// Light, suffix-only stemming: enough to join horse/horses, save/saving/saved, companion/companions.
export function stem(word) {
  let w = String(word ?? '').toLowerCase();
  if (w.length <= 2) return w;
  if (w.length > 3 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length > 3 && w.endsWith('ied')) w = w.slice(0, -3) + 'y';
  else if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !/(?:ss|us|is)$/.test(w)) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith('ing')) w = stripAffix(w, 'ing');
  else if (w.length > 4 && w.endsWith('ed')) w = stripAffix(w, 'ed');
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}
function stripAffix(word, affix) {
  let base = word.slice(0, -affix.length);
  // running → runn → run, but keep fall, pass and buzz.
  if (/([b-df-hj-np-tv-z])\1$/.test(base) && !/(?:ll|ss|zz|ff)$/.test(base)) base = base.slice(0, -1);
  return base;
}

export function synonymVariants(word) {
  const w = normalizeText(word);
  return SYNONYM_BY_WORD.get(w) || SYNONYM_BY_STEM.get(stem(w)) || null;
}

// The words that carry a query, each with its stemmed synonym variants.
export function queryTerms(rawQuery) {
  let normalized = normalizeText(rawQuery);
  const seen = new Set(), terms = [];
  const addTerm = (word, variants, primary = stem(word)) => {
    const key = [...variants].sort().join('|') || primary;
    if (seen.has(key)) return;
    seen.add(key);
    terms.push({ word, variants, primary });
  };
  for (const [phrase, words] of PHRASE_SYNONYMS) {
    if (!normalized.includes(phrase)) continue;
    addTerm(phrase, new Set(words.map(word => stem(word))), stem(words[0]));
    normalized = normalized.split(phrase).join(' ').trim().replace(/\s+/g, ' ');
  }
  for (const word of normalized.split(' ').filter(Boolean)) {
    if (word.length < 2 || STOP_WORDS.has(word)) continue;
    addTerm(word, synonymVariants(word) || new Set([stem(word)]));
  }
  return terms;
}

function fieldValue(entry, field) {
  const value = entry?.[field];
  return Array.isArray(value) ? value.join(' ') : value ?? '';
}
const PREPARED = new WeakMap();
// Stop words are dropped so "join a guild" and "join guild" become the same short sequence.
const phraseSequence = value => tokenize(value).filter(word => word.length >= 2 && !STOP_WORDS.has(word)).map(stem);
function prepare(entry) {
  if (PREPARED.has(entry)) return PREPARED.get(entry);
  const fields = {};
  for (const [field] of FIELD_WEIGHTS) fields[field] = new Set(tokenize(fieldValue(entry, field)).map(stem));
  const prepared = {
    fields,
    titleText: normalizeText(entry?.title),
    sequences: [phraseSequence(entry?.title), phraseSequence(entry?.summary)],
  };
  PREPARED.set(entry, prepared);
  return prepared;
}

// Two stems match exactly, or differ by a suffix of at most two letters (mac → macos). Short tokens never
// match by prefix, so a one-letter fragment cannot stand in for a word.
function tokensMatch(token, variant) {
  if (token === variant) return true;
  if (token.length < 3 || variant.length < 3) return false;
  if (token.startsWith(variant) && token.length - variant.length <= 2) return true;
  if (variant.startsWith(token) && variant.length - token.length <= 1) return true;
  return false;
}
function fieldMatches(tokens, variants) {
  for (const token of tokens) for (const variant of variants) if (tokensMatch(token, variant)) return true;
  return false;
}

function containsSequence(sequence, core) {
  for (let i = 0; i + core.length <= sequence.length; i++) {
    let found = true;
    for (let j = 0; j < core.length; j++) if (sequence[i + j] !== core[j]) { found = false; break; }
    if (found) return true;
  }
  return false;
}

// Reader progress: pages at or before the chosen stage outrank pages further along the path.
export function stageBoost(stageId, { stageOrder = [], selectedStage = 'all' } = {}) {
  if (!selectedStage || selectedStage === 'all' || !Array.isArray(stageOrder) || !stageOrder.length) return 0;
  const selectedIndex = stageOrder.indexOf(selectedStage);
  if (selectedIndex < 0) return 0;
  const index = stageOrder.indexOf(stageId);
  if (index < 0) return 4; // reference material is always available
  const delta = index - selectedIndex;
  if (delta <= 0) return 10 - Math.min(6, -delta);
  return -Math.min(18, 6 * delta);
}

// Score one page for one query context. Returns null when no query term matched anywhere.
export function scorePage(entry, context, { stageOrder = [], selectedStage = 'all' } = {}) {
  if (!entry || !context?.terms?.length) return null;
  const { fields, titleText, sequences } = prepare(entry);
  let score = titleText === context.normalized ? 100 : 0, matched = 0;
  for (const term of context.terms) {
    let points = 0;
    for (const [field, weight] of FIELD_WEIGHTS) if (fields[field]?.size && fieldMatches(fields[field], term.variants)) points += weight;
    if (points > 0) {
      matched++;
      score += points;
    }
  }
  if (!matched) return null;
  score += Math.round(10 * matched / context.terms.length);
  // A whole query phrase in the title or summary ("join a guild") is a stronger signal than scattered words.
  if (context.core?.length > 1 && sequences.some(sequence => containsSequence(sequence, context.core))) score += 18;
  score += stageBoost(entry.stageId, { stageOrder, selectedStage });
  return score;
}

function createContext(rawQuery) {
  const terms = queryTerms(rawQuery);
  return { normalized: normalizeText(rawQuery), terms, core: terms.map(term => term.primary) };
}
const compareEntries = (a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0;

// Rank every matching page, then cap the displayed rows while keeping the real total.
export function search(index, rawQuery, { limit = 8, selectedStage = 'all', stageOrder = [] } = {}) {
  const context = createContext(rawQuery);
  const result = { query: context.normalized, terms: context.terms.map(term => term.word), total: 0, matches: [], suggestions: [], limited: false };
  if (!Array.isArray(index) || !context.terms.length) return result;
  const ranked = [];
  for (const entry of index) {
    const score = scorePage(entry, context, { stageOrder, selectedStage });
    if (score !== null && Number.isFinite(score)) ranked.push({ entry, score });
  }
  ranked.sort((a, b) => b.score - a.score || compareEntries(a.entry, b.entry));
  const rows = Math.max(1, Number(limit) || 8);
  result.matches = ranked.slice(0, rows).map(hit => hit.entry);
  result.total = ranked.length;
  result.limited = ranked.length > result.matches.length;
  if (!result.total) result.suggestions = suggestCorrections(rawQuery, index);
  return result;
}

// Levenshtein distance with an optional cap; suggestions only need to know "within one".
export function editDistance(a, b, max = Infinity) {
  a = String(a ?? '');
  b = String(b ?? '');
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max === Infinity ? Math.abs(a.length - b.length) : max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length];
}

function withinOneEdit(a, b) {
  if (a === b) return true;
  if (editDistance(a, b, 1) <= 1) return true;
  // A single swapped pair (hosre → horse) is a common typo; Levenshtein calls it two edits.
  if (a.length === b.length) {
    const different = [];
    for (let i = 0; i < a.length && different.length <= 2; i++) if (a[i] !== b[i]) different.push(i);
    if (different.length === 2 && different[1] === different[0] + 1) {
      const [i, j] = different;
      return a[i] === b[j] && a[j] === b[i];
    }
  }
  return false;
}

// Vocabulary comes from the words a player can see (title, summary, tags, headings), not the whole body.
const VOCABULARY = new WeakMap();
function vocabulary(index) {
  if (VOCABULARY.has(index)) return VOCABULARY.get(index);
  const words = new Map();
  for (const entry of index) {
    for (const field of ['title', 'summary', 'tags', 'headings']) {
      for (const word of tokenize(fieldValue(entry, field))) {
        if (word.length < 3 || STOP_WORDS.has(word)) continue;
        if (!words.has(stem(word))) words.set(stem(word), word);
        if (!words.has(word)) words.set(word, word);
      }
    }
  }
  VOCABULARY.set(index, words);
  return words;
}

// Offer indexed terms one typo away from an unmatched query word. Empty when nothing is close.
export function suggestCorrections(rawQuery, index, { limit = 3 } = {}) {
  if (!Array.isArray(index) || !index.length) return [];
  const words = vocabulary(index);
  const suggestions = [];
  for (const word of tokenize(rawQuery)) {
    if (word.length < 3 || STOP_WORDS.has(word) || words.has(word)) continue;
    let best = null;
    for (const [key, display] of words) {
      if (Math.abs(key.length - word.length) > 1) continue;
      if (!withinOneEdit(word, key)) continue;
      const distance = editDistance(word, key, 2);
      if (!best || distance < best.distance || (distance === best.distance && display.length < best.suggestion.length)) best = { term: word, suggestion: display, distance };
    }
    if (best && !suggestions.some(suggestion => suggestion.suggestion === best.suggestion)) suggestions.push(best);
  }
  return suggestions.slice(0, Math.max(1, Number(limit) || 3));
}

export default search;
