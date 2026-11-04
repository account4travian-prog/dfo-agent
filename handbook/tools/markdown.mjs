import { icon } from './icons.mjs';
/** Dependency-free, deliberately bounded Markdown. Raw HTML is always text. */
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}
[c]));
export const plainText = s => String(s).replace(/!?(?:\[([^\]]+)\])\([^)]*\)/g, '$1').replace(/[`*_]/g, '').replace(/<[^>]*>/g, '').trim();
export const slugify = s => plainText(s).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/[\s-]+/g, '-') || 'section';
// Parse inline front-matter lists while respecting quoted commas.
function scalarList(raw) {
  if (!raw.endsWith(']')) throw Error(`Unclosed list: ${raw}`);
  const parts = [];
  let current = '', q = '', escape = false;
  for (const c of raw.slice(1, - 1)) {
    if (escape) {
      current += c;
      escape = false;
      continue;
    }
    if (c === '\\' && q === '"') {
      current += c;
      escape = true;
      continue;
    }
    if (q) {
      current += c;
      if (c === q) q = '';
    } else if ((c === '"' || c === "'") && !current.trim()) {
      // A quote opens only at the start of an item, so "Dagon's Breach" stays a plain word.
      current += c;
      q = c;
    } else if (c === ',') {
      parts.push(current);
      current = '';
    } else current += c;
  }
  if (q) throw Error(`Unclosed quote in list: ${raw}`);
  if (current.trim()) parts.push(current);
  return parts.map(s => scalar(s.trim()));
}
// Parse one front-matter scalar and strip only unquoted comments.
function scalar(raw) {
  raw = raw.trim();
  let quote = '', escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === '\\' && quote === '"') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '#' && (i === 0 || /\s/.test(raw[i - 1]))) {
      raw = raw.slice(0, i).trim();
      break;
    }
  }
  if (raw.startsWith('"')) {
    try {
      return JSON.parse(raw);
    } catch {
      throw Error(`Invalid quoted value: ${raw}`);
    }
  }
  if (raw.startsWith("'")) {
    if (!raw.endsWith("'")) throw Error(`Unclosed quote: ${raw}`);
    return raw.slice(1, - 1).replace(/''/g, "'");
  }
  if (raw.startsWith('[')) return scalarList(raw);
  raw = raw.replace(/\s+#.*$/, '').trim();
  return /^-?\d+(?:\.\d+)?$/.test(raw) ? Number(raw): raw;
}
// Parse the supported front-matter subset without permitting raw YAML execution.
export function parseFrontMatter(text) {
  text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) return {
    data: {}, body: text, hasFrontMatter: false
  };
  const end = text.indexOf('\n---', 4);
  if (end < 0 || !/^(?:\n|$)/.test(text.slice(end + 4))) throw Error('Unclosed front matter');
  const data = {};
  for (const line of text.slice(4, end).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) throw Error(`Invalid front matter line: ${line}`);
    if (Object.hasOwn(data, m[1])) throw Error(`Duplicate front matter key: ${m[1]}`);
    data[m[1]] = scalar(m[2]);
  }
  return {
    data, body: text.slice(end + 4).replace(/^\n/, ''), hasFrontMatter: true
  };
}
// Resolve only known finite numeric facts and record which were used.
export function resolveFacts(text, facts = {}, used = new Set()) {
  const result = text.replace(/\{\{fact\s+([^}]+)\}\}/g, (_, raw) => {
    const id = raw.trim();
    if (!Object.hasOwn(facts, id)) throw Error(`Unknown fact id: ${id}`);
    const value = facts[id].value;
    if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(`Invalid numeric fact: ${id}`);
    used.add(id);
    return String(value);
  });
  if (/\{\{fact\b/.test(result)) throw Error('Malformed fact placeholder; use {{fact id}}');
  return result;
}
export const safeUrl = url => !/[\u0000-\u0020\u007f\\]/.test(url) && (!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url) || /^(?:https?:|mailto:)/i.test(url));
// Render bounded Markdown with escaped text and per-page component state.
export function renderMarkdown(source, options = {}) {
  const state = {
    options,
    headings: [],
    links: [],
    images: [],
    tableIds: [],
    usedTerms: new Set(),
    counts: new Map(),
    headingIds: new Set(),
    checklistCount: 0
  };
  const html = blocks(state, source.replace(/\r\n?/g, '\n').split('\n'));
  const {
    headings, links, images, tableIds
  } = state;
  return {
    html, headings, links, images, tableIds
  };
}
// Shared syntax recognizers carry no per-page state.
const esc = escapeHtml;
const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(s => s.trim().replace(/\\\|/g, '|'));
const listMatch = line => line.match(/^(\s*)([-+*]|\d+[.)])\s+(.*)$/);
const special = (lines, i) => /^\s*$|^#{1,6}\s|^\s*(`{3,}|~{3,})|^\s*>|^\s*([-*_])(?:\s*\1){2,}\s*$/.test(lines[i]) || listMatch(lines[i]) || (lines[i + 1] && /^\s*\|?\s*:?-{3,}:?\s*(?:\||$)/.test(lines[i + 1]));
// Annotate only the first eligible occurrence of each glossary term.
function text(state, s, glossary) {
  if (!glossary || !state.options.glossary?.length) return esc(s);
  const terms = state.options.glossary.filter(t => !state.usedTerms.has(t.term.toLowerCase())).sort((a, b) => b.term.length - a.term.length);
  if (!terms.length) return esc(s);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${terms.map(t=>t.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  let out = '', pos = 0;
  for (const m of s.matchAll(re)) {
    const term = terms.find(t => t.term.toLowerCase() === m[0].toLowerCase());
    out += esc(s.slice(pos, m.index));
    if (state.usedTerms.has(term.term.toLowerCase())) out += esc(m[0]);
    else {
      state.usedTerms.add(term.term.toLowerCase());
      out += `<a class="glossary-term" href="${esc(term.url)}" title="${esc(term.definition)}" data-definition="${esc(term.definition)}">${esc(m[0])}</a>`;
    }
    pos = m.index + m[0].length;
  }
  return out + esc(s.slice(pos));
}
// Render inline syntax while keeping code and links out of glossary matching.
function inline(state, s, glossary = true, allowLinks = true) {
  let out = '', i = 0, start = 0;
  const flush = () => {
    out += text(state, s.slice(start, i), glossary);
  };
  while (i < s.length) {
    const rest = s.slice(i);
    let m;
    if ((m = rest.match(/^\\([\\`*_[\]{}()#+.!>|-])/))) {
      flush();
      out += esc(m[1]);
      i += m[0].length;
      start = i;
      continue;
    }
    if ((m = rest.match(/^(`+)([\s\S]*?)\1(?!`)/))) {
      flush();
      out += `<code>${esc(m[2])}</code>`;
      i += m[0].length;
      start = i;
      continue;
    }
    if (allowLinks && (m = rest.match(/^(!?)\[([^\]]*)\]\((<[^>]+>|(?:[^\s()]|\([^)]*\))*)(?:\s+"([^"]*)")?\)/))) {
      flush();
      out += renderInlineLink(state, m);
      i += m[0].length;
      start = i;
      continue;
    }
    if ((m = rest.match(/^(\*\*|__)(?=\S)([\s\S]*?\S)\1/)) || (m = rest.match(/^(\*|_)(?=\S)([^\n]*?\S)\1/))) {
      flush();
      const tag = m[1].length === 2 ? 'strong': 'em';
      out += `<${tag}>${inline(state, m[2],glossary,allowLinks)}</${tag}>`;
      i += m[0].length;
      start = i;
      continue;
    }
    i++;
  }
  flush();
  return out;
}
// Consume the complete fence before dispatching language and info string.
function fenceBlock(state, lines, i, m) {
  let out = '';
  const fence = m[1], lang = m[2], info = (m[3] || '').trim(), body = [];
  i++;
  while (i < lines.length && !new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`).test(lines[i])) body.push(lines[i++]);
  i++;
  if (lang === 'table') {
    state.tableIds.push(info);
    out += state.options.table?.(info) || `<p class="table-placeholder">Table: ${esc(info)}</p>`;
  } else if (lang === 'checklist') {
    if (info && !['daily', 'weekly'].includes(info)) throw Error(`Invalid checklist period: ${info}`);
    const period = info || 'daily';
    const id = `${state.options.checklistPage || 'page'}-${++state.checklistCount}`;
    out += `<fieldset class="checklist" data-checklist="${esc(id)}" data-period="${period}"><legend>${period === 'weekly' ? 'This week' : 'Today'}</legend><p class="checklist-reset">Resets ${period === 'weekly' ? 'Monday at 00:00 UTC' : 'at 00:00 UTC'}. Saved in this browser.</p>`;
    out += body.filter(line => line.trim()).map((line, n) => `<label><input type="checkbox" data-check="${n}" disabled><span>${inline(state, line.replace(/^\s*(?:[-*] |\[[ xX]\] )+/, ''))}</span></label>`).join('');
    out += '<noscript><p>Enable JavaScript to save your checklist.</p></noscript></fieldset>';
  } else {
    out += `<pre><code${lang?` class="language-${esc(lang)}"`:''}>${esc(body.join('\n'))}</code></pre>\n`;
  }
  return {
    html: out, next: i
  };
}
// Generate collision-free heading IDs shared by links and previews.
function headingBlock(state, lines, i, m) {
  let out = '';
  const base = slugify(m[2]);
  let n = (state.counts.get(base) || 0) + 1, id = n === 1 ? base: `${base}-${n}`;
  while (state.headingIds.has(id)) {
    n++;
    id = `${base}-${n}`;
  }
  state.counts.set(base, n);
  state.headingIds.add(id);
  state.headings.push({
    level: m[1].length, text: plainText(m[2]), id
  });
  out += `<h${m[1].length} id="${esc(id)}">${inline(state, m[2],false)}</h${m[1].length}>\n`;
  i++;
  return {
    html: out, next: i
  };
}
// Callouts and ordinary blockquotes share the recursive renderer.
function quoteBlock(state, lines, i, m) {
  let out = '';
  const quote = [];
  while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*> ?/, ''));
  const call = quote[0].match(/^\[!(tip|warning|online|example|note)\]\s*(.*)$/i);
  if (call) out += `<aside class="callout ${call[1].toLowerCase()}" aria-label="${esc(call[1])}"><p class="callout-title">${icon(call[1].toLowerCase(), state.options.iconSprite)}${inline(state, call[2]||call[1],false)}</p>${blocks(state, quote.slice(1))}</aside>\n`;
  else out += `<blockquote>${blocks(state, quote)}</blockquote>\n`;
  return {
    html: out, next: i
  };
}
// Preserve ordered starts and recursively render indented list items.
function listBlock(state, lines, i, m) {
  const line = lines[i];
  let out = '';
  const first = listMatch(line), indent = first[1].length, ordered = /\d/.test(first[2]), tag = ordered ? 'ol': 'ul';
  out += `<${tag}${ordered&&parseInt(first[2])!==1?` start="${parseInt(first[2])}"`:''}>`;
  while (i < lines.length) {
    const item = listMatch(lines[i]);
    if (!item || item[1].length !== indent || /\d/.test(item[2]) !== ordered) break;
    const body = [item[3]];
    i++;
    while (i < lines.length) {
      if (!lines[i].trim()) {
        if (lines[i + 1] && /^\s+\S/.test(lines[i + 1])) {
          body.push('');
          i++;
          continue;
        }
        break;
      }
      if ((listMatch(lines[i])?.[1].length ?? Infinity) <= indent || !/^\s+/.test(lines[i])) break;
      body.push(lines[i].slice(Math.min(indent + 2, lines[i].match(/^\s*/)[0].length)));
      i++;
    }
    out += `<li>${blocks(state, body)}</li>`;
    if (!lines[i]?.trim()) {
      while (i < lines.length && !lines[i].trim()) i++;
    }
  }
  out += `</${tag}>\n`;
  return {
    html: out, next: i
  };
}
// Keep comparison tables within an independent scroll region.
function tableBlock(state, lines, i, m) {
  const line = lines[i];
  let out = '';
  const header = cells(line), aligns = cells(lines[i + 1]).map(c => c.startsWith(':') ? (c.endsWith(':') ? 'center': 'left'): (c.endsWith(':') ? 'right': null));
  i += 2;
  const cell = (s, n, tag) => `<${tag}${tag === 'th' ? ' scope="col"': ''}${aligns[n]?` class="align-${aligns[n]}"`:''}>${inline(state, s,tag!=='th')}</${tag}>`;
  out += `<div class="table-scroll" role="region" aria-label="Comparison table" tabindex="0"><table><thead><tr>${header.map((s,n)=>cell(s,n,'th')).join('')}</tr></thead><tbody>`;
  while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
    out += `<tr>${header.map((_,n)=>cell(cells(lines[i])[n]||'',n,'td')).join('')}</tr>`;
    i++;
  }
  out += '</tbody></table></div>\n';
  return {
    html: out, next: i
  };
}
// Each block handler advances the cursor and returns only its own HTML.
function blocks(state, lines) {
  let out = '', i = 0;
  while (i < lines.length) {
    const line = lines[i];
    let m, result;
    if (!line.trim()) {
      i++;
      continue;
    }
    if ((m = line.match(/^\s*(`{3,}|~{3,})\s*([\w-]*)(?:\s+([^`]*))?$/))) result = fenceBlock(state, lines, i, m);
    else if ((m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/))) result = headingBlock(state, lines, i, m);
    else if (/^\s*>/.test(line)) result = quoteBlock(state, lines, i);
    else if (listMatch(line)) result = listBlock(state, lines, i);
    else if (lines[i + 1] && cells(lines[i + 1]).every(c => /^:?-{3,}:?$/.test(c))) result = tableBlock(state, lines, i);
    else if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) result = {
      html: '<hr>\n', next: i + 1
    };
    else if ((m = line.trim().match(/^!\[([^\]]*)\]\(([^\s]+)\s+"([^"]*)"\)$/))) result = {
      html: `<figure>${inline(state, `![${m[1]}](${m[2]})`,false)}<figcaption>${inline(state, m[3])}</figcaption></figure>\n`,
      next: i + 1
    };
    else {
      const paragraph = [line];
      let next = i + 1;
      while (next < lines.length && !special(lines, next)) paragraph.push(lines[next++]);
      result = {
        html: `<p>${inline(state, paragraph.join(' '))}</p>\n`, next
      };
    }
    out += result.html;
    i = result.next;
  }
  return out;
}
// Resolve links and images before producing escaped attributes.
function renderInlineLink(state, m) {
  let out = '';
  const url = m[3].replace(/^<|>$/g, '');
  if (m[1]) {
    state.images.push({
      url, alt: m[2]
    });
    const href = state.options.image?.(url) ?? url;
    out += safeUrl(href) ? `<img src="${esc(href)}" alt="${esc(m[2])}" loading="lazy">`: esc(m[0]);
  } else {
    state.links.push({
      url
    });
    const result = state.options.link?.(url) ?? {
      href: url
    };
    const r = typeof result === 'string' ? {
      href: result
    }
    : result;
    out += safeUrl(r.href) ? `<a href="${esc(r.href)}"${r.preview?` data-preview="${esc(r.preview)}"`:''}${r.title?` title="${esc(r.title)}"`:''}>${inline(state, m[2],false,false)}${r.later?' <span class="chip">later</span>':''}</a>`: esc(m[0]);
  }
  return out;
}
