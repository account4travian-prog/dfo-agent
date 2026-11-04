---
title: The Fighters Guild
summary: Join a Fighters Guild hall for training, repair, identify and cure services, and the guild's own quest work.
stage: town
order: 61
gate: none
tags: [guilds, fighters guild, training, repair, quests]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Join at a Fighters Guild hall with non-negative standing, one guild skill at 22 and a second at 4.
> - The hall trains members only; it is the place for weapons, movement and combat skills.
> - Its non-training services are repair, identify, donations, cure disease and guild quests.
> - The guild does not sell spells or potions; those are Mages Guild or temple services.

## Joining and rank

The ordinary guild application needs non-negative faction standing, one Fighters Guild skill of at least 22 and a second
guild skill of at least 4. Ranks run from 0 to 9; promotion reads faction reputation and the permanent values of the
guild's skills, not temporary boosts.

Online, personal rank stops at 7. Ranks 8 and 9 are chapter seats. When you earn a promotion, opening the hall's services
applies it immediately; the old review delay is not used for earned promotions. [The NPC guilds](npc-guilds.md) explains
the shared rules.

## What the hall offers

| Service | What it does | Access |
|---|---|---|
| Training | Raise one guild skill by one point | Member; 100 × character level a session |
| Repair | Repair worn equipment | Member; quoted gold |
| Identify | Identify an item | Open to anyone |
| Quests | Take guild work | Open; see the [Fighters Guild quests](../reference/quests/fighters-guild-hunts.md) |
| Donate | Give gold to the guild | Open; affects standing |
| Cure disease | Treat a disease | Open; quoted gold |

A training session takes three game hours, costs fatigue, and can be taken once every 12 game hours. The guild trains
Archery, Axe, Blunt Weapon, Critical Strike, Giantish, Hand-to-Hand, Jumping, Long Blade, Orcish, Running, Short Blade
and Swimming, up to skill 50. The price formula and Refined Training reduction are in [The NPC guilds](npc-guilds.md).

The hall does not offer the Mages Guild's spell, magic-item, soul-gem, summoning or teleport services, and it does not
sell potions. Use [Mages Guild services](mages-guild-services.md), [Temples](temples.md) or
[The Thieves Guild](thieves-guild.md) for those.

## Common mistakes

- Applying with only one qualifying skill.
- Expecting a promotion to arrive on a timer after you have already earned it.
- Paying for training above skill 50; the trainer refuses it.
- Looking for potions or spells at a Fighters Guild hall.

## Next

- [The NPC guilds](npc-guilds.md)
- [Fighters Guild quests](../reference/quests/fighters-guild-hunts.md)
- [Mages Guild services](mages-guild-services.md)

## Sources

- `upstream/snapshot-e4f093166/src/systems/guild/guilds.js`: `isEligibleToJoin`, `calculateNewRank`, `updateRank`.
- `upstream/snapshot-e4f093166/src/systems/guild/guildServices.js`: `TRAINING_SKILLS.FightersGuild`, `canAccessService`,
  `trainingPrice`.
- `upstream/snapshot-e4f093166/src/systems/guild/guildServiceActions.js`: training cooldown and duration.
- `handbook/content/town/npc-guilds.md`: joining, rank and shared training rules.
