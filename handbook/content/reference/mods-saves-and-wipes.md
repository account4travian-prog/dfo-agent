---
title: Mods, saves and wipes
summary: No mods and no save import, where progress lives, and what is known about wipes and seasons.
stage: reference
order: 35
gate: none
status: draft
tags: [mods, saves, wipes, seasons, import, account]
verified: e4f093166
---

> [!tip] At a glance
> - DFO Online does not support mods. You cannot install DFU or Nexus mods, and the game fixes its own ruleset for online play.
> - You cannot import a classic Daggerfall or Daggerfall Unity save yet. DFO characters are made in DFO.
> - Progress lives in one of three places: browser save slots, desktop-app save files, or your online character on the account service.
> - Cloud backup is a manual action, not an automatic sync.
> - The source and the official site set no wipe schedule. Character deletion is manual and permanent.

## Mods: no, and why the answer is firm

The official site says it plainly: **there is no mod support** (`https://daggerfalljs.dev/`, "Not finished"; `index.html`). There is no mod folder, no load order, no Nexus integration and no DFU mod compatibility. A player arriving from Daggerfall Unity should not copy a modlist across, because the client will not load it.

The **Features** rows are not mods. They are the game's own built-in systems and settings, registered in one place (`src/systems/features.js`) and drawn as tiles on the Features page. Some are the port's own work, some are built-in versions of familiar mods, and some are cosmetic. Online, their scope is decided for everyone:

- **Shared and balance systems** are forced on at shipped values: the world mods, PCAAO, Meaner Monsters, Enemy Expansion, Unleveled Loot, Roleplay & Realism and its Items (`src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS`).
- **Personal switches** — looks, sound, survival tier, horse care, wagon upkeep and a few similar settings — remain the player's (`ONLINE_PLAYERS_OWN_MODS`; the Features registry's `online: 'player'` declarations).
- **Offline**, the same Features rows follow your own choices, because an offline game is yours.

[Which rules apply online](online-ruleset.md) is the index to which is which. The practical answer for a mod question is always the same: if the feature is in DFO, it is a Feature row; if it is a downloaded mod, it does not exist here.

## Save import: not yet

The official site's exact words are that you **cannot import classic or Daggerfall Unity saves yet** (`index.html`). There is no converter and no character transfer from another Daggerfall install. A DFO character is created in DFO, in either an offline slot or an online account slot.

Two doors do exist between DFO's own modes: an offline DFO character can be brought online **once**, and an online character can be **copied to offline** as a new local character (`src/ui/enhanced/enhancedMenu.js`: "Bring an offline character in (once)", `copyToOffline`). Neither door imports a save from another game.

## Where your progress lives

There are three stores, and they do not merge by themselves:

| Store | What lives there | What it follows |
|---|---|---|
| Browser save slots | Offline characters made in that browser | That browser's storage only |
| Desktop-app save files | Offline characters made in the app | The files you keep and back up |
| Online character checkpoint | Your online character, its quest state and account records | The account service and your account |

The browser/desktop distinction is on the official site: browser saves are in the browser's storage, while the desktop app keeps real files you can back up (`https://daggerfalljs.dev/`, "Saves" and "The desktop app"). The local slots themselves are filed under the first free slot number (`src/systems/save/saveSlots.js`), which is why two devices can hold the same character under different numbers.

An online character is different in kind. It is checkpointed by the account service as you play and on exit, and it is chosen from the **Online** menu's character list (`src/scenes/world.js`: online checkpoints, exit autosave; `src/ui/enhanced/enhancedMenu.js`: the Online pane). Local browser slots and the online character are separate records; opening an offline save is not a way to rewind an online session.

For the full save behaviour, including what closing the tab does, see [Saving and returning](../begin/saving-and-returning.md).

## Cloud backup is manual

There is a third destination, the cloud save, and it is deliberately not automatic. The cloud save is an **explicit backup action**, not a live sync: a slot is identified by the character and the save name (not the local slot number), it is skipped rather than duplicated when the store already holds it, and nothing here resolves conflicts by picking a winner (`src/systems/cloudSaves.js`: the header states the design and the reasons). Two devices that saved in a different order can hold the same QuickSave under different local numbers; what travels is the character identity.

The consequence is simple: if you want a backup, take it. The game will not quietly take one for you.

## Cross-device play

- **Online characters** follow the account. Sign in on another device and your online character is there (`src/ui/enhanced/enhancedMenu.js`: the Online pane reads the service's characters).
- **Browser offline characters** do not follow you. Another browser or the desktop app has its own store.
- **Desktop-app offline characters** are files; copy them if you want them elsewhere.
- **Cloud backups** are the supported way to move an offline slot; because the operation is manual, the copy is the one you asked for.

## Wipes and seasons: what is actually known

The source and the official site **do not state a wipe policy**. I found no automated character wipe, no launch-reset schedule and no seasonal character reset in the code or on the site. The official page says the game is **not finished** and points to the project ledger for what remains (`https://daggerfalljs.dev/`, "Not finished"); that is a statement about completeness, not a wipe plan. If a wipe policy is ever set, it must come from an announcement, not from this page.

What does exist is **seasonal standing**, not seasonal characters:

- **Arena seasons** last eight weeks from a configured UTC epoch, with a rating ladder; a new season changes standings, not characters (`src/net/arena/arenaLaw.js`; [Arena seasons](../late/arena-seasons.md)).
- **City-control seasons** last eight weeks; at the end Standing moves halfway back to 50, Legacy clears and each fortification drops a tier, but Charters remain (`src/net/townSeatLaw.js`: `SEASON_WEEKS`; [City control](../rivals/city-control.md)).
- **Starfall** is a festival event with its own calendar and rewards, not a reset of characters (`src/net/festivalLaw.js`, `src/net/starfall/starfallLaw.js`).

Character **deletion** is the one permanent, player-triggered reset, and the game warns before it: deleting an online character is permanent, and its Renown, professions, Stores, homes it bought and guild place are lost; homes belong to the account, so your other characters lose them too, while any offline copy you made stays (`src/ui/enhanced/enhancedMenu.js`: the delete-character warning). Treat deletion as final.

## If you lose access or a save

- **Registered account:** use a saved recovery code to get back in. Recovery codes are credentials, not character backups; they restore access, not a deleted character (`server-account/src/accounts.js`: recovery set).
- **Guest account:** the guest lives with the browser session, so clearing site data can remove the way back (`begin/your-account.md`).
- **Offline slot:** check the other store first — the browser or the app may be the one holding it — then the cloud backup if you made one.
- **Bug or crash:** reload first, then the project's issue tracker or Discord (`https://daggerfalljs.dev/`, "If it breaks").

## Common mistakes

- **Installing a mod.** DFO does not load external mods; a copied DFU modlist changes nothing.
- **Expecting a DFU save import.** Import is not available yet.
- **Assuming the cloud is syncing.** It is an explicit backup; take it or do not have one.
- **Playing a browser offline character on another device.** It is in that browser's store, not on your account.
- **Believing a season will reset your character.** Seasons reset standings, not characters; no wipe schedule is stated.
- **Deleting a character to "start fresh online".** The warning is permanent; an offline copy is the only thing that survives.

## Next

- [Saving and returning](../begin/saving-and-returning.md)
- [Your account](../begin/your-account.md)

- [Coming from Daggerfall or Daggerfall Unity](coming-from-daggerfall.md)
## Sources

- `https://daggerfalljs.dev/` and `index.html`: "Not finished" (no save import yet, no mod support), Saves, The desktop app, If it breaks, controls
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS`, `ONLINE_PLAYERS_OWN_MODS`
- `src/systems/features.js`: the Features registry and its `online` declarations
- `src/systems/save/saveSlots.js`: local slots, `QUICK_SAVE_NAME`, desktop `appStorage`
- `src/systems/cloudSaves.js`: the manual backup trigger, identity by character and save name, no overwrite/merge
- `src/systems/save/save.js`, `src/scenes/world.js`: online checkpoints, exit autosave, page-hide checkpoint
- `src/ui/enhanced/enhancedMenu.js`: the Online pane, bring-online-once, copy-to-offline, delete-character warning
- `src/net/arena/arenaLaw.js`: Arena seasons; `src/net/townSeatLaw.js`: `SEASON_WEEKS`, season-end changes; `src/net/starfall/starfallLaw.js`: Starfall
- `server-account/src/accounts.js`: guest and registered accounts, recovery set
- `docs/23-playing-online.md`, `docs/32-questions.md`: online systems and recurring player questions
- The source does not state a wipe schedule; this page says so rather than guessing one.
