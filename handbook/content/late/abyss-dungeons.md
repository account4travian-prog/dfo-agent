---
title: Abyss Dungeons
summary: Find the shared Abyss Dungeon while it is open, and separate its world event from the level-gated questline.
stage: late
order: 20
gate: none
status: draft
tags: [abyss dungeon, dungeons, hour that was not]
verified: 0df2d87eb
---

> [!tip] At a glance
> - The **Abyss Dungeon** is a shared, temporary dungeon that rises in an eligible region when enough accounts are present.
> - Find its entrance before you can enter; the dungeon admits players only during its found phase.
> - An unbeaten dungeon remains for up to 48 hours; after defeat it collapses, then waits through a cooldown.
> - **The Hour That Was Not** is a separate level-12 questline, not the spawn gate for the world dungeon.

## Find the shared dungeon

The Abyss Dungeon is the player-facing name for the system whose internal source name is Super Dungeon. It is one shared world instance, not a personal dungeon that appears whenever you reach a level. The director checks a regional census, requires at least two accounts, and selects an eligible region with the most players; some regions are excluded.

The first rise is delayed. When the entrance is available, discover it in the world. The server admits players only after the dungeon reaches its **found** phase, and stops admitting them when it falls or closes. The ocean-hole systems place its entrances on the seafloor, so approach prepared for underwater exploration.

## Watch its window

An unbeaten dungeon lasts 48 hours. Defeating it starts a three-minute collapse, followed by a two-hour cooldown before another can rise. These are shared world-event timers, not personal daily attempts.

The underwater dungeon uses replacement enemies and upgraded loot. Online, the Iliac Puddle and Ocean Holes systems are part of the shared-world rules. The level that opens the separate questline does not change the dungeon's timer.

## The Hour That Was Not

At character level 12, **The Hour That Was Not** introduces the Abyss Dungeon questline. Keep that introduction distinct from the shared event: the event's own conditions are its census, region selection, spawn phase and discovery state.

## Common mistakes

- Waiting until level 12 to look for the world event confuses its questline with its timed spawn.
- Arriving after the dungeon has fallen or closed does not create a personal instance; wait for the shared event cycle.
- Calling the source's internal name “Super Dungeon” can make event notices harder to recognize; the player-facing name is **Abyss Dungeon**.

## Next

- [Elite Gates and the Elite Breach](elite-gates.md)
- [The Eltheric Ocean](eltheric-ocean.md)

## Sources

- `src/net/superDungeon/sdLaw.js`: rise, lifespan, collapse, cooldown, census, phase admission and player-facing labels
- `src/world/oceanHoles.js`, `src/systems/superDungeon/sdSite.js`: Abyss entrance placement and shared dungeon placement
- `src/systems/superDungeon/sdSpoils.js`: replacement enemies and upgraded loot
- `src/systems/online/onlineLane.js`: online shared sea mods
- `src/systems/questlines/qlLines.js`: level gate for The Hour That Was Not
- Research note: `handbook/research/L1.md`
