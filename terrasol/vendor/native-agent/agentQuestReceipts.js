// @ts-check
// AGENT13: producers report dispositions through the private seam. These never reach player events.
import { journeyEvent, journeyObserved } from './agentJourneyEvents.js';
import { GUILD_GROUPS } from '../formats/factionFile.js';
const offers = new WeakMap();
export function presentJourneyOffer(flow, quest, guild, member) {
  if (!journeyObserved()) return;
  const token = {}; offers.set(flow, token);
  const name = Object.keys(GUILD_GROUPS).find((key) => GUILD_GROUPS[key] === guild) ?? null;
  journeyEvent('quest-offer', { token, questUID: quest.uid, guild: name, member });
}
export function decideJourneyOffer(flow, decision) {
  const token = offers.get(flow);
  if (token) journeyEvent('quest-decision', { token, decision });
}
/** Compare the grant's own inventory quantity, never an unrelated purse change between judge polls. */
export function recordJourneyGrant(action, item, commit) {
  if (!journeyObserved()) return commit();
  const entity = action.parentQuest.hooks?.playerEntity?.();
  const quantity = () => (entity?.items ?? []).filter((i) => i.group === item?.group && i.templateIndex === item?.templateIndex)
    .reduce((n, i) => n + (i.stackCount ?? 1), 0);
  const before = quantity(), amount = item?.stackCount ?? 1;
  journeyEvent('quest-payment', { action, kind: 'direct', amount: 0, committed: false });
  const result = commit();
  if (entity && result !== false && amount > 0 && quantity() - before === amount)
    journeyEvent('quest-payment', { action, kind: 'direct', amount, committed: true });
  return result;
}
export function recordJourneyDisposition(action, kind, committed, item = null) {
  if (journeyObserved()) journeyEvent('quest-payment', { action, kind, amount: 0, committed, item });
}

/** Only executed/active GivePc actions count; alternate, never-triggered reward branches are not debts. */
function paymentActions(quest, dispositions) {
  const relevant = new Set(dispositions.keys());
  for (const task of quest.tasks?.values?.() ?? []) for (const a of task.actions ?? []) {
    if (a.constructor.typeName === 'GivePc' && (a.isComplete || task.triggered && !task.dropped)) relevant.add(a);
  }
  return [...relevant];
}
export function journeyPaymentSettled(quest, dispositions) {
  const actions = paymentActions(quest, dispositions);
  return !!quest.questSuccess && !!quest.questComplete && actions.length > 0 &&
    actions.every((a) => a.isComplete && dispositions.get(a)?.committed === true);
}
export function journeyPayment(quest, dispositions) {
  const actions = paymentActions(quest, dispositions);
  const direct = actions.some((a) => !a.isNothing && (a.textId !== 0 || a.silently));
  const explicitNone = [...dispositions.values()].some((r) => r.kind === 'none' && r.committed);
  if (!direct && !explicitNone) return null;
  return { questUID: quest.uid, kind: direct ? 'direct' : 'none',
    amount: [...dispositions.values()].reduce((n, r) => n + (r.committed && r.kind === 'direct' ? r.amount : 0), 0),
    settled: journeyPaymentSettled(quest, dispositions) };
}
