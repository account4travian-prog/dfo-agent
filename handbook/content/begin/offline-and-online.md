---
title: Offline and online
summary: What DFO's two modes share, what each keeps, and what solo play gives up.
stage: begin
order: 22
gate: none
status: draft
tags: [offline, online, solo, account, saves]
verified: e4f093166
---

> [!tip] At a glance
> - The enhanced front door asks which world you want: **Online**, the shared world, or **Offline**, your own game kept on this device.
> - Offline play is free of accounts. Online play needs an account, either a guest account or a registered one.
> - Offline keeps classic Daggerfall's rules plus your own settings. Online forces the shared ruleset and adds Renown, Marks, the market, player guilds, events and questlines.
> - An offline DFO character can be brought online once; an online character can be copied to offline. Classic Daggerfall and Daggerfall Unity saves cannot be imported yet.
> - Your two characters do not share a save: local slots live on the device, an online character's checkpoints live on the account service.

## Choose a world at the front door

The enhanced front door opens on a question about which world you are entering, not which character you are loading. **Online** leads to the shared world and the account service's characters. **Offline** leads to the doors the game keeps on this device: **Continue**, **New Game** and **Load Game** (`src/ui/enhanced/enhancedMenu.js`: `SECTIONS_BOOT`, `HOME_OFFLINE`, the two-question door). The game's own comment records why the question exists: players had created offline characters while believing they were making online ones.

The two modes are not difficulty levels of one character. They are two separate games that share a client, the same Daggerfall data, and many of the same systems.

## What offline play is

Offline is DFO running as a single-player game. You supply your own Daggerfall data, as for online play, and the game uses the classic Daggerfall rules with the enhancements you choose (`src/systems/online/onlineLane.js`: the offline path reads the player's own settings; `src/systems/features.js`: offline declarations are the player's). Offline single-player allows saving and loading, with **F9** for a quick save and **F11** for a quick load; online, loading during play is disabled (`src/systems/save/saveSlots.js`; `src/scenes/dungeonContext.js`: `ONLINE-LOAD1`).

Offline characters earn **no Renown XP** (`src/net/renown.js`, `renownTracker.js`), so the Firmament has no currency to spend offline; the Firmament is in force only online (`src/systems/firmamentLive.js`: `firmamentInForce` requires the online page). Account-held things do not exist offline either: Marks, the market, player guilds, city seats and the shared events are account-service or shared-world systems.

Offline still has the single-player content: the classic quests and main quest, the guilds and temples, dungeons, survival and horses, and whatever overhauls you switch on. Some questlines are gated on online play or a registered account, so not every line is available offline (`src/systems/questlines/qlLines.js`: each line's `opens` carries `online` and `account` flags).

## What online play is

Online is the shared world. You need an account; a guest account can play, but many account systems are limited until you register (see [Your account](your-account.md)). Your character's progress is checkpointed by the account service, so it follows the account to another device rather than staying in one browser (`src/scenes/world.js`: online checkpoints and exit autosave).

Online also changes the rules. Every shared rule is forced at its shipped value, balance mods are locked whole, and only looks-and-sound switches stay yours (`src/systems/online/onlineLane.js`; see [Which rules apply online](../reference/online-ruleset.md)). Death is not a load: online you respawn at a safe place after a countdown, with a gold cost, while offline death is classic Daggerfall's load-a-save (`src/ui/deathScreen.js`: `DEATH4`; `docs/23-playing-online.md` line 209).

The shared systems are online-only: other players, the market, player guilds and city control, town raids and gates, the Arena, Starfall and the other events, Renown and the Firmament, and the questlines whose deeds the account service records.

## What a solo online player gives up

Online play does not require a party. You can fight, quest, gather and trade alone. What solo play gives up is the party layer:

- The **Renown party bonus**: every member of a party in the room earns the whole kill's Renown plus **10% per extra member** (`src/net/renown.js`: `RENOWN_PARTY_BONUS_PCT`, `renownPartyXp`; `docs/23-playing-online.md`, "Group up with the strong players").
- **Mentor mode**, which lets a high-level friend play beside a low-level character without trivialising the content: it switches on automatically in a party whose reference level is at least three below yours (`src/systems/mentorMode.js`: `MENTOR_MIN_GAP`).
- Shared travel, party rests and party-facing content such as quest instances taken together.

None of that blocks access. It is a speed and company difference, not a gate.

## Moving a character between the modes

The game supports two one-time doors. An **offline DFO character can be brought online once** through the Online menu; the offline character stays as it was (`src/ui/enhanced/enhancedMenu.js`: the Realm page, "Bring an offline character in (once)"). An **online character can be copied to offline** as a new local character, and nothing you do on the copy comes back online (same file, `copyToOffline`).

These doors move a DFO character, not a save from another game. The official site says plainly that you cannot import classic Daggerfall or Daggerfall Unity saves yet (`index.html`, the "Not finished" section). For the save mechanics, see [Saving and returning](saving-and-returning.md).

## Desktop or browser

The browser client stores its local saves in that browser's storage. The desktop app keeps real save files, works offline, finds your Daggerfall install and updates itself; it is available for Windows, Apple-silicon macOS and Linux, and it is not code-signed yet, so the first launch warns (`https://daggerfalljs.dev/`, "The desktop app" and "Saves"). On a phone, the browser client takes the Daggerfall data as a zip and shows touch controls ([Playing in the browser](playing-in-the-browser.md)).

For online characters the choice matters less than for offline ones: the account service holds the character. For offline characters it matters a great deal, because a browser's local store does not follow you to another browser or to the app.

## Common mistakes

- **Starting offline by mistake.** The front door asks Online or Offline for a reason. An offline character does not earn Renown or Marks, and cannot join the shared world's systems.
- **Expecting account rewards offline.** No Renown, Marks, market, player guild or shared event runs in an offline game.
- **Clearing browser data to "fix" the game.** For a browser offline character, that can remove local slots. Online characters live on the account service, but a guest's session can be lost with the browser.
- **Expecting a mid-session load online.** Online loading is disabled; the offline save-and-load loop does not apply there.
- **Importing a DFU save.** Import is not available yet. Character creation in DFO is how a character begins.

## Next

- [Your first launch](your-first-launch.md)
- [Your account](your-account.md)

## Sources

- `https://daggerfalljs.dev/` and `index.html`: the account-optional wording, the "Not finished" section (no save import, no mod support), the Saves and desktop-app sections, browser support and controls
- `src/ui/enhanced/enhancedMenu.js`: `SECTIONS_BOOT`, `HOME_OFFLINE`, `offlineSection`, the two-question front door, `ONLINE_SYNC_NOTE`, the bring-online and copy-to-offline actions, and the delete-character warning
- `src/systems/online/onlineLane.js`: online versus offline settings scope (`ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS`, `ONLINE_PLAYERS_OWN_MODS`)
- `src/systems/features.js`: the Features registry's `online` declarations
- `src/net/renown.js`, `src/net/renownTracker.js`: Renown is earned online only
- `src/systems/firmamentLive.js`, `src/systems/firmamentPowers.js`: the Firmament is in force online only
- `src/systems/questlines/qlLines.js`: questline `opens` flags (`online`, `account`)
- `src/systems/save/saveSlots.js`, `src/systems/cloudSaves.js`: local slot storage, desktop files, cloud backup
- `src/scenes/world.js`: online checkpoints and exit autosave; `src/scenes/dungeonContext.js`: `ONLINE-LOAD1`
- `src/ui/deathScreen.js`: `DEATH4`, offline wait versus online respawn countdown
- `src/net/marksLaw.js`, `server-account/src/*`: account-held Marks and the account-serviced systems
- `docs/23-playing-online.md`: the online systems summary, party bonus and death cost
- The source does not state an exhaustive list of offline-only exceptions beyond the online flags above.
