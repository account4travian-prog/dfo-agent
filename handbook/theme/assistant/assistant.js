const root = document.querySelector('.guide-assistant');
const form = document.querySelector('.ga-form');
const input = document.getElementById('ga-query');
const status = document.getElementById('ga-status');
const answer = document.getElementById('ga-answer');
const factsBox = document.getElementById('ga-facts');
const factList = document.getElementById('ga-fact-list');
const modelBox = document.getElementById('ga-model');
const modelAnswer = document.getElementById('ga-model-answer');
const modelCitations = document.getElementById('ga-model-citations');
const modelNote = document.getElementById('ga-model-note');
const askButton = document.getElementById('ga-ask');
const portrait = document.querySelector('.archivist-portrait');
let lastQuery = '';
let index = null;
let facts = null;

const STOP = new Set('a an and are as at be by can could do does for from had has have how i if in into is it its me my of on or our so than that the their them then there these they this to was we were what when where which who why will with you your about after before over under'.split(' '));
const SYNONYM = new Map([
  ['banking', 'bank'], ['gold', 'bank'], ['money', 'bank'],
  ['begin', 'start'], ['starting', 'start'], ['join', 'guild'], ['guilds', 'guild'],
  ['stuck', 'quest'], ['questline', 'questline'], ['quests', 'quest'],
  ['level', 'level'], ['levels', 'level'], ['renown', 'renown'], ['stars', 'star'],
  ['breaches', 'breach'], ['dungeons', 'dungeon'], ['ships', 'ship'], ['maps', 'map'],
  ['armour', 'armor'], ['armors', 'armor'], ['weapons', 'weapon'], ['spells', 'spell']
]);

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const tokens = value => String(value ?? '').toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+/g) ?? [];
const termsOf = value => tokens(value).filter(t => !STOP.has(t)).map(t => SYNONYM.get(t) ?? t).filter(t => t.length > 1 || t === 'q');
const stem = term => term.length > 4 ? term.replace(/(?:ing|ed|es|s)$/, '') : term;
const normalize = list => list.map(stem).filter(Boolean);
const textOf = doc => [doc.title, doc.summary, ...(doc.tags ?? []), ...(doc.headings ?? []), doc.body, ...Object.values(doc.sections ?? {}).map(s => `${s.title ?? ''} ${s.excerpt ?? ''}`)].join(' ');

function buildIndex(docs) {
  const entries = docs.map(doc => {
    const text = textOf(doc);
    const terms = normalize(termsOf(text));
    const freq = new Map();
    for (const term of terms) freq.set(term, (freq.get(term) ?? 0) + 1);
    return { doc, terms, freq, length: terms.length };
  });
  const df = new Map();
  for (const entry of entries) for (const term of new Set(entry.terms)) df.set(term, (df.get(term) ?? 0) + 1);
  const avg = entries.reduce((sum, e) => sum + e.length, 0) / Math.max(1, entries.length);
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
    // Title and tag matches are stronger signals than a long body mention.
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
    const text = `${section.title ?? ''} ${section.excerpt ?? ''}`;
    let score = 0;
    const haystack = normalize(termsOf(text));
    for (const term of terms) if (haystack.includes(term)) score += 1;
    if (score > bestScore) { bestScore = score; best = { slug, ...section }; }
  }
  return best;
}

function href(url, anchor) {
  const path = String(url ?? './');
  return `../${path}${anchor ? `#${anchor}` : ''}`;
}

function render(query) {
  if (!index) return;
  lastQuery = query.trim();
  setPortrait('idle');
  hideModel();
  const live = /(who is the best|best player|online now|server status|current price|price of|how many players|population|leaderboard|who's online)/i.test(query);
  if (live) {
    status.textContent = 'That is a live or player-specific question; the guide does not hold live player or market data.';
    answer.innerHTML = '<h2>The guide does not answer that</h2><p>It covers rules, systems, quests and places - not who is online, current prices, seat holders or account data.</p>';
    factsBox.hidden = true;
    return;
  }
  const ranked = bm25(query, index).slice(0, 4);
  if (!ranked.length) {
    status.textContent = `No passage matched “${query}”. The guide may not cover this yet.`;
    answer.innerHTML = '<h2>No match</h2><p>Try a game system, item, quest or place name. The guide does not answer live player, price or account questions.</p>' + contributeBlock(query);
    factsBox.hidden = true;
    hideModel();
    return;
  }
  const queryTerms = normalize(termsOf(query));
  const top = ranked[0];
  const topFields = normalize(termsOf([top.doc.title, ...(top.doc.tags ?? []), ...(top.doc.headings ?? [])].join(' ')));
  const strong = top.score >= 3.5 || queryTerms.some(term => topFields.includes(term));
  if (!strong) {
    status.textContent = 'No strong match in the guide. It may not cover this yet.';
    answer.innerHTML = '<h2>No strong match</h2><p>Try a game system, item, quest or place name. The guide does not answer live player, price or account questions.</p>' + contributeBlock(query);
    factsBox.hidden = true;
    hideModel();
    return;
  }
  status.textContent = ranked.length + ' of the closest passages in the guide.';
  const cards = ranked.map(({ doc }, i) => {
    const section = bestSection(doc, query);
    const excerpt = section?.excerpt || doc.excerpt || doc.summary || '';
    const link = href(doc.url, section?.slug);
    return `<article class="ga-card${i === 0 ? ' is-best' : ''}"><div class="ga-card-head"><span class="eyebrow">${esc(doc.stage)}${doc.stageId === 'reference' ? '' : ` · ${esc(doc.gate)}`}</span><span class="ga-status-chip">${esc(doc.status ?? 'published')}</span></div><h3><a href="${esc(link)}">${esc(doc.title)}</a></h3>${section?.title ? `<p class="ga-section">Section: ${esc(section.title)}</p>` : ''}<p>${esc(excerpt)}</p><div class="ga-card-foot"><a href="${esc(link)}">Read this page${section ? ' at this section' : ''} →</a>${doc.url.startsWith('quests/') ? '<span class="ga-muted">Quest guide</span>' : ''}</div></article>`;
  }).join('');
  answer.innerHTML = `<h2>Closest passages</h2>${cards}`;
  renderFacts(query);
}

function renderFacts(query) {
  if (!facts?.facts) { factsBox.hidden = true; return; }
  const terms = new Set(normalize(termsOf(query)));
  const matches = Object.entries(facts.facts).map(([id, fact]) => {
    const hay = normalize(termsOf(`${id} ${fact.label ?? ''} ${fact.unit ?? ''}`));
    let score = 0;
    for (const term of terms) if (hay.includes(term)) score += 1;
    return { id, fact, score };
  }).filter(row => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!matches.length) { factsBox.hidden = true; return; }
  factsBox.hidden = false;
  factList.innerHTML = matches.map(({ id, fact }) => `<article class="ga-fact"><strong>${esc(fact.label ?? id)}</strong> <span class="ga-value">${esc(fact.value)} ${esc(fact.unit ?? '')}</span><small>${esc(fact.source ?? '')} · <code>${esc(fact.symbol ?? id)}</code>${fact.appliesOnline ? ` · online: ${esc(fact.appliesOnline)}` : ''}</small></article>`).join('');
}


function setPortrait(state) {
  if (portrait) portrait.dataset.archivistState = state;
}

function contributeBlock(query) {
  const href = "../contribute/?q=" + encodeURIComponent(query);
  return "<div class=\"ga-contribute\"><p>If the guide should cover this, you can help:</p><div class=\"ga-contribute-actions\"><a class=\"ga-contribute-link\" href=\"" + esc(href) + "\">Submit a Manuscript</a><button type=\"button\" class=\"ga-request-answer\" data-request-answer data-question=\"" + esc(query) + "\">Request answer</button></div><p class=\"ga-contribute-note\">Manuscripts are edited and moderated for factual correctness and readability. Requests are added to the guide-expansion queue.</p></div>";
}

function hideModel() {
  if (!modelBox) return;
  modelBox.hidden = true;
  modelAnswer.innerHTML = "";
  modelCitations.innerHTML = "";
  modelNote.textContent = "";
}

function linkFor(url, anchor) {
  const path = String(url ?? "./");
  return "../" + path + (anchor ? "#" + anchor : "");
}

function renderModel(data) {
  if (!modelBox) return;
  modelBox.hidden = false;
  if (data.mode === "no-coverage") {
    modelAnswer.innerHTML = "<p>The guide does not cover that.</p>";
    modelCitations.innerHTML = "";
    modelNote.textContent = "No written answer was added. The quoted passages below are the closest records.";
    return;
  }
  const paragraphs = String(data.answer ?? "").split(/\n{2,}/).map(part => "<p>" + esc(part).replace(/\n/g, "<br>") + "</p>").join("");
  modelAnswer.innerHTML = paragraphs || "<p>" + esc(data.answer ?? "") + "</p>";
  modelCitations.innerHTML = (data.citations ?? []).map(cite => {
    const label = cite.section ? cite.title + " · " + cite.section : cite.title;
    return "<a href=\"" + esc(linkFor(cite.url, cite.anchor)) + "\">" + esc(label) + "</a>";
  }).join("");
  const usage = data.usage?.budgetUsedUsd != null ? " Estimated guide budget used: USD " + Number(data.usage.budgetUsedUsd).toFixed(4) + "." : "";
  modelNote.textContent = "Checked against the passages below and the guide facts." + usage;
}

async function askModel(query) {
  if (!query) { status.textContent = "Type a question first."; input.focus(); return; }
  askButton.disabled = true;
  askButton.textContent = "Reading...";
  setPortrait('reading');
  modelBox.hidden = false;
  modelAnswer.innerHTML = "<p class=\"ga-loading\">The Archivist opens the book and reads...</p>";
  modelCitations.innerHTML = "";
  modelNote.textContent = "";
  status.textContent = "The Archivist is reading the guide...";
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: query })
    });
    if (response.redirected || response.url.includes("cloudflareaccess")) throw Error("access-sign-in");
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) throw Error(data?.error ?? "assistant unavailable");
    if (data.mode === "model" || data.mode === "no-coverage") {
      renderModel(data);
      setPortrait(data.mode === "model" ? "speaking" : "idle");
      status.textContent = data.mode === "model" ? "A written answer, checked against the guide passages." : "The guide does not cover that question.";
    } else {
      hideModel();
      setPortrait('idle');
      status.textContent = data.fallback === "monthly budget reached" ? "The written-answer budget is used up for this month; the guide passages are below." : "The written answer was not available; the guide passages are below.";
    }
  } catch (error) {
    setPortrait('idle');
    modelBox.hidden = false;
    modelAnswer.innerHTML = "<p>The written answer did not come back. The quoted guide passages are still below.</p>";
    modelCitations.innerHTML = "";
    modelNote.textContent = error?.message === "access-sign-in"
      ? "The model endpoint redirected to the Cloudflare Access sign-in. Refresh this page after signing in."
      : "If you are signed in and this persists, the model layer or its budget may be unavailable.";
    status.textContent = "The written-answer layer is unavailable; the quoted guide passages are below.";
  } finally {
    if (portrait?.dataset.archivistState === 'reading') setPortrait('idle');
    askButton.disabled = false;
    askButton.textContent = "Ask the Archivist";
  }
}

askButton?.addEventListener("click", () => {
  const query = input.value.trim();
  if (!query) { status.textContent = "Type a question first."; input.focus(); return; }
  render(query);
  askModel(query);
});

document.addEventListener("click", async event => {
  const button = event.target.closest?.("[data-request-answer]");
  if (!button) return;
  const question = button.dataset.question || input.value.trim();
  if (!question) { status.textContent = "Type a question first."; input.focus(); return; }
  button.disabled = true;
  const original = button.textContent;
  button.textContent = "Sending...";
  try {
    const response = await fetch("/api/request-answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, page: "ask" }) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) throw Error(result?.error ?? "request failed");
    button.textContent = "Request received";
  } catch {
    button.disabled = false;
    button.textContent = "Try request again";
    status.textContent = "The request could not be sent; use the Discord link in the footer.";
    return;
  }
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const query = input.value.trim();
  if (query) render(query);
});
document.querySelectorAll('.ga-example').forEach(button => button.addEventListener('click', () => {
  input.value = button.textContent.trim();
  render(input.value);
}));

Promise.all([
  fetch('../search-index.json').then(r => r.ok ? r.json() : []),
  fetch('../facts/facts.json').then(r => r.ok ? r.json() : null).catch(() => null)
]).then(([docs, data]) => {
  index = buildIndex(docs);
  facts = data;
  status.textContent = `Ask a question. ${docs.length} pages and ${Object.keys(data?.facts ?? {}).length} checked numbers are searchable.`;
  const incoming = new URLSearchParams(location.search).get('q');
  if (incoming) { input.value = incoming; render(incoming); }
}).catch(error => {
  status.textContent = `The guide index did not load (${error.message}).`;
});
