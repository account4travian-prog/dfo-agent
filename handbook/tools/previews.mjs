import { plainText, slugify } from './markdown.mjs';
// Quote prose only: headings identify sections but never supply the excerpt.
export function extractPreviews(markdown) {
  const state = {
    sections: {},
    counts: new Map(),
    ids: new Set(),
    excerpt: '',
    active: [],
    skipped: false,
    fence: null,
    paragraph: []
  };
  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) consumeLine(state, line);
  flushParagraph(state);
  return {
    excerpt: state.excerpt, sections: state.sections
  };
}
// Exclude components, lists, quotes and tables before collecting plain paragraphs.
function consumeLine(state, line) {
  const opening = line.match(/^\s*(`{3,}|~{3,})/);
  if (opening) {
    flushParagraph(state);
    if (!state.fence) state.fence = opening[1];
    else if (opening[1][0] === state.fence[0] && opening[1].length >= state.fence.length) state.fence = null;
    return;
  }
  if (state.fence) return;
  const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
  if (heading) {
    flushParagraph(state);
    consumeHeading(state, heading);
    return;
  }
  if (!line.trim() || /^\s*(?:>|[-+*]\s|\d+[.)]\s|\||[-*_]{3,})/.test(line)) {
    flushParagraph(state);
    return;
  }
  if (!state.skipped && !/^\s*!\[/.test(line)) state.paragraph.push(line.trim());
}
// Keep section IDs aligned with the renderer, including repeated explicit suffixes.
function consumeHeading(state, heading) {
  const level = heading[1].length, title = plainText(heading[2]);
  const base = slugify(title);
  let n = (state.counts.get(base) || 0) + 1;
  let id = n === 1 ? base: `${base}-${n}`;
  while (state.ids.has(id)) id = `${base}-${++n}`;
  state.counts.set(base, n);
  state.ids.add(id);
  state.active = state.active.filter(section => section.level < level);
  state.active.push({
    id, level
  });
  state.sections[id] = {
    title, excerpt: ''
  };
  state.skipped = state.active.some(section => /^(?:at[- ]a[- ]glance|sources)(?:\b|$)/i.test(state.sections[section.id].title));
}
// The first qualifying paragraph belongs to its enclosing sections as well as the page.
function flushParagraph(state) {
  const text = plainText(state.paragraph.join(' '));
  state.paragraph = [];
  if (!text || state.skipped) return;
  state.excerpt ||= text;
  for (const section of state.active) state.sections[section.id].excerpt ||= text;
}
