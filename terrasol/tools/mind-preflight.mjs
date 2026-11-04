#!/usr/bin/env node
// Bounded real-role preflight. Default is a dry run: it reads local model
// metadata and prints the plan without any network/model call. --execute is
// refused unless DFO_REAL_ROLE_PREFLIGHT=1 is also set by the operator.
import { loadMindConfig } from '../src/mind/config.mjs';
import { askModel } from '../src/models.mjs';
import { buildPreflightPlan, runRolePreflight } from '../src/mind/preflight.mjs';

const execute = process.argv.includes('--execute');
const config = loadMindConfig({ env: process.env });
const plan = buildPreflightPlan(config, { metadata: config.models?.resolution ? { ok: config.models.resolution.ok, source: config.models.resolution.source, fetchedAt: config.models.resolution.fetchedAt, models: Object.fromEntries(Object.entries(config.models.resolution.selected ?? {}).map(([role, slug]) => [role, { slug }])) } : null });
if (!execute) {
  console.log(JSON.stringify({ mode: 'dry-run', plan, note: 'No model call was made. Use --execute only when the operator has authorized a bounded real-role preflight.' }, null, 2));
  process.exit(0);
}
const receipt = await runRolePreflight({ config, askModel, allowPaid: true, env: process.env });
console.log(JSON.stringify(receipt, null, 2));
process.exitCode = receipt.ok ? 0 : 1;
