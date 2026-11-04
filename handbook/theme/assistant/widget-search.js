const STOP = new Set('a an and are as at be by can could do does for from had has have how i if in into is it its me my of on or our so than that the their them then there these they this to was we were what when where which who why will with you your about after before over under'.split(' '));
const SYNONYM = new Map([
  ['banking', 'bank'], ['gold', 'bank'], ['money', 'bank'],
  ['begin', 'start'], ['starting', 'start'], ['join', 'guild'], ['guilds', 'guild'],
  ['stuck', 'quest'], ['questline', 'questline'], ['quests', 'quest'],
  ['level', 'level'], ['levels', 'level'], ['renown', 'renown'], ['stars', 'star'],
  ['breaches', 'breach'], ['dungeons', 'dungeon'], ['ships', 'ship'], ['maps', 'map'],
  ['armour', 'armor'], ['armors', 'armor'], ['weapons', 'weapon'], ['spells', 'spell']
]);

const tokens = value => String(value ?? '').toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
const termsOf = value => tokens(value).filter(t => !STOP.has(t)).map(t => SYNONYM.get(t) ?? t).filter(t => t.length > 1 || t === 'q');
const stem = term => term.length > 4 ? term.replace(/(?:ing|ed|es|s)$/, '') : term;
const normalize = list => list.map(stem).filter(Boolean);
const textOf = doc => [doc.title, doc.summary, ...(doc.tags ?? []), ...(doc.headings ?? []), doc.body, ...Object.values(doc.sections ?? {}).map(s => `${s.title ?? ''} ${s.excerpt ?? ''}`)].join(' ');

export function buildSearchIndex(docs) {
  const entries = docs.map(doc => {
    const terms = normalize(termsOf(textOf(doc)));
    const freq = new Map();
    for (const term of terms) freq.set(term, (freq.get(term) ?? 0) + 1);
    return { doc, terms, freq, length: terms.length };
  });
  const df = new Map();
  for (const entry of entries) for (const term of new Set(entry.terms)) df.set(term, (df.get(term) ?? 0) + 1);
  const avg = entries.reduce((sum, entry) => sum + entry.length, 0) / Math.max(1, entries.length);
  return { entries, df, avg, total: entries.length };
}

function bm25(query, corpus) {
  const terms = normalize(termsOf(query));
  if (!terms.length) return [];
  const k1 = 1.2, b = .75;
  return corpus.entries.map(entry => {
    let score = 0;
    for (const term of terms) {
      const df = corpus.df.get(term) ?? 0;
      if (!df) continue;
      const idf = Math.log(1 + (corpus.total - df + .5) / (df + .5));
      const freq = entry.freq.get(term) ?? 0;
      if (freq) score += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * entry.length / corpus.avg));
    }
    const title = normalize(termsOf(entry.doc.title));
    const tags = normalize(termsOf((entry.doc.tags ?? []).join(' ')));
    for (const term of terms) {
      if (title.includes(term)) score += 3;
      if (tags.includes(term)) score += 1.5;
    }
    return { doc: entry.doc, score };
  }).filter(row => row.score > 0).sort((a, b) => b.score - a.score);
}

function bestSection(doc, query) {
  const terms = normalize(termsOf(query));
  let best = null, bestScore = 0;
  for (const [slug, section] of Object.entries(doc.sections ?? {})) {
    const haystack = normalize(termsOf(`${section.title ?? ''} ${section.excerpt ?? ''}`));
    let score = 0;
    for (const term of terms) if (haystack.includes(term)) score += 1;
    if (score > bestScore) { bestScore = score; best = { slug, ...section }; }
  }
  return best;
}

export function findPassages(corpus, query, limit = 3) {
  const ranked = bm25(query, corpus).slice(0, limit);
  if (!ranked.length) return { ranked: [], strong: false };
  const terms = normalize(termsOf(query));
  const top = ranked[0];
  const fields = normalize(termsOf([top.doc.title, ...(top.doc.tags ?? []), ...(top.doc.headings ?? [])].join(' ')));
  const strong = top.score >= 3.5 || terms.some(term => fields.includes(term));
  return {
    ranked: ranked.map(({ doc }) => {
      const section = bestSection(doc, query);
      return { doc, section, excerpt: section?.excerpt || doc.excerpt || doc.summary || '' };
    }),
    strong
  };
}
