# Money and Loot

*Studied 2026-10-21 at DFO Online commit `4bba28c6c` (2026-10-20). Written for Tiger Fist. The rules below describe online play.*

For town prices and Prosperity, use [The Play Guide](23-playing-online.md). It covers the town price factors and why a booming town does not automatically pay more for your loot. For Soul Cakes and the current MEND-THIRD resale rule, see [What's New Since 17 October](24-whats-new-2026-10.md). For daily Marks caps, see [Caps, Timers and Catch-Up](27-caps-and-timers.md).

## Early money

### Sell dungeon loot

At an NPC counter, the price starts from item value, quality, condition and the counter's quality. Online, Mercantile and Personality both affect your haggle. The game clamps each skill to 0–100; the classic haggle weights Mercantile 179 and Personality 51. Online, the offer uses that haggle result relative to the result at 100 in both skills, with the online sale-skill weight set to 0.5 and the best haggler's half-price ceiling. Both skills help; Mercantile has the larger effect, and Tiger Fist's Personality 10 still contributes. Town Prosperity then changes counter prices; its effect is explained in [The Play Guide](23-playing-online.md). A shop's displayed offer is the useful answer; there is no single fixed price for a dungeon haul. Online, a found item's condition is valued from when it was found. A repair kit or repair effect earns credit for only one third of the extra condition restored; a smith's paid repair adds no resale credit. Read the MEND-THIRD explanation in [What's New Since 17 October](24-whats-new-2026-10.md) before spending gold to repair an item for resale.

Town Prosperity changes counter prices, but its exact sale-price effect is covered in [The Play Guide](23-playing-online.md). Compare the offer at another counter if you are already passing through another town. Selling loot to a shop is dependable; it does not depend on another player wanting that item.

### Quests and bounties

Continue the courier and guild questlines described in [The Play Guide](23-playing-online.md). Quest rewards are set by the quest; the code does not provide one universal level-7 payout to plan around.

A level 7 bounty falls in bounty tier 1 (levels 1–14). A surface pack of 4–8 foes pays 30–50 gold; a dungeon pack of 2–4 is valued like a surface pack of 4–8. Bounties also award a weapon or armour piece, sometimes Magic from level 4. A bounty is worth taking when its hunt fits the outing; the gold amount alone is modest.

### Court writs and the market

Court work writs pay **Marks**, not gold. The reward is `units × material value × 1.2`, and you can claim up to 3 court writs a day. Their job is a specific delivery from witnessed ground; check the Work board for its current open writs. Guild buy writs are different: they pay from a guild's Marks treasury and require the listed material.

The global market can turn gathered material, eligible crafted goods and kit into player sales. It is not a guaranteed fast sale: the price and the buyer have to match. A successful sale earns more when the good is wanted, but has the fees below.

*Sources: `src/systems/shopStock.js` `calculateTradePrice`, `ONLINE_HAGGLE_MAX`, `ONLINE_SALE_SKILL_WEIGHT`; `src/systems/tradeModes.js` `getTradePrice` and `saleConditionPercentage`; `src/systems/item/foundMark.js` `foundSalePercentage`; `src/net/townEconLaw.js`; `src/systems/bounty/bountyBoard.js` `bountyGold` and `bountyItemRule`; `src/net/professionLaw.js` `writPay` and `COURT_WRITS_PER_DAY`; `src/net/writLaw.js` `WRIT_PAY_PCT`; `bible/06-Systems/Economy-Arc.md`; `bible/06-Systems/Professions-Arc.md` §10; [The Play Guide](23-playing-online.md); [What's New Since 17 October](24-whats-new-2026-10.md).*

## Selling well: shops and the market board

| Route | What it does | What you pay or wait |
|---|---|---|
| NPC shop | Buys eligible inventory immediately for gold at its current counter price. | Offer varies by item, condition, haggle skills, and town. |
| Market listing | Lists eligible materials or crafted goods for gold or Marks. Gold listings can use gathered goods or goods bought with gold. Marks listings can use gathered goods or goods bought with Marks. | Listing fee is 1% of the listing's full value, rounded up, minimum 1. A sale pays 5% tax, rounded down, and may also owe the seat's Tithe. |
| Buy order | Lets you post the price and wait for someone to fill it. | Order lasts 7 days; cross-region fills deduct courier cost from the seller's proceeds. |

A listing lasts 72 hours. The board permits 30 active listings and 20 buy orders per account. The price is 1–1,000,000 per unit for a material or for the whole item; a listing or order cannot exceed 10,000,000 total. Local buyers receive the item immediately. A buyer in another region pays for a courier and waits; cost depends on load size and map distance. The current fee is at least 2 Marks, with a load of 20 units priced per 25 map pixels. The Market tab shows the fee and delivery estimate before you confirm.

The Tithe is zero where no seat holds the board's bailiwick. A seat holder sets a rate of 0–10%, or 0–15% for the higher-rate case. It is taken from the seller's proceeds. Compare the displayed net before listing. The market's currency choices are **gold** and **Marks**. The interface and some code call Marks “silver” or “Drakes”; these names refer to the service-held currency. Gold cannot buy Marks at the bank. The board does not let you freely relabel goods: currency must match how the material was acquired. Masterwork auctions are a separate Marks auction route.

*Sources: `src/net/marketLaw.js` `MARKET_LISTING_S`, `MARKET_ORDER_S`, `MARKET_LISTINGS_MAX`, `MARKET_ORDERS_MAX`, `MARKET_TAX_PCT`, `listingFee`, `saleTax`, `saleTithe`, `MARKET_CURRENCIES`, `listableOrigins`, `courierFee`, `courierSeconds`; `src/net/marksLaw.js` `MARKS_BANK`; `bible/06-Systems/Professions-Arc.md` §10 market and auction rules; `server-account/src/market.js` (main branch).*

## Banking and keeping money safe

Online banking uses the Empire's single account. The client maps regional bank counters to that Empire account, so your balance can be deposited and withdrawn at any region. That is different from offline regional accounts. Gold in the account is not carried weight. Carried coins weigh 0.0025 kg each; a withdrawal is refused if it would put you over your encumbrance limit.

You can turn account gold into a letter of credit worth its face value. The letter is an inventory item, weighs nothing, and can be deposited later. Its issue costs a 1% commission from the account, and the minimum letter is 100 gold. A letter can pay for eligible transactions, but the value does not become account gold until you deposit it.

Loans exist online, but the Empire lends only a tenth of the ordinary limit. Roleplay & Realism (always on online) sets that limit at **10,000 gold per level** by default, so online you can borrow **1,000 gold per level**: at level 7, at most **7,000**. There is one loan at a time. Ten percent interest is added immediately; the repayment date is one game year later. If overdue, account funds are taken first. Online, if that is not enough, the Empire can draw from the other regional balances; an unpaid remainder becomes a default.

A respawn death takes one tenth of the gold in your purse, rounded down. It does not take bank gold or letters of credit. Keep only the spendable cash you need on a trip and deposit excess. Marks, Soul Cakes and Weir Keys are held by the account service; physical inventory theft does not reach those balances. Letters, Shards and other bound items follow their own item rules.

*Sources: `src/systems/banking.js` `calculateMaxBankLoan`, `EMPIRE_LOAN_DIVISOR`; `src/systems/roleplayRealism/rrRealism.js` `rrMaxBankLoan`, `LOAN_VALUES`; `src/systems/banking.js` `goldRegion`, `withdrawGold`, `withdrawLetter`, `borrowLoan`, `calculateMaxBankLoan`, `settleOverdueLoan`; `src/systems/deathPenalty.js` `DEATH_GOLD_DIVISOR`; `src/systems/inventory.js` `GOLD_PIECE_WEIGHT_KG` and `letterOfCredit`; `src/net/realm/realmGoldLaw.js`; `src/net/marksLaw.js` `MARKS_BANK`; `server-account/src/marks.js` (main branch).* 

## Currencies

| Currency | Use and how it enters play |
|---|---|
| Gold | Shop purchases and sales, ordinary quests and bounties, and bank deposits. Carried coins have weight. |
| Marks (“silver” or “Drakes”) | Online market currency and account-held balance. Combat events can award Marks: a gate pays 50, a raid 30, and eligible combat sources together are capped at 150 per account per UTC day. The Bank of the Empire exchanges up to 300 Marks per UTC day at 8 gold per Mark. The exchange is one way: gold cannot be converted back into Marks. |
| Welkynd Shards | Bound salvage currency for reforging. Reforge salvage yields 1 from Magic, 3 from Rare, 8 from Legendary, or 15 from Exalted. A Portal Stone costs 5 shards. Salvage only eligible found, rarity-graded pieces. Do not break artifacts, quest or bound items, locked or worn gear, socketed pieces, Aetheric pieces, or items the salvage law refuses. Remove socketed gems first. |
| Soul Cakes | Account-held Witches' Festival currency, earned through the festival's server-tracked acts. Spend them at festival offerings and wares. A Hearth Offering at your home is one of the event's ways to contribute. See [What's New Since 17 October](24-whats-new-2026-10.md) for the current event details. |
| Weir Keys | Account-held keys awarded by the Elite Gate service. Stake one to open a Weir; the key is spent when the service accepts the opening. They are not ordinary loot or market goods. |

The Wallet displays gold, Marks, letters of credit, Deadlands Embers and Welkynd Shards. Letters, Embers and Shards occupy the inventory's wallet holdings; the Marks balance stays on the account. The shard is bound, so it cannot be sold, traded or dropped. Salvage is its practical source for this fighter; portal and reforging uses consume it. Do not count the shard's template value as a sale price.

*Sources: `src/net/marksLaw.js` `MARKS_FAUCETS`, `MARKS_COMBAT`, `MARKS_BANK`, `exchangeGold`; `src/systems/gate/gateSpoils.js` `WELKYND_SHARD`, `PORTAL_STONE_SHARDS`, gate spoils; `src/systems/reforge.js` `SALVAGE_SHARDS`, `salvageRefusal`, `salvagePiece`; `src/systems/walletItem.js` `WALLET_HOLDS`; `src/net/festivalLaw.js`; `src/systems/festival/soulCake.js`; `src/systems/eliteGates/weirKey.js`; `src/net/eliteGates/egLaw.js`; `bible/06-Systems/Wallet.md`; `bible/06-Systems/Materials-Bag.md`; `bible/06-Systems/Loot-Arc.md`.*

## Loot: keep, sell, salvage, repair

**Identify before making a decision about enchanted loot.** Ordinary unenchanted items are already identified. An enchanted item's identify cost is based on its value; a spell can also identify it. Compare the likely use and market value with the cost before paying a shop. Unidentified magic items may be harder to evaluate or list.

**Keep** useful equipment, quest items, materials you plan to craft with, and gear worth listing. Tiger Fist cannot use Steel, Elven or Dwarven weapons, so check metal before carrying a weapon for resale or equipping. **Sell** common spare gear and items you do not need. **Salvage** eligible Magic-or-better drops only when shards are more useful than the sale or a possible listing. The salvage window rechecks each item; automatic selection excludes Legendary items, and bound, worn, locked, quest, artifact, Aetheric or socketed pieces can be refused.

Inventory weight follows each item's template and material. Gold adds 0.0025 kg per coin. The Materials Bag, sold at General Stores, holds up to 300 kg of eligible raw materials separately from normal pack encumbrance. It cannot be sold or dropped while it holds materials. The profession Stores system also holds gathering and crafting materials; see [The Play Guide](23-playing-online.md) for gathering and profession routes.

NPC smiths repair equipment for gold. Repair kits and repair effects can mend gear in the field, but may be partial. For use, repair the gear you rely on. For resale, remember only one third of your own kit/effect repair above the found condition is credited; smith repairs add no sale credit. For exact condition and batch-salvage changes, use [What's New Since 17 October](24-whats-new-2026-10.md).

*Sources: `src/systems/tradeModes.js` `itemIsIdentified`, `calculateItemIdentifyCost`, `saleConditionPercentage`; `src/systems/reforge.js` `salvageRefusal` and `salvagePiece`; `src/systems/inventory.js` `unitWeightInKg`, `GOLD_PIECE_WEIGHT_KG`; `src/net/bagLaw.js` `BAG_KG_LIMIT`, `BAG_BASE_PRICE`; `src/systems/materialsBag.js` `materialKeyOfItem`, `roomFor`; `src/systems/repairService.js`; `src/net/repairLaw.js`; `src/systems/item/foundMark.js`; `bible/06-Systems/Physical-Items.md`; `bible/06-Systems/Materials-Bag.md`; `bible/06-Systems/Loot-Arc.md`; [What's New Since 17 October](24-whats-new-2026-10.md).*

## Owning a home online

Buy a home at its own front door. The offer is available online to registered accounts; the home becomes that character's property and is shared with other players according to its entry setting. Online prices depend on the building footprint and town size, round to the nearest 100 gold, and are bounded from **5,000 to 250,000 gold**. The bank does not sell online homes.

An owner gets personal storage and a bed in the home's own online scene; visitors do not share the owner's cupboard. Set entry to private, party, public or guild at the door. The bed gives a place to rest; the cupboard is personal. The guild setting lets guildmates enter, but a home does not grant a separate guild influence bonus. Guild halls and their influence are a separate system. A home also lets you place a Hearth Offering bowl during the Witches' Festival; see [What's New Since 17 October](24-whats-new-2026-10.md) for its price, capacity and returns.

*Sources: `src/net/homeLaw.js` `HOME_PRICE_MIN`, `HOME_PRICE_MAX`, `homeOnlinePrice`, entry settings; `src/systems/online/onlineHomes.js` home storage and bed; `src/systems/banking.js` `purchaseHouse`; `src/net/homeLaw.js` `HOME_ENTRIES`; `src/systems/festival` Hearth Offering interaction; `server-account/src/homes.js` (main branch); `bible/06-Systems/Economy-Arc.md`; `bible/06-Systems/Professions-Arc.md` §10.*

## A money plan for Tiger Fist

For a 1–2 hour session, take one suitable quest or bounty, clear a manageable dungeon, and sell the spare loot when you return. Bounties at level 7 pay about 30–50 gold for a full surface pack, plus a gear reward. Keep coins for travel, food and repairs; bank the rest so a heavy purse does not crowd out loot. Collect the daily Marks sources already on your route, then exchange Marks at the Empire's bank only when you need gold. Salvage unwanted Magic-or-better gear if you need shards for a Portal Stone or a reforge; keep useful gear and avoid paying for a resale repair. A court writ is worthwhile when its material is already in your Stores or easy to gather. Check the daily caps and event schedule in [Caps, Timers and Catch-Up](27-caps-and-timers.md) and [The Play Guide](23-playing-online.md).

*Sources: `src/systems/bounty/bountyBoard.js` `bountyGold`; `src/net/marksLaw.js` `MARKS_COMBAT`, `MARKS_BANK`; `src/net/professionLaw.js` `writPay`; `src/systems/banking.js` `depositGold`; `src/systems/reforge.js` `SALVAGE_SHARDS`; [Caps, Timers and Catch-Up](27-caps-and-timers.md); [The Play Guide](23-playing-online.md).*
