---
title: Salvage and repair
summary: Welkynd Shards from salvage, repair costs, and resale value.
stage: gear
order: 30
gate: none
tags: [salvage, repair, Welkynd Shards, gear]
verified: 0df2d87eb
status: draft
---

> [!tip] At a glance
> - Salvage eligible found Magic, Rare and Legendary gear for bound Welkynd Shards.
> - Common gear, crafted gear and most special items cannot be salvaged.
> - Online repairs use the item's missing condition in the price calculation, then apply the repair service's one-third scale.
> - A found item's worn condition sets its resale mark; repair does not erase that mark.

## Salvaging gear

Use **Salvage** on an eligible found item to break it into Welkynd Shards. The shard amount depends on the item's tier:

| Found item | Shards |
|---|---:|
| Magic | 1 |
| Rare | 3 |
| Legendary | 8 |
| Exalted Legendary | 15 |

Salvage refuses Common items, Daggerfall's own ungraded magic items, crafted items, Aetheric and Gilded pieces,
Artifacts, quest items, bound items, worn or locked items, and gear with a gem still set. Remove or extract a gem before
you try. Shards are bound: they stack, but cannot be sold, traded, dropped or listed. Shops exchange 5 shards for a
Portal Stone.

## Repairing gear

Repair a damaged item at a smith or guild service. Online, Roleplay & Realism: Items' condition-price rules are held
whole at their shipped defaults. Its repair calculation uses 0.6 times the fraction of condition missing times the
item's base value, with a minimum of 1; the repair service then charges one third of that result, again with a minimum
of 1. A full-condition item is free to repair. The final price can also reflect a guild discount.

If repairs are not instant, the item takes time and must be collected from the smith where you left it. Online allows
magic repairs. Horses and wagons are not repaired at a smith; a Wagon Yard handles wagons.

## Selling found gear

Gear handed to you in a worn state carries a found mark. At an online counter, the marked condition sets its sale
condition even after a smith repairs it. Your own repairs above that mark receive only partial sale credit; wear after
the find still lowers the item's price. An unmarked item, such as crafted gear, sells by its current condition, and a
crafted item's rolled rarity lines do not add to the counter's base piece value.

This makes repairing useful for keeping equipment, but it does not turn a damaged found item into a higher resale
value than its original mark. Compare repair costs with the item's use to you.

## Common mistakes

- **Trying to salvage gear from a shop or a crafting bench.** Salvage is for eligible found gear.
- **Leaving a gem set.** A set gem blocks salvage; unset or extract it first.
- **Repairing only to raise a sale price.** A found item's original condition mark still governs the counter price.

## Next

- [Sockets and reforging](sockets-and-reforging.md)
- [Loot rarity](loot-rarity.md)

## Sources

- `src/systems/online/onlineLane.js`: `ONLINE_WHOLE_MODS` and `ONLINE_FORCED_SETTINGS` (Roleplay & Realism: Items and
  magic repair policy)
- `src/systems/settings/settings.js`: `PORT_DEFAULTS` and `defaultOf` for port repair defaults
- `src/systems/reforge.js`: `SALVAGE_SHARDS`, `salvageShards`, `salvageRefusal`
- `src/systems/gate/gateSpoils.js`: `WELKYND_SHARD`, `PORTAL_STONE_SHARDS`
- `src/systems/repairService.js`: `dfuItemRepairCost`, `REPAIR_COST_SCALE`, `calculateItemRepairCost`,
  `calculateItemRepairTime`, `repairRefusal`
- `src/systems/roleplayRealismItems/rriRealism.js`: `conditionRepairCostBase`, `REPAIR_COST_FACTOR`
- `src/systems/item/foundMark.js`: `foundSalePercentage`, `MEND_SALE_SHARE`; `src/systems/tradeModes.js`:
  `saleConditionPercentage`
- Research note: `handbook/research/P3.md`; online-lane check: `handbook/research/M.md`
