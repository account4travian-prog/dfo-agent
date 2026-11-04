/** Public numeric rules only. Pure exported laws are imported; browser-bound
 * modules use explicit, fail-closed source regexes (recorded as method: source-regex).
 * dfo.text(path) reads UTF-8 relative to src, never a running game or account. */
const exported = (id, label, path, symbol, unit, divisor = 1) => ({
  id,
  label,
  unit,
  appliesOnline: 'base',
  source: `src/${path}`,
  symbol,
  method: 'export',
  read: async dfo => (await dfo(path))[symbol] / divisor
});
const property = (id, label, path, symbol, unit) => ({
  id,
  label,
  unit,
  appliesOnline: 'base',
  source: `src/${path}`,
  symbol,
  method: 'export',
  read: async dfo => symbol.split('.').reduce((v, k) => v?.[k], await dfo(path))
});
const regex = (id, label, path, symbol, pattern, unit) => ({
  id,
  label,
  unit,
  appliesOnline: 'base',
  source: `src/${path}`,
  symbol,
  method: 'source-regex',
  read: async dfo => {
    const match = (await dfo.text(path)).match(pattern);
    if (!match) throw Error(`Source pattern no longer matches ${path}: ${symbol}`);
    return match[1].split('*').reduce((v, s) => v * Number(s.trim().replaceAll('_', '')), 1);
  }
});
const constant = (id, label, path, symbol, unit) => regex(id, label, path, symbol, new RegExp(`^export const ${symbol} = ([0-9_ . *]+);`, 'm'), unit);
// Some public laws are exported functions; call them for the finite number they publish.
const computed = (id, label, path, symbol, unit, read) => ({
  id,
  label,
  unit,
  appliesOnline: 'base',
  source: `src/${path}`,
  symbol,
  method: 'export',
  read: async dfo => read(await dfo(path))
});
const firm = 'net/firmament/firmamentLaw.js', renown = 'net/renown.js', marks = 'net/marksLaw.js', prof = 'net/professionLaw.js', guild = 'net/guild/guildLaw.js';
export const registry = [
  exported('firmament.starsPerRenown', 'Stars per Renown after the first', firm, 'STARS_PER_RENOWN', 'stars'),
  exported('firmament.refundFreeBelowRenown', 'Refunds free below Renown', firm, 'REFUND_FREE_BELOW_RENOWN', 'Renown'),
  exported('firmament.refundCostPerStar', 'Refund cost per star', firm, 'REFUND_SILVER_PER_STAR', 'Marks'),
  exported('firmament.respecGold', 'Firmament respec', firm, 'FIRM_RESPEC_GOLD', 'gold'),
  exported('renown.max', 'Maximum Renown', renown, 'RENOWN_MAX', 'Renown'),
  exported('renown.hourlyXpCap', 'Renown XP per real hour', renown, 'RENOWN_XP_HOUR_MAX', 'XP'),
  exported('renown.partyBonusPct', 'Renown bonus per additional party member', renown, 'RENOWN_PARTY_BONUS_PCT', '%'),
  exported('party.max', 'Maximum party size', 'net/wire.js', 'PARTY_MAX', 'players'),
  constant('death.goldDivisor', 'Carried gold loss divisor', 'systems/deathPenalty.js', 'DEATH_GOLD_DIVISOR'),
  exported('dungeon.respawnMinutes', 'Public dungeon respawn', 'systems/dungeon/dungeonRespawn.js', 'DUNGEON_RESPAWN_MS', 'minutes', 60000),
  exported('dungeon.eliteRespawnMinutes', 'Elite dungeon respawn', 'systems/dungeon/dungeonRespawn.js', 'ELITE_DUNGEON_RESPAWN_MS', 'minutes', 60000),
  property('pistolet.damageMin', 'Dwarven Pistolet minimum damage', 'characters/thunderlockIds.js', 'PISTOLET_SPAN.min', 'damage'),
  property('pistolet.damageMax', 'Dwarven Pistolet maximum damage', 'characters/thunderlockIds.js', 'PISTOLET_SPAN.max', 'damage'),
  property('pistolet.price', 'Dwarven Pistolet base price', 'systems/pistolet.js', 'PISTOLET_TEMPLATES.0.basePrice', 'gold'),
  exported('wild.foeHealthMult', 'Wild zone foe health multiplier', 'systems/wild/wildZone.js', 'WILD_FOE_HEALTH_MULT', 'times'),
  exported('wild.foeDamageMult', 'Wild zone foe damage multiplier', 'systems/wild/wildZone.js', 'WILD_FOE_DAMAGE_MULT', 'times'),
  exported('crafts.courtWritsPerDay', 'Court writs per day', prof, 'COURT_WRITS_PER_DAY', 'writs'),
  exported('craftWrits.perDay', 'Craft writs per day', 'net/craftWritLaw.js', 'CRAFT_WRITS_PER_DAY', 'writs'),
  property('marks.combatPerDay', 'Combat Marks per day', marks, 'MARKS_COMBAT.perDay', 'Marks'),
  property('marks.bankPerDay', 'Marks bank exchange per day', marks, 'MARKS_BANK.perDay', 'Marks'),
  property('marks.bankGoldPerMark', 'Bank exchange gold per Mark', marks, 'MARKS_BANK.goldPerMark', 'gold'),
  exported('market.listingHours', 'Market listing lifetime', 'net/marketLaw.js', 'MARKET_LISTING_S', 'hours', 3600),
  exported('market.listingsMax', 'Maximum market listings', 'net/marketLaw.js', 'MARKET_LISTINGS_MAX', 'listings'),
  exported('crafts.aboveJourneyman', 'Crafts allowed above Journeyman', prof, 'CRAFTS_ABOVE_JOURNEYMAN', 'crafts'),
  exported('crafts.journeymanRank', 'Journeyman rank', prof, 'JOURNEYMAN_RANK', 'rank'),
  constant('travel.portalStoneShards', 'Portal Stone shard cost', 'systems/gate/gateSpoils.js', 'PORTAL_STONE_SHARDS', 'shards'),
  exported('sea.prizeShare', 'Prize share of a wreck’s worth', 'net/sea/seaPrizeLaw.js', 'SEA_PRIZE_SHARE', 'share'),
  exported('sea.prizePiecesMax', 'Maximum pieces taken as a sea prize', 'net/sea/seaPrizeLaw.js', 'SEA_PRIZE_PIECES_MAX', 'pieces'),
  exported('sea.prizeHoldDays', 'Prize hold before unclaimed goods return', 'net/sea/seaPrizeLaw.js', 'SEA_PRIZE_HOLD_S', 'days', 86400),
  exported('dayTurn.spreadMs', 'Daily turn spread window', 'net/dayTurn.js', 'DAY_TURN_SPREAD_MS', 'ms'),
  settingFact('travel.carriageDailyFee', 'Online daily carriage fee', 'immersive-travel', 'General.DailyCarriageFee', 'gold'),
  constant('bank.onlineLoanDivisor', 'Online loan divisor', 'systems/banking.js', 'EMPIRE_LOAN_DIVISOR'),
  exported('home.priceMin', 'Minimum home price', 'net/homeLaw.js', 'HOME_PRICE_MIN', 'gold'),
  exported('home.priceMax', 'Maximum home price', 'net/homeLaw.js', 'HOME_PRICE_MAX', 'gold'),
  exported('guild.foundingGold', 'Guild founding cost', guild, 'GUILD_FOUND_GOLD', 'gold'),
  exported('guild.foundingRenown', 'Guild founding Renown', guild, 'GUILD_FOUND_RENOWN', 'Renown'),
  exported('guild.membersMax', 'Maximum guild members', guild, 'GUILD_MEMBERS_MAX', 'members'),
  computed('training.memberCostPerLevel', 'Guild member training cost per level', 'systems/guild/guildServices.js', 'trainingPrice(member, 1)', 'gold', m => m.trainingPrice({ rank: 0 }, 1)),
  computed('training.nonmemberCostPerLevel', 'Non-member training cost per level', 'systems/guild/guildServices.js', 'trainingPrice(non-member, 1)', 'gold', m => m.trainingPrice({ rank: -1 }, 1)),
  computed('training.sessionCap', 'Highest skill training can reach', 'systems/guild/guildServices.js', 'trainingMax()', 'skill level', m => m.trainingMax()),
  constant('revenant.minRenown', 'Revenants begin at Renown', 'systems/revenant/revenant.js', 'REVENANT_MIN_RENOWN', 'Renown'),
];
// A settings-dependent fact asks the same store as the online game.
function settingFact(id, label, vendor, key, unit) {
  return {
    id,
    label,
    unit,
    vendor,
    key,
    appliesOnline: 'whole',
    method: 'export',
    source: 'src/systems/modSettings.js',
    symbol: `modSetting(${vendor}, ${key})`,
    read: async dfo => (await dfo('systems/modSettings.js')).modSetting(vendor, key)
  };
}
// Guard each PCAAO rule with its real switch before reading its exported law.
function pcaaoFact(id, label, key, read, symbol, unit) {
  return {
    id: `pcaao.${id}`,
    label,
    unit,
    vendor: 'pcaao',
    key,
    appliesOnline: 'whole',
    method: 'export',
    source: 'src/combat/pcaao.js',
    symbol,
    async read(dfo) {
      const {
        modSetting
      } = await dfo('systems/modSettings.js');
      if (!modSetting('pcaao', 'Enabled') || !modSetting('pcaao', key)) throw Error(`Online PCAAO rule is disabled: ${key}`);
      return read(await dfo('combat/pcaao.js'), dfo);
    },
  };
}
registry.push(pcaaoFact('hitChanceMin', 'Minimum hit chance', 'armorHitFormulaRedone', m => m.PCAAO_HIT_CHANCE_MIN, 'PCAAO_HIT_CHANCE_MIN', '%'), pcaaoFact('hitChanceMax', 'Maximum hit chance', 'armorHitFormulaRedone', m => m.PCAAO_HIT_CHANCE_MAX, 'PCAAO_HIT_CHANCE_MAX', '%'), pcaaoFact('strengthDamageDivisor', 'Strength damage divisor', 'fixedStrengthDamageModifier', m => 100 / (m.pcaaoDamageModifier(150) - m.pcaaoDamageModifier(50)), 'pcaaoDamageModifier'), pcaaoFact('adrenalineRushThresholdDivisor', 'Adrenaline Rush health threshold divisor', 'armorHitFormulaRedone', async (m, dfo) => {
  const text = await dfo.text('combat/pcaao.js');
  const match = text.match(/const rushing = .*?maxHealth \?\? 0\) \/ (\d+)\)/);
  if (!match) throw Error('Adrenaline Rush threshold source changed');
  return Number(match[1]);
}, 'pcaaoAdrenalineRushToHit (threshold, source-regex)'), pcaaoFact('adrenalineRushBonus', 'Adrenaline Rush hit bonus', 'armorHitFormulaRedone', async (m, dfo) => {
  const {
    SPECIAL_ABILITY_BITS
  } = await dfo('systems/specialAdvantages.js');
  return m.pcaaoAdrenalineRushToHit({
    career: {
      abilityFlagsAndSpellPointsBitfield: SPECIAL_ABILITY_BITS.adrenalineRush
    },
    health: 1,
    maxHealth: 120
  }, {
    career: {}, health: 120, maxHealth: 120
  });
}, 'pcaaoAdrenalineRushToHit', 'to hit'),);
registry.push(pcaaoFact('adrenalineRushImprovedBonus', 'Improved Adrenaline Rush hit bonus', 'armorHitFormulaRedone', async (m, dfo) => {
  const text = await dfo.text('combat/pcaao.js');
  const match = text.match(/if \(rushing\(attacker\)\) mod \+= entityImprovedAdrenalineRush\(attacker\) \? (\d+) : 8/);
  if (!match) throw Error('Improved Adrenaline Rush bonus source changed');
  return Number(match[1]);
}, 'pcaaoAdrenalineRushToHit (improved bonus)', 'to hit'));
for (const id of ['pcaao.adrenalineRushThresholdDivisor', 'pcaao.adrenalineRushImprovedBonus']) registry.find(fact => fact.id === id).method = 'source-regex';
export default registry;
