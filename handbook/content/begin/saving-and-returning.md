---
title: Saving and returning
summary: Know where your progress lives, what closing the tab does, and how to return safely.
stage: begin
order: 28
gate: none
tags: [saving, persistence, log out, returning]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Browser save slots live in that browser's storage; the desktop app keeps real save files.
> - Your online character is held by the account service.
> - **F9** quick save and **F11** quick load are the offline save/load controls; loading during online play is disabled.
> - Return through the Play page with the same account for your online character.

## What is saved where

Your **character save** records the character and their adventure: position, possessions, equipment, quests and other
session state. Offline browser slots live in browser storage. The desktop app uses real files instead, which you can
back up. The [official site's Saves section](https://daggerfalljs.dev/) describes this browser/app distinction.

An online character has a separate home: the account service holds its checkpoint. Local browser slots and your
online character are therefore different records. Opening an offline save is not a way to rewind an online session.
The game explicitly refuses loading during online play, including quick load.

**Marks**, **Renown** and **questline deeds** also have account-service records. They are not all contained in an
offline save slot. Guest restrictions differ between these systems; see [Your account](your-account.md) before
investing time in account rewards.

**Recovery codes** are credentials for getting back into your account. They are not character backups. Keep the codes
somewhere you can reach without opening the game or relying on this browser's storage.

## Closing the tab

Online progress saves as you go and on exit: the source has online checkpoints, an unload save, and a final checkpoint
when leaving through the menu. It also checkpoints an online character when the page is hidden.

That describes the save paths the game attempts. The source does not establish a guaranteed tab-close delay or promise
that every last change survives a browser crash or interrupted connection. Read any save failure the game reports.
For offline play, use your save controls before leaving rather than assuming the online checkpoint rules apply.

## Coming back

Open the [Play page](https://daggerfalljs.dev/play/) and sign into the same account. The **Online** menu lists
**Your online characters** from the service; choose the character's **Play** button. For installation and game-file
setup, follow [Your first launch](your-first-launch.md).

Local browser saves belong to the browser storage where you made them. Changing browsers or installing the desktop
app does not move those slots automatically. The app's files are a separate store; keep file backups if you use it.
Optional cloud backups are another separate operation, not an automatic copy of every local save.

## If you lose access

Use your saved recovery codes if you cannot sign into a registered account. Each code is spent separately, so preserve
the unused set. A guest relies on the device's stored session rather than a registered username and password.
Clearing that browser's data can remove your way back to the guest account. [Your account](your-account.md) explains
registration and recovery.

## Common mistakes

- Clearing site data without accounting for local saves and a guest session.
- Expecting a mid-session load to undo an online mistake.
- Playing as a guest for days before checking which rewards require registration.
- Keeping only one recovery code and discarding the remaining unused codes.

## Next

- [Your first launch](your-first-launch.md)
- [Your account](your-account.md)

- [Mods, saves and wipes](../reference/mods-saves-and-wipes.md)
## Sources

- `src/systems/save/saveSlots.js`: `saveSlot`, `loadSlot`, `QUICK_SAVE_NAME`, `appStorage` browser/file distinction
- `src/systems/save/save.js`: `snapshotPlayer`
- `src/scenes/dungeonContext.js`: `quickSave` realm sink; `quickLoad`, `ONLINE-LOAD1` (guard at lines 9602-9603 in this snapshot)
- `src/scenes/world.js`: `onlineCheckpoint`, `exitAutosave`, `setBeforeTitleExit`, `whenPageHides`
- `src/ui/enhanced/enhancedMenu.js`: `paneOnline`, `realmCard`
- `server-account/src/accounts.js`: `createGuest`, `openSession`, `register`, `recover`, `accountKind`
- `src/systems/cloudSaves.js`: explicit backup trigger and slot import distinction
- [Official site](https://daggerfalljs.dev/): Saves and The desktop app sections, also read in snapshot `index.html`
- `server-account/src/marks.js`, `server-account/src/renownTracks.js`, `server-account/src/questlines.js`: account balance, Renown tracks and questline deed records; guest restrictions detailed in `your-account.md`
