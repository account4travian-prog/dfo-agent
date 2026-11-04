// Bounded real-role preflight. Preparing the preflight is model-free; executing
// it requires an explicit operator flag and is never run by this worktree.
import { roleAvailable, ROLE_NAMES } from './config.mjs';
import { normalizeUsage } from './budget.mjs';

export const PREFLIGHT_SCHEMA = 'dfo-preflight.v1';
const OK_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { ok: { type: 'boolean' }, role: { type: 'string' } },
  required: ['ok', 'role'],
};

export function buildPreflightPlan(config, { metadata = null, env = process.env } = {}) {
  const allowlist = Array.isArray(config.models?.allowlist) ? config.models.allowlist : null;
  const roles = {};
  for (const role of ROLE_NAMES) {
    const availability = roleAvailable(config, role, allowlist);
    roles[role] = {
      role,
      model: config.roles[role]?.model ?? null,
      effort: config.roles[role]?.effort ?? null,
      timeoutMs: config.roles[role]?.timeoutMs ?? null,
      available: availability.ok,
      reason: availability.ok ? null : availability.reason,
      metadata: metadata?.models?.[role]?.slug ?? null,
      metadataSource: metadata?.source ?? null,
    };
  }
  return {
    schemaVersion: PREFLIGHT_SCHEMA,
    subscriptionOnly: true,
    apiBillingFallback: false,
    executionRequires: 'explicit --execute plus DFO_REAL_ROLE_PREFLIGHT=1',
    envFlag: env.DFO_REAL_ROLE_PREFLIGHT === '1',
    caps: {
      maxInputTokens: config.budget?.maxInputTokens ?? null,
      maxCalls: config.budget?.maxCalls ?? null,
      maxOutputTokens: config.budget?.maxOutputTokens ?? null,
    },
    metadata: metadata ? { ok: metadata.ok === true, source: metadata.source ?? null, fetchedAt: metadata.fetchedAt ?? null, selected: Object.fromEntries(ROLE_NAMES.map(role => [role, metadata.models?.[role]?.slug ?? null])) } : null,
    roles,
    runnable: ROLE_NAMES.every(role => roles[role].available),
    command: 'node tools/mind-preflight.mjs --execute',
  };
}

/**
 * Execute one minimal request per role. Paid execution is refused unless
 * allowPaid AND DFO_REAL_ROLE_PREFLIGHT=1 are both set. Tests inject askModel.
 */
export async function runRolePreflight({ config, askModel, budget = null, logger = { event() {} }, allowPaid = false, env = process.env, clock = () => Date.now(), plan = null } = {}) {
  const prepared = plan ?? buildPreflightPlan(config, { env });
  if (!allowPaid || env.DFO_REAL_ROLE_PREFLIGHT !== '1') {
    return { ok: false, code: 'operator-required', reason: 'real-role preflight requires allowPaid and DFO_REAL_ROLE_PREFLIGHT=1', calls: 0, plan: prepared };
  }
  if (!prepared.runnable) return { ok: false, code: 'role-unavailable', reason: 'not every role is configured/available', calls: 0, plan: prepared };
  if (typeof askModel !== 'function') throw new TypeError('preflight needs a model transport');
  const receipts = [];
  let calls = 0;
  for (const role of ROLE_NAMES) {
    const info = prepared.roles[role];
    const started = clock();
    const prompt = `Bounded role preflight for ${role}. Reply with JSON {"ok":true,"role":"${role}"} only. Do not use tools, code, network or game actions.`;
    try {
      const result = await askModel({ model: info.model, effort: info.effort, prompt, images: [], schema: OK_SCHEMA, timeoutMs: Math.min(info.timeoutMs ?? 20000, 30000), subscriptionOnly: true });
      calls++;
      const usage = result?.usage ? normalizeUsage(result.usage) : { input_tokens: null, cached_input_tokens: null, output_tokens: null };
      const valid = result?.json?.ok === true && result?.json?.role === role;
      const receipt = { role, requestedModel: info.model, effectiveModel: result?.requestedModel ?? null, valid, ms: clock() - started, usage, usageReported: !!result?.usage, sessionId: result?.sessionId ?? null };
      if (budget) budget.record({ role, usage: result?.usage ?? {}, calls: 1, usageReported: !!result?.usage });
      receipts.push(receipt);
      logger.event?.('role-preflight-receipt', receipt);
      if (!valid || receipt.requestedModel !== receipt.effectiveModel && receipt.effectiveModel !== null) {
        return { ok: false, code: 'role-mismatch', reason: `${role} did not return a valid receipt`, calls, receipts, plan: prepared };
      }
    } catch (error) {
      calls++;
      const receipt = { role, requestedModel: info.model, valid: false, ms: clock() - started, error: error.message, errorCode: error.code ?? null, usageReported: false };
      receipts.push(receipt);
      logger.event?.('role-preflight-receipt', receipt);
      if (error?.code === 'USAGE_LIMIT') return { ok: false, code: 'usage-limit', reason: 'subscription usage limit reached', calls, receipts, plan: prepared };
      return { ok: false, code: 'role-failed', reason: `${role}: ${error.message}`, calls, receipts, plan: prepared };
    }
  }
  return { ok: true, code: 'all-roles-verified', calls, receipts, plan: prepared, completedAt: new Date(clock()).toISOString() };
}
