---
title: The Eltheric Ocean
summary: The open sea past Veilhaven's peace is an online PvP zone with four depth bands and no fixed level gate.
stage: late
order: 50
gate: none
status: draft
verified: e4f093166
tags: [eltheric ocean, veil, ships, sea travel, pvp, wild zone]
---

> [!tip] At a glance
> - Past **Veilhaven's peace**, the Eltheric Ocean is an **open PvP zone** online: other players can fight you, and a death drops your remains.
> - The peace covers Veilhaven, the water around it and the way between it and the Veil; the rest of the sea, its isles, towns and ruins do not.
> - Foes there are about **four times** an ordinary foe's health and damage, and each deeper band pays more loot: **+25%**, **+50%**, **+75%**, then **+100%** in the Abyss.
> - A death at sea rises at the nearest freeport's town; a wrecked and boarded ship is not a death but gives up part of its hold.
> - The source sets **no universal character-level gate** for the crossing; the danger is the sea's law, not a lock on the door.

## Where the peace ends

Online, the sea's shared rules divide it in two. **Veilhaven's peace** covers the Veil, the water within a short radius of Veilhaven's own pixel where the crossing makes landfall, and the way between them. No player fights within it.

Every other pixel of the sea's box — its isles, their towns and their ruins — runs the same law as the **Wrothgarian Mountains' Open Zone**: the live flag, fights refereed by the relay, the death's drop and remains, strangers, and foes four times as strong. Offline the sea is the captain's own; the open-PvP rule is online only.

## What waits past it

The deeper you go, the richer and the deadlier. The sea borrows the Open Zone's four rings as depth bands:

| Band | What it is | Loot |
|---|---|---|
| The Shallows | the outer band | +25% |
| The Reaches | the next band | +50% |
| The Deep Aether | the deep band | +75% |
| The Abyss | the heart of the sea | +100% |

Foe health and damage are four times an ordinary foe's in every band; the bands change the loot, not the foe's base strength. A player killed at sea leaves remains, and the death rises at the nearest freeport's town — Veilhaven is one — so a voyage can cost you the trip home as well as the fight. A ship that is wrecked and boarded is a separate case: the captain keeps the hull's hold through death, but the boarder takes a share of the hold as a prize (up to eight of its most valuable pieces, about a third of its worth).

## Reaching the sea

The sea is reached by ship, not by walking or a land carriage. The source does not set a universal character-level requirement for the crossing; it does set the sea's own law once you are past the peace. Use the current map and ship service to establish whether a particular passage is available, and read [Owning a ship](../gear/owning-a-ship.md) before you sail into another captain's guns.

Ocean holes can lead to Abyss Dungeon entrances on the seafloor. Treat that as an encounter in the shared sea, not proof that every voyage enters a dungeon; see [Abyss Dungeons](abyss-dungeons.md).

## Common mistakes

- **Sailing past the peace without a plan.** Other players can attack you there, and a death drops remains; the open sea is not a scenic shortcut.
- **Treating the deep bands as only "more loot".** The loot rises, but the foes are four times as strong everywhere past the peace.
- **Expecting a level gate to protect you.** The source sets no universal level requirement, so danger comes from the zone's law and the foes, not from a character-level lock.
- **Forgetting the way home.** A death rises at the nearest freeport; a wrecked ship is not a death but still costs part of the hold.

## Next

- [Owning a ship](../gear/owning-a-ship.md)
- [The Open Zone](open-zone.md)
- [Abyss Dungeons](abyss-dungeons.md)

## Sources

- `src/systems/wild/etherWild.js`: `ETHER_PEACE_PX`, the open-PvP zone, the four depth bands and the freeport rise (`ETHER_RISE_PX`, `etherRiseSite`)
- `src/systems/wild/wildZone.js`: `WILD_FOE_HEALTH_MULT` and `WILD_FOE_DAMAGE_MULT` (4), `WILD_RING_LOOT` (1.25/1.5/1.75/2), `WILD_RINGS`, the relay-refereed fights, death drop and remains
- `src/world/ethericSea.js`: the sea box, `inEther`, `inVeil`, Veilhaven and the depth bands
- `src/net/sea/seaPrizeLaw.js`: `SEA_PRIZE_SHARE` (one third), `SEA_PRIZE_PIECES_MAX` (8), the boarded wreck's prize
- `src/world/oceanHoles.js`, `src/systems/travel/travel.js`: seafloor holes, Abyss entrances and sea passage
- `src/systems/online/onlineLane.js`: the shared online sea systems
- Research notes: `handbook/research/L1.md`, `handbook/research/E1.md`
