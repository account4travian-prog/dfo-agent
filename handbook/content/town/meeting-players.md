---
title: Meeting other players
summary: Chat channels, finding a group, parties, shared kills and mentor mode.
stage: town
order: 90
gate: none
status: draft
verified: 0df2d87eb
tags: [chat, parties, social, safety]
---

> [!tip] At a glance
> - Use **Local** for nearby players, **Region** for your region, or **World** to reach everyone online.
> - Join **Trade** or **LFG** when you want those opt-in channels.
> - Invite people into a party for shared play; party members keep individual quest progress.
> - Use `/block` to hide a player's chat and requests, and `/report` to report conduct.

## Choose a channel

DFO chat separates messages by audience. `/world` or `/g` reaches everyone online; `/region` or `/r` reaches your region; `/local`, `/l`, `/say` or `/s` reaches nearby players. `/party` and `/guild` stay with those groups. Trade and LFG are opt-in: use `/join trade` or `/join lfg` to listen and speak there, and `/leave trade` or `/leave lfg` to leave one. The chat panel shows the channels available to you.

## Find a group and travel together

Post in LFG to look for companions, then invite players from the Social panel. A party can hold {{fact party.max}} accounts including you. Invitations expire after two minutes. Each member retains their own quest state when a shareable quest is copied to them; questline steps cannot be shared.

When several party members fight the same foe, recent attackers count toward the shared encounter's scaling. Renown from a kill is not divided among the party. For a journey to the leader, see [Party travel](../travel/party-travel.md).

## Keep control of contact

`/block`, `/unblock` and `/blocked` manage who can reach you through chat, requests and invitations. A block hides that player's lines and requests from you; the other player is not told. Use `/report <name>` or a chat line's Report action for player conduct. `/bug` opens a private developer report form.

> [!note] Shared containers
> Some dungeon containers have a shared base list. Taking an item from that list can change what remains for other players; personal bonus loot is separate.

## Next

- [Party travel](../travel/party-travel.md)
- [Tavern games](../feet/tavern-games.md)

- [Play with a friend](play-with-a-friend.md)
## Sources

- `src/net/chatCommands.js`: channel commands, joining and leaving opt-in channels, block and report commands
- `src/net/chat.js`: channel names and opt-in channel behavior
- `src/net/wire.js`: `PARTY_MAX`, `INVITE_TTL_MS`
- `src/systems/quest/questShare.js`: copied quest state and questline sharing refusal
- `src/systems/party/partyScale.js`: recent attackers and shared foe scaling
- `src/net/renown.js`: `renownPartyXp`
- `src/net/safety/safetyLaw.js`, `src/net/social.js`: block and report behavior
- `src/scenes/roomLootHost.js`: shared room container base list
- Research note: `handbook/research/S1.md`
