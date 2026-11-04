---
title: The Thieves Guild
summary: How the guild invites you, what its hall trains, and which fence and spymaster services open at rank.
stage: town
order: 66
gate: none
tags: [guilds, thieves guild, theft, fence, spymaster]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - You cannot apply. The guild invites you after **10 thefts**.
> - The invitation letter is stamped outside; online it arrives faster than the classic three-day wait.
> - The hall trains stealth skills and opens the **fence** at rank 2 and the **spymaster** at rank 4.
> - Joining reveals the guild hall on the town map.

## How you get in

The Thieves Guild has no application desk. Its tally counts thefts; at 10, it stamps an invitation letter. The initiation
starts only while you are **outside**, and the tally freezes while a letter is pending. It never fires twice. Joining
reveals the guild's hall on the town map.

The letter is a crime-guild invitation, not a courier questline letter. Online the wait is shorter than the classic
three-day delay. [Thievery](thievery.md) covers the theft tallies, stolen goods and the law.

## Rank and services

Ranks run from 0 to 9 under the same reputation-and-skill law as the other guilds. Online personal rank stops at 7; 8
and 9 are chapter seats. Earned promotions apply when you open the hall's services.

| Service | What it does | Access |
|---|---|---|
| Training | Raise one guild skill | Member; 100 × character level a session |
| Quests | Guild work | Open |
| Sell Magic Items (fence) | Sell enchanted equipment | Rank 2 |
| Spymaster | Open an information conversation | Rank 4 |
| Buy/Make Potions, spells, magic items, soul gems, summoning | Not offered | Use a temple or the Mages Guild |

The hall trains Backstabbing, Blunt Weapon, Climbing, Dodging, Jumping, Lockpicking, Pickpocket, Short Blade, Stealth,
Streetwise and Swimming, up to skill 50. A session takes three game hours and is limited by the shared 12-game-hour
cooldown. [The NPC guilds](npc-guilds.md) covers the price formula.

## Common mistakes

- Trying to apply at the hall instead of waiting for the tally.
- Carrying stolen goods into a court date; a conviction takes them.
- Expecting the fence or spymaster at rank 0.
- Looking for spellmaking or teleport at a guild hall; those are Mages Guild services.

## Next

- [Thievery](thievery.md)
- [The NPC guilds](npc-guilds.md)
- [Thieves Guild work](../reference/quests/thieves-guild-work.md)

## Sources

- `upstream/snapshot-e4f093166/src/systems/crimeGuilds.js`: `THIEVES_GUILD_TALLY_TARGET`,
  `CRIME_GUILD_LETTER_ONLINE_MINUTES`, invitation handling.
- `upstream/snapshot-e4f093166/src/systems/guild/guildServices.js`: `thievesCanAccessService`, `TRAINING_SKILLS`.
- `upstream/snapshot-e4f093166/src/systems/guild/guildHallReveal.js`: hall reveal.
- `handbook/content/town/thievery.md`: theft, stolen goods and the tally.
