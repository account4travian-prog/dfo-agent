---
title: Horses
summary: Buy a horse at a Stable, use its speed and gallop carefully, and keep it fed when you travel together.
stage: travel
order: 40
gate: none
tags: [horses, stable, gallop, travel]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - A Stable offers three horses for the town's game day; their stats and prices vary.
> - Speed affects riding pace, while Stamina affects how long a horse can gallop.
> - Galloping spends the horse's breath. It becomes winded at zero and must recover before galloping again.
> - Oats feed a horse for 24 hours; apples last four hours and build more bond.

## Choose a horse

Visit a Stable to compare the horses offered that day. Each has four stats: Speed, Stamina, Endurance and Strength. Speed changes the riding pace; Stamina sets the gallop reserve; Endurance affects breath use and recovery; Strength matters when the horse pulls a team. The horse's starting stats influence its price, so compare the profile with how you expect to travel.

## Ride and gallop

Riding is faster than walking, but galloping uses breath. When the reserve runs out, the horse is winded and cannot gallop until at least 30% of its breath has returned. A starving horse cannot gallop. Entering a building or dungeon dismounts you; you do not automatically remount when you leave.

## Feed and care

You can feed a horse oats or an apple. Oats last 24 hours; an apple lasts four hours and is a stronger treat for bond. Online, the **Horse care** setting is yours to choose, and its default is **Boons** ([which rules apply online](../reference/online-ruleset.md)). In Boons, hunger does not reduce the horse's stats. Under **Hard** care, hunger lowers stats and a loaded wagon can slow a team according to its horses' Strength. In any care tier, a starving horse cannot gallop. A horse at a Stable is fed there; a horse waiting in the world grazes enough not to starve.

Your own Horse Cart and Cargo setting governs whether its mod places horses and wagons in the world online. Stable purchases and the port's riding rules are separate from that placement feature ([wagons and hauling](../feet/wagons-and-hauling.md)). For the route itself, see [overworld travel](overworld-travel.md); when you want to meet a companion on the road, see [party travel](party-travel.md).

## Common mistakes

- **Galloping a horse that is already winded.** It cannot gallop until at least 30% of its breath returns, and a starving horse never can. Cost: you walk the last stretch or fail to outrun an ambush.
- **Leaving the horse unfed before a long ride.** Oats last 24 hours and an apple four; a starving horse cannot gallop, and under **Hard** care hunger lowers its stats ([which rules apply online](../reference/online-ruleset.md)). Cost: a slower journey.
- **Buying a horse for a one-off inter-city trip.** A [hired carriage](hired-carriages.md) charges a small daily fare and needs no feed, while a horse costs its Stable price and must be fed. Cost: gold spent on a mount you did not need.

## Next

- [Ships and passage](ships-and-passage.md)
- [Portal Stones](portal-stones.md)

## Sources

- `src/systems/merchantYards.js`: `STABLE_HORSES_OFFERED`, `stableHorses`, `yardStock`
- `src/systems/steedCare.js`: `STEED_STATS`, `steedValue`, `canGallop`, `STEED_FOODS`, `tendHorses`
- `src/systems/transport.js`: `dismountOnTransition`
- `src/systems/upkeep/upkeepTiers.js`: `HORSE_CARE_DEFAULT`, `HORSE_CARE_RULES`
- `src/systems/features.js`, `src/systems/online/onlineLane.js`: online Horse care ownership and Horse Cart and Cargo's player-owned setting
- Research: `handbook/research/V1.md` (horses)
