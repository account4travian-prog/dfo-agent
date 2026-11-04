---
title: Player guilds
summary: Joining and founding a guild, ranks, vault and chapters.
stage: rivals
order: 50
gate: renown 10
status: draft
tags: [player guilds, guilds, vault, chapters]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Player guilds are online account groups, separate from the NPC guilds and orders in town.
> - Joining is by invitation. Founding requires Renown {{fact guild.foundingRenown}} and {{fact guild.foundingGold}} gold.
> - Guildmaster, Officer, Member and Recruit are distinct ranks with different permissions.
> - A guild vault stores shared items; permissions and capacity depend on guild state and facilities.

## Join or found a guild

An existing guild invites you to join. If you want to found one, meet the Renown requirement and pay the founding cost. The service allows up to {{fact guild.membersMax}} characters in a guild. The Guildmaster and Officers can manage different guild actions; membership rank controls which actions are available.

| Rank | What it means |
|---|---|
| **Guildmaster** | Leads the guild and holds its highest permissions. |
| **Officer** | Can perform the officer actions granted by the guild law. |
| **Member** | A full guild member without officer controls. |
| **Recruit** | A newly admitted or lower-rank member. |

The exact permission checks belong to the guild service. Before depositing valuable items or Marks, read the current guild screen and confirm who can withdraw or spend them.

## Guild vault and town chapters

The guild vault is the player guild's shared storage. Its capacity and permissions can change with guild facilities. Use the vault law and the guild UI as the authority for what you may deposit or withdraw.

“Chapter” can also mean an NPC guild chapter: a local branch of a Fighters Guild, Mages Guild, temple or order. That is separate from a player guild's ranks and permissions. Joining an NPC chapter does not make you a player-guild officer or grant authority over a town seat. See [NPC guilds](../town/npc-guilds.md) for those organizations.

## Connect a guild to city control

Player guilds can pledge towns and compete for a Charter through the seat system. That is a separate weekly activity with its own influence, fee and upkeep rules. A guild membership alone does not mean that the guild holds a town. Continue to [City control](city-control.md) for how pledges and Charters work.

> [!online] Online rule
> Player guilds are backed by DFO's account service. Offline NPC guilds are a different game system; offline membership does not create an online player guild.

## Common mistakes

- **Confusing NPC guild membership with a player guild.** They have different rosters, services and progression.
- **Assuming every guild member can withdraw from the vault.** Guild rank and vault permissions govern access.
- **Assuming a pledge already means the guild owns a town.** A Charter is resolved at the weekly Turning.

## Next

- [City control](city-control.md)
- [NPC guilds](../town/npc-guilds.md)

## Sources

- `src/net/guild/guildLaw.js`: founding cost, roster cap, ranks and `GUILD_POWERS` / `guildMay`
- `src/net/guild/guildVaultLaw.js`: vault capacity and permission law
- `server-account/src/guilds.js`: invitations and account-side guild enforcement
- `src/net/npcChapterLaw.js`: NPC guild chapter distinction
- `src/net/townSeatLaw.js`: guild pledges and Charters
- Research: `handbook/research/R2.md`
