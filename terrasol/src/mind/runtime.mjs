// Composition root for the three-tier runtime. The playing worker supplies the
// HTTP request function, model transport, memory and logger; tests supply fakes.
import { createControlClient } from './control-client.mjs';
import { createBudget } from './budget.mjs';
import { createModelRouter } from './router.mjs';
import { createContextBuilder } from './context.mjs';
import { createScheduler } from './scheduler.mjs';
import { createMapPicture } from './map-picture.mjs';
import { askModel as realAskModel } from '../models.mjs';
import { searchHandbook as realSearchHandbook } from '../handbook.mjs';

export function createMindRuntime({
  config, memory, logger, request, askModel = realAskModel, searchHandbook = realSearchHandbook,
  plan = null, planHistory = [], session = null, clock = () => Date.now(), sleep = null,
  onPause = null, onCheckpoint = null, onPlanChange = null, onDecisionPacket = null, onRepairProposal = null,
  idFactory = null, initialBudget = null, operatorBudgetResume = false, sourceRevision = null, readRepairStatus = null, initialRepair = null, placePictureWriter = null,
} = {}) {
  if (!config) throw new TypeError('runtime needs a mind config');
  if (!memory) throw new TypeError('runtime needs memory');
  if (!logger) throw new TypeError('runtime needs a logger');
  if (typeof request !== 'function') throw new TypeError('runtime needs a request function');
  const client = createControlClient({ request });
  const budget = createBudget({limits:config.budget,initialStatus:initialBudget});
  if(operatorBudgetResume)budget.resume({operator:true});
  const router = createModelRouter({ config, askModel, budget, modelAllowlist: Array.isArray(config.models?.allowlist) ? config.models.allowlist : null });
  const context = createContextBuilder({ mode:session?.mode??'online', memory, config, searchHandbook });
  const mapPictureWriter = placePictureWriter ?? (typeof session?.run === 'string' && session.run.trim() ? createMapPicture({ runDir: session.run }) : null);
  const scheduler = createScheduler({ config, client, router, memory, context, budget, logger, clock, ...(sleep ? { sleep } : {}), ...(idFactory ? { idFactory } : {}), plan, planHistory, searchHandbook, session, onPause, onCheckpoint, onPlanChange, onDecisionPacket, onRepairProposal, sourceRevision, readRepairStatus, initialRepair, placePictureWriter: mapPictureWriter });
  return { client, budget, router, context, scheduler };
}

/** Fail closed when the driver does not advertise the required contract. */
export async function checkMindSupport(client, logger = { event() {} }) {
  try {
    const capabilities = await client.capabilities({ refresh: true });
    if (!capabilities.ok) {
      logger.event?.('mind-control-unavailable', { contractVersion: capabilities.contractVersion, missing: capabilities.missing, note: 'holding; no model calls made' });
      return { ok: false, reason: 'control-unavailable', capabilities };
    }
    logger.event?.('mind-control-ready', { contractVersion: capabilities.contractVersion, intents: capabilities.intents, snapshot: capabilities.snapshot, requestFencing: capabilities.requestFencing, images: capabilities.images, ui: capabilities.ui });
    return { ok: true, capabilities };
  } catch (error) {
    logger.event?.('mind-control-error', { error: error.message, code: error.code ?? null });
    return { ok: false, reason: 'control-error', error: error.message };
  }
}

export async function runMindRuntime({ signal = null, deadline = null, shouldStop = null, ...options } = {}) {
  const runtime = createMindRuntime(options);
  const support = await checkMindSupport(runtime.client, options.logger);
  if (!support.ok) return { ok: false, ...support, budget: runtime.budget.status(), router: runtime.router.snapshot() };
  const summary = await runtime.scheduler.run({ signal, deadline, shouldStop });
  return { ok: true, summary, capabilities: support.capabilities, scheduler: runtime.scheduler, budget: runtime.budget.status(), router: runtime.router.snapshot() };
}
