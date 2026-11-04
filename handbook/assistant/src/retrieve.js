// Retrieval for the guide assistant. Pure, testable, no Cloudflare or model dependency.
const STOP = new Set('a an and are as at be by can could do does for from had has have how i if in into is it its me my of on or our so than that the their them then there these they this to was we were what when where which who why will with you your about after before over under'.split(' '));
const SYNONYMS = new Map([
  ['banking', 'bank'], ['gold', 'bank'], ['money', 'bank'],
  ['begin', 'start'], ['starting', 'start'], ['join', 'guild'], ['guilds', 'guild'],
  ['stuck', 'quest'], ['quests', 'quest'], ['levels', 'level'], ['stars', 'star'],
  ['breaches', 'breach'], ['dungeons', 'dungeon'], ['ships', 'ship'], ['maps', 'map'],
  ['armour', 'armor'], ['armors', 'armor'], ['weapons', 'weapon'], ['spells', 'spell']
]);
const stem = term => term.length > 4 ? term.replace(/(?:ing|ed|es|s)$/, '') : term;
const tokenize = value => String(value ?? '').toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
const terms = value => tokenize(value).filter(t => !STOP.has(t)).map(t => SYNONYMS.get(t) ?? t).filter(Boolean).map(stem);
const normalize = list => list.map(stem).filter(Boolean);

function textOf(doc) {
  return [doc.title, doc.summary, ...(doc.tags ?? []), ...(doc.headings ?? []), doc.body,
    ...Object.values(doc.sections ?? {}).map(s => `${s.title ?? ''} ${s.excerpt ?? ''}`)].join(' ');
}

export function createRetriever(docs) {
  const entries = docs.map(doc => {
    const all = normalize(terms(textOf(doc)));
    const freq = new Map();
    for (const term of all) freq.set(term, (freq.get(term) ?? 0) + 1);
    return { doc, freq, length: all.length };
  });
  const df = new Map();
  for (const entry of entries) for (const term of new Set(entry.freq.keys())) df.set(term, (df.get(term) ?? 0) + 1);
  const avg = entries.reduce((sum, e) => sum + e.length, 0) / Math.max(1, entries.length);
  const total = entries.length;

  function search(query, limit = 4) {
    const queryTerms = normalize(terms(query));
    if (!queryTerms.length) return [];
    const k1 = 1.2, b = .75;
    const scored = entries.map(entry => {
      let score = 0;
      for (const term of queryTerms) {
        const freq = entry.freq.get(term) ?? 0;
        if (!freq) continue;
        const docsWith = df.get(term) ?? 0;
        const idf = Math.log(1 + (total - docsWith + .5) / (docsWith + .5));
        score += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * entry.length / avg));
      }
      const title = normalize(terms(entry.doc.title));
      const tags = normalize(terms((entry.doc.tags ?? []).join(' ')));
      for (const term of queryTerms) {
        if (title.includes(term)) score += 3;
        if (tags.includes(term)) score += 1.5;
      }
      return { doc: entry.doc, score };
    }).filter(row => row.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    return scored.map(row => {
      const section = bestSection(row.doc, query);
      return {
        ...row,
        section,
        excerpt: section?.excerpt || row.doc.excerpt || row.doc.summary || ''
      };
    });
  }

  return { search, docs: entries };
}

export function bestSection(doc, query) {
  const queryTerms = normalize(terms(query));
  let best = null, bestScore = 0;
  for (const [slug, section] of Object.entries(doc.sections ?? {})) {
    const haystack = normalize(terms(`${section.title ?? ''} ${section.excerpt ?? ''}`));
    let score = 0;
    for (const term of queryTerms) if (haystack.includes(term)) score += 1;
    if (score > bestScore) { bestScore = score; best = { slug, ...section }; }
  }
  return best;
}

export function contextOf(hits) {
  return hits.map((hit, i) => {
    const section = hit.section?.title ? `\nSECTION: ${hit.section.title}` : '';
    return `[${i + 1}] ${hit.doc.title}\nURL: ${hit.doc.url}${section}\n${hit.excerpt}`;
  }).join('\n\n');
}
