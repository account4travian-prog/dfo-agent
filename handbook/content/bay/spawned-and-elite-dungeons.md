---
title: Spawned and Elite dungeons
summary: Dungeons that appear in the wilds, their tiers and their loot.
stage: bay
order: 60
gate: none
status: draft
tags: [dungeons, elite dungeons, spawned dungeons, danger]
verified: 0df2d87eb
---

> [!tip] At a glance
> - A **spawned dungeon** is a temporary dungeon entrance that can appear in the wilderness.
> - Its online label can be **Regular Dungeon**, **Elite Dungeon** or **Abyss Dungeon**.
> - Elite and Abyss are different dungeon tiers; individual Elite foes are a separate system.
> - Check the tier before entering. Shared dungeon layouts and enemy selections are consistent for the players who enter.

## Find a spawned dungeon

The world can create a dungeon entrance in the wild. The spawn system has separate normal and elite rolls; together, they allow a dungeon to appear through either path. A location needs space around it, and a cleared location eventually expires before it can return. The game controls those timers, so do not expect a cleared entrance to remain available indefinitely.

Use the dungeon's online tier label to understand which kind of instance you are approaching. The online dungeon-tier system gives an Abyss Dungeon priority over the Elite Dungeon label when both flags apply.

| Tier shown | How to read it |
|---|---|
| **Regular Dungeon** | A standard online spawned dungeon. |
| **Elite Dungeon** | A dungeon tier with multiple selected elite foes and a longer respawn delay. |
| **Abyss Dungeon** | The player-facing name for a separate shared high-end dungeon system. Its entry and mechanics are covered later in [Abyss Dungeons](../late/abyss-dungeons.md). |

## What the label does not tell you

An Elite Dungeon is not the same thing as a dungeon containing a single Elite foe. Elite Foes promotes individual enemies. The two systems do combine their scaling: an Elite foe in an Elite Dungeon has seven times its ordinary health and four times its ordinary damage. Use the in-game tier and enemy presentation rather than calculating the multipliers yourself.

The Wrothgarian Wild Zone also has its own enemy and dungeon rules. It is a later area; this page does not treat its special scaling as the ordinary dungeon rule.

> [!online] Online rule
> Dungeon tier labels are DFO Online features. The shared dungeon selection comes from the location's layout, while the online dungeon-tier system provides the displayed label. Single-player Daggerfall Unity does not use these tier labels.

## Before you enter

1. Check the dungeon label and your supplies.
2. Make sure your party is ready; dungeon foes and containers are shared-world activity.
3. If the tier is beyond your current comfort, mark the location and return later.

Public dungeon foes and containers respawn on their own timers. Those timers are world behavior, not a personal cooldown. See [Elites and champions](elites-and-champions.md) for individual foe promotions.

## Common mistakes

- **Reading “Elite Dungeon” as “every foe is an Elite.”** The tier selects a set of foes; it does not rename each one.
- **Applying one system's multiplier to another.** The source does not establish a simple compounded figure for every path.
- **Treating a respawn as your private reset.** Foes and containers have separate shared-world timers.

## Next

- [Elites and champions](elites-and-champions.md)
- [Abyss Dungeons](../late/abyss-dungeons.md)

## Sources

- `src/world/spawnedDungeons.js`: spawn chances, tier multipliers, clearance and expiry
- `src/systems/dungeon/dungeonTier.js`: online tier precedence and display labels
- `src/systems/dungeon/dungeonRespawn.js`: public and Elite Dungeon respawn timers
- `src/systems/eliteFoes.js`: individual Elite foe scaling and the combined Elite Dungeon multipliers
- Research: `handbook/research/W1.md`; online precedence: `handbook/research/M.md`
