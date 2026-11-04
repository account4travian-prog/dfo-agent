// Per-tier and session usage accounting and the pause latch. Cached input is a
// subset of input and is never added a second time. Caps are explicit
// engineering limits supplied by the operator, not a subscription conversion.
const ZERO = () => ({ input_tokens: 0, cached_input_tokens: 0, output_tokens: 0, calls: 0, unreportedCalls:0 });

function validLimit(value) { return value === null || value === undefined || (Number.isSafeInteger(value) && value >= 0); }
function usageValue(value, name) {
  if (value === undefined || value === null) return 0;
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a non-negative number`);
  return Math.trunc(value);
}

/** Normalize a model usage record. Cached tokens are clamped to the input count. */
export function normalizeUsage(usage = {}) {
  if (usage === null || typeof usage !== 'object' || Array.isArray(usage)) throw new TypeError('usage must be an object');
  const input = usageValue(usage.input_tokens, 'input_tokens');
  const cached = Math.min(usageValue(usage.cached_input_tokens, 'cached_input_tokens'), input);
  const output = usageValue(usage.output_tokens, 'output_tokens');
  return { input_tokens: input, cached_input_tokens: cached, output_tokens: output };
}

export function createBudget({ limits = {}, now = () => Date.now(), onPause = null, initialStatus = null } = {}) {
  for (const key of ['maxInputTokens', 'maxCalls', 'maxOutputTokens']) if (!validLimit(limits[key])) throw new TypeError(`budget.${key} must be null or a non-negative integer`);
  if (limits.tiers !== undefined && (limits.tiers === null || typeof limits.tiers !== 'object' || Array.isArray(limits.tiers))) throw new TypeError('budget.tiers must be an object');
  const tiers = { ...(limits.tiers ?? {}) };
  for (const [role, tier] of Object.entries(tiers)) {
    if (tier === null || typeof tier !== 'object' || Array.isArray(tier)) throw new TypeError(`budget tier ${role} must be an object`);
    for (const key of ['maxInputTokens', 'maxCalls', 'maxOutputTokens']) if (!validLimit(tier[key])) throw new TypeError(`budget.tiers.${role}.${key} must be null or a non-negative integer`);
  }
  const totals = ZERO();
  const byRole = Object.fromEntries(Object.keys(tiers).map(role => [role, ZERO()]));
  let paused = false;
  let pauseReason = null;
  let pauseAt = null;
  if(initialStatus){
    const restore=(target,source)=>{for(const k of Object.keys(target)){const v=source?.[k]??0;if(!Number.isSafeInteger(v)||v<0)throw new TypeError('Invalid saved budget counters');target[k]=v;}target.cached_input_tokens=Math.min(target.cached_input_tokens,target.input_tokens);};
    restore(totals,initialStatus.totals);
    for(const [role,value] of Object.entries(initialStatus.byRole??{})){byRole[role]=ZERO();restore(byRole[role],value);}
    paused=initialStatus.paused===true;pauseReason=paused?initialStatus.pauseReason:null;pauseAt=paused?initialStatus.pauseAt:null;
  }

  function roleTotals(role) { return byRole[role] ??= ZERO(); }
  function exceeds() {
    if (limits.maxInputTokens !== null && limits.maxInputTokens !== undefined && totals.input_tokens >= limits.maxInputTokens) return 'input-token-cap';
    if (limits.maxCalls !== null && limits.maxCalls !== undefined && totals.calls >= limits.maxCalls) return 'call-cap';
    if (limits.maxOutputTokens !== null && limits.maxOutputTokens !== undefined && totals.output_tokens >= limits.maxOutputTokens) return 'output-token-cap';
    for (const [role, tier] of Object.entries(tiers)) {
      const current = roleTotals(role);
      if (tier.maxInputTokens !== null && tier.maxInputTokens !== undefined && current.input_tokens >= tier.maxInputTokens) return `${role}-input-token-cap`;
      if (tier.maxCalls !== null && tier.maxCalls !== undefined && current.calls >= tier.maxCalls) return `${role}-call-cap`;
      if (tier.maxOutputTokens !== null && tier.maxOutputTokens !== undefined && current.output_tokens >= tier.maxOutputTokens) return `${role}-output-token-cap`;
    }
    return null;
  }
  function pause(reason = 'budget-exhausted') {
    if (paused) return status();
    paused = true;
    pauseReason = reason;
    pauseAt = new Date(now()).toISOString();
    onPause?.(reason, status());
    return status();
  }
  function check(role) {
    if (paused) return { ok: false, code: 'paused', reason: pauseReason, pause: true };
    const reason = exceeds();
    if (reason) {
      if (limits.pauseOnExhaustion !== false) pause(`budget-exhausted:${reason}`);
      return { ok: false, code: 'budget-exhausted', reason, pause: limits.pauseOnExhaustion !== false };
    }
    return { ok: true };
  }
  function record({ role, usage = {}, calls = 1, usageReported=true } = {}) {
    if (!role || typeof role !== 'string') throw new TypeError('role is required');
    if (!Number.isSafeInteger(calls) || calls < 0) throw new TypeError('calls must be a non-negative integer');
    const normalized = normalizeUsage(usage);
    const current = roleTotals(role);
    for (const key of ['input_tokens', 'cached_input_tokens', 'output_tokens']) {
      totals[key] += normalized[key];
      current[key] += normalized[key];
    }
    totals.calls += calls;
    current.calls += calls;
    if(!usageReported){totals.unreportedCalls+=calls;current.unreportedCalls+=calls;}
    else if(calls===0&&current.unreportedCalls>0){current.unreportedCalls--;totals.unreportedCalls=Math.max(0,totals.unreportedCalls-1);}
    const reason = exceeds();
    if (reason && limits.pauseOnExhaustion !== false) pause(`budget-exhausted:${reason}`);
    return status();
  }
  function resume({ operator = false } = {}) {
    if (!operator) return { ok: false, code: 'operator-required', reason: 'budget pause can only be cleared by an explicit operator action' };
    paused = false;
    pauseReason = null;
    pauseAt = null;
    return { ok: true };
  }
  function status() {
    const remaining = {
      inputTokens: limits.maxInputTokens === null || limits.maxInputTokens === undefined ? null : Math.max(0, limits.maxInputTokens - totals.input_tokens),
      calls: limits.maxCalls === null || limits.maxCalls === undefined ? null : Math.max(0, limits.maxCalls - totals.calls),
    };
    return {
      limits: { maxInputTokens: limits.maxInputTokens ?? null, maxCalls: limits.maxCalls ?? null, maxOutputTokens: limits.maxOutputTokens ?? null, tiers },
      totals: { ...totals, total_tokens: totals.input_tokens + totals.output_tokens },
      byRole: Object.fromEntries(Object.entries(byRole).map(([role, value]) => [role, { ...value, total_tokens: value.input_tokens + value.output_tokens }])),
      remaining, paused, pauseReason, pauseAt,
      note: 'Cached input is a subset of input. Known token totals exclude unreported calls. Limits are engineering caps, not a subscription allowance conversion.',
    };
  }
  return { check, canCall: check, record, pause, resume, status, paused: () => paused, pauseReason: () => pauseReason };
}
