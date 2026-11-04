// Configuration for the three-tier mind runtime. All limits are engineering
// settings, not a conversion between tokens and a subscription allowance.
import fs from 'node:fs';
import { modelIds, readLocalModelMetadata } from './model-metadata.mjs';

export const MIND_SCHEMA = 'dfo-mind.v1';
export const ROLE_NAMES = Object.freeze(['luna', 'terra', 'sol']);
export const LEGACY_INTENTS = Object.freeze(['turn', 'look', 'goto', 'use', 'explore', 'fight', 'retreat', 'stop']);
const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
const IMAGE_POLICIES = new Set(['never', 'ui', 'always']);
const TOP_LEVEL = new Set(['schemaVersion', 'roles', 'scheduler', 'budget', 'models', 'notes']);
const ROLE_KEYS = new Set(['enabled', 'model', 'effort', 'timeoutMs', 'decisionTtlMs', 'cooldownMs', 'maxCallsPerWindow', 'windowMs', 'contextBytes', 'images']);
const SCHEDULER_KEYS = new Set(['pollIntervalMs', 'snapshotRetries', 'snapshotRetryDelayMs', 'localRetries', 'failureThreshold', 'planTtlMs', 'maxCycles', 'requestSolReviewOnComplete', 'continueAfterPlan', 'maxEmptyPlanBoundaries', 'reviewAtSessionEnd', 'planHistoryLimit']);
const BUDGET_KEYS = new Set(['maxInputTokens', 'maxCalls', 'maxOutputTokens', 'tiers', 'pauseOnExhaustion']);
const MODELS_KEYS = new Set(['allowlist', 'resolution']);

// `gpt-6-luna` is the highest locally listed Luna in the Codex model cache on
// the operator machine (see docs/round2/path-b/MODEL-AVAILABILITY.md). It is a
// resolved identifier, not a placeholder: loadMindConfig verifies it against
// the local metadata and records the finding. An explicit environment/config
// override still wins.
export const RESOLVED_LUNA_ID = 'gpt-6-luna';
export const DEFAULT_ROLES = Object.freeze({
  luna: Object.freeze({ enabled: true, model: RESOLVED_LUNA_ID, effort: 'low', timeoutMs: 15000, decisionTtlMs: 10000, cooldownMs: 1000, maxCallsPerWindow: 30, windowMs: 60000, contextBytes: 6000, images: 'ui' }),
  terra: Object.freeze({ enabled: true, model: 'gpt-6.1-terra', effort: 'low', timeoutMs: 45000, decisionTtlMs: 120000, cooldownMs: 15000, maxCallsPerWindow: 12, windowMs: 600000, contextBytes: 12000, images: 'ui' }),
  sol: Object.freeze({ enabled: true, model: 'gpt-6.1-sol', effort: 'medium', timeoutMs: 90000, decisionTtlMs: 600000, cooldownMs: 120000, maxCallsPerWindow: 3, windowMs: 3600000, contextBytes: 20000, images: 'never' }),
});
export const DEFAULT_SCHEDULER = Object.freeze({ pollIntervalMs: 250, snapshotRetries: 2, snapshotRetryDelayMs: 250, localRetries: 1, failureThreshold: 2, planTtlMs: 180000, maxCycles: 5000, requestSolReviewOnComplete: true, continueAfterPlan: true, maxEmptyPlanBoundaries: 2, reviewAtSessionEnd: true, planHistoryLimit: 12 });
// Finite engineering caps. These are session safety limits, not a conversion
// from a subscription allowance to tokens. Override them for a real run.
export const DEFAULT_BUDGET = Object.freeze({ maxInputTokens: 1500000, maxCalls: 240, maxOutputTokens: 60000, tiers: Object.freeze({}), pauseOnExhaustion: true });

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const optionalInteger = (value, min, max) => value === null || value === undefined || integer(value, min, max);

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]));
  return value;
}
function merge(base, extra) {
  if (!isObject(base) || !isObject(extra)) return clone(extra ?? base);
  const out = { ...base };
  for (const [key, value] of Object.entries(extra)) out[key] = isObject(value) && isObject(base[key]) ? merge(base[key], value) : clone(value);
  return out;
}
function envInteger(env, name) {
  if (env[name] === undefined || env[name] === '') return undefined;
  const value = Number(env[name]);
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative integer`);
  return value;
}

/** Resolve a config object with defaults, local model metadata and environment overrides. */
export function resolveMindConfig(input = {}, { env = process.env, modelMetadata = null } = {}) {
  if (!isObject(input)) throw new TypeError('Mind config must be an object');
  const config = merge({ schemaVersion: MIND_SCHEMA, roles: DEFAULT_ROLES, scheduler: DEFAULT_SCHEDULER, budget: DEFAULT_BUDGET, models: { allowlist: null }, notes: '' }, input);
  config.roles = merge(DEFAULT_ROLES, input.roles ?? {});
  config.scheduler = merge(DEFAULT_SCHEDULER, input.scheduler ?? {});
  config.budget = merge(DEFAULT_BUDGET, input.budget ?? {});
  config.models = merge({ allowlist: null, resolution: null }, input.models ?? {});
  if (modelMetadata) {
    config.models.resolution = {
      schemaVersion: modelMetadata.schemaVersion ?? 'dfo-model-metadata.v1',
      ok: modelMetadata.ok === true,
      source: modelMetadata.source ?? null,
      fetchedAt: modelMetadata.fetchedAt ?? null,
      clientVersion: modelMetadata.clientVersion ?? null,
      selected: modelIds(modelMetadata),
      reason: modelMetadata.reason ?? null,
    };
    if (modelMetadata.ok) {
      for (const role of ROLE_NAMES) {
        const slug = modelMetadata.models?.[role]?.slug;
        if (slug) config.roles[role] = { ...config.roles[role], model: config.roles[role].model ?? slug };
      }
      if (config.models.allowlist === null) config.models.allowlist = [...new Set(ROLE_NAMES.map(role => config.roles[role].model).filter(Boolean))];
    }
  }
  for (const [key, name] of [['luna', 'DFO_LUNA_MODEL'], ['terra', 'DFO_TERRA_MODEL'], ['sol', 'DFO_SOL_MODEL']]) {
    if (typeof env[name] === 'string' && env[name].trim()) config.roles[key] = { ...config.roles[key], model: env[name].trim() };
  }
  const maxInputTokens = envInteger(env, 'DFO_MIND_MAX_INPUT_TOKENS');
  const maxCalls = envInteger(env, 'DFO_MIND_MAX_CALLS');
  if (maxInputTokens !== undefined) config.budget.maxInputTokens = maxInputTokens;
  if (maxCalls !== undefined) config.budget.maxCalls = maxCalls;
  const errors = validateMindConfig(config);
  if (errors.length) {
    const error = new Error(`Invalid mind config: ${errors.join('; ')}`);
    error.code = 'MIND_CONFIG_INVALID';
    error.errors = errors;
    throw error;
  }
  return config;
}

/** Load an optional JSON config file, local model metadata and environment overrides. */
export function loadMindConfig({ env = process.env, readFile = null, modelMetadata = undefined } = {}) {
  let input = {};
  const file = typeof env.DFO_MIND_CONFIG === 'string' && env.DFO_MIND_CONFIG.trim() ? env.DFO_MIND_CONFIG.trim() : null;
  if (file) {
    let raw;
    try {
      raw = readFile ? readFile(file) : fs.readFileSync(file, 'utf8');
    } catch (cause) {
      const error = new Error(`Cannot read DFO_MIND_CONFIG ${file}: ${cause.message}`);
      error.code = 'MIND_CONFIG_UNREADABLE';
      throw error;
    }
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) throw new TypeError('Mind config file must contain an object');
    input = parsed;
  }
  let metadata = modelMetadata;
  if (metadata === undefined && !['1', 'true', 'off', 'disabled'].includes(String(env.DFO_MODEL_METADATA_DISABLED ?? '').toLowerCase())) {
    try { metadata = readLocalModelMetadata({ env }); } catch (error) { metadata = { ok: false, reason: error.message, models: { luna: null, terra: null, sol: null } }; }
  }
  return resolveMindConfig(input, { env, modelMetadata: metadata ?? null });
}

export function validateMindConfig(config) {
  const errors = [];
  if (!isObject(config)) return ['config must be an object'];
  if (config.schemaVersion !== MIND_SCHEMA) errors.push(`schemaVersion must be ${MIND_SCHEMA}`);
  for (const key of Object.keys(config)) if (!TOP_LEVEL.has(key)) errors.push(`unknown top-level key ${key}`);
  for (const role of ROLE_NAMES) {
    const value = config.roles?.[role];
    if (!isObject(value)) { errors.push(`roles.${role} must be an object`); continue; }
    for (const key of Object.keys(value)) if (!ROLE_KEYS.has(key)) errors.push(`unknown roles.${role}.${key}`);
    if (typeof value.enabled !== 'boolean') errors.push(`roles.${role}.enabled must be boolean`);
    if (value.model !== null && (typeof value.model !== 'string' || !value.model.trim() || value.model.length > 120)) errors.push(`roles.${role}.model must be null or a model identifier`);
    if (!EFFORTS.has(value.effort)) errors.push(`roles.${role}.effort is unsupported`);
    if (!integer(value.timeoutMs, 1000, 300000)) errors.push(`roles.${role}.timeoutMs must be 1000..300000`);
    if (!integer(value.decisionTtlMs, 500, 3600000)) errors.push(`roles.${role}.decisionTtlMs must be 500..3600000`);
    if (!integer(value.cooldownMs, 0, 3600000)) errors.push(`roles.${role}.cooldownMs must be 0..3600000`);
    if (!integer(value.maxCallsPerWindow, 0, 10000)) errors.push(`roles.${role}.maxCallsPerWindow must be 0..10000`);
    if (!integer(value.windowMs, 1000, 86400000)) errors.push(`roles.${role}.windowMs must be 1000..86400000`);
    if (!integer(value.contextBytes, 1000, 200000)) errors.push(`roles.${role}.contextBytes must be 1000..200000`);
    if (!IMAGE_POLICIES.has(value.images)) errors.push(`roles.${role}.images must be never, ui or always`);
  }
  const scheduler = config.scheduler;
  if (!isObject(scheduler)) errors.push('scheduler must be an object');
  else {
    for (const key of Object.keys(scheduler)) if (!SCHEDULER_KEYS.has(key)) errors.push(`unknown scheduler.${key}`);
    if (!integer(scheduler.pollIntervalMs, 1, 5000)) errors.push('scheduler.pollIntervalMs must be 1..5000');
    if (!integer(scheduler.snapshotRetries, 0, 10)) errors.push('scheduler.snapshotRetries must be 0..10');
    if (!integer(scheduler.snapshotRetryDelayMs, 0, 10000)) errors.push('scheduler.snapshotRetryDelayMs must be 0..10000');
    if (!integer(scheduler.localRetries, 0, 10)) errors.push('scheduler.localRetries must be 0..10');
    if (!integer(scheduler.failureThreshold, 1, 10)) errors.push('scheduler.failureThreshold must be 1..10');
    if (!integer(scheduler.planTtlMs, 1000, 3600000)) errors.push('scheduler.planTtlMs must be 1000..3600000');
    if (!integer(scheduler.maxCycles, 1, 100000)) errors.push('scheduler.maxCycles must be 1..100000');
    if (typeof scheduler.requestSolReviewOnComplete !== 'boolean') errors.push('scheduler.requestSolReviewOnComplete must be boolean');
    if (typeof scheduler.continueAfterPlan !== 'boolean') errors.push('scheduler.continueAfterPlan must be boolean');
    if (!integer(scheduler.maxEmptyPlanBoundaries, 1, 20)) errors.push('scheduler.maxEmptyPlanBoundaries must be 1..20');
    if (typeof scheduler.reviewAtSessionEnd !== 'boolean') errors.push('scheduler.reviewAtSessionEnd must be boolean');
    if (!integer(scheduler.planHistoryLimit, 1, 100)) errors.push('scheduler.planHistoryLimit must be 1..100');
  }
  const budget = config.budget;
  if (!isObject(budget)) errors.push('budget must be an object');
  else {
    for (const key of Object.keys(budget)) if (!BUDGET_KEYS.has(key)) errors.push(`unknown budget.${key}`);
    for (const key of ['maxInputTokens', 'maxCalls', 'maxOutputTokens']) if (!optionalInteger(budget[key], 0, Number.MAX_SAFE_INTEGER)) errors.push(`budget.${key} must be null or a non-negative integer`);
    if (typeof budget.pauseOnExhaustion !== 'boolean') errors.push('budget.pauseOnExhaustion must be boolean');
    if (!isObject(budget.tiers)) errors.push('budget.tiers must be an object');
    else for (const [role, tier] of Object.entries(budget.tiers)) {
      if (!ROLE_NAMES.includes(role)) errors.push(`budget.tiers.${role} is not a role`);
      else if (!isObject(tier)) errors.push(`budget.tiers.${role} must be an object`);
      else for (const [key, value] of Object.entries(tier)) {
        if (!['maxInputTokens', 'maxCalls', 'maxOutputTokens'].includes(key)) errors.push(`budget.tiers.${role}.${key} is not a limit`);
        else if (!optionalInteger(value, 0, Number.MAX_SAFE_INTEGER)) errors.push(`budget.tiers.${role}.${key} must be null or a non-negative integer`);
      }
    }
  }
  if (!isObject(config.models)) errors.push('models must be an object');
  else {
    for (const key of Object.keys(config.models)) if (!MODELS_KEYS.has(key)) errors.push(`unknown models.${key}`);
    if (config.models.allowlist !== null && !Array.isArray(config.models.allowlist)) errors.push('models.allowlist must be null or an array');
    else if (Array.isArray(config.models.allowlist) && config.models.allowlist.some(model => typeof model !== 'string' || !model.trim())) errors.push('models.allowlist entries must be non-empty strings');
    if (config.models.resolution !== null && !isObject(config.models.resolution)) errors.push('models.resolution must be null or an object');
  }
  return errors;
}

/** Whether a role can be called, and why not. Never substitutes a different model. */
export function roleAvailable(config, role, allowedModels) {
  const value = config?.roles?.[role];
  if (!value) return { ok: false, reason: `unknown role ${role}` };
  if (!value.enabled) return { ok: false, reason: `${role} disabled` };
  if (!value.model) return { ok: false, reason: `${role} model is not configured` };
  if (allowedModels && !allowedModels.includes(value.model)) return { ok: false, reason: `${role} model ${value.model} is not in the local allowlist` };
  return { ok: true, model: value.model, effort: value.effort };
}

export function allowedModelsFor(config) {
  if (Array.isArray(config?.models?.allowlist)) return config.models.allowlist.map(model => model.trim());
  return null;
}

export function redactedConfig(config) {
  const copy = clone(config);
  if (copy.notes) copy.notes = typeof copy.notes === 'string' ? copy.notes.slice(0, 200) : '';
  return copy;
}
