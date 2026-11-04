// Read locally cached Codex model metadata to resolve the exact role models.
// This reads model descriptors only; it never reads auth/credential files and
// never spends a model call. A missing/unreadable cache is reported as unknown.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const MODEL_METADATA_SCHEMA = 'dfo-model-metadata.v1';
export const ROLE_FAMILIES = Object.freeze({ luna: 'luna', terra: 'terra', sol: 'sol' });

function candidatePaths(env = process.env) {
  const home = os.homedir();
  const paths = [];
  if (env.DFO_MODELS_CACHE) paths.push(env.DFO_MODELS_CACHE);
  if (env.CODEX_HOME) paths.push(path.join(env.CODEX_HOME, 'models_cache.json'));
  paths.push(path.join(home, '.codex-dfo-roles', 'models_cache.json'));
  paths.push(path.join(home, '.codex', 'models_cache.json'));
  return [...new Set(paths)];
}

function versionOf(slug, family) {
  const match = new RegExp(`^gpt-(\\d+(?:\\.\\d+)?)-${family}$`, 'i').exec(String(slug));
  return match ? Number(match[1]) : null;
}
function priorityOf(model) {
  return Number.isFinite(model?.priority) ? model.priority : 1000;
}
export function selectFamily(models, family) {
  const candidates = (Array.isArray(models) ? models : [])
    .filter(model => typeof model?.slug === 'string' && versionOf(model.slug, family) !== null)
    .filter(model => model.visibility === undefined || model.visibility === 'list')
    .filter(model => model.supported_in_api !== false)
    .map(model => ({ slug: model.slug, displayName: model.display_name ?? model.name ?? model.slug, version: versionOf(model.slug, family), priority: priorityOf(model), defaultReasoningLevel: model.default_reasoning_level ?? null }))
    .sort((a, b) => (b.version - a.version) || (a.priority - b.priority) || a.slug.localeCompare(b.slug));
  return candidates[0] ?? null;
}

/** Parse a models_cache.json document and select the highest locally listed role model. */
export function parseModelMetadata(document, { source = null } = {}) {
  const models = Array.isArray(document?.models) ? document.models : [];
  const selected = {};
  for (const [role, family] of Object.entries(ROLE_FAMILIES)) selected[role] = selectFamily(models, family);
  const ok = Object.values(selected).every(Boolean);
  return {
    schemaVersion: MODEL_METADATA_SCHEMA,
    ok,
    source,
    fetchedAt: document?.fetched_at ?? null,
    clientVersion: document?.client_version ?? null,
    models: selected,
    reason: ok ? null : `no locally listed model for ${Object.entries(selected).filter(([, value]) => !value).map(([role]) => role).join(', ')}`,
  };
}

/** Read the first usable local cache. Never reads credentials. */
export function readLocalModelMetadata({ env = process.env, readFile = fs.readFileSync } = {}) {
  const errors = [];
  for (const file of candidatePaths(env)) {
    if (!fs.existsSync(file)) { errors.push({ file, reason: 'missing' }); continue; }
    try {
      const document = JSON.parse(readFile(file, 'utf8'));
      const parsed = parseModelMetadata(document, { source: file });
      if (parsed.ok) return parsed;
      errors.push({ file, reason: parsed.reason });
    } catch (error) {
      errors.push({ file, reason: `unreadable: ${error.message}` });
    }
  }
  return { schemaVersion: MODEL_METADATA_SCHEMA, ok: false, source: null, fetchedAt: null, clientVersion: null, models: { luna: null, terra: null, sol: null }, reason: errors.map(item => `${item.file}: ${item.reason}`).join('; ') || 'no local model metadata cache found', errors };
}

export function modelIds(metadata) {
  const out = {};
  for (const role of Object.keys(ROLE_FAMILIES)) out[role] = metadata?.models?.[role]?.slug ?? null;
  return out;
}
