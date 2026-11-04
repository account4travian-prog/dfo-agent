// @ts-check
// AGENT11/12 - a fork's spatial-frame signal and HARNESS-ONLY journey evidence. The only player sense here is an
// opaque revision: the view/coordinate frame changed. Names, memberships, quest tasks, receipts and death/exit
// latches are for the builder's judge(), just like fightLedger(); NEVER add them to state(), view(), events() or
// any playing-model path. Producers tell actual events; polling gold or mode cannot reconstruct a transaction.
import { totalGoldAmount } from '../systems/court.js';
import { journeyFrame, journeyEvent, onJourneyEvent, journeyObserved } from './agentJourneyEvents.js';
import { worldMinutes } from '../systems/worldTick.js';
import { itemProvenance, markJourneyOrigin, withJourneyPurchase } from './agentProvenance.js';
import { journeyPayment, journeyPaymentSettled } from './agentQuestReceipts.js';
import { RMB_SIDE } from '../world/locationLayout.js';
import { EXTRA_DISTANCE } from '../world/locationEntrance.js';

const generation = globalThis.performance?.timeOrigin ?? Date.now(); // constant for this page, changes on reload

/** AGENT13 (the workspace's fixtures, docs/20 A.4): the world clock's minute of the day - what ?tod sets
 *  (scenes/exterior.js "if (bootTod != null) setWorldMinutes(") - so a start asked for at noon can be checked.
 *  Harness-only, like the rest of read(). */
function clockNow(clock) {
  try { const m = clock(); return Number.isFinite(m) ? { minuteOfDay: ((Math.floor(m) % 1440) + 1440) % 1440 } : null; } catch { return null; }
}

const scalar = (x) => typeof x === 'number' && Number.isFinite(x) || typeof x === 'string' ? x : null;
const itemIds = new WeakMap();
let nextItemId = 0;
export function judgeItem(it) {
  if (it && typeof it === 'object' && !itemIds.has(it)) itemIds.set(it, `item-${++nextItemId}`);
  return { id: scalar(it?.uid) ?? itemIds.get(it) ?? null, name: String(it?.name ?? ''), count: Number.isFinite(it?.stackCount) ? it.stackCount : 1,
    questUID: scalar(it?.questUID), questSymbol: it?.questSymbol?.name ?? null, provenance: itemProvenance(it) };
}
export function judgeQuest(q) {
  return { uid: scalar(q.uid), name: String(q.questName ?? ''), displayName: q.displayName ?? null,
    started: q.questStartTime ?? null, success: !!q.questSuccess, complete: !!q.questComplete,
    tasks: Array.from(q.tasks ?? [], ([name, t]) => ({ name: String(name), triggered: !!t.triggered, dropped: !!t.dropped })) };
}

/** The host only wires its already-owned objects; conversion and schema live here, outside its scope. */
export function journeyFacts(loc, building, memberships, quests, loading, position, pixel, region = null, inTown = null) {
  return { region: loc?.regionName ?? region,
    location: loc ? { name: loc.name ?? null, mapId: scalar(loc.mapTableData?.mapId),
      regionIndex: scalar(loc.regionIndex), pixel: { x: pixel.x, y: pixel.y },
      buildings: (loc.exterior?.buildings ?? []).map((b) => ({ type: scalar(b.buildingType), factionId: scalar(b.factionId) })) } : null,
    building: building ? { key: scalar(building.buildingKey), type: scalar(building.buildingType),
      factionId: scalar(building.factionId), mapId: scalar(building.townMapId) } : null,
    memberships: Object.entries(memberships ?? {}).map(([key, m]) => ({ key, guild: m.guild ?? null,
      rank: scalar(m.rank), lastRankChange: scalar(m.lastRankChange) })),
    quests: quests?.values?.() ?? null, loading: !!loading, position: position ? Array.from(position) : null, inTown };
}

/** AGENT13: the built town rectangle and travel's own entrance apron, in the current scene frame.
 *  world.js is wired; exterior.js, worldModes.js and dungeonContext.js are deliberately not fixture hosts. */
export function journeyTown(loc, position, built, pixel, translation) {
  const b = built.get(`${pixel.x},${pixel.y}`), ext = loc?.exterior?.exteriorData;
  if (!b?.locOrigin || !ext || !position?.every(Number.isFinite)) return null;
  const t = translation(pixel.x, pixel.y), x = position[0] - b.locOrigin[0] - t[0], z = position[2] - b.locOrigin[2] - t[2];
  const epsilon = 1e-6; // the same boundary after a floating-origin subtraction
  return x >= -EXTRA_DISTANCE - epsilon && x <= ext.width * RMB_SIDE + EXTRA_DISTANCE + epsilon &&
    z >= -EXTRA_DISTANCE - epsilon && z <= ext.height * RMB_SIDE + EXTRA_DISTANCE + epsilon;
}

/** Wrap the game's COMMITTED counter transfer, not its staging. No event on a refusal or throw, no event at all
 *  outside an installed judge. Item identities/counts are captured before stack merging can alter them. */
export function recordJourneyTrade(entity, building, mode, items, price, proceeds, commit) {
  if (!journeyObserved() || !['Buy', 'Sell', 'SellMagic'].includes(mode)) return commit();
  let going = items.map(judgeItem);
  const goldBefore = totalGoldAmount(entity);
  const result = mode === 'Buy' ? withJourneyPurchase(items, () => { going = items.map(judgeItem); return commit(); }) : commit();
  if (result !== false && going.length) journeyEvent('trade', { t: Math.round(performance.now()), mode, items: going, price,
    payment: proceeds?.kind ?? 'gold', amount: proceeds?.amount ?? price,
    goldBefore, goldAfter: totalGoldAmount(entity), buildingKey: scalar(building?.buildingKey),
    buildingType: scalar(building?.buildingType), factionId: scalar(building?.factionId) });
  return result;
}

/** Detached snapshots only. `source` is a private host closure; nothing calls it through a normal sense.
 *  Events retain completed quests after the machine removes them, and death/exit remain true until page reload. */
export function createJourneyJudge(entity, mode, source = () => null, subscribe = onJourneyEvent, clock = worldMinutes) {
  let dead = false, exited = false, seq = 0;
  const trades = [], rewards = [], ended = new Map(), questOffers = [], offerTokens = new Map(), payments = new Map(), paymentQuests = new Map();
  const rewardSettlements = new Map();
  const dispose = subscribe((kind, data) => {
    if (kind === 'death') dead = true;
    if (kind === 'dungeon-exit') exited = true;
    if (kind === 'trade') trades.push({ seq: ++seq, ...data });
    if (kind === 'quest-offer') {
      const row = { seq: questOffers.length + 1, guild: data.guild, member: data.member, questUID: data.questUID, decision: null };
      offerTokens.set(data.token, row); questOffers.push(row);
    }
    if (kind === 'quest-decision') { const row = offerTokens.get(data.token); if (row && row.decision == null) row.decision = data.decision; }
    if (kind === 'quest-payment') {
      const q = data.action.parentQuest;
      if (!payments.has(q.uid)) payments.set(q.uid, new Map());
      payments.get(q.uid).set(data.action, { kind: data.kind, amount: data.amount,
        committed: data.committed && (data.kind !== 'offered' || rewards.some((r) => r.questUID === q.uid && r.item === data.item)) });
    }
    if (kind === 'reward') rewards.push({ item: data.item, questUID: data.questUID, atOffer: judgeItem(data.item), collected: 0 });
    if (kind === 'take') {
      const r = rewards.find((r) => (r.item === data.item || (r.atOffer.id != null && r.atOffer.id === data.item?.uid)) && r.collected < r.atOffer.count);
      if (r) r.collected = Math.min(r.atOffer.count, r.collected + data.count);
    }
    if (kind === 'quest-ended') {
      ended.set(data.uid, { ...judgeQuest(data), removed: true });
      paymentQuests.set(data.uid, journeyPayment(data, payments.get(data.uid) ?? new Map()));
      rewardSettlements.set(data.uid, journeyPaymentSettled(data, payments.get(data.uid) ?? new Map()));
    }
  });
  for (const item of entity.items ?? []) markJourneyOrigin(item, 'start');
  return {
    dispose,
    read() {
      let s;
      try { s = source(); } catch { s = null; } // boot closure not initialised yet: explicitly unscorable
      const live = Array.from(s?.quests ?? []);
      const quests = live.map(judgeQuest);
      for (const q of live) {
        paymentQuests.set(q.uid, journeyPayment(q, payments.get(q.uid) ?? new Map()));
        rewardSettlements.set(q.uid, journeyPaymentSettled(q, payments.get(q.uid) ?? new Map()));
      }
      for (const q of quests) if (q.complete) ended.set(q.uid, q);
      return structuredClone({ generation, available: s != null && s.quests != null, mode: mode(), frame: journeyFrame(),
        region: s?.region ?? null, location: s?.location ?? null, building: s?.building ?? null,
        loading: s?.loading ?? null, position: s?.position ?? null, inTown: mode() === 'exterior' ? s?.inTown ?? null : false,
        memberships: s?.memberships ?? null, quests: s?.quests == null ? null : [...ended.values(), ...quests.filter((q) => !ended.has(q.uid))],
        rewards: rewards.map(({ questUID, atOffer, collected }) => ({ ...atOffer, questUID, collected, remaining: atOffer.count - collected,
          settled: rewardSettlements.get(questUID) === true && !rewards.some((r) => r.questUID === questUID && r.collected < r.atOffer.count) })),
        questOffers, questPayments: [...paymentQuests.values()].filter(Boolean).map((p) => ({ ...p,
          settled: p.settled && !rewards.some((r) => r.questUID === p.questUID && r.collected < r.atOffer.count) })),
        gold: totalGoldAmount(entity), items: (entity.items ?? []).map(judgeItem), trades,
        dead, dungeonExited: exited, clock: clockNow(clock) });
    },
  };
}
