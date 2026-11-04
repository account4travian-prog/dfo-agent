---
title: Knightly orders
summary: Join an order for quests, an armour gift by personal rank and a house at rank 9; orders do not train.
stage: town
order: 64
gate: none
tags: [guilds, knightly orders, armour, house, rank]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Knightly orders share one membership slot; joining a different order replaces the old one.
> - Orders train nothing. Their rewards are quest work, an armour gift and a house.
> - The armour gift follows **personal rank**; the house arrives at personal rank 9.
> - Online chapter seats do not grant the house, and rank 8/9 are seats rather than ordinary promotions.

## Joining and rank

Apply at an order with non-negative standing, one order skill at 22 and a second at 4. All knightly orders share one
membership slot, so joining another order replaces the previous membership. Ranks run from 0 to 9 and follow the same
reputation-and-skill promotion law as the other guilds.

Online, personal rank stops at 7; ranks 8 and 9 are chapter seats. Earned promotions are applied immediately when you
open the order's services. A chapter seat does not count as personal rank for the permanent gifts.

## What the order offers

| Service | What it does | Access |
|---|---|---|
| Quests | Order work, including hunts and rescues | Open |
| Receive Armor | Choose the order's armour gift | Knightly member; one claim per personal rank |
| Receive House | Claim the order's house | Personal rank 9; once per order |
| Training | None | The order offers no training |

The armour gift is a choice from the order's set. The house is a one-time claim at personal rank 9; online, chapter
seats grant no house. For quest work, see [Knightly order quests](../reference/quests/knightly-order-quests.md).

Orders do not sell potions, spells, magic items, soul gems or summoning, and they do not offer the Mages Guild teleport.
Those are temple or Mages Guild services. See [Temples](temples.md) and [Mages Guild services](mages-guild-services.md).

## Common mistakes

- Expecting a knightly order to train a skill.
- Counting a chapter seat as personal rank 9 for the house.
- Joining two orders and expecting both memberships.
- Looking for spell or potion services at an order hall.

## Next

- [The NPC guilds](npc-guilds.md)
- [Knightly order quests](../reference/quests/knightly-order-quests.md)
- [City control](../rivals/city-control.md)

## Sources

- `upstream/snapshot-e4f093166/src/systems/knightlyGifts.js`: `receiveArmorDecision`, `receiveHouseDecision`,
  `RECEIVE_HOUSE_RANK`.
- `upstream/snapshot-e4f093166/src/systems/guild/guildServices.js`: `trainingSkills` returns null for an order;
  knightly service switch.
- `upstream/snapshot-e4f093166/src/systems/guild/guildVariants.js`: knightly membership group.
- `handbook/content/town/npc-guilds.md`: joining, rank and shared membership rules.
