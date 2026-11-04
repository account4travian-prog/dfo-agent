#!/usr/bin/env node
// Beam-search a connected, capped Firmament plan for Tiger Fist.
// DFO_SRC may point at the read-only DFO source export's src directory.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.resolve(process.env.DFO_SRC || path.join(workspace, 'upstream/daggerfall-js-source/src'));
const T = await import(pathToFileURL(path.join(source, 'net/firmament/firmamentTree.js')).href);
const L = await import(pathToFileURL(path.join(source, 'net/firmament/firmamentLaw.js')).href);

const start = 'st.start';
const milestones = [5, 10, 15, 20, 30, 40, 50];
const beamWidth = 120;
const craftRanks = [100, 100, 100, 100]; // Provisioning, Smithing, Herbalism, Mining.
const craftBudget = L.craftPointsFor(craftRanks);
const weights = {
  fistBlow: 70, meleeBlow: 2, weaponBlow: 1,
  blowTaken: 40, evade: 6, hp: 1.5, hpPct: 2, armor: 4,
  strength: 2.8, speed: 3, luck: 1.7, agility: 1.8, endurance: 2.2,
  hpRegen: 1.2, HandToHand: 12, CriticalStrike: 1.7, Dodging: 1.8, Running: 1,
  herbalism: 3, mining: 3, smithing: 3, provisioning: 3,
  carry: 0.5, fatigueLess: 0.5,
};
// Replaceable modeling inputs; 50 is not a claim about Tiger Fist's current attributes or skills.
const attrBase = { strength: 50, speed: 50, luck: 50, agility: 50, endurance: 50 };
const skillBase = { HandToHand: 50, CriticalStrike: 50, Dodging: 50, Running: 50 };
const goalChannels = new Set(['weaponDmg','meleeDmg','fistDmg','blowTaken','evade','hp','hpPct','armor','hpRegen','strength','skill.HandToHand','skill.CriticalStrike','skill.Dodging']);
const combatGoals = [...T.FIRM_NODES.values()].filter((n) => n.ring === 'combat' && n.kind !== 'start' && Object.keys(n.stats).some((key) => goalChannels.has(key)));

function rawTotals(keys) { return L.totals({ start, keys }); }
function cappedTotals(keys) { return L.capped(rawTotals(keys)); }
function utility(keys) {
  const c = cappedTotals(keys);
  const fist = L.blowPct(c, { skill: 'HandToHand' });
  const blade = L.blowPct(c, { skill: 'LongBlade' });
  const any = L.blowPct(c, {});
  let score = fist * weights.fistBlow + Math.max(0, blade - fist) * weights.meleeBlow + Math.max(0, any - blade) * weights.weaponBlow;
  // Negative blowTaken is mitigation and is deliberately a major survival reward.
  score += Math.max(0, -(c.blowTaken ?? 0)) * weights.blowTaken;
  score -= Math.max(0, c.blowTaken ?? 0) * weights.blowTaken;
  for (const k of ['evade', 'hp', 'hpPct', 'armor', 'hpRegen']) score += Math.max(0, c[k] ?? 0) * weights[k];
  for (const a of ['strength', 'speed', 'luck', 'agility', 'endurance']) {
    score += Math.max(0, c[a] ?? 0) * weights[a];
    score += L.pctOf(attrBase[a], c[`pct.${a}`] ?? 0) * weights[a];
  }
  for (const s of ['HandToHand', 'CriticalStrike', 'Dodging', 'Running']) {
    score += Math.max(0, c[`skill.${s}`] ?? 0) * weights[s];
    score += L.pctOf(skillBase[s], c[`skillPct.${s}`] ?? 0) * weights[s];
  }
  for (const p of ['herbalism', 'mining', 'smithing', 'provisioning']) {
    score += Math.max(0, c[`xp.${p}`] ?? 0) * weights[p];
    score += Math.max(0, c[`yield.${p}`] ?? 0) * weights[p];
  }
  score += Math.max(0, c.carry ?? 0) * weights.carry;
  score += Math.max(0, c.fatigueLess ?? 0) * weights.fatigueLess;
  return score;
}
function describe(node) { return Object.entries(node.stats).map(([k, v]) => L.statWords(k, v)).join('; ') || 'no stat'; }
function channelSummary(keys) {
  const c = cappedTotals(keys);
  const channels = ['weaponDmg','meleeDmg','fistDmg','blowTaken','evade','hp','hpPct','armor','strength','pct.strength','speed','pct.speed','luck','agility','endurance','hpRegen','skill.HandToHand','skill.CriticalStrike','skill.Dodging','skill.Running','xp.herbalism','yield.herbalism','xp.mining','yield.mining','xp.smithing','xp.provisioning','carry','fatigueLess'];
  return channels.filter((k) => c[k]).map((k) => L.statWords(k, c[k])).join(', ') || 'none';
}
function spend(keys, stars) {
  const cost = L.firmCostOf(keys);
  const left = L.pointsLeft(keys, stars, craftBudget);
  return { cost, left, totalLeft: stars + craftBudget - cost.combat - cost.life };
}
function valid(keys, stars) {
  return L.fits(keys, stars, craftBudget) && !L.treeFault({ start, keys }, stars, craftBudget);
}
function signature(keys) { return [...keys].sort().join('|'); }
function rankState(state, stars) {
  const s = spend(state.keys, stars);
  return utility(state.keys) - (s.totalLeft * 1e-8);
}
function hasPositiveContinuation(keys, first, stars, ring, banned) {
  const before = utility(keys);
  const afterFirst = [...keys, first];
  for (const next of T.FIRM_ADJ.get(first) ?? []) {
    const node = T.firmNode(next);
    if (!node || node.kind === 'start' || node.ring !== ring || banned.has(next) || afterFirst.includes(next)) continue;
    const extended = [...afterFirst, next];
    const cost = L.firmCostOf(extended);
    if (cost.combat <= stars && cost.combat + cost.life <= stars + craftBudget && valid(extended, stars) && utility(extended) > before) return true;
  }
  return false;
}
function beamToBudget(seed, stars, ring, banned = new Set()) {
  let beam = [seed];
  const maximumStars = stars + craftBudget;
  while (true) {
    const expanded = new Map();
    let changed = false;
    for (const state of beam) {
      const owned = new Set(state.keys);
      const frontier = new Set();
      for (const from of [start, ...state.keys]) {
        const node = T.firmNode(from);
        if (from !== start && node?.kind === 'keystone') continue;
        for (const key of T.FIRM_ADJ.get(from) ?? []) {
          if (key === start || owned.has(key) || T.START_KEYS.includes(key)) continue;
          frontier.add(key);
        }
      }
      for (const key of frontier) {
        if (T.firmNode(key)?.ring !== ring) continue;
        if (banned.has(key)) continue;
        const oneStar = [...state.keys, key];
        const oneCost = L.firmCostOf(oneStar);
        if (oneCost.combat > stars || oneCost.combat + oneCost.life > maximumStars || !valid(oneStar, stars)) continue;
        // After the actual fist blow has hit its shared cap, zero-marginal combat stars do not consume Renown.
        if (utility(oneStar) <= utility(state.keys) && !hasPositiveContinuation(state.keys, key, stars, ring, banned)) continue;
        const sig = signature(oneStar);
        if (!expanded.has(sig)) expanded.set(sig, { keys: oneStar });
        changed = true;
      }
      // Expand complete shortest paths to score-bearing targets as well as one-star frontiers.
      // This keeps a zero-value bridge alive when it leads to a valuable guard or fist cluster.
      for (const target of (ring === 'combat' ? combatGoals : [])) {
        if (target.ring !== ring || state.keys.includes(target.key) || banned.has(target.key)) continue;
        const route = L.pathTo({ start, keys: state.keys }, target.key);
        if (!route.length || route.some((key) => banned.has(key))) continue;
        const keys = [...state.keys, ...route.filter((key) => !state.keys.includes(key))];
        const cost = L.firmCostOf(keys);
        if (cost.combat > stars || cost.combat + cost.life > maximumStars || !valid(keys, stars) || utility(keys) <= utility(state.keys)) continue;
        const sig = signature(keys);
        if (!expanded.has(sig)) expanded.set(sig, { keys });
        changed = true;
      }
    }
    if (!changed) break;
    const next = [...expanded.values()].sort((a, b) => rankState(b, stars) - rankState(a, stars) || signature(a.keys).localeCompare(signature(b.keys)));
    beam = next.slice(0, beamWidth);
    if (!beam.length) break;
    const best = beam[0];
    // A route can include bridge stars; expansion stops only when no reachable legal purchase remains.
    if (best.keys.length >= maximumStars) break;
  }
  return beam.sort((a, b) => rankState(b, stars) - rankState(a, stars))[0] ?? seed;
}
function totalsForPlan(keys, stars) {
  const c = cappedTotals(keys);
  const { cost, left, totalLeft } = spend(keys, stars);
  return { c, cost, left, totalLeft };
}
function printPlan(renown, keys, previous) {
  const stars = L.starsFor(renown);
  const added = keys.filter((k) => !previous.includes(k));
  const allOrdered = keys;
  console.log(`\nRenown ${renown} — ${stars} Renown Stars; ${keys.length} total stars; +${added.length} this step`);
  added.forEach((key, i) => {
    const prefix = [...previous, ...added.slice(0, i + 1)];
    const n = T.firmNode(key);
    const { c } = totalsForPlan(prefix, stars);
    console.log(`${String(previous.length + i + 1).padStart(2, '0')}. ${n.name} [${key}] — ${describe(n)} | fist blow ${L.blowPct(c, { skill: 'HandToHand' })}% | blowTaken ${c.blowTaken ?? 0} | evade ${c.evade ?? 0}% | hp ${c.hp ?? 0} | hpPct ${c.hpPct ?? 0}%`);
  });
  const { c, cost, left, totalLeft } = totalsForPlan(allOrdered, stars);
  console.log(`Totals: ${channelSummary(keys)}`);
  console.log(`Spend: ${cost.combat} combat + ${cost.life} life; Renown Stars left ${left.stars}; Craft left ${left.craft}; total unspent ${totalLeft}.`);
  console.log(`Combat readout: fist blow ${L.blowPct(c, { skill: 'HandToHand' })}%; blowTaken ${c.blowTaken ?? 0}; evade ${c.evade ?? 0}%; hp ${c.hp ?? 0}; hpPct ${c.hpPct ?? 0}%.`);
}

console.log(`Firmament source: ${source}`);
console.log(`Search: beam width ${beamWidth}; start The Steed (${start}); assumed Craft budget ${craftBudget}; combat score uses marginal blowPct.`);
// Reserve the first eight combat stars for the shortest legal route toward Pankration.
// This makes the build's Hand-to-Hand cluster reachable at the first tier where its capped channel matters.
const fistOpening = L.pathTo({ start, keys: [] }, 'st.c5.4').slice(0, 8);
let best = { keys: fistOpening };
let previous = [];
// st.r2 is a necessary bridge to the fist cluster in this tree. Keep it, but exclude Charge and the Long Blade cluster.
const noChargePath = new Set(['st.k', ...[...T.FIRM_NODES.keys()].filter((key) => key.startsWith('st.c1.'))]);
for (const renown of milestones) {
  best = beamToBudget(best, L.starsFor(renown), 'combat', noChargePath);
  best = beamToBudget(best, L.starsFor(renown), 'life', noChargePath);
  const keys = best.keys;
  if (!previous.every((k) => keys.includes(k))) throw new Error(`Renown ${renown} plan is not a superset`);
  if (!L.fits(keys, L.starsFor(renown), craftBudget) || L.treeFault({ start, keys }, L.starsFor(renown), craftBudget)) throw new Error(`Renown ${renown} failed Firmament law`);
  printPlan(renown, keys, previous);
  previous = keys;
}

function steedComparison(keys) {
  const c = cappedTotals(keys);
  return { keys: keys.length, fist: L.blowPct(c, { skill: 'HandToHand' }), blowTaken: c.blowTaken ?? 0, evade: c.evade ?? 0, hp: c.hp ?? 0, hpPct: c.hpPct ?? 0, score: utility(keys) };
}
const charge = T.firmNode('st.k');
const noChargeKeys = previous;
const chargePath = L.pathTo({ start, keys: [] }, 'st.k');
let withCharge = { keys: [...chargePath] };
if (L.treeFault({ start, keys: withCharge.keys }, L.starsFor(50), craftBudget)) throw new Error('Steed comparison path is invalid');
withCharge = beamToBudget(withCharge, L.starsFor(50), 'combat');
withCharge = beamToBudget(withCharge, L.starsFor(50), 'life');
const withChargeKeys = withCharge.keys;
if (!valid(noChargeKeys, L.starsFor(50)) || !valid(withChargeKeys, L.starsFor(50))) throw new Error('Steed comparison tree failed Firmament law');
console.log('\nRenown 50 Steed\'s Charge comparison:');
console.log(`Without Steed's Charge and Long Blade cluster (st.k, st.c1.*); st.r2 remains because the live graph requires it to reach st.c5.*: ${JSON.stringify(steedComparison(noChargeKeys))}`);
console.log(`With Steed's Charge (${describe(charge)}): ${JSON.stringify(steedComparison(withChargeKeys))}`);

const lifeNodes = previous.filter((key) => T.firmNode(key)?.ring === 'life');
console.log(`\nLife-ring allocation uses the assumed ${craftBudget} Craft points first; any life stars beyond that use Renown Stars. Allocated life stars: ${lifeNodes.length}.`);
