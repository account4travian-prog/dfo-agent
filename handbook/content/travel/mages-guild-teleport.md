---
title: Mages Guild teleport
summary: Use the Mages Guild's rank-gated teleport service from a guild hall, and keep Recall's separate anchor rules in mind.
stage: travel
order: 70
gate: none
tags: [Mages Guild, teleport, Recall, travel]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Any Mages Guild member can teleport from a guild hall by turning on **paid teleportation** in their own Travel
>   Options settings: (8 − rank) × 200 gold a trip.
> - The free service is for rank 8 and above, which online means a chapter's officers and Master.
> - Recall is a spell that uses a one-use anchor. It is separate from the guild service.
> - Online, these teleports cannot cross into or out of the Open Zone or cross the Veil.

## Guild service

Use the service at a Mages Guild hall and choose a destination from its teleport map. There are two ways in:

| Route | Who | Cost |
|---|---|---|
| Free service | Members at rank 8 or above | Free |
| Paid service | Any member, once you turn on **Enable Paid Teleportation** in your Travel Options settings (off by default) | (8 − your rank) × 200 gold per teleport: 1,400 gold at rank 1, 200 at rank 7 |

> [!online] Online rule: rank 8 is a chapter seat
> Online, your own guild rank stops at 7. Ranks 8 and 9 are **chapter seats**: each Mages Guild chapter has three
> officers (rank 8) and one Master (rank 9). So the free service is for chapter officers. For everyone else, the paid
> service is the way to use guild teleport, and its switch is your own: Travel Options' paid-teleport setting is not
> one of the travel switches DFO forces online ([which rules apply online](../reference/online-ruleset.md)).

You do not need to cast a spell to use the guild service. It is a [Mages Guild service](../town/mages-guild-services.md), not the Mysticism spell Recall. The guild ranks themselves are covered with the [NPC guilds](../town/npc-guilds.md).

## Recall

Recall is the Mysticism Teleport effect. Cast it once to set an anchor and again to return to that place. The anchor records the position and context, including whether it was set outside, inside a building or in a dungeon; using it consumes the anchor. You can set an anchor inside and cast Recall from an interior.

Online refusal rules prevent Recall from entering or leaving the [Open Zone](../late/open-zone.md) and from crossing the Veil. These same world boundaries apply to the guild teleport service.

## Common mistakes

- **Waiting for rank 8 before using the teleport.** Any member can use the paid service once **Enable Paid Teleportation** is on; waiting for a chapter seat costs travel time ([NPC guilds](../town/npc-guilds.md)). Cost: days of carriage fares.
- **Forgetting to turn the setting on.** Paid teleportation is off by default; a member who stands at the hall expecting a port finds nothing and takes a carriage instead. Cost: a fare and a session detour.
- **Planning a Recall that crosses a boundary.** Recall and the guild service both refuse the Open Zone and the Veil, so such a trip has to be walked or sailed ([Portal Stones](portal-stones.md)). Cost: a plan that cannot be executed.

## Next

- [Party travel](party-travel.md)
- [The map and danger](the-map-and-danger.md)

## Sources

- `src/systems/guild/guildServices.js`: `magesCanAccessService`
- `src/systems/travel/travelOptions.js`: `registerCustomGuild`, paid service registration
- `src/ui/travel/travelMapOptions.js`: `teleportCost`, `TELEPORT_RANK_FREE` (8), `TELEPORT_COST_PER_RANK` (200)
- `src/net/npcChapterLaw.js`: `ROLL_BOOK_RANK_MAX` (7; ranks 8 and 9 are chapter seats)
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS['travel-options']` (paid teleport not among the forced keys)
- `src/systems/modSettings.js`: `Teleportation.EnablePaidTeleportation`
- `src/systems/teleportAnchor.js`: Recall anchor setup and `teleportPlan`
- `src/scenes/world.js`: `wildTeleportRefused`, `veilRefused`
- Research: `handbook/research/V1.md` (Mages Guild teleport and Recall)
