---
title: The Dark Brotherhood
summary: How the Brotherhood invites you, what its sanctuary trains, and which potion, soul-gem and spymaster services open at rank.
stage: town
order: 67
gate: none
tags: [guilds, dark brotherhood, murder, potions, spymaster]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - You cannot apply. The Brotherhood invites you after **15 murders**.
> - A murdered townsperson counts as 5 and a guard as 1.
> - The sanctuary trains combat and stealth skills; potions open at rank 1, potion making at 3, soul gems at 5 and
>   the spymaster at 7.
> - Joining reveals the sanctuary on the town map.

## How you get in

The Dark Brotherhood has no application desk. Its tally counts murders; at 15, it stamps an invitation letter. A murdered
townsperson counts as 5 and a guard as 1. The initiation starts only while you are **outside**, and the tally freezes
while a letter is pending. It never fires twice. Joining reveals the sanctuary on the town map.

The letter is a crime-guild invitation, not a courier questline letter. Online the wait is shorter than the classic
three-day delay. [Thievery](thievery.md) covers the tally and the law.

## Rank and services

Ranks run from 0 to 9 under the same reputation-and-skill law as the other guilds. Online personal rank stops at 7; 8
and 9 are chapter seats. Earned promotions apply when you open the sanctuary's services.

| Service | What it does | Access |
|---|---|---|
| Training | Raise one guild skill | Member; 100 × character level a session |
| Quests | Brotherhood contracts | Open |
| Buy Potions | Buy stocked potions | Rank 1 |
| Make Potions | Mix carried ingredients | Rank 3 |
| Buy Soulgems | Buy empty or filled traps | Rank 5 |
| Spymaster | Open an information conversation | Rank 7 |
| Spells, magic items, summoning, teleport | Not offered | Use a temple or the Mages Guild |

The sanctuary trains Archery, Backstabbing, Climbing, Critical Strike, Daedric, Destruction, Dodging, Running, Short
Blade, Stealth, Streetwise and Swimming, up to skill 50. A session takes three game hours and is limited by the shared
12-game-hour cooldown. [The NPC guilds](npc-guilds.md) covers the price formula.

## Common mistakes

- Grinding murders for the tally; the crime leaves a lasting mark.
- Trying to apply at the sanctuary.
- Expecting potion making at rank 1 or the spymaster at rank 0.
- Looking for spellmaking or teleport here; those are Mages Guild services.

## Next

- [Thievery](thievery.md)
- [The NPC guilds](npc-guilds.md)
- [Dark Brotherhood contracts](../reference/quests/dark-brotherhood-contracts.md)

## Sources

- `upstream/snapshot-e4f093166/src/systems/crimeGuilds.js`: `DARK_BROTHERHOOD_TALLY_TARGET`, tally weights and
  invitation handling.
- `upstream/snapshot-e4f093166/src/systems/guild/guildServices.js`: `brotherhoodCanAccessService`, `TRAINING_SKILLS`.
- `upstream/snapshot-e4f093166/src/systems/guild/guildHallReveal.js`: hall reveal.
- `handbook/content/town/thievery.md`: murder tally and the law.
