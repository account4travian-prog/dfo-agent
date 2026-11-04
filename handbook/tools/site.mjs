import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter, renderMarkdown, resolveFacts, plainText, slugify } from './markdown.mjs';
import { tables } from './tables.mjs';
export const handbookRoot = fileURLToPath(new URL('../', import.meta.url));
export const posix = s => s.split(path.sep).join('/');
export const relativeUrl = (from, to) => {
  const r = path.posix.relative(path.posix.dirname(from), to);
  return (r || './').replace(/index\.html$/, '') || './';
};
export const gateLabel = gate => {
  const s = String(gate || 'none');
  if (/^none$/i.test(s)) return 'Available from the start';
  return /^renown \d+$/i.test(s) ? `Unlocks at Renown ${s.split(' ')[1]}`: /^level \d+$/i.test(s) ? `Unlocks at character level ${s.split(' ')[1]}`: /^registered$/i.test(s) ? 'Registered account': s.replace(/^(?:other|quest)\s+["']?(.*?)["']?$/i, (_, v) => /^quest/i.test(s) ? `Quest: ${v}`: v);
};
export const isForwardLink = (from, to, stages) => from !== to && to !== 'reference' && from !== 'reference' && stages.findIndex(s => s.id === to) > stages.findIndex(s => s.id === from);
// Walk source files in a stable order; a missing optional directory is empty.
export async function walk(dir) {
  try {
    const entries = await readdir(dir, {
      withFileTypes: true
    });
    return (await Promise.all(entries.sort((a, b) => a.name.localeCompare(b.name)).map(e => e.isDirectory() ? walk(path.join(dir, e.name)): path.join(dir, e.name)))).flat();
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}
// Read a JSON input, allowing a fallback only for an absent file.
export async function readJson(file, fallback) {
  try {
    // Editors on Windows can leave a byte-order mark; JSON.parse does not accept one.
    return JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
  } catch (e) {
    if (e.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw e;
  }
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Render a committed ISO calendar date the way a player reads it, without locale data.
export function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return '';
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month} ${match[1]}`: '';
}
// Normalize the committed sync record; an absent file falls back to the facts commit only.
export function normalizeSync(sync, fallbackCommit) {
  const text = value => typeof value === 'string' ? value.trim(): '';
  const commit = value => /^[a-f\d]{7,40}$/i.test(text(value)) ? text(value): '';
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value): '';
  const data = sync && typeof sync === 'object' && !Array.isArray(sync) ? sync: {};
  const sourceCommit = commit(data.sourceCommit);
  const dates = {};
  if (data.commitDates && typeof data.commitDates === 'object' && !Array.isArray(data.commitDates)) {
    for (const [hash, value] of Object.entries(data.commitDates)) if (commit(hash) && date(value)) dates[hash] = value;
  }
  const sourceDate = date(data.sourceDate), guideCommit = commit(data.guideCommit), guideDate = date(data.guideDate), checkedAt = date(data.checkedAt);
  // A date stated for the sync commits stays usable for a page verified at that commit.
  if (sourceCommit && sourceDate) dates[sourceCommit] ||= sourceDate;
  if (guideCommit && guideDate) dates[guideCommit] ||= guideDate;
  return {
    sourceCommit: sourceCommit || commit(fallbackCommit),
    sourceDate,
    guideCommit,
    guideDate,
    commitsBehind: Number.isInteger(data.commitsBehind) && data.commitsBehind >= 0 ? data.commitsBehind: null,
    checkedAt,
    commitDates: dates,
    configured: Boolean(sourceCommit)
  };
}
// Resolve a verified page hash to a committed date, when the sync record names it.
export function commitDate(sync, hash) {
  if (!sync || !hash) return '';
  if (sync.commitDates && Object.hasOwn(sync.commitDates, hash)) return sync.commitDates[hash];
  if (hash === sync.sourceCommit) return sync.sourceDate || '';
  if (hash === sync.guideCommit) return sync.guideDate || '';
  return '';
}
// Load and validate the complete source graph before any output is replaced.
export async function loadSite({
  root = handbookRoot,
  contentDir = path.join(root, 'content'),
  factsFile = path.join(root, 'facts/facts.json'),
  syncFile = path.join(root, 'facts/sync.json'),
  stagesFile = path.join(root, 'stages.json')
} = {}) {
  const {
    stages
  } = await readJson(stagesFile);
  const factData = await readJson(factsFile);
  if (!Array.isArray(stages) || new Set(stages.map(stage => stage.id)).size !== stages.length || stages.some(stage => !/^[-a-z0-9]+$/.test(stage.id))) throw Error('stages.json must contain unique safe stage ids');
  const site = {
    root,
    contentDir,
    stages,
    factData,
    syncData: normalizeSync(await readJson(syncFile, null), factData.commit),
    pages: [],
    bySource: new Map(),
    byUrl: new Map(),
    errors: [],
    warnings: []
  };
  await readPages(site);
  site.pages.sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage) || a.meta.order - b.meta.order || a.slug.localeCompare(b.slug));
  for (const page of site.pages) {
    if (site.byUrl.has(page.url)) site.errors.push(`${page.source}: duplicate slug within stage: ${page.slug}`);
    site.bySource.set(page.source, page);
    site.byUrl.set(page.url, page);
  }
  await validateAssets(site);
  for (const page of site.pages) validateLinks(page, site);
  site.glossary = extractGlossary(site);
  return site;
}
// Parse each source independently so a check reports every actionable failure.
async function readPages(site) {
  for (const file of(await walk(site.contentDir)).filter(file => file.endsWith('.md'))) {
    const source = posix(path.relative(site.contentDir, file));
    try {
      const parsed = parseFrontMatter(await readFile(file, 'utf8'));
      const meta = parsed.data;
      const slug = path.basename(file, '.md');
      const page = {
        ...parsed,
        meta,
        source,
        file,
        slug,
        stage: site.stages.find(stage => stage.id === meta.stage),
        url: `${meta.stage}/${slug}/index.html`,
        usedFacts: new Set()
      };
      validateMetadata(page, site);
      page.resolved = resolveFacts(page.body, site.factData.facts, page.usedFacts);
      page.render = renderMarkdown(page.resolved);
      validatePageBody(page, site);
      site.pages.push(page);
    } catch (error) {
      site.errors.push(`${source}: ${error.message}`);
    }
  }
}
// Planned pages require just their navigation metadata; drafts retain normal checks.
function validateMetadata(page, site) {
  const {
    meta, source, slug
  } = page;
  const error = message => site.errors.push(`${source}: ${message}`);
  const planned = meta.status === 'planned';
  if (meta.status && !['planned', 'draft', 'published'].includes(meta.status)) error(`invalid status ${meta.status}`);
  if (planned) {
    meta.tags ||= [];
    site.warnings.push(`${source}: planned page`);
  }
  for (const field of['title', 'summary', 'stage', 'gate', ...(!planned ? ['verified']: [])]) {
    if (typeof meta[field] !== 'string' || !meta[field].trim()) error(`missing/invalid ${field}`);
  }
  if (!page.hasFrontMatter) error('missing front matter');
  if (!Number.isFinite(meta.order)) error('order must be a number');
  if (!Array.isArray(meta.tags) || meta.tags.some(tag => typeof tag !== 'string')) error('tags must be a list of strings');
  if (!page.stage) error(`unknown stage ${String(meta.stage)}`);
  if (page.stage && source.split('/')[0] !== meta.stage) error(`folder must match stage ${meta.stage}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) error(`invalid slug ${slug}`);
  if (!planned && !/^[a-f\d]{7,40}$/i.test(String(meta.verified))) error('verified must be a commit hash');
  if (!/^(?:none|level \d+|renown \d+|registered|quest ["'].+["']|other ["'].+["'])$/i.test(String(meta.gate))) error(`invalid gate ${String(meta.gate)}`);
}
// Validate component references and editorial structure without changing source text.
function validatePageBody(page, site) {
  const {
    source, meta, render
  } = page;
  for (const id of render.tableIds) if (!tables.has(id)) site.errors.push(`${source}: unknown table id ${id}`);
  if (meta.status !== 'planned' && !render.headings.some(heading => heading.level === 2 && heading.text === 'Sources')) site.errors.push(`${source}: missing ## Sources section`);
  let previous = 1;
  for (const heading of render.headings) {
    if (heading.level > previous + 1) site.warnings.push(`${source}: heading skips from h${previous} to h${heading.level}: ${heading.text}`);
    previous = heading.level;
  }
  const words = plainText(page.resolved).split(/\s+/).length;
  if (words > 2500) site.warnings.push(`${source}: ${words} words (over 2,500)`);
  const commit = site.factData.commit;
  if (meta.verified && meta.verified !== commit && !String(commit).startsWith(meta.verified) && !String(meta.verified).startsWith(commit)) site.warnings.push(`${source}: verified ${meta.verified} differs from facts ${commit}; recheck against current source`);
}
// Link validation stays strict: only explicitly planned pages are future targets.
function validateLinks(page, site) {
  let forward = 0;
  for (const {
    url
  }
  of page.render.links) {
    const target = resolveLink(page, url, site);
    if (target.external) continue;
    if (target.error) {
      site.errors.push(`${page.source}: ${target.error}`);
      continue;
    }
    if (target.page && isForwardLink(page.meta.stage, target.page.meta.stage, site.stages)) forward++;
    if (target.anchor && target.page && !target.page.render.headings.some(heading => heading.id === target.anchor)) site.errors.push(`${page.source}: broken anchor ${url}`);
    if (target.anchor && target.stage && !target.special && !['pages', 'main'].includes(target.anchor)) site.errors.push(`${page.source}: broken stage anchor ${url}`);
  }
  if (forward) site.warnings.push(`${page.source}: ${forward} forward link${forward === 1 ? '' : 's'}`);
}
// Only credited original artwork is eligible for publication.
async function validateAssets(site) {
  let credits = '';
  try {
    credits = await readFile(path.join(site.root, 'theme/art/CREDITS.md'), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const page of site.pages) {
    for (const image of page.render.images) {
      if (!image.alt.trim()) site.errors.push(`${page.source}: image missing alt text: ${image.url}`);
      const asset = resolveImage(page, image.url, site);
      if (asset.error) {
        site.errors.push(`${page.source}: ${asset.error}`);
        continue;
      }
      try {
        await access(asset.file);
      } catch {
        site.errors.push(`${page.source}: missing image ${image.url}`);
      }
      if (!credits.includes(path.basename(asset.file))) site.errors.push(`${page.source}: no theme/art/CREDITS.md entry for ${image.url}`);
    }
  }
  for (const file of(await walk(path.join(site.root, 'theme/art'))).filter(file => /stage-[^/\\]+\.webp$/.test(file))) {
    if (!credits.includes(path.basename(file))) site.errors.push(`theme/art/CREDITS.md: missing entry for ${path.basename(file)}`);
  }
}
// Resolve Markdown source links first, then already-built relative page routes.
const SPECIAL_PAGES = new Map([
  ['quests/', { url: 'quests/index.html', title: 'Quest guide', gate: 'Always available', special: true, stage: { id: 'reference', title: 'Reference', gate: 'Always available' } }],
  ['quests/index.html', { url: 'quests/index.html', title: 'Quest guide', gate: 'Always available', special: true, stage: { id: 'reference', title: 'Reference', gate: 'Always available' } }]
]);
export function resolveLink(page, url, site) {
  if (/^(?:https?:|mailto:)/i.test(url)) return {
    external: true
  };
  if (/^(?:[a-z][\w+.-]*:|\/)/i.test(url)) return {
    error: `unsafe or non-relative URL ${url}`
  };
  const parsed = decodeLink(url);
  if (parsed.error) return parsed;
  const {
    raw, anchor
  } = parsed;
  if (!raw) return {
    page, anchor
  };
  const source = path.posix.normalize(path.posix.join(path.posix.dirname(page.source), raw));
  const target = site.bySource.get(source);
  if (target) return {
    page: target, anchor
  };
  if (!raw.endsWith('.md')) {
    const output = path.posix.normalize(path.posix.join(path.posix.dirname(page.url), raw));
    const target = site.byUrl.get(output.endsWith('/') ? output + 'index.html': output);
    if (target) return {
      page: target, anchor
    };
    const special = SPECIAL_PAGES.get(output.endsWith('/') ? output : output + '/');
    if (special) return { ...special, anchor };
    const stage = site.stages.find(s => `${s.id}/index.html` === output || `${s.id}/` === output);
    if (stage) return {
      stage, anchor
    };
  }
  return {
    error: `broken internal link ${url}`
  };
}
// Decode the path and anchor independently so malformed URLs remain actionable errors.
function decodeLink(url) {
  let decoded;
  try {
    decoded = decodeURI(url);
  } catch {
    return {
      error: `invalid URL ${url}`
    };
  }
  const [before, anchorRaw] = decoded.split('#'), raw = before.split('?')[0];
  let anchor;
  try {
    anchor = anchorRaw ? decodeURIComponent(anchorRaw): '';
  } catch {
    return {
      error: `invalid anchor ${url}`
    };
  }
  return {
    raw, anchor
  };
}
// Limit images to credited original artwork within the theme.
export function resolveImage(page, url, site) {
  if (/^(?:[a-z][\w+.-]*:|\/)/i.test(url)) return {
    error: `images must be local original theme/art files: ${url}`
  };
  let file = path.resolve(path.dirname(page.file), url);
  if (url.startsWith('theme/art/')) file = path.resolve(site.root, url);
  const art = path.resolve(site.root, 'theme/art') + path.sep;
  if (!file.startsWith(art) || !/\.(?:svg|webp|png|jpe?g|avif)$/i.test(file)) return {
    error: `image outside theme/art or unsupported type: ${url}`
  };
  return {
    file, url: posix(path.relative(site.root, file))
  };
}
// Read first-paragraph definitions from glossary entry headings.
export function extractGlossary(site) {
  const page = site.bySource.get('reference/glossary.md');
  if (!page) return [];
  const terms = [];
  for (const m of page.resolved.matchAll(/^### (.+)\n+([^\n#>]+(?:\n[^\n#>]+)*)/gm)) {
    const term = plainText(m[1]), h = page.render.headings.find(h => h.level === 3 && h.text === term);
    if (h) terms.push({
      term, definition: plainText(m[2]), url: page.url + '#' + h.id
    });
  }
  return terms;
}
// Bind article links, glossary entries and assets to their built relative routes.
export function pageOptions(page, site) {
  return {
    checklistPage: page.url,
    glossary: page.source === 'reference/glossary.md' ? []: site.glossary.map(t => ({
      ...t, url: relativeUrl(page.url, t.url.split('#')[0]) + '#' + t.url.split('#')[1]
    })),
    link: url => {
      const t = resolveLink(page, url, site);
      if (t.error) throw Error(`${page.source}: ${t.error}`);
      if (t.external) return {
        href: url
      };
      const target = t.page?.url || (t.special ? t.url : t.stage ? `${t.stage.id}/index.html` : t.url);
      return {
        href: relativeUrl(page.url, target) + (t.anchor ? '#' + t.anchor: ''),
        preview: target.replace(/index\.html$/, ''),
        later: isForwardLink(page.meta.stage, t.page?.meta.stage || t.stage?.id, site.stages),
        title: t.page ? `${t.page.stage.title} · ${gateLabel(t.page.meta.gate)}`: `${t.stage.title} · ${t.stage.gate}`
      };
    },
    image: url => {
      const a = resolveImage(page, url, site);
      if (a.error) throw Error(a.error);
      return relativeUrl(page.url, a.url);
    }
  };
}
