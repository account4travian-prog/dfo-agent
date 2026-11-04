---
title: Elites and champions
summary: Stronger foes with halos and traits, and when they appear.
stage: bay
order: 10
gate: renown 5
status: draft
tags: [elites, champions, combat, renown]
verified: 0df2d87eb
---

> [!tip] At a glance
> - An **Elite** is one unusually strong enemy. A champion is a different kind of named enemy with a visible trait.
> - Your own elite encounters begin at Renown 5; a new elite must also meet the character-level floor.
> - An Elite Dungeon is a place with several elite foes. Do not confuse its dungeon tier with an individual foe's promotion.
> - These fights are optional encounters. Leave room to retreat if the foe outmatches you.

## Two kinds of special foe

An Elite has a larger sprite and a pulsing blue outline. Its health and attacks are far stronger than those of its ordinary kind, and it has a separate loot roll. A champion instead has a name and one trait, such as **Fiery**, **Swift** or **Vampiric**. Both can appear in online play; the game treats them as separate promotions.

| What you see | What it means |
|---|---|
| **Elite** name and blue glow | A foe promoted by Elite Foes; it hits harder and can take much more damage. |
| A named foe and a trait | A champion promotion; the trait gives that foe its special behavior. |
| **Elite Dungeon** | A dungeon tier that selects several eligible foes as elites. It is a property of the dungeon as well as the enemies inside. |

## When they appear

In the open world, an eligible enemy can be promoted when it is created. Your own open-world and searchable elite rolls wait until Renown 5. The new foe must be at least character level 3. Ordinary dungeons can have no elite or one; an Elite Dungeon selects three or four eligible foes from its layout. A shared dungeon uses the same selection for everyone who enters it.

Champions have their own promotion and trait rules. They are also limited to eligible foes of character level 3 or higher. An elite is not also a champion.

> [!online] Online rule
> Elite Foes, Champions and the loot-rarity system are live in online play under DFO's shared-world settings. Some shared dungeon selections are made from the dungeon layout, while an open-world foe's owner carries its promotion to other players.

## Before you engage

Treat the name and glow as a warning, not as a promise that the reward will make the fight worthwhile for your character. Check your health, supplies and escape route first. Party members can help, but a group fight also changes enemy strength; see [Meeting other players](../town/meeting-players.md).

## Common mistakes

- **Treating “Elite Dungeon” as a foe name.** The tier describes the dungeon; an Elite is an individual enemy.
- **Assuming all nearby foes share one promotion.** Each eligible foe is selected separately, and champions and elites are distinct.
- **Using a classic or single-player rule as the online rule.** Online promotion and shared-room selection are controlled by DFO's own systems.

## Next

- [The Arena](the-arena.md)
- [Spawned and Elite dungeons](spawned-and-elite-dungeons.md)

## Sources

- `src/systems/eliteFoes.js`: `ELITE_FOE_*`, `eliteEligible`, `eliteRenownOpen`, `pickDungeonElites`, `promoteEliteFoe`, `eliteLoot`
- `src/systems/champions.js`: champion promotion, level floor and trait handling
- `src/systems/online/onlineLane.js`: online Elite Foes, Champions and loot-rarity policy
- Research: `handbook/research/W1.md`; online precedence: `handbook/research/M.md`
