---
title: Portal Stones
summary: Spend Welkynd Shards on a Portal Stone, choose a destination under the open sky, and let nearby travelers step through.
stage: travel
order: 60
gate: none
tags: [portal stone, Welkynd Shards, teleport, travel]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Any shop can sell a Portal Stone for 5 Welkynd Shards.
> - Use the stone under open sky at a valid place to choose a destination; confirming consumes one stone and opens a portal for 30 seconds.
> - Other nearby players can use the open portal too.
> - A portal cannot bypass danger, a duel, siege wards or a journey already under way.

## Buy and use a stone

Buy a Portal Stone from a [shop counter](../town/shops-and-prices.md) with [Welkynd Shards](../gear/salvage-and-repair.md). The stone is always available at the counter; it is not a shelf item bought with gold. Use it from your pack or hotbar, choose a place on the [map](the-map-and-danger.md), then confirm. Closing the map without choosing does not spend the stone.

The portal appears in front of you and remains open for 30 seconds. Walk through it to arrive at the chosen place. Online, nearby players can also pass through it while it stands.

## Limits

You need open sky and room to place the portal. You cannot open one indoors, in water, aboard a boat or on a standalone street. The portal is held while you are dead or moving, in a duel, under siege wards, near enemies or already travelling. Online teleport boundaries also apply: a Portal Stone cannot cross into or out of the [Open Zone](../late/open-zone.md) or cross the Veil.

> [!warning] Save the stone for a clear moment
> Enemies nearby or a journey in progress prevent portal use. The stone does not provide an escape from those rules.

## Common mistakes

- **Saving the stone for an escape from a fight.** The portal is held near enemies, so a Portal Stone cannot pull you out of a losing fight ([the map and danger](the-map-and-danger.md)). Cost: you die with the stone still in your pack.
- **Trying to open one indoors or on a street.** The stone needs open sky and room to place the portal, so a refused attempt wastes the moment you needed it.
- **Expecting a Portal Stone to cross the Open Zone or the Veil.** Online boundaries apply to it just as they do to the [Mages Guild teleport](mages-guild-teleport.md). Cost: a journey planned around a teleport that cannot be made.

## Next

- [Mages Guild teleport](mages-guild-teleport.md)
- [Party travel](party-travel.md)

## Sources

- `src/systems/portalStone.js`: `PORTAL_OPEN_MS`, `portalHold`, portal placement and use
- `src/scenes/portalGates.js`: valid placement and portal entry
- `src/systems/gate/gateSpoils.js`: `PORTAL_STONE_SHARDS`, Portal Stone item definition
- `src/scenes/world.js`: Open Zone and Veil teleport refusals
- Research: `handbook/research/V1.md` (Portal Stones and Welkynd Shards)
