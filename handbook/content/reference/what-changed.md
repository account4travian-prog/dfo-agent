---
title: What changed
summary: Player-facing changes in the latest sync, plus the archived notes from the previous one.
stage: reference
order: 50
gate: none
status: draft
verified: e4f093166
tags: [updates, sync, changes, patch notes]
---

> [!tip] At a glance
> - Current sync: **0df2d87eb (21 October 2026) → e4f093166 (24 October 2026)**.
> - The sea past Veilhaven's peace became an online open-PvP zone, with ship prizes, bounties, seasons, vaults and events.
> - Guns, a spell hand, account-owned homes, a 75-member guild cap, crafting writs, Collections, the event board and several dungeon changes arrived.
> - No new level or registration gate was set for these systems; the only registered number that changed was the guild cap (50 → 75).
> - Older entries remain below as an archive; they describe changes already present in the guide before this sync.

## Sync: 0df2d87eb to e4f093166 (21–24 October 2026)

### Sea and ships

- **The Eltheric Ocean past Veilhaven's peace is an online open-PvP zone** (ETHER-WILD). The same wild-zone law as the Wrothgarian Mountains applies: relay-refereed fights, death's drop and remains, four-times-stronger foes, and loot that rises through four depth bands (+25%, +50%, +75%, +100%). A death at sea rises at the nearest freeport's town, and the peace around Veilhaven and the Veil is safe. See [The Eltheric Ocean](../late/eltheric-ocean.md).
- **Ship-vs-ship prizes** (SHIP-PVP): a wrecked and boarded ship is not a death — its captain keeps the hull's hold — but the boarder takes about one third of the hold's worth, at most eight pieces, held by the account service for collection. See [Owning a ship](../gear/owning-a-ship.md).
- **New sea activity**: freeport bounties funded by players' gold, a realm season board, daily deep-sea elite vaults, the Aether Storm and treasure-fleet shared events, and the Eltheric Tidemail Aetheric set.

### Weapons and hands

- **The Dwarven Pistolet** is in the game: one-handed, Archery, uses Dwemer Pellets, deals 4–15 damage. Two pistols can be paired, and a pistol can be paired with a blade; the mixed pair's gun reloads in 2.8 s instead of 1.4 s (PISTOLET, MIXED-PAIR). Since GUNS-UNFOUND (23 October) neither gun drops, but pellets still drop and are still sold.
- **A readied spell can share the hand with a one-handed weapon** when the other hand is empty (SPELL-HAND); a two-hander or two occupied hands still use the classic cast.

### Homes, guilds and the interface

- **Homes are the account's**, bought by one character (ACCOUNT-HOMES). `char_id` is the buyer whose three-home cap counts it, and deleting that character releases its homes. See [Owning a home](../gear/homes.md).
- **A guild holds 75 members**, not 50 (GUILD-CAP); the guild hall can be sold at its door by its guildmaster (GUILD-HALL-SALE), and the Guild tab is now a window of its own (GUILD-WINDOW).
- **Collections** (COLLECTIONS-II): titles, auras, profile icons and glyphs, where each comes from and whether it can be had now.
- **The HUD event board** and a grouped **Timers** window announce shared events (EVENTS1, TIMERS2), and the pause menu's **season book** shows the season's boards (SEASON-BOOK).
- **NPC marks** (NPC-MARKS): a bobbing gold `!` over a quest person, a gold coin over a merchant and a blue gem over a guild servant, on Morrowind bodies.
- **Middle mouse is the party ping** (PARTY-PING), and auto-run moved to **F3**.

### Professions and economy

- **Crafting writs** (CRAFT-WRITS): up to three per account per UTC day, drawn within the character's best crafter's ranks, filled with goods the service saw made, and paid in Marks, craft XP, Renown and guild standing.
- **Potion drops were cut to under half**; a Novice's brew now makes two potions at 25 gold, and cooked food is lighter (CRAFT-PAYS, POT-THIN).

### Dungeons and world timing

- **The Abyss Dungeon's Way Through** portal stands beside everyone in the dungeon after the first person crosses the Rift, and beside each later arrival (SD-THROUGH).
- **Unpicked boss/floor loot is mailed to the mailbox** (LOST-SPOILS), so a missed floor is not always a loss.
- **Wilderness spawned dungeons are 25% rarer** (SPAWN-THIN): the 30% normal and 10% elite bands are kept on three quarters of the pixels that rolled them.
- **Daily books turn up to ten minutes after 00:00 UTC** (DAY-TURN): each book (professions, nodes, dungeon state, town state) turns its own UTC day within that spread.
- Several quest, chat and rendering fixes: keyboard focus in chat, quest giver/location names, travel-view stalls, snow on steep faces, horse posing and boat state.

### What did not change

The reviewed changes set no new character-level or registration gate for these systems. The stock-class revision belongs to the previous sync. The fact registry re-read 34 values at `e4f093166`: only `guild.membersMax` changed (50 → 75); the online-ruleset table gained the Event board and Morrowind People Marks rows.

## Previous sync: 4bba28c6c to 0df2d87eb (archive)

These changes were already in the guide before the current sync and are kept for returning readers. The source interval is `4bba28c6c..0df2d87eb` (20–21 October 2026).

- **Starfall** can populate denser waves (up to 24 foes) under a dedicated spawn grant; the account claim record still counts at most nine stars per account per UTC day.
- **Open Zone and professions**: death gold drops show correctly when partly taken, and Enemy Expansion animals can be skinned for profession hides.
- **Items and trading**: loose-pack Essence can be spent on the Reforge; Enemy Expansion souls in Soul Gems no longer freeze trading.
- **Chat and quest clarity**: Tab/Space no longer hijack chat focus; quest responses identify the questor and the temple or guild hall.
- **Travel and rendering**: travel-view stalls reduced, horses posed on entry, held boats tracked, grass updates spread, snow on steep faces.
- **Character and desktop**: the eighteen stock classes have revised skill lists (movement skills keep a high tier only where they are the class's own; languages no longer take a tier slot); the Burglar is forbidden chain and plate; the desktop shell recovers from renderer loss.
- **Shared-world timing**: the online world carries an owner's clock through streets, buildings and dungeon foes without catch-up progress; shared foe updates are prioritized and bounded.

## Next

- [Caps, timers and resets](caps-and-timers.md)
- [Questions new players ask](questions.md)

## Sources

- `src/systems/wild/etherWild.js`, `src/systems/wild/wildZone.js`: ETHER-WILD, the four bands, foe multipliers, death drop and rise
- `src/net/sea/seaPrizeLaw.js`, `src/net/sea/seaBountyLaw.js`, `src/net/sea/seaSeasonLaw.js`, `src/systems/sea/seaVaults.js`, `src/systems/sea/seaEvents.js`, `src/scenes/naval/navalSeaSet.js`: sea prizes and activities
- `bible/05-Combat/Dwarven-Pistolet.md`, `bible/05-Combat/Dwarven-Thunderlock.md`, `bible/05-Combat/Two-Hands.md`, `src/combat/twoHands/spellHand.js`: Pistolet, pairs and the spell hand
- `server-account/src/homes.js`, `src/net/homeLaw.js`, `src/net/guild/guildLaw.js`: ACCOUNT-HOMES, HOME_CAP and GUILD_MEMBERS_MAX
- `src/ui/collections/wardrobeCatalogue.js`, `src/systems/eventBoard.js`, `src/systems/seasonBook.js`, `src/render/npcMarkPass.js`, `src/systems/party/partyPing.js`: Collections, event board, season book, NPC marks and party ping
- `src/net/craftWritLaw.js`, `src/net/dayTurn.js`, `src/world/spawnedDungeons.js`, `src/net/lostSpoils.js`, `src/scenes/superDungeon/sdThrough.js`: writs, day turn, spawn thinning, lost spoils and Way Through
- `handbook/facts/facts.json`, `handbook/facts/tables.json`: the re-read facts and the online ruleset table
- Previous sync sources remain in the archived entry above; research notes: `handbook/research/X2.md`, `handbook/research/M.md`
