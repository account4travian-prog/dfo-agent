---
title: Wagons and hauling
summary: Carts and wagons, their upkeep, and The Merchant's Road.
stage: feet
order: 80
gate: level 3
status: draft
verified: 0df2d87eb
tags: [wagons, hauling, travel, upkeep]
---

> [!tip] At a glance
> - A cart or wagon is a pack item that you deploy behind you to carry goods.
> - The Small Cart, Open Wagon and Caravan differ in capacity, horse team and whether passengers can ride.
> - Buy enough horses to hitch the wagon; you can buy additional horses at a Stable.
> - The level-3 introduction **The Merchant's Road** begins with a stable master.

## Choose a wagon

The **Small Cart** is the lightest option. The **Open Wagon** carries more and has passenger seats. The **Caravan** carries the most and opens as an enterable room. Check the Stable's listing and your carrying needs before buying; each type requires its own horse team, bought separately.

Your wagon is represented by an item in your pack. Deploying it places it behind you, where it carries goods you would otherwise carry yourself. It is not a way to travel instantly between towns. If you own multiple kinds, the wagon law selects the best one to drive.

## Wear and care

Travel wears a wagon. Road and off-road movement, load and wagon type affect the wear. A Wagon Yard can repair it, and a Wagon Repair Kit lets you mend it in the field. Your wagon upkeep tier affects what its condition means for pace and sale value. **Boons** is the default tier, but upkeep is a player-controlled online setting; check your current setting before assuming wear slows your wagon.

Park with care in towns. The online wagon warden can move teams that linger on roads or exceed a town's parking allowance; the wagon and its cargo remain yours at the relocation point.

## Take the introduction

At character level 3, a stable master can offer **The Merchant's Road**, a short introduction to moving a wagon's load and completing a haul. It is a good point to learn how the job's cargo and route fit your normal travel. See [Horses](../travel/horses.md) for riding and [Overworld travel](../travel/overworld-travel.md) for journeys between places.

## Next

- [Tavern games](tavern-games.md)
- [Horses](../travel/horses.md)

## Sources

- `src/systems/wagon/wagonKinds.js`: `WAGON_KINDS`, horse-team and active-wagon rules
- `src/systems/wagon/wagonUpkeep.js`: wear, repair and wagon pace
- `src/systems/upkeep/upkeepTiers.js`: `WAGON_UPKEEP_DEFAULT`, `WAGON_UPKEEP_RULES`
- `src/systems/features.js`: player-owned online wagon upkeep feature
- `src/systems/online/onlineLane.js`: online preference policy
- Online-lane check: `handbook/research/M.md`
- `src/systems/wagon/wagonWarden.js`, `src/net/wire.js`: online parking and relocation rules
- `src/systems/questlines/qlLines.js`: `introRoad`, The Merchant's Road gate and steps
- Research note: `handbook/research/V1.md`
