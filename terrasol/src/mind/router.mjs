// Role -> model routing. A role is either configured with its exact local
// model identifier or reported unavailable. There is no fallback substitution,
// no API-billing path, and no hidden per-tier retry storm.
import { roleAvailable, allowedModelsFor } from './config.mjs';
import { askModel as defaultAskModel, allowedModels as defaultAllowedModels } from '../models.mjs';
import { normalizeUsage } from './budget.mjs';

function emptyStats() { return { calls: 0, ok: 0, failed: 0, unavailable: 0, input_tokens: 0, cached_input_tokens: 0, output_tokens: 0, totalMs: 0, lastMs: null, lastAt: null, lastModel: null, lastEffort: null }; }

export function createModelRouter({ config, askModel = defaultAskModel, budget, clock = () => Date.now(), modelAllowlist = null } = {}) {
  if (!config?.roles) throw new TypeError('router needs a mind config');
  if (!budget) throw new TypeError('router needs a budget governor');
  const allowlist = modelAllowlist ?? allowedModelsFor(config) ?? defaultAllowedModels();
  const stats = Object.fromEntries(Object.keys(config.roles).map(role => [role, emptyStats()]));
  function available(role) { return roleAvailable(config, role, allowlist); }
  function recordFailure(role, code) {
    const row = stats[role] ??= emptyStats();
    row.calls++;
    row.failed++;
    if (code === 'unavailable') row.unavailable++;
  }
  async function call({ role, requestId = null, basis = null, prompt, images = [], schema, signal } = {}) {
    const roleConfig = config.roles?.[role];
    if (!roleConfig) return { ok: false, code: 'unavailable', reason: `unknown role ${role}` };
    const availability = available(role);
    if (!availability.ok) {
      const row = stats[role] ??= emptyStats();
      row.unavailable++;
      return { ok: false, code: 'unavailable', reason: availability.reason, role };
    }
    if (typeof prompt !== 'string' || !prompt.trim()) return { ok: false, code: 'invalid-request', reason: 'prompt is empty' };
    const gate = budget.check(role);
    if (!gate.ok) return { ok: false, code: gate.code, reason: gate.reason ?? 'budget blocked', pause: !!gate.pause, role };
    const started = clock();
    budget.record({role,usage:{},usageReported:false});
    let result;
    try {
      result = await askModel({ model: availability.model, effort: roleConfig.effort, prompt, images, schema, timeoutMs: roleConfig.timeoutMs, signal, subscriptionOnly: true });
    } catch (error) {
      if (error?.code === 'USAGE_LIMIT') {
        budget.pause('usage-limit');
        recordFailure(role, 'usage-limit');
        return { ok: false, code: 'usage-limit', reason: 'subscription usage limit reached', pause: true, role };
      }
      if (signal?.aborted) return { ok: false, code: 'aborted', reason: 'model call cancelled', role };
      recordFailure(role, 'model-error');
      return { ok: false, code: 'model-error', reason: String(error?.message ?? error), role, cause: error };
    }
    const ms = clock() - started;
    let usage;
    try {if(!result?.usage||!Number.isFinite(result.usage.input_tokens))throw Error('usage unavailable');usage = normalizeUsage(result.usage); } catch (error) {budget.pause('usage-unavailable');recordFailure(role, 'invalid-usage'); return { ok: false, code: 'invalid-usage', reason: error.message, role }; }
    const row = stats[role] ??= emptyStats();
    row.calls++;
    row.ok++;
    row.input_tokens += usage.input_tokens;
    row.cached_input_tokens += usage.cached_input_tokens;
    row.output_tokens += usage.output_tokens;
    row.totalMs += ms;
    row.lastMs = ms;
    row.lastAt = new Date(clock()).toISOString();
    row.lastModel = availability.model;
    row.lastEffort = availability.effort;
    budget.record({role,usage,calls:0});
    return { ok: true, role, model: availability.model, effort: availability.effort, json: result?.json, text: result?.text, usage, ms, requestId, basis, sessionId: result?.sessionId ?? null };
  }
  function snapshot() {
    return {
      schemaVersion: 'dfo-mind.v1',
      subscriptionOnly: true,
      allowlist: [...allowlist],
      roles: Object.fromEntries(Object.entries(stats).map(([role, row]) => [role, { ...row, available: available(role) }])),
    };
  }
  return { call, available, snapshot, allowlist: () => [...allowlist] };
}
