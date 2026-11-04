---
title: Shops and prices
summary: Match a shop to the goods it stocks, compare its offer with your needs, and use haggling with condition and town prices in mind.
stage: town
order: 20
gate: none
tags: [shops, prices, haggling, prosperity]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Use the right counter: each shop type stocks and buys particular groups of goods.
> - The price shown before you confirm is the price that matters; haggling depends on both Mercantile and Personality.
> - Online, worn weapons and armor are worth less, and a shop limits what it pays for items you sell.
> - A town's Prosperity affects asking and selling prices. Compare counters before spending or selling.

## Choose a counter

The nine shop types are Alchemist, Armorer, Bookseller, Clothing Store, Furniture Store, Gem Store, General Store, Pawn Shop and Weapon Smith. Their stock is rolled for each shop and can change when the game day changes. A shop buys only the item groups its counter accepts. The Pawn Shop takes a broad range; specialist counters are narrower. Only Armorers, General Stores and Weapon Smiths repair equipment.

Some goods are handled through their own systems rather than ordinary shop shelves. For example, the game excludes endless-stock supplies, trade goods and boat parts from ordinary buyback. Read the counter's available actions before hauling something across town to sell.

## Read the price

The regional price index sets a shared baseline, and shop quality moves the counter's asking price around that baseline. Haggling uses the merchant's skill against yours. Mercantile carries more weight in the calculation than Personality, but both matter ([attributes and skills](../creation/attributes-and-skills.md)). Your offered sale price is worse than the counter's buying price, and online limits the maximum a counter pays.

Online, Roleplay & Realism: Items prices weapons and armor by condition. New or well-kept goods are worth more than badly worn pieces. Town Prosperity adds another local factor to what counters ask and pay; the score is shown on the town's card ([reading a town](reading-a-town.md)). A thriving town can therefore feel different from a struggling one even where the regional index is the same.

> [!tip] Before you sell
> Check condition, compare the counter's displayed offer, and keep in mind that an item bought from a counter cannot later be sold back to that counter for more than it originally charged.

## Common mistakes

- **Selling to the first counter you pass.** Offers vary with the counter's quality, the item's condition and the town's Prosperity; compare a second counter before selling a full haul. Cost: the difference on every item.
- **Repairing a found item to raise its sale price.** A found item keeps its found condition mark when sold, and a paid repair adds no resale credit ([salvage and repair](../gear/salvage-and-repair.md)). Cost: the repair fee.
- **Carrying a day's takings into the next dungeon.** The online death penalty takes one tenth of the gold you carry; deposit the proceeds at a [bank](banks.md) first. Cost: gold on every death.

## Next

- [Banks](banks.md)
- [Taverns and rooms](taverns-and-rooms.md)

## Sources

- `src/systems/shopStock.js`: `isShop`, `isRepairShop`, `SHOP_BUYS_GROUPS`, `calculateCost`, `calculateTradePrice`, online price limits
- `src/systems/roleplayRealismItems/rriRealism.js`: `conditionCostBase`, `conditionBasedPricesOn`
- `src/net/townEconLaw.js`: `townProsperity`, `townShopFactor`
- `src/systems/online/onlineLane.js`: Roleplay & Realism: Items and town economy online lane
- Research: `handbook/research/T1.md` (shops, prices, haggling, Prosperity)
